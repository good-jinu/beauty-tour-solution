import type {
	Activity,
	ActivityFilters,
	CreateActivityData,
	PaginatedActivities,
	ScheduleCriteria,
	UpdateActivityData,
} from "../types";

/**
 * Abstract interface for activity repository operations
 */
export interface IActivityRepository {
	/**
	 * Create a new activity
	 */
	createActivity(activityData: CreateActivityData): Promise<Activity>;

	/**
	 * Get activities with filtering and pagination
	 */
	getActivities(filters?: ActivityFilters): Promise<PaginatedActivities>;

	/**
	 * Get a single activity by ID
	 */
	getActivityById(activityId: string): Promise<Activity | null>;

	/**
	 * Update an existing activity
	 */
	updateActivity(
		activityId: string,
		updates: UpdateActivityData,
	): Promise<Activity>;

	/**
	 * Delete an activity
	 */
	deleteActivity(activityId: string): Promise<void>;

	/**
	 * Search activities for schedule generation
	 */
	searchActivitiesForSchedule(criteria: ScheduleCriteria): Promise<Activity[]>;

	/**
	 * Search activities by theme and region
	 */
	searchByThemeAndRegion(theme: string, region?: string): Promise<Activity[]>;

	/**
	 * Search activities by price range
	 */
	searchByPriceRange(minPrice?: number, maxPrice?: number): Promise<Activity[]>;

	/**
	 * Check if an activity exists
	 */
	activityExists(activityId: string): Promise<boolean>;
}
