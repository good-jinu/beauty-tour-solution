import type { Activity, ScheduleCriteria } from "@bts/core";
import { ActivityTheme } from "@bts/core";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_CODES,
	HTTP_STATUS,
} from "$lib/types/api";
import { getActivityService } from "$lib/utils/activityApiHelpers";
import { generateRequestId, logApiEvent } from "$lib/utils/apiHelpers";

/**
 * Validate schedule criteria from query parameters
 */
function validateScheduleCriteria(searchParams: URLSearchParams): {
	isValid: boolean;
	data?: ScheduleCriteria;
	errors?: string[];
} {
	const errors: string[] = [];

	// Validate required theme parameter
	const theme = searchParams.get("theme");
	if (!theme) {
		errors.push("theme parameter is required");
	} else {
		// Validate theme is a valid ActivityTheme
		const validThemes = Object.values(ActivityTheme);
		if (!validThemes.includes(theme as ActivityTheme)) {
			errors.push(`Invalid theme. Must be one of: ${validThemes.join(", ")}`);
		}
	}

	// Validate optional parameters
	const region = searchParams.get("region");
	const maxPriceStr = searchParams.get("maxPrice");
	const workingHoursDay = searchParams.get("workingHoursDay");
	const workingHoursTime = searchParams.get("workingHoursTime");

	let maxPrice: number | undefined;
	if (maxPriceStr) {
		maxPrice = parseFloat(maxPriceStr);
		if (Number.isNaN(maxPrice) || maxPrice <= 0) {
			errors.push("maxPrice must be a positive number");
		}
	}

	// Validate working hours parameters (both must be provided together)
	let workingHours: ScheduleCriteria["workingHours"];
	if (workingHoursDay || workingHoursTime) {
		if (!workingHoursDay || !workingHoursTime) {
			errors.push(
				"Both workingHoursDay and workingHoursTime must be provided together",
			);
		} else {
			const validDays = [
				"monday",
				"tuesday",
				"wednesday",
				"thursday",
				"friday",
				"saturday",
				"sunday",
			];
			if (!validDays.includes(workingHoursDay)) {
				errors.push(
					`Invalid workingHoursDay. Must be one of: ${validDays.join(", ")}`,
				);
			}

			// Validate time format (HH:MM)
			const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
			if (!timeRegex.test(workingHoursTime)) {
				errors.push(
					"Invalid workingHoursTime format. Must be HH:MM (e.g., 14:30)",
				);
			}

			if (errors.length === 0) {
				workingHours = {
					day: workingHoursDay as keyof ScheduleCriteria["workingHours"],
					time: workingHoursTime,
				};
			}
		}
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	const criteria: ScheduleCriteria = {
		theme: theme as ActivityTheme,
		region: region || undefined,
		maxPrice,
		workingHours,
	};

	return { isValid: true, data: criteria };
}

export const GET: RequestHandler = async ({ url }) => {
	const startTime = Date.now();
	const requestId = generateRequestId();

	try {
		logApiEvent("info", "Starting activity search request", { requestId });

		// Parse and validate query parameters
		const searchParams = url.searchParams;
		const validation = validateScheduleCriteria(searchParams);

		if (!validation.isValid) {
			logApiEvent("warn", "Invalid search criteria", {
				requestId,
				errors: validation.errors,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					`Invalid search criteria: ${validation.errors?.join(", ")}`,
					{ errors: validation.errors },
				),
				{ status: HTTP_STATUS.BAD_REQUEST },
			);
		}

		const criteria = validation.data!;

		logApiEvent("info", "Search criteria validated successfully", {
			requestId,
			criteria,
		});

		// Search activities through service
		const activityService = await getActivityService();
		const activities: Activity[] =
			await activityService.searchActivitiesForSchedule(criteria);

		const processingTime = Date.now() - startTime;
		logApiEvent("info", "Activity search completed successfully", {
			requestId,
			processingTime: `${processingTime}ms`,
			resultCount: activities.length,
			theme: criteria.theme,
			region: criteria.region,
		});

		// Return activities optimized for schedule generation
		const optimizedActivities = activities.map((activity) => ({
			activityId: activity.activityId,
			name: activity.name,
			theme: activity.theme,
			workingHours: activity.workingHours,
			location: activity.location,
			price: activity.price,
			description: activity.description,
			images: activity.images?.slice(0, 1), // Only include first image for performance
			amenities: activity.amenities,
			isActive: activity.isActive,
		}));

		return json(createSuccessResponse(optimizedActivities), {
			status: HTTP_STATUS.OK,
		});
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logApiEvent("error", "Failed to search activities", {
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

			// Validation errors from service layer
			if (error.message.includes("Theme is required")) {
				return json(
					createErrorResponse(ERROR_CODES.VALIDATION_ERROR, error.message, {
						error: error.message,
					}),
					{ status: HTTP_STATUS.BAD_REQUEST },
				);
			}
		}

		// Generic error response
		return json(
			createErrorResponse(
				ERROR_CODES.INTERNAL_ERROR,
				"An unexpected error occurred while searching activities",
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
