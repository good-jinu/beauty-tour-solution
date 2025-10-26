import type { IEventRepository } from "../repositories";
import type { StoredEvent, UserEvent } from "../types";
import { EVENT_VALIDATION } from "../types";
import { validateStoredEvent, validateUserEvent } from "../types/event";
import { logger } from "../utils/logger";

/**
 * Request interface for storing events
 */
export interface StoreEventRequest {
	guestId: string;
	eventData: UserEvent;
}

/**
 * Response interface for storing events
 */
export interface StoreEventResponse {
	success: boolean;
	data?: {
		eventId: string;
		timestamp: string;
	};
	error?: {
		code: string;
		message: string;
		details?: Record<string, unknown> | string[] | string;
	};
}

/**
 * Request interface for batch storing events
 */
export interface BatchStoreEventsRequest {
	guestId: string;
	events: UserEvent[];
}

/**
 * Response interface for batch storing events
 */
export interface BatchStoreEventsResponse {
	success: boolean;
	data?: {
		successCount: number;
		failureCount: number;
		eventIds: string[];
	};
	error?: {
		code: string;
		message: string;
		details?: Record<string, unknown> | string[] | string;
	};
}

/**
 * Event service for handling event business logic
 */
export class EventService {
	constructor(private eventRepository: IEventRepository) {}

	/**
	 * Store a single user event with validation and sanitization
	 */
	async storeEvent(request: StoreEventRequest): Promise<StoreEventResponse> {
		const startTime = Date.now();

		try {
			logger.info("Starting event store operation", {
				guestId: request.guestId,
				eventType: request.eventData?.event_type,
				pageUrl: request.eventData?.page_url,
			});

			// Validate guest ID
			if (!request.guestId || request.guestId.trim() === "") {
				logger.warn("Event store failed: Invalid guest ID", {
					guestId: request.guestId,
				});
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Guest ID is required and must be non-empty",
						details: { field: "guestId" },
					},
				};
			}

			// Validate guest ID format (UUID v4)
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(request.guestId)) {
				logger.warn("Event store failed: Invalid guest ID format", {
					guestId: request.guestId,
				});
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Guest ID must be a valid UUID v4",
						details: { field: "guestId" },
					},
				};
			}

			// Validate event data
			logger.debug("Validating event data structure");
			const validation = validateUserEvent(request.eventData);
			if (!validation.isValid) {
				logger.warn("Event data validation failed", {
					errorCount: validation.errors?.length || 0,
					errors: validation.errors,
				});
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Event data validation failed",
						details: validation.errors,
					},
				};
			}

			logger.debug("Event data validation passed");

			// Sanitize event data
			const sanitizedEvent = this.sanitizeUserEvent(request.eventData);

			// Create stored event object
			const eventId = this.generateEventId();
			const now = new Date().toISOString();

			const storedEvent: StoredEvent = {
				guest_id: request.guestId,
				event_timestamp: sanitizedEvent.timestamp,
				event_type: sanitizedEvent.event_type,
				event_id: eventId,
				page_url: sanitizedEvent.page_url,
				user_agent: sanitizedEvent.user_agent,
				viewport_width: sanitizedEvent.viewport_width,
				viewport_height: sanitizedEvent.viewport_height,
				element_tag: sanitizedEvent.element_tag,
				element_id: sanitizedEvent.element_id,
				element_text: sanitizedEvent.element_text,
				scroll_percent: sanitizedEvent.scroll_percent,
				created_at: now,
			};

			logger.debug("Created stored event object", {
				eventId,
				guestId: request.guestId,
				eventType: storedEvent.event_type,
			});

			// Validate stored event before saving
			const storedValidation = validateStoredEvent(storedEvent);
			if (!storedValidation.isValid) {
				logger.error(
					"Stored event validation failed",
					new Error("Validation failed"),
					{
						errors: storedValidation.errors,
					},
				);
				return {
					success: false,
					error: {
						code: "INTERNAL_ERROR",
						message: "Failed to create valid stored event",
						details: storedValidation.errors,
					},
				};
			}

			// Save to repository
			logger.debug("Delegating to repository layer");
			await this.eventRepository.saveEvent(storedEvent);

			const processingTime = Date.now() - startTime;
			logger.info("Event stored successfully", {
				eventId: storedEvent.event_id,
				guestId: storedEvent.guest_id,
				eventType: storedEvent.event_type,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: true,
				data: {
					eventId: storedEvent.event_id,
					timestamp: storedEvent.event_timestamp,
				},
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error("Event store operation failed", error as Error, {
				guestId: request.guestId,
				eventType: request.eventData?.event_type,
				processingTime: `${processingTime}ms`,
			});

			return this.handleServiceError(
				error,
				"STORE_ERROR",
				"Failed to store event",
			);
		}
	}

	/**
	 * Store multiple events in a batch operation
	 */
	async batchStoreEvents(
		request: BatchStoreEventsRequest,
	): Promise<BatchStoreEventsResponse> {
		const startTime = Date.now();

		try {
			logger.info("Starting batch event store operation", {
				guestId: request.guestId,
				eventCount: request.events?.length || 0,
			});

			// Validate guest ID
			if (!request.guestId || request.guestId.trim() === "") {
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Guest ID is required and must be non-empty",
						details: { field: "guestId" },
					},
				};
			}

			// Validate guest ID format
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
			if (!uuidRegex.test(request.guestId)) {
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Guest ID must be a valid UUID v4",
						details: { field: "guestId" },
					},
				};
			}

			// Validate events array
			if (!Array.isArray(request.events) || request.events.length === 0) {
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Events array is required and must not be empty",
						details: { field: "events" },
					},
				};
			}

			// Validate batch size
			const maxBatchSize = 25; // DynamoDB batch write limit
			if (request.events.length > maxBatchSize) {
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: `Batch size cannot exceed ${maxBatchSize} events`,
						details: { field: "events", maxSize: maxBatchSize },
					},
				};
			}

			// Process and validate each event
			const storedEvents: StoredEvent[] = [];
			const eventIds: string[] = [];
			const now = new Date().toISOString();

			for (let i = 0; i < request.events.length; i++) {
				const userEvent = request.events[i];

				// Validate individual event
				const validation = validateUserEvent(userEvent);
				if (!validation.isValid) {
					logger.warn(`Event validation failed for event ${i}`, {
						errors: validation.errors,
					});
					return {
						success: false,
						error: {
							code: "VALIDATION_ERROR",
							message: `Event ${i} validation failed`,
							details: validation.errors,
						},
					};
				}

				// Sanitize and create stored event
				const sanitizedEvent = this.sanitizeUserEvent(userEvent);
				const eventId = this.generateEventId();
				eventIds.push(eventId);

				const storedEvent: StoredEvent = {
					guest_id: request.guestId,
					event_timestamp: sanitizedEvent.timestamp,
					event_type: sanitizedEvent.event_type,
					event_id: eventId,
					page_url: sanitizedEvent.page_url,
					user_agent: sanitizedEvent.user_agent,
					viewport_width: sanitizedEvent.viewport_width,
					viewport_height: sanitizedEvent.viewport_height,
					element_tag: sanitizedEvent.element_tag,
					element_id: sanitizedEvent.element_id,
					element_text: sanitizedEvent.element_text,
					scroll_percent: sanitizedEvent.scroll_percent,
					created_at: now,
				};

				storedEvents.push(storedEvent);
			}

			// Save batch to repository
			logger.debug("Delegating batch operation to repository layer");
			await this.eventRepository.batchSaveEvents(storedEvents);

			const processingTime = Date.now() - startTime;
			logger.info("Batch events stored successfully", {
				guestId: request.guestId,
				eventCount: storedEvents.length,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: true,
				data: {
					successCount: storedEvents.length,
					failureCount: 0,
					eventIds,
				},
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error("Batch event store operation failed", error as Error, {
				guestId: request.guestId,
				eventCount: request.events?.length || 0,
				processingTime: `${processingTime}ms`,
			});

			return this.handleBatchServiceError(
				error,
				"BATCH_STORE_ERROR",
				"Failed to store events batch",
			);
		}
	}

	/**
	 * Sanitize user event data to prevent sensitive information storage
	 */
	private sanitizeUserEvent(event: UserEvent): UserEvent {
		const sanitized: UserEvent = {
			event_type: event.event_type,
			timestamp: event.timestamp,
			page_url: this.sanitizeUrl(event.page_url),
			user_agent: event.user_agent
				? this.sanitizeUserAgent(event.user_agent)
				: undefined,
			viewport_width: event.viewport_width,
			viewport_height: event.viewport_height,
		};

		// Sanitize event-specific fields
		if (event.element_tag) {
			sanitized.element_tag = this.sanitizeString(
				event.element_tag,
				EVENT_VALIDATION.MAX_TAG_LENGTH,
			);
		}

		if (event.element_id) {
			sanitized.element_id = this.sanitizeString(
				event.element_id,
				EVENT_VALIDATION.MAX_ID_LENGTH,
			);
		}

		if (event.element_text) {
			sanitized.element_text = this.sanitizeElementText(event.element_text);
		}

		if (event.scroll_percent !== undefined) {
			sanitized.scroll_percent = Math.max(
				0,
				Math.min(100, Math.round(event.scroll_percent)),
			);
		}

		return sanitized;
	}

	/**
	 * Sanitize URL to remove sensitive query parameters
	 */
	private sanitizeUrl(url: string): string {
		try {
			const urlObj = new URL(url);

			// Remove potentially sensitive query parameters
			const sensitiveParams = [
				"token",
				"key",
				"password",
				"secret",
				"auth",
				"session",
				"api_key",
			];
			sensitiveParams.forEach((param) => {
				urlObj.searchParams.delete(param);
			});

			// Limit URL length
			const sanitizedUrl = urlObj.toString();
			return sanitizedUrl.length > EVENT_VALIDATION.MAX_URL_LENGTH
				? sanitizedUrl.substring(0, EVENT_VALIDATION.MAX_URL_LENGTH)
				: sanitizedUrl;
		} catch {
			// If URL parsing fails, just truncate the original string
			return url.length > EVENT_VALIDATION.MAX_URL_LENGTH
				? url.substring(0, EVENT_VALIDATION.MAX_URL_LENGTH)
				: url;
		}
	}

	/**
	 * Sanitize user agent string
	 */
	private sanitizeUserAgent(userAgent: string): string {
		// Remove potentially identifying information while keeping browser/OS info
		return this.sanitizeString(userAgent, EVENT_VALIDATION.MAX_TEXT_LENGTH);
	}

	/**
	 * Sanitize element text to prevent sensitive data capture
	 */
	private sanitizeElementText(text: string): string {
		// Remove potential sensitive patterns
		const sanitized = text
			.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[CARD]") // Credit card numbers
			.replace(
				/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
				"[EMAIL]",
			) // Email addresses
			.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[PHONE]") // Phone numbers
			.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, "[SSN]"); // SSN patterns

		return this.sanitizeString(sanitized, EVENT_VALIDATION.MAX_TEXT_LENGTH);
	}

	/**
	 * Generic string sanitization
	 */
	private sanitizeString(str: string, maxLength: number): string {
		if (!str) return str;

		// Trim whitespace and limit length
		const trimmed = str.trim();
		return trimmed.length > maxLength
			? trimmed.substring(0, maxLength)
			: trimmed;
	}

	/**
	 * Generate a unique event ID
	 */
	private generateEventId(): string {
		// Generate a UUID v4
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	/**
	 * Handle batch service errors with appropriate error codes and messages
	 */
	private handleBatchServiceError(
		error: unknown,
		defaultCode: string,
		defaultMessage: string,
	): BatchStoreEventsResponse {
		let errorCode = defaultCode;
		let errorMessage = defaultMessage;
		const errorDetails =
			error instanceof Error ? error.message : "Unknown error";

		if (error instanceof Error) {
			// Handle specific error types
			if (error.message.includes("validation")) {
				errorCode = "VALIDATION_ERROR";
				errorMessage = "Event data validation failed";
			} else if (
				error.message.includes("DynamoDB") ||
				error.message.includes("database")
			) {
				errorCode = "DATABASE_ERROR";
				errorMessage = "Database operation failed";
			} else if (error.message.includes("timeout")) {
				errorCode = "TIMEOUT_ERROR";
				errorMessage = "Operation timed out";
			} else if (
				error.message.includes("permission") ||
				error.message.includes("access")
			) {
				errorCode = "PERMISSION_ERROR";
				errorMessage = "Access denied";
			} else if (error.message.includes("rate limit")) {
				errorCode = "RATE_LIMIT_ERROR";
				errorMessage = "Rate limit exceeded";
			}
		}

		return {
			success: false,
			error: {
				code: errorCode,
				message: errorMessage,
				details: errorDetails,
			},
		};
	}

	/**
	 * Handle service errors with appropriate error codes and messages
	 */
	private handleServiceError(
		error: unknown,
		defaultCode: string,
		defaultMessage: string,
	): StoreEventResponse {
		let errorCode = defaultCode;
		let errorMessage = defaultMessage;
		const errorDetails =
			error instanceof Error ? error.message : "Unknown error";

		if (error instanceof Error) {
			// Handle specific error types
			if (error.message.includes("validation")) {
				errorCode = "VALIDATION_ERROR";
				errorMessage = "Event data validation failed";
			} else if (
				error.message.includes("DynamoDB") ||
				error.message.includes("database")
			) {
				errorCode = "DATABASE_ERROR";
				errorMessage = "Database operation failed";
			} else if (error.message.includes("timeout")) {
				errorCode = "TIMEOUT_ERROR";
				errorMessage = "Operation timed out";
			} else if (
				error.message.includes("permission") ||
				error.message.includes("access")
			) {
				errorCode = "PERMISSION_ERROR";
				errorMessage = "Access denied";
			} else if (error.message.includes("already exists")) {
				errorCode = "CONFLICT_ERROR";
				errorMessage = "Event already exists";
			} else if (error.message.includes("not found")) {
				errorCode = "NOT_FOUND_ERROR";
				errorMessage = "Resource not found";
			} else if (error.message.includes("rate limit")) {
				errorCode = "RATE_LIMIT_ERROR";
				errorMessage = "Rate limit exceeded";
			}
		}

		return {
			success: false,
			error: {
				code: errorCode,
				message: errorMessage,
				details: errorDetails,
			},
		};
	}
}
