import { BedrockAgentCoreService } from "@bts/infra";
import type {
	GenerateScheduleRequest,
	GenerateScheduleResponse,
	ScheduleDay,
	ScheduleItem,
} from "../types";
import type {
	Activity,
	ActivityTheme,
	ScheduleCriteria,
} from "../types/activity";
import type { IActivityService } from "./ActivityService";

interface ParsedSchedule {
	schedule: ScheduleDay[];
	summary?: GenerateScheduleResponse["summary"];
}

export class ScheduleGenerator {
	private agentService: BedrockAgentCoreService;
	private activityService: IActivityService;

	constructor(activityService: IActivityService) {
		this.agentService = new BedrockAgentCoreService();
		this.activityService = activityService;
	}

	async generateSchedule(
		request: GenerateScheduleRequest,
	): Promise<GenerateScheduleResponse> {
		try {
			// Get available activities based on user preferences
			const availableActivities = await this.getAvailableActivities(request);

			if (availableActivities.length === 0) {
				console.warn("No activities found for request criteria", request);
				return this.createFallbackSchedule();
			}

			// Prepare structured data with real activity information
			const structuredData = this.prepareStructuredDataWithActivities(
				request,
				availableActivities,
			);

			const result =
				await this.agentService.queryAgentWithStructuredData<ParsedSchedule>(
					structuredData,
					"trip-planner",
				);

			// Validate and normalize the structured response
			const validatedResult = this.validateAndNormalizeSchedule(result);

			// Add business logic calculations with real activity data
			const parsedResult =
				await this.addBusinessLogicCalculationsWithActivities(
					validatedResult,
					request,
					availableActivities,
				);

			return {
				success: true,
				schedule: parsedResult.schedule,
				summary: parsedResult.summary,
			};
		} catch (error) {
			console.error("Failed to generate schedule with structured data:", error);

			// Fallback to creating a basic schedule with real activities if possible
			const fallbackResult =
				await this.createFallbackScheduleWithActivities(request);

			return {
				...fallbackResult,
				error:
					error instanceof Error
						? error.message
						: "Failed to generate beauty schedule",
				details: error instanceof Error ? error.stack : undefined,
			};
		}
	}

	/**
	 * Prepare structured data with real activity information for better AI generation
	 */
	private prepareStructuredDataWithActivities(
		request: GenerateScheduleRequest,
		availableActivities: Activity[],
	): Record<string, unknown> {
		const duration = this.calculateDuration(request.startDate, request.endDate);
		const solutionType = request.solutionType || "topranking";

		// Group activities by theme for better organization
		const activitiesByTheme = this.groupActivitiesByTheme(availableActivities);

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
			availableActivities: activitiesByTheme,
			requirements: {
				generateIndividualCosts: false, // We'll use real activity prices
				skipTotalCalculations: true,
				useRealActivityData: true,
				respectWorkingHours: true,
				onlyScheduleDuringAvailableTimeSlots: true,
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
				workingHoursGuidelines: {
					preferBusinessHours: "09:00-17:00",
					avoidEarlyMorning: "before 08:00",
					avoidLateEvening: "after 19:00",
					checkAvailableTimeSlots:
						"Use only times listed in availableTimeSlots for each activity",
				},
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
									activityId: "string (must match available activity IDs)",
									scheduledTime: "string",
									duration: "string",
									status: "string (planned|booked|completed|cancelled)",
									notes: "string",
									customPrice: "number (optional override)",
								},
							},
							notes: "string",
						},
					},
				},
			},
		};
	}

	/**
	 * Group activities by theme for better organization in AI prompt
	 */
	private groupActivitiesByTheme(
		activities: Activity[],
	): Record<string, Activity[]> {
		const grouped: Record<string, Activity[]> = {};

		for (const activity of activities) {
			const theme = activity.theme;
			if (!grouped[theme]) {
				grouped[theme] = [];
			}

			grouped[theme].push({
				activityId: activity.activityId,
				name: activity.name,
				theme: activity.theme,
				location: {
					name: activity.location.name,
					district: activity.location.district,
					address: activity.location.address,
					city: activity.location.city,
					region: activity.location.region,
				},
				price: {
					amount: activity.price.amount,
					currency: activity.price.currency,
					type: activity.price.type,
				},
				workingHours: activity.workingHours,
				description: activity.description,
				amenities: activity.amenities,
				isActive: activity.isActive,
				createdAt: activity.createdAt,
				updatedAt: activity.updatedAt,
			});
		}

		return grouped;
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

	/**
	 * Add business logic calculations using real activity data
	 */
	private async addBusinessLogicCalculationsWithActivities(
		parsed: ParsedSchedule,
		request: GenerateScheduleRequest,
		availableActivities: Activity[],
	): Promise<ParsedSchedule> {
		// Create a map of activities for quick lookup
		const activityMap = new Map<string, Activity>();
		availableActivities.forEach((activity) => {
			activityMap.set(activity.activityId, activity);
		});

		// Validate schedule against working hours
		const workingHoursValidation = this.validateScheduleAgainstWorkingHours(
			parsed.schedule,
			availableActivities,
		);

		if (!workingHoursValidation.isValid) {
			console.warn(
				"Schedule has working hours conflicts:",
				workingHoursValidation.conflicts,
			);

			// Attempt to fix conflicts by suggesting alternative times
			await this.attemptToFixWorkingHoursConflicts(
				parsed.schedule,
				workingHoursValidation.conflicts,
				activityMap,
			);
		}

		let totalCost = 0;
		let totalActivities = 0;
		const themesUsed = new Set<string>();

		// Calculate day totals using real activity prices
		parsed.schedule.forEach((day: ScheduleDay) => {
			let dayCost = 0;

			day.items.forEach((item: ScheduleItem) => {
				const activity = activityMap.get(item.activityId);
				if (activity) {
					// Use custom price if provided, otherwise use activity price
					const itemPrice = item.customPrice || activity.price.amount;
					dayCost += itemPrice;
					themesUsed.add(activity.theme);
				} else {
					// Fallback to custom price or 0 if activity not found
					dayCost += item.customPrice || 0;
					console.warn(
						`Activity ${item.activityId} not found in available activities`,
					);
				}
			});

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

		// Calculate summary with real data
		const uniqueActivityIds = new Set<string>();
		parsed.schedule.forEach((day: ScheduleDay) => {
			day.items.forEach((item: ScheduleItem) => {
				uniqueActivityIds.add(item.activityId);
			});
		});

		parsed.summary = {
			totalDays: parsed.schedule.length,
			totalActivities,
			totalThemes: themesUsed.size,
			estimatedCost: totalCost,
			activitiesUsed: Array.from(uniqueActivityIds),
		};

		return parsed;
	}

	/**
	 * Attempt to fix working hours conflicts by adjusting schedule times
	 */
	private async attemptToFixWorkingHoursConflicts(
		schedule: ScheduleDay[],
		conflicts: Array<{
			date: string;
			activityId: string;
			time: string;
			reason: string;
		}>,
		activityMap: Map<string, Activity>,
	): Promise<void> {
		for (const conflict of conflicts) {
			const activity = activityMap.get(conflict.activityId);
			if (!activity) continue;

			// Find the schedule item to fix
			const day = schedule.find((d) => d.date === conflict.date);
			if (!day) continue;

			const item = day.items.find(
				(i) =>
					i.activityId === conflict.activityId &&
					i.scheduledTime === conflict.time,
			);
			if (!item) continue;

			// Get alternative times
			const alternatives = this.suggestAlternativeTimes(
				activity,
				conflict.date,
				conflict.time,
			);

			if (alternatives.length > 0) {
				const newTime = alternatives[0]; // Use the best alternative
				console.log(
					`Adjusting ${conflict.activityId} from ${conflict.time} to ${newTime} on ${conflict.date}`,
				);

				item.scheduledTime = newTime;
				item.notes = item.notes
					? `${item.notes} (Time adjusted due to working hours)`
					: "Time adjusted due to working hours";
			} else {
				console.warn(
					`No alternative times available for ${conflict.activityId} on ${conflict.date}`,
				);

				// Mark the item with a warning note
				item.notes = item.notes
					? `${item.notes} (WARNING: Scheduled outside working hours)`
					: "WARNING: Scheduled outside working hours";
			}
		}
	}

	private createFallbackSchedule(): GenerateScheduleResponse {
		const totalCost = 200;
		const fallbackActivityId = "fallback_activity_001";

		return {
			success: false,
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
			error: "Schedule generation failed, showing fallback data",
		};
	}

	/**
	 * Create fallback schedule using real activities when possible
	 */
	private async createFallbackScheduleWithActivities(
		request: GenerateScheduleRequest,
	): Promise<GenerateScheduleResponse> {
		try {
			// Try to get at least one activity for fallback
			const availableActivities = await this.getAvailableActivities(request);

			if (availableActivities.length > 0) {
				const activity = availableActivities[0];
				const totalCost = activity.price.amount;

				return {
					success: false,
					schedule: [
						{
							date: request.startDate,
							dayNumber: 1,
							items: [
								{
									activityId: activity.activityId,
									scheduledTime: "09:00",
									duration: "2h",
									status: "planned" as const,
									notes: `Fallback schedule with ${activity.name}`,
									customPrice: activity.price.amount,
								},
							],
							totalCost: totalCost,
							notes:
								"Schedule generation failed - showing fallback with real activity",
						},
					],
					summary: {
						totalDays: 1,
						totalActivities: 1,
						totalThemes: 1,
						estimatedCost: totalCost,
						activitiesUsed: [activity.activityId],
					},
					error:
						"Schedule generation failed, showing fallback with real activity data",
				};
			}
		} catch (error) {
			console.error("Failed to create fallback with real activities:", error);
		}

		// Fall back to the original fallback if no activities available
		return this.createFallbackSchedule();
	}

	private calculateDuration(startDate: string, endDate: string): number {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}

	/**
	 * Get available activities based on user preferences and filters
	 */
	async getAvailableActivities(
		request: GenerateScheduleRequest,
	): Promise<Activity[]> {
		const allActivities: Activity[] = [];

		// Search for activities for each selected theme
		for (const theme of request.selectedThemes) {
			try {
				const criteria: ScheduleCriteria = {
					theme: theme as ActivityTheme,
					region: request.region,
					maxPrice: request.budget
						? Math.floor((request.budget / request.selectedThemes.length) * 1.2)
						: undefined, // Allow 20% buffer
				};

				const themeActivities =
					await this.activityService.searchActivitiesForSchedule(criteria);
				allActivities.push(...themeActivities);
			} catch (error) {
				console.error(`Failed to get activities for theme ${theme}:`, error);
				// Continue with other themes even if one fails
			}
		}

		// Remove duplicates and apply additional filtering
		const uniqueActivities = this.removeDuplicateActivities(allActivities);
		console.log("uniqueActivities", uniqueActivities);
		const filteredActivities = this.applyActivityFiltering(
			uniqueActivities,
			request,
		);
		console.log("filtered: ", filteredActivities);

		// Filter by working hours to ensure activities are generally available
		const workingHoursFilteredActivities = this.filterActivitiesByWorkingHours(
			filteredActivities,
			[],
		);
		console.log("working: ", workingHoursFilteredActivities);

		// Sort by relevance and user preferences
		const sortedActivities = this.sortActivitiesByRelevance(
			workingHoursFilteredActivities,
			request,
		);
		console.log("sorted: ", sortedActivities);

		// Limit results to prevent overwhelming the AI with too many options
		const maxActivitiesPerTheme = 10;
		const limitedActivities = this.limitActivitiesPerTheme(
			sortedActivities,
			request.selectedThemes,
			maxActivitiesPerTheme,
		);

		console.log(
			`Found ${limitedActivities.length} available activities for schedule generation (from ${allActivities.length} total, ${workingHoursFilteredActivities.length} after working hours filter)`,
		);
		return limitedActivities;
	}

	/**
	 * Limit the number of activities per theme to prevent overwhelming the AI
	 */
	private limitActivitiesPerTheme(
		activities: Activity[],
		selectedThemes: string[],
		maxPerTheme: number,
	): Activity[] {
		const themeCounters: Record<string, number> = {};
		const result: Activity[] = [];

		// Initialize counters
		selectedThemes.forEach((theme) => {
			themeCounters[theme] = 0;
		});

		// Add activities up to the limit per theme
		for (const activity of activities) {
			const theme = activity.theme;
			if (themeCounters[theme] < maxPerTheme) {
				result.push(activity);
				themeCounters[theme]++;
			}
		}

		return result;
	}

	/**
	 * Remove duplicate activities from the list
	 */
	private removeDuplicateActivities(activities: Activity[]): Activity[] {
		const seen = new Set<string>();
		return activities.filter((activity) => {
			if (seen.has(activity.activityId)) {
				return false;
			}
			seen.add(activity.activityId);
			return true;
		});
	}

	/**
	 * Apply additional filtering logic based on user preferences
	 */
	private applyActivityFiltering(
		activities: Activity[],
		request: GenerateScheduleRequest,
	): Activity[] {
		return activities.filter((activity) => {
			// Only include active activities
			if (!activity.isActive) {
				return false;
			}

			// Filter by theme matching user selections
			if (!this.isThemeMatching(activity.theme, request.selectedThemes)) {
				return false;
			}

			// Apply budget constraints with flexible pricing
			if (
				!this.isBudgetCompatible(
					activity.price,
					request.budget,
					request.selectedThemes.length,
				)
			) {
				return false;
			}

			return true;
		});
	}

	/**
	 * Check if activity theme matches user selections
	 */
	private isThemeMatching(
		activityTheme: ActivityTheme,
		selectedThemes: string[],
	): boolean {
		return selectedThemes.includes(activityTheme);
	}

	/**
	 * Check if activity price is compatible with user budget
	 */
	private isBudgetCompatible(
		activityPrice: Activity["price"],
		userBudget: number,
		themeCount: number,
	): boolean {
		if (!userBudget) {
			return true; // No budget constraint
		}

		// Calculate budget per theme with some flexibility
		const budgetPerTheme = (userBudget * 1450) / themeCount;
		const maxAllowedPrice = budgetPerTheme * 1.2; // Allow 20% over budget per activity

		// Handle different price types
		switch (activityPrice.type) {
			case "fixed":
				return activityPrice.amount <= maxAllowedPrice;

			case "starting_from":
				// For "starting from" prices, be more lenient as final price may vary
				return activityPrice.amount <= maxAllowedPrice * 1.3;

			case "range":
				// For range pricing, check the minimum price
				return activityPrice.amount <= maxAllowedPrice;

			default:
				return activityPrice.amount <= maxAllowedPrice;
		}
	}

	/**
	 * Sort activities by relevance and user preferences
	 */
	private sortActivitiesByRelevance(
		activities: Activity[],
		request: GenerateScheduleRequest,
	): Activity[] {
		return activities.sort((a, b) => {
			// Primary sort: by theme priority (order in selectedThemes)
			const aThemeIndex = request.selectedThemes.indexOf(a.theme);
			const bThemeIndex = request.selectedThemes.indexOf(b.theme);

			if (aThemeIndex !== bThemeIndex) {
				return aThemeIndex - bThemeIndex;
			}

			// Secondary sort: by price (ascending for better value)
			const aPriceScore = this.calculatePriceScore(
				a.price,
				request.budget,
				request.selectedThemes.length,
			);
			const bPriceScore = this.calculatePriceScore(
				b.price,
				request.budget,
				request.selectedThemes.length,
			);

			if (aPriceScore !== bPriceScore) {
				return aPriceScore - bPriceScore;
			}

			// Tertiary sort: by location relevance
			const aLocationScore = this.calculateLocationScore(
				a.location,
				request.region,
			);
			const bLocationScore = this.calculateLocationScore(
				b.location,
				request.region,
			);

			return bLocationScore - aLocationScore; // Higher score first
		});
	}

	/**
	 * Calculate price score for sorting (lower is better)
	 */
	private calculatePriceScore(
		price: Activity["price"],
		userBudget: number,
		themeCount: number,
	): number {
		if (!userBudget) {
			return price.amount; // Just use raw price if no budget
		}

		const budgetPerTheme = userBudget / themeCount;
		const ratio = price.amount / budgetPerTheme;

		// Prefer activities that are 60-80% of budget per theme
		if (ratio >= 0.6 && ratio <= 0.8) {
			return ratio; // Best value range
		} else if (ratio < 0.6) {
			return ratio + 0.5; // Slightly penalize very cheap options
		} else {
			return ratio + 1.0; // Penalize expensive options
		}
	}

	/**
	 * Calculate location relevance score (higher is better)
	 */
	private calculateLocationScore(
		location: Activity["location"],
		userRegion: string,
	): number {
		// Exact region match gets highest score
		if (location.region === userRegion) {
			return 100;
		}

		// Partial matches get lower scores
		const normalizedActivityRegion = location.region.toLowerCase();
		const normalizedUserRegion = userRegion.toLowerCase();

		if (
			normalizedActivityRegion.includes(normalizedUserRegion) ||
			normalizedUserRegion.includes(normalizedActivityRegion)
		) {
			return 75;
		}

		// Check for known region relationships
		const regionProximity: Record<string, Record<string, number>> = {
			seoul: { incheon: 50, gyeonggi: 40 },
			busan: { ulsan: 60, gyeongsangnamdo: 40 },
			jeju: { jejuisland: 90 },
		};

		const userRegionLower = normalizedUserRegion;
		const activityRegionLower = normalizedActivityRegion;

		if (regionProximity[userRegionLower]?.[activityRegionLower]) {
			return regionProximity[userRegionLower][activityRegionLower];
		}

		return 0; // No relationship found
	}

	/**
	 * Check if an activity is available during a specific time slot
	 */
	private isActivityAvailableAtTime(
		activity: Activity,
		date: string,
		time: string,
	): boolean {
		try {
			const dayOfWeek = this.getDayOfWeek(date);
			const timeSlot = activity.workingHours[dayOfWeek];

			// Check if the activity is open on this day
			if (!timeSlot.isOpen) {
				return false;
			}

			// Check if the requested time is within working hours
			if (timeSlot.openTime && timeSlot.closeTime) {
				return this.isTimeWithinRange(
					time,
					timeSlot.openTime,
					timeSlot.closeTime,
				);
			}

			// If no specific hours are set but marked as open, assume available
			return true;
		} catch (error) {
			console.error(
				`Error checking activity availability for ${activity.activityId}:`,
				error,
			);
			return false; // Default to not available if there's an error
		}
	}

	/**
	 * Get day of week from date string
	 */
	private getDayOfWeek(dateString: string): keyof Activity["workingHours"] {
		const date = new Date(dateString);
		const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

		const dayNames: (keyof Activity["workingHours"])[] = [
			"sunday",
			"monday",
			"tuesday",
			"wednesday",
			"thursday",
			"friday",
			"saturday",
		];

		return dayNames[dayIndex];
	}

	/**
	 * Check if a time is within a given range
	 */
	private isTimeWithinRange(
		time: string,
		openTime: string,
		closeTime: string,
	): boolean {
		try {
			const timeMinutes = this.timeToMinutes(time);
			const openMinutes = this.timeToMinutes(openTime);
			const closeMinutes = this.timeToMinutes(closeTime);

			// Handle cases where close time is past midnight
			if (closeMinutes < openMinutes) {
				// Activity is open past midnight
				return timeMinutes >= openMinutes || timeMinutes <= closeMinutes;
			} else {
				// Normal case
				return timeMinutes >= openMinutes && timeMinutes <= closeMinutes;
			}
		} catch (error) {
			console.error(
				`Error comparing times: ${time}, ${openTime}, ${closeTime}`,
				error,
			);
			return false;
		}
	}

	/**
	 * Convert time string (HH:MM) to minutes since midnight
	 */
	private timeToMinutes(timeString: string): number {
		const [hours, minutes] = timeString.split(":").map(Number);
		return hours * 60 + minutes;
	}

	/**
	 * Filter activities based on working hours for a specific schedule
	 */
	private filterActivitiesByWorkingHours(
		activities: Activity[],
		_schedule: ScheduleDay[],
	): Activity[] {
		return activities.filter((activity) => {
			// Check if activity has at least one day when it's open
			const hasOpenDays = Object.values(activity.workingHours).some(
				(timeSlot) => timeSlot.isOpen,
			);

			if (!hasOpenDays) {
				return false; // Activity is never open
			}

			// For schedule generation, we want activities that are open during typical business hours
			// Check if activity is open during common appointment times (9 AM - 6 PM)
			const commonHours = [
				"09:00",
				"10:00",
				"11:00",
				"14:00",
				"15:00",
				"16:00",
			];
			const workingDays: (keyof Activity["workingHours"])[] = [
				"monday",
				"tuesday",
				"wednesday",
				"thursday",
				"friday",
			];

			for (const day of workingDays) {
				const timeSlot = activity.workingHours[day];
				if (timeSlot.isOpen) {
					for (const hour of commonHours) {
						if (
							!timeSlot.openTime ||
							!timeSlot.closeTime ||
							this.isTimeWithinRange(
								hour,
								timeSlot.openTime,
								timeSlot.closeTime,
							)
						) {
							return true; // Activity is available during at least one common hour
						}
					}
				}
			}

			return false; // Activity is not available during common business hours
		});
	}

	/**
	 * Validate schedule items against activity working hours
	 */
	private validateScheduleAgainstWorkingHours(
		schedule: ScheduleDay[],
		availableActivities: Activity[],
	): {
		isValid: boolean;
		conflicts: Array<{
			date: string;
			activityId: string;
			time: string;
			reason: string;
		}>;
	} {
		const activityMap = new Map<string, Activity>();
		availableActivities.forEach((activity) => {
			activityMap.set(activity.activityId, activity);
		});

		const conflicts: Array<{
			date: string;
			activityId: string;
			time: string;
			reason: string;
		}> = [];

		for (const day of schedule) {
			for (const item of day.items) {
				const activity = activityMap.get(item.activityId);

				if (!activity) {
					conflicts.push({
						date: day.date,
						activityId: item.activityId,
						time: item.scheduledTime,
						reason: "Activity not found",
					});
					continue;
				}

				if (
					!this.isActivityAvailableAtTime(
						activity,
						day.date,
						item.scheduledTime,
					)
				) {
					const dayOfWeek = this.getDayOfWeek(day.date);
					const timeSlot = activity.workingHours[dayOfWeek];

					let reason = "Activity is closed";
					if (!timeSlot.isOpen) {
						reason = `Activity is closed on ${dayOfWeek}`;
					} else if (timeSlot.openTime && timeSlot.closeTime) {
						reason = `Activity is closed at ${item.scheduledTime} (open ${timeSlot.openTime}-${timeSlot.closeTime})`;
					}

					conflicts.push({
						date: day.date,
						activityId: item.activityId,
						time: item.scheduledTime,
						reason,
					});
				}
			}
		}

		return {
			isValid: conflicts.length === 0,
			conflicts,
		};
	}

	/**
	 * Suggest alternative times for conflicted schedule items
	 */
	private suggestAlternativeTimes(
		activity: Activity,
		date: string,
		preferredTime: string,
	): string[] {
		const dayOfWeek = this.getDayOfWeek(date);
		const timeSlot = activity.workingHours[dayOfWeek];

		if (!timeSlot.isOpen || !timeSlot.openTime || !timeSlot.closeTime) {
			return []; // No alternatives if activity is closed
		}

		const alternatives: string[] = [];
		const openMinutes = this.timeToMinutes(timeSlot.openTime);
		const closeMinutes = this.timeToMinutes(timeSlot.closeTime);
		const preferredMinutes = this.timeToMinutes(preferredTime);

		// Generate time slots every 30 minutes within working hours
		for (
			let minutes = openMinutes;
			minutes <= closeMinutes - 60;
			minutes += 30
		) {
			const timeString = this.minutesToTime(minutes);

			// Skip the original conflicted time
			if (Math.abs(minutes - preferredMinutes) > 30) {
				alternatives.push(timeString);
			}
		}

		// Sort by proximity to preferred time
		alternatives.sort((a, b) => {
			const aMinutes = this.timeToMinutes(a);
			const bMinutes = this.timeToMinutes(b);
			const aDiff = Math.abs(aMinutes - preferredMinutes);
			const bDiff = Math.abs(bMinutes - preferredMinutes);
			return aDiff - bDiff;
		});

		return alternatives.slice(0, 3); // Return top 3 alternatives
	}

	/**
	 * Convert minutes since midnight to time string (HH:MM)
	 */
	private minutesToTime(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
	}
}
