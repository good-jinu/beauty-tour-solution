import {
	BedrockRuntimeClient,
	ConversationRole,
	ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { GenerateJourneyRequest, GenerateJourneyResponse } from "../types";
import { BEAUTY_THEMES, REGIONS } from "../types";

export interface JourneyGeneratorConfig {
	awsRegion?: string;
	modelId?: string;
}

export class JourneyGenerator {
	private client: BedrockRuntimeClient;
	private modelId: string;

	constructor(config: JourneyGeneratorConfig = {}) {
		const awsRegion = config.awsRegion ?? "us-east-1";
		this.client = new BedrockRuntimeClient({ region: awsRegion });
		this.modelId = config.modelId ?? "openai.gpt-oss-120b-1:0";
	}

	async generateJourney(
		formData: GenerateJourneyRequest,
	): Promise<GenerateJourneyResponse> {
		try {
			const prompt = this.createPrompt(formData);

			// Build conversation messages in the format expected by the Converse API
			const conversation = [
				{
					role: ConversationRole.USER,
					content: [{ text: prompt }],
				},
			];

			const command = new ConverseCommand({
				modelId: this.modelId,
				messages: conversation,
				// inferenceConfig maps to the CLI's --inference-config
				inferenceConfig: {
					maxTokens: 4096,
					temperature: 0.7,
					topP: 0.9,
				},
			});

			const response = await this.client.send(command);

			// Response structure: response.output.message.content[0].text
			const aiResponse =
				response?.output?.message?.content?.[0]?.text ??
				response?.output?.message?.content?.[1]?.text ??
				// fallback in case of different structure
				(typeof response === "string" ? response : null);

			return {
				success: true,
				recommendation: aiResponse,
				formData,
			};
		} catch (error) {
			console.error("Bedrock API Error:", error);

			return {
				success: false,
				error: "Failed to generate beauty journey recommendations",
				details: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	private createPrompt(data: GenerateJourneyRequest): string {
		const regionLabels = Object.fromEntries(
			REGIONS.map((region) => [
				region.value,
				`${region.label} - ${region.city}`,
			]),
		);
		const themeLabels = Object.fromEntries(
			BEAUTY_THEMES.map((theme) => [theme.value, theme.label]),
		);

		const duration = this.calculateDuration(data.startDate, data.endDate);
		const addOns: string[] = [];

		if (data.addOns.flights) addOns.push("flights");
		if (data.addOns.hotels) addOns.push("recovery accommodation");
		if (data.addOns.activities) addOns.push("wellness activities");
		if (data.addOns.transport) addOns.push("medical transport");

		return `You are a professional beauty and medical tourism consultant. Create a detailed, personalized beauty journey plan based on the following information:

**Destination:** ${regionLabels[data.region] || data.region}
**Travel Dates:** ${data.startDate} to ${data.endDate} (${duration} days)
**Treatment Type:** ${themeLabels[data.theme] || data.theme}
**Number of Travelers:** ${data.travelers} person(s)
**Budget:** $${data.budget} USD
**Package Includes:** ${addOns.length > 0 ? addOns.join(", ") : "treatments only"}
${data.specialRequests ? `**Special Requests:** ${data.specialRequests}` : ""}

Please provide a comprehensive beauty journey plan that includes:

1. **Executive Summary** - Brief overview of the recommended journey

2. **Recommended Clinics/Facilities** (3-5 options)
   - Name and reputation
   - Specific treatments offered
   - Estimated costs
   - Why they're suitable for this client

3. **Day-by-Day Itinerary**
   - Treatment schedule
   - Recovery periods
   - Wellness activities
   - Sightseeing opportunities (if time permits)

4. **Accommodation Recommendations**
   - Recovery-friendly hotels or medical hotels
   - Amenities important for recovery
   - Estimated costs

5. **Budget Breakdown**
   - Treatment costs
   - Accommodation
   - Transportation (if included)
   - Activities (if included)
   - Contingency fund recommendation

6. **Important Considerations**
   - Pre-trip preparations
   - Medical considerations
   - Recovery timeline
   - Post-treatment care
   - Travel restrictions or requirements

7. **Tips for This Destination**
   - Cultural considerations
   - Language support
   - Best practices for medical tourism in this region
   - Safety tips

Format the response in clear sections with markdown formatting. Be specific, professional, and consider safety and quality above all else.`;
	}

	private calculateDuration(startDate: string, endDate: string): number {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}
}
