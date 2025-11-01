import { BedrockAgentCoreService } from "@bts/infra";
import type {
	GenerateScheduleRequest,
	GenerateScheduleResponse,
	ScheduleActivity,
	ScheduleDay,
} from "../types";

interface ParsedSchedule {
	schedule: ScheduleDay[];
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
		const structuredData = this.prepareStructuredData(request);

		try {
			const result =
				await this.agentService.queryAgentWithStructuredData<ParsedSchedule>(
					structuredData,
					"trip-planner",
				);

			// Validate and normalize the structured response
			const validatedResult = this.validateAndNormalizeSchedule(result);

			// Add business logic calculations
			const parsedResult = this.addBusinessLogicCalculations(
				validatedResult,
				request,
			);

			return {
				success: true,
				...parsedResult,
			};
		} catch (error) {
			console.error("Failed to generate schedule with structured data:", error);

			// Fallback to creating a basic schedule
			const fallbackResult = this.createFallbackSchedule();

			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to generate beauty schedule",
				details: error instanceof Error ? error.stack : undefined,
				...fallbackResult,
			};
		}
	}

	private prepareStructuredData(
		request: GenerateScheduleRequest,
	): Record<string, unknown> {
		const duration = this.calculateDuration(request.startDate, request.endDate);
		const solutionType = request.solutionType || "topranking";

		return {
			action: "generate_beauty_schedule",
			tripDetails: {
				region: request.region,
				startDate: request.startDate,
				endDate: request.endDate,
				duration,
				themes: request.selectedThemes,
				budget: request.budget,
				solutionType,
				specialRequests: request.moreRequests || null,
			},
			requirements: {
				generateIndividualCosts: true,
				skipTotalCalculations: true,
				dayStructure: {
					day1: "consultations",
					day2Plus: "treatments",
					finalDay: "follow-ups",
				},
				categories: [
					"consultation",
					"treatment",
					"recovery",
					"wellness",
					"transport",
				],
				includeLocations: true,
				includeDetailedDescriptions: true,
				useRealisticCosts: true,
			},
			outputFormat: {
				structure: "schedule_array",
				fields: {
					schedule: {
						type: "array",
						items: {
							date: "string (ISO)",
							dayNumber: "number",
							activities: {
								type: "array",
								items: {
									time: "string",
									activity: "string",
									location: "string",
									duration: "string",
									cost: "number",
									description: "string",
									category:
										"string (consultation|treatment|recovery|wellness|transport)",
								},
							},
							notes: "string",
						},
					},
				},
			},
		};
	}

	private validateAndNormalizeSchedule(parsed: ParsedSchedule): ParsedSchedule {
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

		return parsed;
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
