import type { IActivityRepository } from "../repositories/ActivityRepository";
import type {
	Activity,
	ActivityFilters,
	CreateActivityData,
	PaginatedActivities,
	ScheduleCriteria,
	UpdateActivityData,
	ValidationResult,
} from "../types";
import { ActivityValidator } from "../utils/activityValidation";
import { logger } from "../utils/logger";

/**
 * Service error types for activity operations
 */
export enum ActivityServiceErrorType {
	VALIDATION_ERROR = "VALIDATION_ERROR",
	NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
	DUPLICATE_ERROR = "DUPLICATE_ERROR",
	REPOSITORY_ERROR = "REPOSITORY_ERROR",
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Service error class for activity operations
 */
export class ActivityServiceError extends Error {
	public readonly type: ActivityServiceErrorType;
	public readonly originalError?: Error;

	constructor(
		message: string,
		type: ActivityServiceErrorType = ActivityServiceErrorType.UNKNOWN_ERROR,
		originalError?: Error,
	) {
		super(message);
		this.name = "ActivityServiceError";
		this.type = type;
		this.originalError = originalError;
	}
}

/**
 * Activity service interface
 */
export interface IActivityService {
	createActivity(activityData: CreateActivityData): Promise<Activity>;
	getActivities(filters?: ActivityFilters): Promise<PaginatedActivities>;
	getActivityById(activityId: string): Promise<Activity | null>;
	updateActivity(
		activityId: string,
		updates: UpdateActivityData,
	): Promise<Activity>;
	deleteActivity(activityId: string): Promise<void>;
	searchActivitiesForSchedule(criteria: ScheduleCriteria): Promise<Activity[]>;
	validateActivityData(
		data: CreateActivityData | UpdateActivityData,
	): ValidationResult;
}

/**
 * Activity service implementation with business logic and validation
 */
export class ActivityService implements IActivityService {
	private repository: IActivityRepository;

	constructor(repository: IActivityRepository) {
		this.repository = repository;
		logger.info("ActivityService initialized");
	}

	/**
	 * Create a new activity with validation
	 */
	async createActivity(activityData: CreateActivityData): Promise<Activity> {
		try {
			logger.debug("Creating activity", {
				name: activityData.name,
				theme: activityData.theme,
			});

			// Validate activity data
			const validation = this.validateActivityData(activityData);
			if (!validation.isValid) {
				const errorMessage = `Validation failed: ${validation.errors.map((e) => e.message).join(", ")}`;
				logger.warn("Activity creation validation failed", {
					name: activityData.name,
					errors: validation.errors,
				});
				throw new ActivityServiceError(
					errorMessage,
					ActivityServiceErrorType.VALIDATION_ERROR,
				);
			}

			// Create activity through repository
			const activity = await this.repository.createActivity(activityData);

			logger.info("Activity created successfully", {
				activityId: activity.activityId,
				name: activity.name,
			});

			return activity;
		} catch (error) {
			if (error instanceof ActivityServiceError) {
				throw error;
			}

			logger.error("Failed to create activity", error as Error, {
				name: activityData.name,
			});

			throw new ActivityServiceError(
				`Failed to create activity: ${(error as Error).message}`,
				ActivityServiceErrorType.REPOSITORY_ERROR,
				error as Error,
			);
		}
	}

	/**
	 * Get activities with filtering and pagination
	 */
	async getActivities(filters?: ActivityFilters): Promise<PaginatedActivities> {
		try {
			logger.debug("Getting activities", { filters });

			// Apply default filters and validation
			const validatedFilters = this.validateAndNormalizeFilters(filters);

			const result = await this.repository.getActivities(validatedFilters);

			logger.debug("Activities retrieved successfully", {
				count: result.activities.length,
				total: result.pagination.total,
			});

			return result;
		} catch (error) {
			logger.error("Failed to get activities", error as Error, { filters });

			throw new ActivityServiceError(
				`Failed to get activities: ${(error as Error).message}`,
				ActivityServiceErrorType.REPOSITORY_ERROR,
				error as Error,
			);
		}
	}

	/**
	 * Get a single activity by ID
	 */
	async getActivityById(activityId: string): Promise<Activity | null> {
		try {
			if (!activityId || typeof activityId !== "string") {
				throw new ActivityServiceError(
					"Activity ID is required and must be a string",
					ActivityServiceErrorType.VALIDATION_ERROR,
				);
			}

			logger.debug("Getting activity by ID", { activityId });

			const activity = await this.repository.getActivityById(activityId);

			if (activity) {
				logger.debug("Activity found", {
					activityId,
					name: activity.name,
				});
			} else {
				logger.debug("Activity not found", { activityId });
			}

			return activity;
		} catch (error) {
			if (error instanceof ActivityServiceError) {
				throw error;
			}

			logger.error("Failed to get activity by ID", error as Error, {
				activityId,
			});

			throw new ActivityServiceError(
				`Failed to get activity: ${(error as Error).message}`,
				ActivityServiceErrorType.REPOSITORY_ERROR,
				error as Error,
			);
		}
	}

	/**
	 * Update an existing activity with validation
	 */
	async updateActivity(
		activityId: string,
		updates: UpdateActivityData,
	): Promise<Activity> {
		try {
			if (!activityId || typeof activityId !== "string") {
				throw new ActivityServiceError(
					"Activity ID is required and must be a string",
					ActivityServiceErrorType.VALIDATION_ERROR,
				);
			}

			logger.debug("Updating activity", { activityId, updates });

			// Validate update data
			const validation = this.validateActivityData(updates);
			if (!validation.isValid) {
				const errorMessage = `Validation failed: ${validation.errors.map((e) => e.message).join(", ")}`;
				logger.warn("Activity update validation failed", {
					activityId,
					errors: validation.errors,
				});
				throw new ActivityServiceError(
					errorMessage,
					ActivityServiceErrorType.VALIDATION_ERROR,
				);
			}

			// Check if activity exists
			const existingActivity =
				await this.repository.getActivityById(activityId);
			if (!existingActivity) {
				throw new ActivityServiceError(
					`Activity ${activityId} not found`,
					ActivityServiceErrorType.NOT_FOUND_ERROR,
				);
			}

			// Update activity through repository
			const updatedActivity = await this.repository.updateActivity(
				activityId,
				updates,
			);

			logger.info("Activity updated successfully", {
				activityId,
				name: updatedActivity.name,
			});

			return updatedActivity;
		} catch (error) {
			if (error instanceof ActivityServiceError) {
				throw error;
			}

			logger.error("Failed to update activity", error as Error, {
				activityId,
			});

			throw new ActivityServiceError(
				`Failed to update activity: ${(error as Error).message}`,
				ActivityServiceErrorType.REPOSITORY_ERROR,
				error as Error,
			);
		}
	}

	/**
	 * Delete an activity with safety checks
	 */
	async deleteActivity(activityId: string): Promise<void> {
		try {
			if (!activityId || typeof activityId !== "string") {
				throw new ActivityServiceError(
					"Activity ID is required and must be a string",
					ActivityServiceErrorType.VALIDATION_ERROR,
				);
			}

			logger.debug("Deleting activity", { activityId });

			// Check if activity exists
			const existingActivity =
				await this.repository.getActivityById(activityId);
			if (!existingActivity) {
				throw new ActivityServiceError(
					`Activity ${activityId} not found`,
					ActivityServiceErrorType.NOT_FOUND_ERROR,
				);
			}

			// TODO: Add business logic to check if activity is referenced in active schedules
			// This would require integration with schedule service

			// Delete activity through repository
			await this.repository.deleteActivity(activityId);

			logger.info("Activity deleted successfully", { activityId });
		} catch (error) {
			if (error instanceof ActivityServiceError) {
				throw error;
			}

			logger.error("Failed to delete activity", error as Error, {
				activityId,
			});

			throw new ActivityServiceError(
				`Failed to delete activity: ${(error as Error).message}`,
				ActivityServiceErrorType.REPOSITORY_ERROR,
				error as Error,
			);
		}
	}

	/**
	 * Search activities for schedule generation with business logic
	 */
	async searchActivitiesForSchedule(
		criteria: ScheduleCriteria,
	): Promise<Activity[]> {
		try {
			logger.debug("Searching activities for schedule", { criteria });

			// Validate schedule criteria
			if (!criteria.theme) {
				throw new ActivityServiceError(
					"Theme is required for schedule activity search",
					ActivityServiceErrorType.VALIDATION_ERROR,
				);
			}

			// Apply business logic for schedule generation
			const activities =
				await this.repository.searchActivitiesForSchedule(criteria);

			// Additional business logic filtering
			const filteredActivities = activities.filter((activity) => {
				// Only include active activities
				if (!activity.isActive) return false;

				// Apply budget constraints with some flexibility (allow 10% over budget)
				if (criteria.maxPrice && activity.price.amount > criteria.maxPrice) {
					return false;
				}

				return true;
			});

			// Sort by relevance (price ascending for better user experience)
			filteredActivities.sort((a, b) => a.price.amount - b.price.amount);

			logger.debug("Activities found for schedule", {
				totalFound: activities.length,
				afterFiltering: filteredActivities.length,
				theme: criteria.theme,
			});

			return filteredActivities;
		} catch (error) {
			if (error instanceof ActivityServiceError) {
				throw error;
			}

			logger.error("Failed to search activities for schedule", error as Error, {
				criteria,
			});

			throw new ActivityServiceError(
				`Failed to search activities for schedule: ${(error as Error).message}`,
				ActivityServiceErrorType.REPOSITORY_ERROR,
				error as Error,
			);
		}
	}

	/**
	 * Validate activity data using the dedicated validation utility
	 */
	validateActivityData(
		data: CreateActivityData | UpdateActivityData,
	): ValidationResult {
		return ActivityValidator.validateActivityData(data);
	}

	/**
	 * Validate and normalize activity filters
	 */
	private validateAndNormalizeFilters(
		filters?: ActivityFilters,
	): ActivityFilters {
		if (!filters) return {};

		const normalized: ActivityFilters = { ...filters };

		// Validate and normalize pagination
		if (normalized.page !== undefined) {
			normalized.page = Math.max(1, Math.floor(normalized.page));
		}

		if (normalized.limit !== undefined) {
			normalized.limit = Math.min(
				100,
				Math.max(1, Math.floor(normalized.limit)),
			);
		}

		// Validate price filters
		if (normalized.minPrice !== undefined && normalized.minPrice < 0) {
			normalized.minPrice = 0;
		}

		if (normalized.maxPrice !== undefined && normalized.maxPrice < 0) {
			delete normalized.maxPrice;
		}

		// Ensure maxPrice is greater than minPrice
		if (
			normalized.minPrice !== undefined &&
			normalized.maxPrice !== undefined &&
			normalized.maxPrice < normalized.minPrice
		) {
			delete normalized.maxPrice;
		}

		return normalized;
	}
}
