import type { GenerateScheduleRequest, PlanData } from "@bts/core";
import { ScheduleGenerator } from "@bts/core";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { validateGuestId } from "$lib/server/middleware/auth";
import {
	getActivityService,
	getPlanService,
	getScheduleService,
} from "$lib/utils/apiHelpers";

// Create schedule generator with activity service
let scheduleGenerator: ScheduleGenerator | null = null;

async function getScheduleGenerator(): Promise<ScheduleGenerator> {
	if (!scheduleGenerator) {
		const activityService = await getActivityService();
		scheduleGenerator = new ScheduleGenerator(activityService);
	}
	return scheduleGenerator;
}

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

		const generator = await getScheduleGenerator();
		const result = await generator.generateSchedule(requestData);

		if (result.success) {
			// Automatically save the schedule using guestId from cookies
			if (guestId && result.schedule) {
				try {
					const solutionType = requestData.solutionType || "topranking";
					const title = `${solutionType.charAt(0).toUpperCase() + solutionType.slice(1)} Beauty Tour Plan`;

					// Save to both plans table (for backward compatibility) and schedules table
					const [planSavePromise, scheduleSavePromise] =
						await Promise.allSettled([
							// Save to plans table (existing functionality)
							(async () => {
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

								const planService = await getPlanService();
								return await planService.savePlan({
									guestId,
									planData,
									title,
								});
							})(),

							// Save to schedules table (new functionality)
							(async () => {
								const scheduleService = await getScheduleService();
								return await scheduleService.saveSchedule({
									guestId,
									title,
									request: requestData,
									schedule: result.schedule || [],
								});
							})(),
						]);

					// Log results
					if (
						planSavePromise.status === "fulfilled" &&
						planSavePromise.value.success
					) {
						console.log(
							`Schedule saved to plans table for ${solutionType}:`,
							planSavePromise.value.data.planId,
						);
					} else {
						console.error(
							`Failed to save to plans table for ${solutionType}:`,
							planSavePromise.status === "fulfilled"
								? planSavePromise.value
								: planSavePromise.reason,
						);
					}

					if (
						scheduleSavePromise.status === "fulfilled" &&
						scheduleSavePromise.value.success
					) {
						console.log(
							`Schedule saved to schedules table for ${solutionType}:`,
							scheduleSavePromise.value.data?.scheduleId,
						);
					} else {
						console.error(
							`Failed to save to schedules table for ${solutionType}:`,
							scheduleSavePromise.status === "fulfilled"
								? scheduleSavePromise.value.error
								: scheduleSavePromise.reason,
						);
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
