import type { GenerateScheduleRequest } from "@bts/core";
import { ScheduleGenerator } from "@bts/core";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";

const scheduleGenerator = new ScheduleGenerator();

export const POST: RequestHandler = async ({ request }) => {
	try {
		const requestData: GenerateScheduleRequest = await request.json();

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
