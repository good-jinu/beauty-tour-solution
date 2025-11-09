import type { IScheduleRepository } from "../repositories/ScheduleRepository";
import type { ActivityTheme, ScheduleCriteria } from "../types/activity";
import type {
	GenerateScheduleRequest,
	GenerateScheduleResponse,
	ScheduleDay,
	ScheduleWithActivities,
} from "../types/schedule";
import { logger } from "../utils/logger";
import type { ScheduleActivityService } from "./ScheduleActivityService";
import { ScheduleService } from "./ScheduleService";

/**
 * Enhanced schedule service that integrates activity management with schedule generation
 * This service replaces mock data with real activities and provides comprehensive schedule management
 */
export class EnhancedScheduleService extends ScheduleService {
	private scheduleActivityService: ScheduleActivityService;

	constructor(
		scheduleRepository: IScheduleRepository,
		scheduleActivityService: ScheduleActivityService,
	) {
		super(scheduleRepository);
		this.scheduleActivityService = scheduleActivityService;
		logger.info("EnhancedScheduleService initialized");
	}

	/**
	 * Generate a schedule using real activities instead of mock data
	 */
	async generateSchedule(
		request: GenerateScheduleRequest,
	): Promise<GenerateScheduleResponse> {
		const startTime = Date.now();

		try {
			logger.info("Starting enhanced schedule generation", {
				region: request.region,
				themes: request.selectedThemes,
				budget: request.budget,
				dateRange: `${request.startDate} to ${request.endDate}`,
			});

			// Validate request
			const validation = this.validateGenerateRequest(request);
			if (!validation.isValid) {
				logger.warn("Schedule generation request validation failed", {
					errors: validation.errors,
				});
				return {
					success: false,
					error: "VALIDATION_ERROR",
					details: validation.errors.map((e) => e.message).join(", "),
				};
			}

			// Convert request to activity search criteria
			const criteria: ScheduleCriteria & {
				startDate: string;
				endDate: string;
				selectedThemes: string[];
				budget: number;
				solutionType?: "topranking" | "premium" | "budget";
			} = {
				theme: request.selectedThemes[0] as ActivityTheme, // Primary theme
				region: request.region,
				maxPrice: request.budget,
				startDate: request.startDate,
				endDate: request.endDate,
				selectedThemes: request.selectedThemes,
				budget: request.budget,
				solutionType: request.solutionType,
			};

			// Generate schedule with real activities
			const schedule =
				await this.scheduleActivityService.generateScheduleWithActivities(
					criteria,
				);

			if (schedule.length === 0) {
				logger.warn("No schedule generated - no suitable activities found", {
					criteria,
				});
				return {
					success: false,
					error: "NO_ACTIVITIES_FOUND",
					details:
						"No activities found matching your criteria. Please try adjusting your preferences.",
				};
			}

			// Calculate summary
			const totalActivities = schedule.reduce(
				(sum, day) => sum + day.items.length,
				0,
			);
			const totalCost = schedule.reduce((sum, day) => sum + day.totalCost, 0);
			const uniqueThemes = new Set<string>();
			const activityIds = new Set<string>();

			for (const day of schedule) {
				for (const item of day.items) {
					activityIds.add(item.activityId);
				}
			}

			// Get theme information by resolving a few activities
			const sampleActivities = await Promise.all(
				Array.from(activityIds)
					.slice(0, 5)
					.map((id) =>
						this.scheduleActivityService.activityService.getActivityById(id),
					),
			);

			sampleActivities.forEach((activity) => {
				if (activity) {
					uniqueThemes.add(activity.theme);
				}
			});

			const summary = {
				totalDays: schedule.length,
				totalActivities,
				totalThemes: uniqueThemes.size,
				estimatedCost: totalCost,
				activitiesUsed: Array.from(activityIds),
			};

			// Auto-save if guest ID provided
			if (request.guestId) {
				try {
					await this.saveSchedule({
						guestId: request.guestId,
						title: `Beauty Tour - ${request.region}`,
						request,
						schedule,
					});
					logger.debug("Schedule auto-saved for guest", {
						guestId: request.guestId,
					});
				} catch (saveError) {
					logger.warn("Failed to auto-save schedule", {
						guestId: request.guestId,
						error: (saveError as Error).message,
					});
					// Don't fail the generation if save fails
				}
			}

			const processingTime = Date.now() - startTime;
			logger.info("Enhanced schedule generated successfully", {
				totalDays: summary.totalDays,
				totalActivities: summary.totalActivities,
				estimatedCost: summary.estimatedCost,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: true,
				schedule,
				summary,
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error("Enhanced schedule generation failed", error as Error, {
				request,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: false,
				error: "GENERATION_ERROR",
				details: `Failed to generate schedule: ${(error as Error).message}`,
			};
		}
	}

	/**
	 * Get a schedule with resolved activity data for display
	 */
	async getScheduleWithActivities(
		guestId: string,
		scheduleId: string,
	): Promise<{
		success: boolean;
		data?: ScheduleWithActivities;
		error?: string;
	}> {
		try {
			logger.debug("Getting schedule with resolved activities", {
				guestId,
				scheduleId,
			});

			// Get the stored schedule
			const scheduleResponse = await this.getSchedule({ guestId, scheduleId });

			if (!scheduleResponse.success || !scheduleResponse.data) {
				return {
					success: false,
					error: scheduleResponse.error?.message || "Schedule not found",
				};
			}

			// Resolve activity references
			const resolvedSchedule =
				await this.scheduleActivityService.resolveScheduleActivities(
					scheduleResponse.data.schedule,
				);

			logger.debug("Schedule activities resolved successfully", {
				guestId,
				scheduleId,
				totalActivities: resolvedSchedule.summary.totalActivities,
			});

			return {
				success: true,
				data: resolvedSchedule,
			};
		} catch (error) {
			logger.error("Failed to get schedule with activities", error as Error, {
				guestId,
				scheduleId,
			});

			return {
				success: false,
				error: `Failed to get schedule: ${(error as Error).message}`,
			};
		}
	}

	/**
	 * Update a schedule item (change activity, time, etc.)
	 */
	async updateScheduleItem(
		guestId: string,
		scheduleId: string,
		dayNumber: number,
		itemIndex: number,
		updates: Partial<{
			activityId: string;
			scheduledTime: string;
			duration: string;
			status: "planned" | "booked" | "completed" | "cancelled";
			notes: string;
			customPrice: number;
		}>,
	): Promise<{
		success: boolean;
		data?: ScheduleDay[];
		error?: string;
	}> {
		try {
			logger.debug("Updating schedule item", {
				guestId,
				scheduleId,
				dayNumber,
				itemIndex,
				updates,
			});

			// Get current schedule
			const scheduleResponse = await this.getSchedule({ guestId, scheduleId });
			if (!scheduleResponse.success || !scheduleResponse.data) {
				return {
					success: false,
					error: "Schedule not found",
				};
			}

			const schedule = [...scheduleResponse.data.schedule];
			const day = schedule[dayNumber - 1];

			if (!day || !day.items[itemIndex]) {
				return {
					success: false,
					error: "Schedule item not found",
				};
			}

			// Update the item using the schedule activity service
			const updatedItem = await this.scheduleActivityService.updateScheduleItem(
				day.items[itemIndex],
				updates,
			);

			// Update the schedule
			schedule[dayNumber - 1].items[itemIndex] = updatedItem;

			// Recalculate day cost if price changed
			if (updates.customPrice !== undefined || updates.activityId) {
				let dayCost = 0;
				for (const item of schedule[dayNumber - 1].items) {
					if (item.customPrice !== undefined) {
						dayCost += item.customPrice;
					} else {
						// Get activity price
						const activity =
							await this.scheduleActivityService.activityService.getActivityById(
								item.activityId,
							);
						if (activity) {
							dayCost += activity.price.amount;
						}
					}
				}
				schedule[dayNumber - 1].totalCost = dayCost;
			}

			// Save updated schedule
			const updateResponse = await this.updateSchedule({
				guestId,
				scheduleId,
				schedule,
			});

			if (!updateResponse.success) {
				return {
					success: false,
					error: updateResponse.error?.message || "Failed to update schedule",
				};
			}

			logger.info("Schedule item updated successfully", {
				guestId,
				scheduleId,
				dayNumber,
				itemIndex,
			});

			return {
				success: true,
				data: schedule,
			};
		} catch (error) {
			logger.error("Failed to update schedule item", error as Error, {
				guestId,
				scheduleId,
				dayNumber,
				itemIndex,
			});

			return {
				success: false,
				error: `Failed to update schedule item: ${(error as Error).message}`,
			};
		}
	}

	/**
	 * Validate schedule generation request
	 */
	private validateGenerateRequest(request: GenerateScheduleRequest): {
		isValid: boolean;
		errors: Array<{ field: string; message: string }>;
	} {
		const errors: Array<{ field: string; message: string }> = [];

		if (!request.region || request.region.trim() === "") {
			errors.push({ field: "region", message: "Region is required" });
		}

		if (!request.startDate) {
			errors.push({ field: "startDate", message: "Start date is required" });
		}

		if (!request.endDate) {
			errors.push({ field: "endDate", message: "End date is required" });
		}

		if (!request.selectedThemes || request.selectedThemes.length === 0) {
			errors.push({
				field: "selectedThemes",
				message: "At least one theme must be selected",
			});
		}

		if (!request.budget || request.budget <= 0) {
			errors.push({
				field: "budget",
				message: "Budget must be greater than 0",
			});
		}

		// Validate date range
		if (request.startDate && request.endDate) {
			const startDate = new Date(request.startDate);
			const endDate = new Date(request.endDate);

			if (Number.isNaN(startDate.getTime())) {
				errors.push({
					field: "startDate",
					message: "Invalid start date format",
				});
			}

			if (Number.isNaN(endDate.getTime())) {
				errors.push({ field: "endDate", message: "Invalid end date format" });
			}

			if (startDate >= endDate) {
				errors.push({
					field: "dateRange",
					message: "End date must be after start date",
				});
			}

			// Check if dates are not too far in the past
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			if (startDate < today) {
				errors.push({
					field: "startDate",
					message: "Start date cannot be in the past",
				});
			}

			// Check reasonable date range (not more than 30 days)
			const daysDiff = Math.ceil(
				(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
			);
			if (daysDiff > 30) {
				errors.push({
					field: "dateRange",
					message: "Schedule cannot exceed 30 days",
				});
			}
		}

		// Validate themes
		const validThemes = [
			"plastic-surgery",
			"hair-salon",
			"skin-clinic",
			"diet-activities",
			"nail",
			"makeup",
		];

		if (request.selectedThemes) {
			for (const theme of request.selectedThemes) {
				if (!validThemes.includes(theme)) {
					errors.push({
						field: "selectedThemes",
						message: `Invalid theme: ${theme}. Valid themes are: ${validThemes.join(", ")}`,
					});
				}
			}
		}

		// Validate solution type
		if (request.solutionType) {
			const validSolutionTypes = ["topranking", "premium", "budget"];
			if (!validSolutionTypes.includes(request.solutionType)) {
				errors.push({
					field: "solutionType",
					message: `Invalid solution type: ${request.solutionType}. Valid types are: ${validSolutionTypes.join(", ")}`,
				});
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}
