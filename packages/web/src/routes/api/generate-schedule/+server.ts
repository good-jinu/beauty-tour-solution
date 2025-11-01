import type { GenerateScheduleRequest, PlanData } from "@bts/core";
import { ScheduleGenerator } from "@bts/core";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { validateGuestId } from "$lib/server/middleware/auth";
import { getPlanService } from "$lib/utils/apiHelpers";

const scheduleGenerator = new ScheduleGenerator();

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const requestData: GenerateScheduleRequest = await request.json();

		// Get guestId from cookies using auth middleware
		const authResult = validateGuestId(cookies);
		const guestId = authResult.guestId;

		// Validate required fields
		if (
			!requestData.region ||
			!requestData.startDate ||
			!requestData.endDate ||
			!requestData.selectedThemes ||
			!requestData.budget
		) {
			return json(
				{
					success: false,
					error: "Missing required fields",
					details:
						"region, startDate, endDate, selectedThemes, and budget are required",
				},
				{ status: 400 },
			);
		}

		const result = await scheduleGenerator.generateSchedule(requestData);

		if (result.success) {
			// Automatically save the schedule using guestId from cookies
			if (guestId && result.schedule) {
				try {
					const planData: PlanData = {
						formData: {
							region: requestData.region,
							startDate: requestData.startDate,
							endDate: requestData.endDate,
							theme: requestData.selectedThemes[0] || "",
							budget: requestData.budget,
							specialRequests: requestData.moreRequests || null,
						},
						schedule: result,
					};

					const solutionType = requestData.solutionType || "topranking";
					const title = `${solutionType.charAt(0).toUpperCase() + solutionType.slice(1)} Beauty Tour Plan`;

					const planService = await getPlanService();
					const saveResult = await planService.savePlan({
						guestId,
						planData,
						title,
					});

					if (saveResult.success) {
						console.log(
							`Schedule automatically saved for ${solutionType}:`,
							saveResult.data.planId,
						);
					} else {
						console.error(
							`Failed to auto-save schedule for ${solutionType}:`,
							saveResult.error,
						);
						// Don't fail the generation if saving fails, just log the error
					}
				} catch (saveError) {
					console.error("Error during auto-save:", saveError);
					// Don't fail the generation if saving fails, just log the error
				}
			}

			return json(result);
		} else {
			return json(result, { status: 500 });
		}
	} catch (error) {
		console.error("Schedule Generation Error:", error);

		return json(
			{
				success: false,
				error: "Failed to generate beauty schedule",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};
