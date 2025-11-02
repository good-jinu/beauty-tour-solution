import type {
	Activity,
	ActivityFilters,
	CreateActivityData,
	PaginatedActivities,
} from "@bts/core";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { validateAdminAuth } from "$lib/server/middleware";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_CODES,
	HTTP_STATUS,
} from "$lib/types/api";
import { getActivityService } from "$lib/utils/activityApiHelpers";
import {
	validateActivityFilters,
	validateCreateActivityRequest,
} from "$lib/utils/activityValidation";
import { generateRequestId, logApiEvent } from "$lib/utils/apiHelpers";

export const GET: RequestHandler = async ({ url, cookies }) => {
	// Check admin authentication
	const authResult = validateAdminAuth(cookies);
	if (!authResult.isAuthenticated) {
		return json(
			createErrorResponse(
				ERROR_CODES.UNAUTHORIZED,
				"Admin authentication required",
			),
			{ status: HTTP_STATUS.UNAUTHORIZED },
		);
	}
	const startTime = Date.now();
	const requestId = generateRequestId();

	try {
		logApiEvent("info", "Starting get activities request", { requestId });

		// Parse query parameters for filtering
		const searchParams = url.searchParams;
		const filters: ActivityFilters = {
			page: searchParams.get("page")
				? parseInt(searchParams.get("page")!, 10)
				: 1,
			limit: searchParams.get("limit")
				? parseInt(searchParams.get("limit")!, 10)
				: 50,
			search: searchParams.get("search") || undefined,
			theme: (searchParams.get("theme") as any) || undefined,
			region: searchParams.get("region") || undefined,
			minPrice: searchParams.get("minPrice")
				? parseFloat(searchParams.get("minPrice")!)
				: undefined,
			maxPrice: searchParams.get("maxPrice")
				? parseFloat(searchParams.get("maxPrice")!)
				: undefined,
			isActive: searchParams.get("isActive")
				? searchParams.get("isActive") === "true"
				: undefined,
			sortBy: (searchParams.get("sortBy") as any) || "createdAt",
			sortOrder: (searchParams.get("sortOrder") as any) || "desc",
		};

		// Validate filters
		const filterValidation = validateActivityFilters(filters);
		if (!filterValidation.isValid) {
			logApiEvent("warn", "Invalid activity filters", {
				requestId,
				errors: filterValidation.errors,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					`Invalid filters: ${filterValidation.errors?.join(", ")}`,
					{ filters, errors: filterValidation.errors },
				),
				{ status: HTTP_STATUS.BAD_REQUEST },
			);
		}

		logApiEvent("info", "Filters validated successfully", {
			requestId,
			filters,
		});

		// Get activity service and fetch activities
		const activityService = await getActivityService();
		const result: PaginatedActivities =
			await activityService.getActivities(filters);

		const processingTime = Date.now() - startTime;
		logApiEvent("info", "Activities retrieved successfully", {
			requestId,
			processingTime: `${processingTime}ms`,
			count: result.activities.length,
			total: result.pagination.total,
		});

		return json(createSuccessResponse(result), { status: HTTP_STATUS.OK });
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logApiEvent("error", "Failed to get activities", {
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
				return json(
					createErrorResponse(
						ERROR_CODES.SERVICE_UNAVAILABLE,
						"Activity service is not properly configured",
						{ error: error.message },
					),
					{ status: HTTP_STATUS.SERVICE_UNAVAILABLE },
				);
			}

			// AWS/DynamoDB specific errors
			if (
				error.message.includes("AccessDenied") ||
				error.message.includes("UnauthorizedOperation")
			) {
				return json(
					createErrorResponse(
						ERROR_CODES.SERVICE_UNAVAILABLE,
						"Database access denied. Please contact support",
						{ error: "Permission denied" },
					),
					{ status: HTTP_STATUS.SERVICE_UNAVAILABLE },
				);
			}

			// Timeout errors
			if (
				error.message.includes("timeout") ||
				error.message.includes("ETIMEDOUT")
			) {
				return json(
					createErrorResponse(
						ERROR_CODES.TIMEOUT_ERROR,
						"Request timed out. Please try again",
						{ error: "Timeout" },
					),
					{ status: HTTP_STATUS.SERVICE_UNAVAILABLE },
				);
			}
		}

		// Generic error response
		return json(
			createErrorResponse(
				ERROR_CODES.INTERNAL_ERROR,
				"An unexpected error occurred while fetching activities",
				{
					error: error instanceof Error ? error.message : "Unknown error",
					processingTime: `${processingTime}ms`,
					requestId,
				},
			),
			{ status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
		);
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	// Check admin authentication
	const authResult = validateAdminAuth(cookies);
	if (!authResult.isAuthenticated) {
		return json(
			createErrorResponse(
				ERROR_CODES.UNAUTHORIZED,
				"Admin authentication required",
			),
			{ status: HTTP_STATUS.UNAUTHORIZED },
		);
	}
	const startTime = Date.now();
	const requestId = generateRequestId();

	try {
		logApiEvent("info", "Starting create activity request", { requestId });

		// Parse request body
		const body = await request.json();

		// Validate request data
		const validation = validateCreateActivityRequest(body);
		if (!validation.isValid) {
			logApiEvent("warn", "Invalid activity creation data", {
				requestId,
				errors: validation.errors,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					`Validation failed: ${validation.errors?.join(", ")}`,
					{ errors: validation.errors },
				),
				{ status: HTTP_STATUS.BAD_REQUEST },
			);
		}

		const activityData: CreateActivityData = validation.data!;

		logApiEvent("info", "Activity data validated successfully", {
			requestId,
			name: activityData.name,
			theme: activityData.theme,
		});

		// Create activity through service
		const activityService = await getActivityService();
		const activity: Activity =
			await activityService.createActivity(activityData);

		const processingTime = Date.now() - startTime;
		logApiEvent("info", "Activity created successfully", {
			requestId,
			processingTime: `${processingTime}ms`,
			activityId: activity.activityId,
			name: activity.name,
		});

		return json(createSuccessResponse(activity), {
			status: HTTP_STATUS.CREATED,
		});
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logApiEvent("error", "Failed to create activity", {
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
			// Validation errors from service layer
			if (error.message.includes("Validation failed")) {
				return json(
					createErrorResponse(ERROR_CODES.VALIDATION_ERROR, error.message, {
						error: error.message,
					}),
					{ status: HTTP_STATUS.BAD_REQUEST },
				);
			}

			// Database configuration errors
			if (error.message.includes("DynamoDB table name is required")) {
				return json(
					createErrorResponse(
						ERROR_CODES.SERVICE_UNAVAILABLE,
						"Activity service is not properly configured",
						{ error: error.message },
					),
					{ status: HTTP_STATUS.SERVICE_UNAVAILABLE },
				);
			}

			// Duplicate activity errors
			if (error.message.includes("already exists")) {
				return json(
					createErrorResponse(
						ERROR_CODES.CONFLICT_ERROR,
						"An activity with this name already exists",
						{ error: error.message },
					),
					{ status: 409 },
				);
			}
		}

		// Generic error response
		return json(
			createErrorResponse(
				ERROR_CODES.INTERNAL_ERROR,
				"An unexpected error occurred while creating the activity",
				{
					error: error instanceof Error ? error.message : "Unknown error",
					processingTime: `${processingTime}ms`,
					requestId,
				},
			),
			{ status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
		);
	}
};
