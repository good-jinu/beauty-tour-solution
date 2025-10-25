import { BedrockAgentCoreService } from "@bts/infra";
import type {
	GenerateScheduleRequest,
	GenerateScheduleResponse,
	ScheduleActivity,
	ScheduleDay,
} from "../types";

interface ParsedSchedule {
	schedule: ScheduleDay[];
	costBreakdown?: GenerateScheduleResponse["costBreakdown"];
	summary?: GenerateScheduleResponse["summary"];
}

export class ScheduleGenerator {
	private agentService: BedrockAgentCoreService;

	constructor() {
		this.agentService = new BedrockAgentCoreService();
	}

	async generateSchedule(
		request: GenerateScheduleRequest,
	): Promise<GenerateScheduleResponse> {
		const prompt = this.createStructuredPrompt(request);

		try {
			const result = await this.agentService.queryAgent(prompt, "trip-planner");

			// Parse the structured JSON response and add business logic calculations
			const parsedResult = this.parseAgentResponse(result, request);

			return {
				success: true,
				...parsedResult,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to generate beauty schedule",
				details: error instanceof Error ? error.stack : undefined,
			};
		}
	}

	private createStructuredPrompt(request: GenerateScheduleRequest): string {
		const duration = this.calculateDuration(request.startDate, request.endDate);
		const solutionType = request.solutionType || "topranking";

		return `Create a beauty tourism schedule for ${request.region}.

TRIP DETAILS:
- Dates: ${request.startDate} to ${request.endDate} (${duration} days)
- Themes: ${request.selectedThemes.join(", ")}
- Budget: $${request.budget} USD
- Solution Type: ${solutionType}
- Travelers: ${request.travelers || 1}
${request.moreRequests ? `- Special Requests: ${request.moreRequests}` : ""}

FOCUS ON:
- Generate activities with individual costs only
- Don't calculate totals or summaries
- Day 1: consultations, Day 2+: treatments, Final day: follow-ups
- Categories: consultation, treatment, recovery, wellness, transport
- Include specific locations and detailed descriptions
- Use realistic individual activity costs for ${request.region}`;
	}

	private parseAgentResponse(
		response: GenerateScheduleResponse | string,
		request: GenerateScheduleRequest,
	): Partial<GenerateScheduleResponse> {
		try {
			if (typeof response !== "string") {
				return response;
			}

			// Clean and parse JSON response
			let cleanResponse = response.trim();

			// Remove markdown code blocks
			cleanResponse = cleanResponse
				.replace(/```json\n?/g, "")
				.replace(/```\n?/g, "");

			// Extract JSON object
			const jsonStart = cleanResponse.indexOf("{");
			const jsonEnd = cleanResponse.lastIndexOf("}") + 1;

			if (jsonStart === -1 || jsonEnd === 0) {
				throw new Error("No JSON found in response");
			}

			const jsonString = cleanResponse.substring(jsonStart, jsonEnd);
			const parsed: ParsedSchedule = JSON.parse(jsonString);

			// Basic validation
			if (!parsed.schedule || !Array.isArray(parsed.schedule)) {
				throw new Error("Invalid schedule structure");
			}

			// Ensure all required fields exist
			parsed.schedule.forEach((day: ScheduleDay) => {
				if (!day.activities) day.activities = [];
				if (!day.notes) day.notes = "";
				day.activities.forEach((activity: ScheduleActivity) => {
					if (!activity.description) activity.description = "";
				});
			});

			// Add business logic calculations here (moved from Python)
			return this.addBusinessLogicCalculations(parsed, request);
		} catch (error) {
			console.error("Failed to parse agent response:", error);
			return this.createFallbackSchedule();
		}
	}

	private addBusinessLogicCalculations(
		parsed: ParsedSchedule,
		request: GenerateScheduleRequest,
	): Partial<GenerateScheduleResponse> {
		// Calculate totals in business logic, not LLM
		let totalCost = 0;
		let totalActivities = 0;

		// Calculate day totals
		parsed.schedule.forEach((day: ScheduleDay) => {
			const dayCost = day.activities.reduce(
				(sum: number, activity: ScheduleActivity) => sum + (activity.cost || 0),
				0,
			);
			day.totalCost = dayCost;
			totalCost += dayCost;
			totalActivities += day.activities.length;
		});

		// Apply solution type multiplier
		const solutionType = request.solutionType || "topranking";
		const costMultiplier =
			solutionType === "premium" ? 1.5 : solutionType === "budget" ? 0.6 : 1.0;
		totalCost = Math.round(totalCost * costMultiplier);

		// Update day costs with multiplier
		parsed.schedule.forEach((day: ScheduleDay) => {
			day.totalCost = Math.round(day.totalCost * costMultiplier);
		});

		// Calculate cost breakdown
		parsed.costBreakdown = {
			treatments: Math.round(totalCost * 0.7),
			accommodation: Math.round(totalCost * 0.2),
			transportation: Math.round(totalCost * 0.05),
			activities: Math.round(totalCost * 0.05),
			total: totalCost,
			budgetUtilization: Math.min(1.0, totalCost / request.budget),
		};

		// Calculate summary
		const uniqueCategories = new Set();
		parsed.schedule.forEach((day: ScheduleDay) => {
			day.activities.forEach((activity: ScheduleActivity) => {
				uniqueCategories.add(activity.category);
			});
		});

		parsed.summary = {
			totalDays: parsed.schedule.length,
			totalActivities,
			totalThemes: uniqueCategories.size,
			estimatedCost: totalCost,
		};

		return parsed;
	}

	private createFallbackSchedule(): Partial<GenerateScheduleResponse> {
		const totalCost = 200;

		return {
			schedule: [
				{
					date: new Date().toISOString().split("T")[0],
					dayNumber: 1,
					activities: [
						{
							time: "09:00",
							activity: "Initial Consultation",
							location: "Beauty Clinic",
							duration: "2h",
							cost: 200,
							description: "Comprehensive consultation and planning",
							category: "consultation" as const,
						},
					],
					totalCost: totalCost,
					notes: "Schedule generation failed - showing fallback data",
				},
			],

			costBreakdown: {
				treatments: Math.round(totalCost * 0.7),
				accommodation: Math.round(totalCost * 0.2),
				transportation: Math.round(totalCost * 0.05),
				activities: Math.round(totalCost * 0.05),
				total: totalCost,
				budgetUtilization: 0.04,
			},
			summary: {
				totalDays: 1,
				totalActivities: 1,
				totalThemes: 1,
				estimatedCost: totalCost,
			},
		};
	}

	private calculateDuration(startDate: string, endDate: string): number {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}
}
