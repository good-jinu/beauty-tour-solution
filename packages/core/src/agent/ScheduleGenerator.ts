import { BedrockAgentCoreService } from "@bts/infra";
import type {
	GenerateScheduleRequest,
	GenerateScheduleResponse,
	ScheduleDay,
	ScheduleItem,
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
							items: {
								type: "array",
								items: {
									activityId: "string",
									scheduledTime: "string",
									duration: "string",
									status: "string (planned|booked|completed|cancelled)",
									notes: "string",
									customPrice: "number (optional)",
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
			if (!day.items) day.items = [];
			if (!day.notes) day.notes = "";
			day.items.forEach((item: ScheduleItem) => {
				if (!item.notes) item.notes = "";
				if (!item.status) item.status = "planned";
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
			const dayCost = day.items.reduce(
				(sum: number, item: ScheduleItem) => sum + (item.customPrice || 0),
				0,
			);
			day.totalCost = dayCost;
			totalCost += dayCost;
			totalActivities += day.items.length;
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
		const uniqueActivityIds = new Set<string>();
		parsed.schedule.forEach((day: ScheduleDay) => {
			day.items.forEach((item: ScheduleItem) => {
				uniqueActivityIds.add(item.activityId);
			});
		});

		parsed.summary = {
			totalDays: parsed.schedule.length,
			totalActivities,
			totalThemes: uniqueActivityIds.size, // Using activity count as theme approximation
			estimatedCost: totalCost,
			activitiesUsed: Array.from(uniqueActivityIds),
		};

		return parsed;
	}

	private createFallbackSchedule(): Partial<GenerateScheduleResponse> {
		const totalCost = 200;
		const fallbackActivityId = "fallback_activity_001";

		return {
			schedule: [
				{
					date: new Date().toISOString().split("T")[0],
					dayNumber: 1,
					items: [
						{
							activityId: fallbackActivityId,
							scheduledTime: "09:00",
							duration: "2h",
							status: "planned" as const,
							notes: "Comprehensive consultation and planning",
							customPrice: 200,
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
				activitiesUsed: [fallbackActivityId],
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
