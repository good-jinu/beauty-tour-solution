import type { Activity, ScheduleCriteria } from "../types/activity";
import type {
	ScheduleDay,
	ScheduleDayWithActivities,
	ScheduleItem,
	ScheduleItemWithActivity,
	ScheduleWithActivities,
} from "../types/schedule";
import { logger } from "../utils/logger";
import type { IActivityService } from "./ActivityService";

/**
 * Service for integrating activities with schedules
 * Handles resolving activity references and schedule generation logic
 */
export class ScheduleActivityService {
	public readonly activityService: IActivityService;

	constructor(activityService: IActivityService) {
		this.activityService = activityService;
		logger.info("ScheduleActivityService initialized");
	}

	/**
	 * Resolve activity references in a schedule to get full activity data
	 */
	async resolveScheduleActivities(
		schedule: ScheduleDay[],
	): Promise<ScheduleWithActivities> {
		try {
			logger.debug("Resolving activity references in schedule", {
				totalDays: schedule.length,
			});

			// Collect all unique activity IDs from the schedule
			const activityIds = new Set<string>();
			for (const day of schedule) {
				for (const item of day.items) {
					activityIds.add(item.activityId);
				}
			}

			// Fetch all activities in batch
			const activities = new Map<string, Activity>();
			const activityPromises = Array.from(activityIds).map(
				async (activityId) => {
					const activity =
						await this.activityService.getActivityById(activityId);
					if (activity) {
						activities.set(activityId, activity);
					}
					return { activityId, activity };
				},
			);

			await Promise.all(activityPromises);

			// Resolve each day's activities
			const resolvedSchedule: ScheduleDayWithActivities[] = [];
			let totalActivities = 0;
			const themesUsed = new Set<string>();
			let totalCost = 0;

			for (const day of schedule) {
				const resolvedItems: ScheduleItemWithActivity[] = [];

				for (const item of day.items) {
					const activity = activities.get(item.activityId);
					if (!activity) {
						logger.warn("Activity not found for schedule item", {
							activityId: item.activityId,
							date: day.date,
						});
						continue;
					}

					const resolvedItem: ScheduleItemWithActivity = {
						...item,
						activity: {
							activityId: activity.activityId,
							name: activity.name,
							theme: activity.theme,
							location: {
								name: activity.location.name,
								address: activity.location.address,
								district: activity.location.district,
							},
							price: {
								currency: activity.price.currency,
								amount: activity.price.amount,
								type: activity.price.type,
							},
							description: activity.description,
							contactInfo: activity.contactInfo,
						},
					};

					resolvedItems.push(resolvedItem);
					totalActivities++;
					themesUsed.add(activity.theme);

					// Use custom price if set, otherwise use activity price
					const itemCost = item.customPrice ?? activity.price.amount;
					totalCost += itemCost;
				}

				resolvedSchedule.push({
					...day,
					items: resolvedItems,
				});
			}

			const result: ScheduleWithActivities = {
				schedule: resolvedSchedule,
				summary: {
					totalDays: schedule.length,
					totalActivities,
					totalThemes: themesUsed.size,
					estimatedCost: totalCost,
					activitiesUsed: Array.from(activityIds),
				},
			};

			logger.debug("Schedule activities resolved successfully", {
				totalDays: result.summary.totalDays,
				totalActivities: result.summary.totalActivities,
				totalThemes: result.summary.totalThemes,
				estimatedCost: result.summary.estimatedCost,
			});

			return result;
		} catch (error) {
			logger.error("Failed to resolve schedule activities", error as Error);
			throw new Error(
				`Failed to resolve schedule activities: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Generate a schedule using real activities based on user criteria
	 */
	async generateScheduleWithActivities(
		criteria: ScheduleCriteria & {
			startDate: string;
			endDate: string;
			selectedThemes: string[];
			budget: number;
			solutionType?: "topranking" | "premium" | "budget";
		},
	): Promise<ScheduleDay[]> {
		try {
			logger.debug("Generating schedule with real activities", { criteria });

			const startDate = new Date(criteria.startDate);
			const endDate = new Date(criteria.endDate);
			const totalDays =
				Math.ceil(
					(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
				) + 1;

			// Get available activities for each theme
			const allActivities: Activity[] = [];
			for (const theme of criteria.selectedThemes) {
				const themeActivities =
					await this.activityService.searchActivitiesForSchedule({
						theme: theme as any,
						region: criteria.region,
						maxPrice: criteria.budget / criteria.selectedThemes.length, // Rough budget per theme
					});
				allActivities.push(...themeActivities);
			}

			if (allActivities.length === 0) {
				throw new Error("No activities found matching the criteria");
			}

			// Sort activities based on solution type
			const sortedActivities = this.sortActivitiesBySolutionType(
				allActivities,
				criteria.solutionType,
			);

			// Generate schedule days
			const schedule: ScheduleDay[] = [];
			let remainingBudget = criteria.budget;
			let activityIndex = 0;

			for (let dayNum = 0; dayNum < totalDays; dayNum++) {
				const currentDate = new Date(startDate);
				currentDate.setDate(startDate.getDate() + dayNum);

				const dayItems: ScheduleItem[] = [];
				let dayCost = 0;

				// Add 1-3 activities per day based on themes and budget
				const activitiesPerDay = Math.min(
					3,
					Math.max(1, criteria.selectedThemes.length),
				);

				for (
					let i = 0;
					i < activitiesPerDay && activityIndex < sortedActivities.length;
					i++
				) {
					const activity =
						sortedActivities[activityIndex % sortedActivities.length];

					// Check if we can afford this activity
					if (activity.price.amount <= remainingBudget) {
						const scheduleItem: ScheduleItem = {
							activityId: activity.activityId,
							scheduledTime: this.generateTimeSlot(i, activity),
							duration: this.estimateDuration(activity.theme),
							status: "planned",
							notes: `${activity.theme} appointment at ${activity.location.name}`,
						};

						dayItems.push(scheduleItem);
						dayCost += activity.price.amount;
						remainingBudget -= activity.price.amount;
					}

					activityIndex++;
				}

				schedule.push({
					date: currentDate.toISOString().split("T")[0],
					dayNumber: dayNum + 1,
					items: dayItems,
					totalCost: dayCost,
					notes: `Day ${dayNum + 1} of your beauty tour`,
				});
			}

			logger.info("Schedule generated successfully", {
				totalDays: schedule.length,
				totalActivities: schedule.reduce(
					(sum, day) => sum + day.items.length,
					0,
				),
				totalCost: criteria.budget - remainingBudget,
			});

			return schedule;
		} catch (error) {
			logger.error(
				"Failed to generate schedule with activities",
				error as Error,
				{ criteria },
			);
			throw new Error(
				`Failed to generate schedule: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Update schedule item with new activity or timing
	 */
	async updateScheduleItem(
		scheduleItem: ScheduleItem,
		updates: Partial<ScheduleItem>,
	): Promise<ScheduleItem> {
		try {
			logger.debug("Updating schedule item", {
				activityId: scheduleItem.activityId,
				updates,
			});

			// If activity is being changed, validate the new activity exists
			if (
				updates.activityId &&
				updates.activityId !== scheduleItem.activityId
			) {
				const newActivity = await this.activityService.getActivityById(
					updates.activityId,
				);
				if (!newActivity) {
					throw new Error(`Activity ${updates.activityId} not found`);
				}
				if (!newActivity.isActive) {
					throw new Error(`Activity ${updates.activityId} is not active`);
				}
			}

			const updatedItem: ScheduleItem = {
				...scheduleItem,
				...updates,
			};

			logger.debug("Schedule item updated successfully", {
				activityId: updatedItem.activityId,
			});

			return updatedItem;
		} catch (error) {
			logger.error("Failed to update schedule item", error as Error, {
				activityId: scheduleItem.activityId,
			});
			throw new Error(
				`Failed to update schedule item: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Validate that all activities in a schedule exist and are active
	 */
	async validateScheduleActivities(schedule: ScheduleDay[]): Promise<{
		isValid: boolean;
		errors: Array<{ day: number; activityId: string; error: string }>;
	}> {
		try {
			const errors: Array<{ day: number; activityId: string; error: string }> =
				[];

			for (const day of schedule) {
				for (const item of day.items) {
					const activity = await this.activityService.getActivityById(
						item.activityId,
					);

					if (!activity) {
						errors.push({
							day: day.dayNumber,
							activityId: item.activityId,
							error: "Activity not found",
						});
					} else if (!activity.isActive) {
						errors.push({
							day: day.dayNumber,
							activityId: item.activityId,
							error: "Activity is not active",
						});
					}
				}
			}

			return {
				isValid: errors.length === 0,
				errors,
			};
		} catch (error) {
			logger.error("Failed to validate schedule activities", error as Error);
			throw new Error(
				`Failed to validate schedule: ${(error as Error).message}`,
			);
		}
	}

	/**
	 * Sort activities based on solution type preference
	 */
	private sortActivitiesBySolutionType(
		activities: Activity[],
		solutionType?: "topranking" | "premium" | "budget",
	): Activity[] {
		switch (solutionType) {
			case "premium":
				// Sort by price descending (most expensive first)
				return [...activities].sort((a, b) => b.price.amount - a.price.amount);

			case "budget":
				// Sort by price ascending (cheapest first)
				return [...activities].sort((a, b) => a.price.amount - b.price.amount);
			default:
				// Sort by a combination of factors (for now, just by name for consistency)
				// In the future, this could include ratings, reviews, etc.
				return [...activities].sort((a, b) => a.name.localeCompare(b.name));
		}
	}

	/**
	 * Generate appropriate time slot based on activity type and order
	 */
	private generateTimeSlot(orderInDay: number, activity: Activity): string {
		// Get the activity's working hours for a typical day (use Monday as default)
		const workingHours = activity.workingHours.monday;

		if (!workingHours.isOpen || !workingHours.openTime) {
			// Default time slots if no working hours specified
			const defaultTimes = ["09:00", "13:00", "16:00"];
			return defaultTimes[orderInDay % defaultTimes.length];
		}

		// Parse open time and generate slots based on order
		const [openHour, openMinute] = workingHours.openTime.split(":").map(Number);
		const baseTime = openHour * 60 + openMinute; // Convert to minutes

		// Add 3-4 hours between appointments
		const slotOffset = orderInDay * 180; // 3 hours in minutes
		const slotTime = baseTime + slotOffset;

		const hour = Math.floor(slotTime / 60) % 24;
		const minute = slotTime % 60;

		return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
	}

	/**
	 * Estimate duration based on activity theme
	 */
	private estimateDuration(theme: string): string {
		const durationMap: Record<string, string> = {
			plastic_surgery_eye: "3h",
			plastic_surgery_nose: "4h",
			plastic_surgery_face: "5h",
			hair_salon: "2h",
			nail_salon: "1h 30min",
			spa_wellness: "2h 30min",
			dental: "1h",
			dermatology: "1h 30min",
		};

		return durationMap[theme] || "2h";
	}
}
