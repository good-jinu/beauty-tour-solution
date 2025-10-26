import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_CODES,
	type SavePlanApiRequest,
	validateSavePlanRequest,
} from "$lib/types/api";
import {
	generateRequestId,
	getPlanService,
	logApiEvent,
} from "$lib/utils/apiHelpers";

export const POST: RequestHandler = async ({ request }) => {
	const startTime = Date.now();
	const requestId = generateRequestId();

	try {
		logApiEvent("info", "Starting plan save request", { requestId });

		// Parse request body
		let requestBody: unknown;
		try {
			requestBody = await request.json();
		} catch (error) {
			logApiEvent("error", "JSON parsing failed", {
				requestId,
				error: error instanceof Error ? error.message : "Unknown parsing error",
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Invalid JSON in request body",
					{
						error:
							error instanceof Error ? error.message : "Unknown parsing error",
					},
				),
				{ status: 400 },
			);
		}

		logApiEvent("info", "Request body parsed successfully", { requestId });

		// Validate request data
		const validation = validateSavePlanRequest(requestBody);
		if (!validation.isValid) {
			logApiEvent("warn", "Request validation failed", {
				requestId,
				errorCount: validation.errors?.length || 0,
				errors: validation.errors,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Request validation failed",
					{ errors: validation.errors },
				),
				{ status: 400 },
			);
		}

		const validatedRequest = validation.data as SavePlanApiRequest;
		logApiEvent("info", "Request validated successfully", {
			requestId,
			guestId: validatedRequest.guestId,
			hasTitle: !!validatedRequest.title,
		});

		// Additional validation for guest ID
		if (!validatedRequest.guestId || validatedRequest.guestId.trim() === "") {
			logApiEvent("warn", "Guest ID validation failed", { requestId });
			return json(
				createErrorResponse(
					ERROR_CODES.GUEST_ID_REQUIRED,
					"Guest ID is required",
				),
				{ status: 400 },
			);
		}

		// Additional validation for plan data
		if (!validatedRequest.planData) {
			logApiEvent("warn", "Plan data validation failed", { requestId });
			return json(
				createErrorResponse(
					ERROR_CODES.PLAN_DATA_REQUIRED,
					"Plan data is required",
				),
				{ status: 400 },
			);
		}

		// Log plan data structure for debugging
		logApiEvent("info", "Plan data structure validated", {
			requestId,
			hasFormData: !!validatedRequest.planData.formData,
			region: validatedRequest.planData.formData?.region,
			theme: validatedRequest.planData.formData?.theme,
			budget: validatedRequest.planData.formData?.budget,
		});

		// Call plan service to save the plan
		logApiEvent("info", "Delegating to plan service", { requestId });
		const service = await getPlanService();
		const result = await service.savePlan({
			guestId: validatedRequest.guestId,
			planData: validatedRequest.planData,
			title: validatedRequest.title,
		});

		const processingTime = Date.now() - startTime;
		logApiEvent("info", "Service call completed", {
			requestId,
			processingTime: `${processingTime}ms`,
			success: result.success,
		});

		// Handle service response
		if (result.success) {
			logApiEvent("info", "Plan saved successfully", {
				requestId,
				planId: result.data.planId,
				guestId: result.data.guestId,
			});
			return json(createSuccessResponse(result.data), { status: 201 });
		} else {
			logApiEvent("warn", "Service returned error", {
				requestId,
				errorCode: result.error.code,
				errorMessage: result.error.message,
			});

			// Map service error codes to HTTP status codes
			let httpStatus = 500;

			switch (result.error.code) {
				case "VALIDATION_ERROR":
					httpStatus = 400;
					break;
				case "DATABASE_ERROR":
				case "SAVE_ERROR":
					httpStatus = 500;
					break;
				case "TIMEOUT_ERROR":
					httpStatus = 503;
					break;
				case "PERMISSION_ERROR":
					httpStatus = 503;
					break;
				case "CONFLICT_ERROR":
					httpStatus = 409;
					break;
				case "NOT_FOUND_ERROR":
					httpStatus = 404;
					break;
				default:
					httpStatus = 500;
			}

			return json(
				createErrorResponse(
					result.error.code,
					result.error.message,
					result.error.details,
				),
				{ status: httpStatus },
			);
		}
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logApiEvent("error", "Unexpected error in API handler", {
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

		// Handle specific error types with better error messages
		if (error instanceof Error) {
			// Database configuration errors
			if (error.message.includes("DynamoDB table name is required")) {
				logApiEvent("error", "DynamoDB configuration error", { requestId });
				return json(
					createErrorResponse(
						ERROR_CODES.SERVICE_UNAVAILABLE,
						"Database service is not properly configured",
						{ error: error.message },
					),
					{ status: 503 },
				);
			}

			// Conflict errors
			if (error.message.includes("Plan with this ID already exists")) {
				logApiEvent("warn", "Plan ID conflict detected", { requestId });
				return json(
					createErrorResponse(
						ERROR_CODES.SAVE_FAILED,
						"Plan could not be saved due to a conflict",
						{ error: error.message },
					),
					{ status: 409 },
				);
			}

			// AWS/DynamoDB specific errors
			if (
				error.message.includes("AccessDenied") ||
				error.message.includes("UnauthorizedOperation")
			) {
				logApiEvent("error", "AWS permission error", { requestId });
				return json(
					createErrorResponse(
						ERROR_CODES.SERVICE_UNAVAILABLE,
						"Database access denied. Please contact support",
						{ error: "Permission denied" },
					),
					{ status: 503 },
				);
			}

			// Network/timeout errors
			if (
				error.message.includes("timeout") ||
				error.message.includes("ETIMEDOUT")
			) {
				logApiEvent("error", "Timeout error", { requestId });
				return json(
					createErrorResponse(
						ERROR_CODES.SERVICE_UNAVAILABLE,
						"Request timed out. Please try again",
						{ error: "Timeout" },
					),
					{ status: 503 },
				);
			}

			// Validation errors from deeper layers
			if (
				error.message.includes("validation") ||
				error.message.includes("invalid")
			) {
				logApiEvent("warn", "Deep validation error", { requestId });
				return json(
					createErrorResponse(
						ERROR_CODES.VALIDATION_ERROR,
						"Data validation failed",
						{ error: error.message },
					),
					{ status: 400 },
				);
			}
		}

		// Generic error response with more context
		return json(
			createErrorResponse(
				ERROR_CODES.INTERNAL_ERROR,
				"An unexpected error occurred while saving the plan",
				{
					error: error instanceof Error ? error.message : "Unknown error",
					processingTime: `${processingTime}ms`,
					requestId,
				},
			),
			{ status: 500 },
		);
	}
};
