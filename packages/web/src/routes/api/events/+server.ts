import { EventService, type UserEvent, validateUserEvent } from "@bts/core";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getServerEventTrackingConfig } from "$lib/config/server";
import { validateGuestId } from "$lib/server/middleware/auth";
import { createDynamoDBEventRepository } from "$lib/services/repositoryFactory";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_CODES,
} from "$lib/types/api";
import {
	checkRateLimit,
	classifyEventError,
	generateRequestId,
	logEventApiEvent,
	validateRequestSize,
} from "$lib/utils/apiHelpers";
import { sanitizeEventData, sanitizeUrl } from "$lib/utils/dataSanitizer";

/**
 * Event API request validation with sanitization
 */
function validateEventRequest(
	data: unknown,
	sanitizeData: boolean = true,
): {
	isValid: boolean;
	data?: UserEvent;
	errors?: string[];
} {
	const errors: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("Request body must be an object");
		return { isValid: false, errors };
	}

	// Sanitize data if enabled
	let processedData = data;
	if (sanitizeData) {
		// biome-ignore lint/suspicious/noExplicitAny: allow any
		processedData = sanitizeEventData(data as Record<string, any>);

		// Sanitize URL if present
		if (
			processedData &&
			typeof processedData === "object" &&
			"page_url" in processedData
		) {
			const pageUrl = processedData.page_url;
			if (typeof pageUrl === "string") {
				processedData.page_url = sanitizeUrl(pageUrl);
			}
		}
	}

	// Validate using the core event validation
	const validation = validateUserEvent(processedData);
	if (!validation.isValid) {
		return {
			isValid: false,
			errors: validation.errors,
		};
	}

	return {
		isValid: true,
		data: processedData as UserEvent,
	};
}

/**
 * POST /api/events - Store a user event
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const startTime = Date.now();
	const requestId = generateRequestId();

	try {
		// Get server configuration
		const config = getServerEventTrackingConfig();

		// Check if event tracking is enabled
		if (!config.enabled) {
			logEventApiEvent("info", "Event tracking is disabled", { requestId });
			return json(
				createSuccessResponse({
					message: "Event tracking is disabled",
				}),
				{ status: 200 },
			);
		}

		logEventApiEvent("info", "Starting store event request", { requestId });

		// Validate request size
		const sizeValidation = validateRequestSize(request);
		if (!sizeValidation.isValid) {
			logEventApiEvent("warn", "Request size validation failed", {
				requestId,
				error: sizeValidation.error,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					sizeValidation.error ?? "",
					{ requestId },
				),
				{ status: 413 },
			);
		}

		// Validate and get guest ID from cookies
		const authResult = validateGuestId(cookies);
		const guestId = authResult.guestId;

		logEventApiEvent("info", "Guest ID validated", {
			requestId,
			guestId,
			isNewGuest: authResult.isNewGuest,
		});

		// Check rate limiting using configuration
		const rateLimitResult = checkRateLimit(
			guestId,
			config.rateLimitPerMinute,
			60000,
		);
		if (!rateLimitResult.allowed) {
			logEventApiEvent("warn", "Rate limit exceeded", {
				requestId,
				guestId,
				remaining: rateLimitResult.remaining,
				resetTime: new Date(rateLimitResult.resetTime).toISOString(),
			});
			return json(
				createErrorResponse(
					ERROR_CODES.RATE_LIMIT_ERROR,
					"Too many requests. Please try again later",
					{
						requestId,
						remaining: rateLimitResult.remaining,
						resetTime: rateLimitResult.resetTime,
					},
				),
				{
					status: 429,
					headers: {
						"Retry-After": Math.ceil(
							(rateLimitResult.resetTime - Date.now()) / 1000,
						).toString(),
						"X-RateLimit-Limit": "100",
						"X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
						"X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
					},
				},
			);
		}

		// Parse request body
		let requestBody: unknown;
		try {
			requestBody = await request.json();
		} catch (error) {
			logEventApiEvent("warn", "Invalid JSON in request body", {
				requestId,
				error: error instanceof Error ? error.message : "Unknown error",
			});
			return json(
				createErrorResponse(
					ERROR_CODES.INVALID_JSON_ERROR,
					"Invalid JSON in request body",
					{ requestId },
				),
				{ status: 400 },
			);
		}

		// Validate event data with sanitization
		const validation = validateEventRequest(requestBody, config.sanitizeData);
		if (!validation.isValid || !validation.data) {
			logEventApiEvent("warn", "Event data validation failed", {
				requestId,
				errors: validation.errors,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.EVENT_VALIDATION_ERROR,
					"Event data validation failed",
					{ errors: validation.errors, requestId },
				),
				{ status: 400 },
			);
		}

		const eventData = validation.data;

		logEventApiEvent("info", "Request validated successfully", {
			requestId,
			guestId,
			eventType: eventData.event_type,
			pageUrl: eventData.page_url,
		});

		// Create event repository
		const repositoryResult = await createDynamoDBEventRepository();
		if (!repositoryResult.success || !repositoryResult.data) {
			logEventApiEvent("error", "Failed to create event repository", {
				requestId,
				error: repositoryResult.error,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.SERVICE_UNAVAILABLE,
					"Event tracking service is not available",
					{ error: repositoryResult.error, requestId },
				),
				{ status: 503 },
			);
		}

		// Create event service and store event
		const eventService = new EventService(repositoryResult.data);

		logEventApiEvent("info", "Delegating to event service", { requestId });
		const result = await eventService.storeEvent({
			guestId,
			eventData,
		});

		const processingTime = Date.now() - startTime;
		logEventApiEvent("info", "Service call completed", {
			requestId,
			processingTime: `${processingTime}ms`,
			success: result.success,
		});

		// Handle service response
		if (result.success) {
			logEventApiEvent("info", "Event stored successfully", {
				requestId,
				guestId,
				eventType: eventData.event_type,
				eventId: result.data?.eventId,
			});
			return json(
				createSuccessResponse({
					eventId: result.data?.eventId,
					timestamp: result.data?.timestamp,
					message: "Event stored successfully",
				}),
				{ status: 201 },
			);
		} else {
			logEventApiEvent("warn", "Service returned error", {
				requestId,
				errorCode: result.error?.code,
				errorMessage: result.error?.message,
			});

			// Map service error codes to HTTP status codes
			let httpStatus = 500;

			switch (result.error?.code) {
				case "VALIDATION_ERROR":
					httpStatus = 400;
					break;
				case "CONFLICT_ERROR":
					httpStatus = 409;
					break;
				case "NOT_FOUND_ERROR":
					httpStatus = 404;
					break;
				case "PERMISSION_ERROR":
					httpStatus = 403;
					break;
				case "TIMEOUT_ERROR":
				case "DATABASE_ERROR":
					httpStatus = 503;
					break;
				case "RATE_LIMIT_ERROR":
					httpStatus = 429;
					break;
				default:
					httpStatus = 500;
			}

			return json(
				createErrorResponse(
					result.error?.code || ERROR_CODES.INTERNAL_ERROR,
					result.error?.message || "Failed to store event",
					{ details: result.error?.details, requestId },
				),
				{ status: httpStatus },
			);
		}
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logEventApiEvent("error", "Unexpected error in event API handler", {
			requestId,
			processingTime: `${processingTime}ms`,
			error:
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack,
						}
					: "Unknown error",
		});

		// Use the enhanced error classification
		const errorInfo = classifyEventError(error);

		logEventApiEvent("error", `Classified error: ${errorInfo.code}`, {
			requestId,
			errorCode: errorInfo.code,
			errorMessage: errorInfo.message,
			httpStatus: errorInfo.httpStatus,
		});

		return json(
			createErrorResponse(errorInfo.code, errorInfo.message, {
				error: error instanceof Error ? error.message : "Unknown error",
				processingTime: `${processingTime}ms`,
				requestId,
			}),
			{
				status: errorInfo.httpStatus,
				headers: {
					"X-Request-ID": requestId,
				},
			},
		);
	}
};

/**
 * PUT /api/events - Store multiple events in batch
 */
export const PUT: RequestHandler = async ({ request, cookies }) => {
	const startTime = Date.now();
	const requestId = generateRequestId();

	try {
		// Get server configuration
		const config = getServerEventTrackingConfig();

		// Check if event tracking is enabled
		if (!config.enabled) {
			logEventApiEvent("info", "Batch event tracking is disabled", {
				requestId,
			});
			return json(
				createSuccessResponse({
					message: "Event tracking is disabled",
					successCount: 0,
					failureCount: 0,
					eventIds: [],
				}),
				{ status: 200 },
			);
		}

		logEventApiEvent("info", "Starting batch store events request", {
			requestId,
		});

		// Validate request size
		const sizeValidation = validateRequestSize(request);
		if (!sizeValidation.isValid) {
			logEventApiEvent("warn", "Request size validation failed", {
				requestId,
				error: sizeValidation.error,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					sizeValidation.error ?? "",
					{ requestId },
				),
				{ status: 413 },
			);
		}

		// Validate and get guest ID from cookies
		const authResult = validateGuestId(cookies);
		const guestId = authResult.guestId;

		logEventApiEvent("info", "Guest ID validated for batch request", {
			requestId,
			guestId,
			isNewGuest: authResult.isNewGuest,
		});

		// Check rate limiting (higher limit for batch operations)
		const rateLimitResult = checkRateLimit(guestId, 20, 60000); // 20 batch requests per minute
		if (!rateLimitResult.allowed) {
			logEventApiEvent("warn", "Batch rate limit exceeded", {
				requestId,
				guestId,
				remaining: rateLimitResult.remaining,
				resetTime: new Date(rateLimitResult.resetTime).toISOString(),
			});
			return json(
				createErrorResponse(
					ERROR_CODES.RATE_LIMIT_ERROR,
					"Too many batch requests. Please try again later",
					{
						requestId,
						remaining: rateLimitResult.remaining,
						resetTime: rateLimitResult.resetTime,
					},
				),
				{
					status: 429,
					headers: {
						"Retry-After": Math.ceil(
							(rateLimitResult.resetTime - Date.now()) / 1000,
						).toString(),
						"X-RateLimit-Limit": "20",
						"X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
						"X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
					},
				},
			);
		}

		// Parse request body
		let requestBody: unknown;
		try {
			requestBody = await request.json();
		} catch (error) {
			logEventApiEvent("warn", "Invalid JSON in batch request body", {
				requestId,
				error: error instanceof Error ? error.message : "Unknown error",
			});
			return json(
				createErrorResponse(
					ERROR_CODES.INVALID_JSON_ERROR,
					"Invalid JSON in request body",
					{ requestId },
				),
				{ status: 400 },
			);
		}

		// Validate batch request structure
		if (!requestBody || typeof requestBody !== "object") {
			logEventApiEvent("warn", "Invalid batch request structure", {
				requestId,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Request body must be an object",
					{ requestId },
				),
				{ status: 400 },
			);
		}

		const batchRequest = requestBody as Record<string, unknown>;

		if (!Array.isArray(batchRequest.events)) {
			logEventApiEvent("warn", "Events array missing in batch request", {
				requestId,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Request must contain an 'events' array",
					{ requestId },
				),
				{ status: 400 },
			);
		}

		const events = batchRequest.events;

		if (events.length === 0) {
			logEventApiEvent("warn", "Empty events array in batch request", {
				requestId,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Events array must not be empty",
					{ requestId },
				),
				{ status: 400 },
			);
		}

		if (events.length > 25) {
			logEventApiEvent("warn", "Batch size exceeds limit", {
				requestId,
				eventCount: events.length,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Batch size cannot exceed 25 events",
					{ requestId, maxSize: 25 },
				),
				{ status: 400 },
			);
		}

		// Validate each event in the batch with sanitization
		const validatedEvents: UserEvent[] = [];
		for (let i = 0; i < events.length; i++) {
			const validation = validateEventRequest(events[i], config.sanitizeData);
			if (!validation.isValid || !validation.data) {
				logEventApiEvent(
					"warn",
					`Event validation failed in batch at index ${i}`,
					{
						requestId,
						eventIndex: i,
						errors: validation.errors,
					},
				);
				return json(
					createErrorResponse(
						ERROR_CODES.EVENT_VALIDATION_ERROR,
						`Event ${i} validation failed`,
						{ errors: validation.errors, eventIndex: i, requestId },
					),
					{ status: 400 },
				);
			}
			validatedEvents.push(validation.data);
		}

		logEventApiEvent("info", "Batch request validated successfully", {
			requestId,
			guestId,
			eventCount: validatedEvents.length,
		});

		// Create event repository
		const repositoryResult = await createDynamoDBEventRepository();
		if (!repositoryResult.success || !repositoryResult.data) {
			logEventApiEvent("error", "Failed to create event repository for batch", {
				requestId,
				error: repositoryResult.error,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.SERVICE_UNAVAILABLE,
					"Event tracking service is not available",
					{ error: repositoryResult.error, requestId },
				),
				{ status: 503 },
			);
		}

		// Create event service and store events
		const eventService = new EventService(repositoryResult.data);

		logEventApiEvent(
			"info",
			"Delegating to event service for batch operation",
			{
				requestId,
				eventCount: validatedEvents.length,
			},
		);

		const result = await eventService.batchStoreEvents({
			guestId,
			events: validatedEvents,
		});

		const processingTime = Date.now() - startTime;
		logEventApiEvent("info", "Batch service call completed", {
			requestId,
			processingTime: `${processingTime}ms`,
			success: result.success,
		});

		// Handle service response
		if (result.success) {
			logEventApiEvent("info", "Batch events stored successfully", {
				requestId,
				guestId,
				eventCount: result.data?.successCount,
				eventIds: result.data?.eventIds,
			});
			return json(
				createSuccessResponse({
					successCount: result.data?.successCount || 0,
					failureCount: result.data?.failureCount || 0,
					eventIds: result.data?.eventIds || [],
					message: "Events stored successfully",
				}),
				{ status: 201 },
			);
		} else {
			logEventApiEvent("warn", "Batch service returned error", {
				requestId,
				errorCode: result.error?.code,
				errorMessage: result.error?.message,
			});

			// Map service error codes to HTTP status codes
			let httpStatus = 500;

			switch (result.error?.code) {
				case "VALIDATION_ERROR":
					httpStatus = 400;
					break;
				case "CONFLICT_ERROR":
					httpStatus = 409;
					break;
				case "NOT_FOUND_ERROR":
					httpStatus = 404;
					break;
				case "PERMISSION_ERROR":
					httpStatus = 403;
					break;
				case "TIMEOUT_ERROR":
				case "DATABASE_ERROR":
				case "BATCH_STORE_ERROR":
					httpStatus = 503;
					break;
				case "RATE_LIMIT_ERROR":
					httpStatus = 429;
					break;
				default:
					httpStatus = 500;
			}

			return json(
				createErrorResponse(
					result.error?.code || ERROR_CODES.INTERNAL_ERROR,
					result.error?.message || "Failed to store events batch",
					{ details: result.error?.details, requestId },
				),
				{ status: httpStatus },
			);
		}
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logEventApiEvent("error", "Unexpected error in batch event API handler", {
			requestId,
			processingTime: `${processingTime}ms`,
			error:
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack,
						}
					: "Unknown error",
		});

		// Use the enhanced error classification
		const errorInfo = classifyEventError(error);

		logEventApiEvent("error", `Classified batch error: ${errorInfo.code}`, {
			requestId,
			errorCode: errorInfo.code,
			errorMessage: errorInfo.message,
			httpStatus: errorInfo.httpStatus,
		});

		return json(
			createErrorResponse(errorInfo.code, errorInfo.message, {
				error: error instanceof Error ? error.message : "Unknown error",
				processingTime: `${processingTime}ms`,
				requestId,
			}),
			{
				status: errorInfo.httpStatus,
				headers: {
					"X-Request-ID": requestId,
				},
			},
		);
	}
};
