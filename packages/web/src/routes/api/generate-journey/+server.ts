import type { GenerateJourneyRequest } from "@bts/core";
import { JourneyGenerator } from "@bts/core";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

// Use the region from SvelteKit server env if available, otherwise default to us-east-1
const awsRegion = env.AWS_REGION ?? "us-east-1";
const journeyGenerator = new JourneyGenerator({ awsRegion });

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData: GenerateJourneyRequest = await request.json();
		const result = await journeyGenerator.generateJourney(formData);

		if (result.success) {
			return json(result);
		} else {
			return json(result, { status: 500 });
		}
	} catch (error) {
		console.error("Journey Generation Error:", error);

		return json(
			{
				success: false,
				error: "Failed to generate beauty journey recommendations",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};
