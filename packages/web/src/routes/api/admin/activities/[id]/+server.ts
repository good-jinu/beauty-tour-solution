import type { Activity } from "@bts/core";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_CODES,
	HTTP_STATUS,
} from "$lib/types/api";
import { getActivityService } from "$lib/utils/activityApiHelpers";
import { validateUpdateActivityRequest } from "$lib/utils/activityValidation";
import { generateRequestId, logApiEvent } from "$lib/utils/apiHelpers";

export const GET: RequestHandler = async ({ params }) => {
	const startTime = Date.now();
	const requestId = generateRequestId();
	const activityId = params.id;

	try {
		logApiEvent("info", "Starting get activity by ID request", {
			requestId,
			activityId,
		});

		if (!activityId) {
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Activity ID is required",
				),
				{ status: HTTP_STATUS.BAD_REQUEST },
			);
		}

		// Get activity service and fetch activity
		const activityService = await getActivityService();
		const activity: Activity | null =
			await activityService.getActivityById(activityId);

		if (!activity) {
			logApiEvent("warn", "Activity not found", {
				requestId,
				activityId,
			});
			return json(
				createErrorResponse(
					ERROR_CODES.NOT_FOUND_ERROR,
					`Activity ${activityId} not found`,
				),
				{ status: HTTP_STATUS.NOT_FOUND },
			);
		}

		const processingTime = Date.now() - startTime;
		logApiEvent("info", "Activity retrieved successfully", {
			requestId,
			processingTime: `${processingTime}ms`,
			activityId,
			name: activity.name,
		});

		return json(createSuccessResponse(activity), { status: HTTP_STATUS.OK });
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logApiEvent("error", "Failed to get activity", {
			requestId,
			processingTime: `${processingTime}ms`,
			activityId,
			error:
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack,
						}
					: "Unknown error",
		});

		return json(
			createErrorResponse(
				ERROR_CODES.INTERNAL_ERROR,
				"An unexpected error occurred while fetching the activity",
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

export const PUT: RequestHandler = async ({ params, request }) => {
	const startTime = Date.now();
	const requestId = generateRequestId();
	const activityId = params.id;

	try {
		logApiEvent("info", "Starting update activity request", {
			requestId,
			activityId,
		});

		if (!activityId) {
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Activity ID is required",
				),
				{ status: HTTP_STATUS.BAD_REQUEST },
			);
		}

		// Parse request body
		const body = await request.json();

		// Validate request data
		const validation = validateUpdateActivityRequest(body);
		if (!validation.isValid) {
			logApiEvent("warn", "Invalid activity update data", {
				requestId,
				activityId,
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

		const updateData = validation.data;
		if (!updateData) {
			return json(
				createErrorResponse("VALIDATION_ERROR", "Invalid update data"),
				{ status: HTTP_STATUS.BAD_REQUEST },
			);
		}

		logApiEvent("info", "Activity update data validated successfully", {
			requestId,
			activityId,
			updateFields: Object.keys(updateData),
		});

		// Update activity through service
		const activityService = await getActivityService();
		const activity: Activity = await activityService.updateActivity(
			activityId,
			updateData,
		);

		const processingTime = Date.now() - startTime;
		logApiEvent("info", "Activity updated successfully", {
			requestId,
			processingTime: `${processingTime}ms`,
			activityId,
			name: activity.name,
		});

		return json(createSuccessResponse(activity), { status: HTTP_STATUS.OK });
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logApiEvent("error", "Failed to update activity", {
			requestId,
			processingTime: `${processingTime}ms`,
			activityId,
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
			// Not found errors
			if (error.message.includes("not found")) {
				return json(
					createErrorResponse(
						ERROR_CODES.NOT_FOUND_ERROR,
						`Activity ${activityId} not found`,
					),
					{ status: HTTP_STATUS.NOT_FOUND },
				);
			}

			// Validation errors from service layer
			if (error.message.includes("Validation failed")) {
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
				"An unexpected error occurred while updating the activity",
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

export const DELETE: RequestHandler = async ({ params }) => {
	const startTime = Date.now();
	const requestId = generateRequestId();
	const activityId = params.id;

	try {
		logApiEvent("info", "Starting delete activity request", {
			requestId,
			activityId,
		});

		if (!activityId) {
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Activity ID is required",
				),
				{ status: HTTP_STATUS.BAD_REQUEST },
			);
		}

		// Delete activity through service
		const activityService = await getActivityService();
		await activityService.deleteActivity(activityId);

		const processingTime = Date.now() - startTime;
		logApiEvent("info", "Activity deleted successfully", {
			requestId,
			processingTime: `${processingTime}ms`,
			activityId,
		});

		return json(
			createSuccessResponse({
				message: "Activity deleted successfully",
				activityId,
			}),
			{ status: HTTP_STATUS.OK },
		);
	} catch (error) {
		const processingTime = Date.now() - startTime;
		logApiEvent("error", "Failed to delete activity", {
			requestId,
			processingTime: `${processingTime}ms`,
			activityId,
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
			// Not found errors
			if (error.message.includes("not found")) {
				return json(
					createErrorResponse(
						ERROR_CODES.NOT_FOUND_ERROR,
						`Activity ${activityId} not found`,
					),
					{ status: HTTP_STATUS.NOT_FOUND },
				);
			}

			// Business logic errors (e.g., activity in use)
			if (error.message.includes("referenced in active schedules")) {
				return json(
					createErrorResponse(
						ERROR_CODES.CONFLICT_ERROR,
						"Cannot delete activity that is referenced in active schedules",
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
				"An unexpected error occurred while deleting the activity",
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
