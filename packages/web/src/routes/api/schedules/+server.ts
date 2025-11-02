import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { validateGuestId } from "$lib/server/middleware/auth";
import { getScheduleService } from "$lib/utils/apiHelpers";

/**
 * GET /api/schedules
 * Get all schedules for the authenticated guest
 */
export const GET: RequestHandler = async ({ cookies }) => {
	try {
		// Get guestId from cookies using auth middleware
		const authResult = validateGuestId(cookies);
		const guestId = authResult.guestId;
		const scheduleService = await getScheduleService();

		const result = await scheduleService.getSchedules({ guestId });

		if (result.success) {
			return json({
				success: true,
				data: result.data,
				count: result.data?.length || 0,
			});
		} else {
			return json(
				{
					success: false,
					error: result.error?.message || "Failed to fetch schedules",
					details: result.error?.details,
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Get schedules error:", error);
		return json(
			{
				success: false,
				error: "Failed to fetch schedules",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};

/**
 * POST /api/schedules
 * Save a new schedule for the authenticated guest
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Get guestId from cookies using auth middleware
		const authResult = validateGuestId(cookies);
		const guestId = authResult.guestId;
		const requestData = await request.json();

		// Validate required fields
		if (!requestData.request || !requestData.schedule) {
			return json(
				{
					success: false,
					error: "Missing required fields",
					details: "Both 'request' and 'schedule' fields are required",
				},
				{ status: 400 },
			);
		}

		const scheduleService = await getScheduleService();

		const result = await scheduleService.saveSchedule({
			guestId,
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
			const statusCode = result.error?.code === "VALIDATION_ERROR" ? 400 : 500;
			return json(
				{
					success: false,
					error: result.error?.message || "Failed to save schedule",
					details: result.error?.details,
				},
				{ status: statusCode },
			);
		}
	} catch (error) {
		console.error("Save schedule error:", error);
		return json(
			{
				success: false,
				error: "Failed to save schedule",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};

/**
 * DELETE /api/schedules
 * Delete all schedules for the authenticated guest
 */
export const DELETE: RequestHandler = async ({ cookies }) => {
	try {
		// Get guestId from cookies using auth middleware
		const authResult = validateGuestId(cookies);
		const guestId = authResult.guestId;
		const _scheduleService = await getScheduleService();

		// Get the repository directly to call deleteSchedulesByGuestId
		// Note: This functionality could be added to the service layer if needed frequently
		const scheduleRepository = await import(
			"$lib/services/repositoryFactory"
		).then((m) => m.createDynamoDBScheduleRepository());

		await scheduleRepository.deleteSchedulesByGuestId(guestId);

		return json({
			success: true,
			message: "All schedules deleted successfully",
		});
	} catch (error) {
		console.error("Delete schedules error:", error);
		return json(
			{
				success: false,
				error: "Failed to delete schedules",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};
