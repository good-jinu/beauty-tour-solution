import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_CODES,
} from "$lib/types/api";
import {
	generateRequestId,
	getPlanService,
	logApiEvent,
} from "$lib/utils/apiHelpers";

export const GET: RequestHandler = async ({ params, url }) => {
	const startTime = Date.now();
	const requestId = generateRequestId();

	try {
		logApiEvent("info", "Starting get plan detail request", {
			requestId,
			planId: params.planId,
		});

		// Get planId from route parameters
		const { planId } = params;

		// Get guestId from query parameters for security
		const guestId = url.searchParams.get("guestId");

		if (!planId || typeof planId !== "string" || planId.trim() === "") {
			logApiEvent("warn", "Plan ID missing from route parameters", {
				requestId,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Plan ID is required",
				),
				{ status: 400 },
			);
		}

		if (!guestId || guestId.trim() === "") {
			logApiEvent("warn", "Guest ID missing from query parameters", {
				requestId,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.GUEST_ID_REQUIRED,
					"Guest ID is required as a query parameter",
				),
				{ status: 400 },
			);
		}

		logApiEvent("info", "Request validated successfully", {
			requestId,
			planId,
			guestId,
		});

		// Call plan service to get all plans for the guest, then filter by planId
		// This ensures the guest can only access their own plans
		logApiEvent("info", "Delegating to plan service", { requestId });
		const service = await getPlanService();
		const result = await service.getPlans({ guestId });

		const processingTime = Date.now() - startTime;
		logApiEvent("info", "Service call completed", {
			requestId,
			processingTime: `${processingTime}ms`,
			success: result.success,
		});

		// Handle service response
		if (result.success) {
			// Find the specific plan
			const plan = result.data.find((p) => p.planId === planId);

			if (!plan) {
				logApiEvent("warn", "Plan not found or access denied", {
					requestId,
					planId,
					guestId,
				});
				return json(
					createErrorResponse(
						ERROR_CODES.VALIDATION_ERROR,
						"Plan not found or you don't have access to it",
					),
					{ status: 404 },
				);
			}

			logApiEvent("info", "Plan retrieved successfully", {
				requestId,
				planId,
				guestId,
			});
			return json(createSuccessResponse(plan), { status: 200 });
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
				case "NOT_FOUND_ERROR":
					httpStatus = 404;
					break;
				case "PERMISSION_ERROR":
					httpStatus = 403;
					break;
				case "TIMEOUT_ERROR":
					httpStatus = 503;
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

		// Handle specific error types
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
		}

		// Generic error response
		return json(
			createErrorResponse(
				ERROR_CODES.INTERNAL_ERROR,
				"An unexpected error occurred while fetching the plan",
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
