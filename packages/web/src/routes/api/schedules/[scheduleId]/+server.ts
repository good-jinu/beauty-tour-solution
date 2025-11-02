import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { validateGuestId } from "$lib/server/middleware/auth";
import { getScheduleService } from "$lib/utils/apiHelpers";

/**
 * GET /api/schedules/[scheduleId]
 * Get a specific schedule by ID for the authenticated guest
 */
export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		// Get guestId from cookies using auth middleware
		const authResult = validateGuestId(cookies);
		const guestId = authResult.guestId;
		const scheduleId = (params as Record<string, string>).scheduleId;

		if (!scheduleId) {
			return json(
				{
					success: false,
					error: "Missing schedule ID",
					details: "Schedule ID is required in the URL path",
				},
				{ status: 400 },
			);
		}

		const scheduleService = await getScheduleService();

		const result = await scheduleService.getSchedule({ guestId, scheduleId });

		if (result.success) {
			return json({
				success: true,
				data: result.data,
			});
		} else {
			const statusCode = result.error?.code === "NOT_FOUND_ERROR" ? 404 : 500;
			return json(
				{
					success: false,
					error: result.error?.message || "Failed to fetch schedule",
					details: result.error?.details,
				},
				{ status: statusCode },
			);
		}
	} catch (error) {
		console.error("Get schedule error:", error);
		return json(
			{
				success: false,
				error: "Failed to fetch schedule",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};

/**
 * PUT /api/schedules/[scheduleId]
 * Update a specific schedule by ID for the authenticated guest
 */
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		// Get guestId from cookies using auth middleware
		const authResult = validateGuestId(cookies);
		const guestId = authResult.guestId;
		const scheduleId = (params as Record<string, string>).scheduleId;

		if (!scheduleId) {
			return json(
				{
					success: false,
					error: "Missing schedule ID",
					details: "Schedule ID is required in the URL path",
				},
				{ status: 400 },
			);
		}

		const requestData = await request.json();
		const scheduleService = await getScheduleService();

		const result = await scheduleService.updateSchedule({
			guestId,
			scheduleId,
			title: requestData.title,
			request: requestData.request,
			schedule: requestData.schedule,
		});

		if (result.success) {
			return json({
				success: true,
				data: result.data,
			});
		} else {
			let statusCode = 500;
			if (result.error?.code === "NOT_FOUND_ERROR") {
				statusCode = 404;
			} else if (result.error?.code === "VALIDATION_ERROR") {
				statusCode = 400;
			}

			return json(
				{
					success: false,
					error: result.error?.message || "Failed to update schedule",
					details: result.error?.details,
				},
				{ status: statusCode },
			);
		}
	} catch (error) {
		console.error("Update schedule error:", error);
		return json(
			{
				success: false,
				error: "Failed to update schedule",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};

/**
 * DELETE /api/schedules/[scheduleId]
 * Delete a specific schedule by ID for the authenticated guest
 */
export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		// Get guestId from cookies using auth middleware
		const authResult = validateGuestId(cookies);
		const guestId = authResult.guestId;
		const scheduleId = (params as Record<string, string>).scheduleId;

		if (!scheduleId) {
			return json(
				{
					success: false,
					error: "Missing schedule ID",
					details: "Schedule ID is required in the URL path",
				},
				{ status: 400 },
			);
		}

		const scheduleService = await getScheduleService();

		const result = await scheduleService.deleteSchedule({
			guestId,
			scheduleId,
		});

		if (result.success) {
			return json({
				success: true,
				message: "Schedule deleted successfully",
			});
		} else {
			const statusCode = result.error?.code === "NOT_FOUND_ERROR" ? 404 : 500;
			return json(
				{
					success: false,
					error: result.error?.message || "Failed to delete schedule",
					details: result.error?.details,
				},
				{ status: statusCode },
			);
		}
	} catch (error) {
		console.error("Delete schedule error:", error);
		return json(
			{
				success: false,
				error: "Failed to delete schedule",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};
