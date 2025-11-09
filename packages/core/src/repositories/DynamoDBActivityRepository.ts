import { DynamoDBService } from "@bts/infra";
import {
	type IActivityRepository,
	logger,
	RepositoryError,
	RepositoryErrorType,
} from "../index";
import type {
	Activity,
	ActivityFilters,
	ActivityTheme,
	ContactInfo,
	CreateActivityData,
	DynamoDBActivityItem,
	Location,
	PaginatedActivities,
	Price,
	ScheduleCriteria,
	UpdateActivityData,
	WorkingHours,
} from "../types";

/**
 * DynamoDB implementation of the activity repository
 */
export class DynamoDBActivityRepository implements IActivityRepository {
	private dynamoService: DynamoDBService;

	constructor(tableName: string, region?: string) {
		this.dynamoService = new DynamoDBService({
			tableName,
			region,
		});

		logger.info("DynamoDB Activity Repository initialized", {
			tableName,
			region: region || "default",
		});
	}

	/**
	 * Create a new activity
	 */
	async createActivity(activityData: CreateActivityData): Promise<Activity> {
		try {
			const activityId = this.generateActivityId();
			const now = new Date().toISOString();

			const activity: Activity = {
				activityId,
				...activityData,
				isActive: activityData.isActive ?? true,
				createdAt: now,
				updatedAt: now,
			};

			const dynamoItem = this.activityToDynamoItem(activity);

			logger.debug("Creating activity in DynamoDB", {
				activityId,
				name: activity.name,
				theme: activity.theme,
			});

			await this.dynamoService.putItem(dynamoItem);

			logger.info("Activity created successfully", {
				activityId,
				name: activity.name,
			});

			return activity;
		} catch (error) {
			logger.error("Failed to create activity", error as Error, {
				name: activityData.name,
				theme: activityData.theme,
			});

			throw new RepositoryError(
				`Failed to create activity: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Get activities with filtering and pagination
	 */
	async getActivities(filters?: ActivityFilters): Promise<PaginatedActivities> {
		try {
			const page = filters?.page ?? 1;
			const limit = filters?.limit ?? 50;
			const offset = (page - 1) * limit;

			logger.debug("Getting activities with filters", {
				filters,
				page,
				limit,
			});

			// Build scan parameters for filtering
			const scanParams: Record<string, unknown> = {};

			// Add filter expressions
			const filterExpressions: string[] = [];
			const expressionAttributeValues: Record<string, unknown> = {};
			const expressionAttributeNames: Record<string, string> = {};

			if (filters?.search) {
				filterExpressions.push(
					"contains(#name, :search) OR contains(#description, :search)",
				);
				expressionAttributeNames["#name"] = "name";
				expressionAttributeNames["#description"] = "description";
				expressionAttributeValues[":search"] = filters.search;
			}

			if (filters?.theme) {
				filterExpressions.push("#theme = :theme");
				expressionAttributeNames["#theme"] = "theme";
				expressionAttributeValues[":theme"] = filters.theme;
			}

			// if (filters?.region) {
			// 	filterExpressions.push("#region = :region");
			// 	expressionAttributeNames["#region"] = "region";
			// 	expressionAttributeValues[":region"] = filters.region;
			// }

			if (filters?.minPrice !== undefined) {
				filterExpressions.push("#price >= :minPrice");
				expressionAttributeNames["#price"] = "price";
				expressionAttributeValues[":minPrice"] = filters.minPrice;
			}

			if (filters?.maxPrice !== undefined) {
				filterExpressions.push("#price <= :maxPrice");
				expressionAttributeNames["#price"] = "price";
				expressionAttributeValues[":maxPrice"] = filters.maxPrice;
			}

			if (filters?.isActive !== undefined) {
				filterExpressions.push("#isActive = :isActive");
				expressionAttributeNames["#isActive"] = "isActive";
				expressionAttributeValues[":isActive"] = filters.isActive;
			}

			if (filterExpressions.length > 0) {
				scanParams.FilterExpression = filterExpressions.join(" AND ");
				scanParams.ExpressionAttributeValues = expressionAttributeValues;
				scanParams.ExpressionAttributeNames = expressionAttributeNames;
			}

			// Use scan operation to get all items with filters
			const results = await this.dynamoService.scanItems(scanParams);
			const allActivities = results.map((item) =>
				this.dynamoItemToActivity(item as unknown as DynamoDBActivityItem),
			);

			// Apply sorting
			if (filters?.sortBy) {
				const sortBy = filters.sortBy;
				allActivities.sort((a, b) => {
					const aValue = this.getSortValue(a, sortBy);
					const bValue = this.getSortValue(b, sortBy);
					const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
					return filters.sortOrder === "desc" ? -comparison : comparison;
				});
			}

			// Apply pagination
			const paginatedActivities = allActivities.slice(offset, offset + limit);
			const total = allActivities.length;
			const totalPages = Math.ceil(total / limit);

			logger.debug("Activities retrieved successfully", {
				resultCount: paginatedActivities.length,
				total,
				page,
				totalPages,
			});

			return {
				activities: paginatedActivities,
				pagination: {
					page,
					limit,
					total,
					totalPages,
					hasNext: page < totalPages,
					hasPrev: page > 1,
				},
			};
		} catch (error) {
			logger.error("Failed to get activities", error as Error, { filters });

			throw new RepositoryError(
				`Failed to get activities: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Get a single activity by ID
	 */
	async getActivityById(activityId: string): Promise<Activity | null> {
		try {
			logger.debug("Getting activity by ID", { activityId });

			const result = await this.dynamoService.getItem({ activityId });

			if (!result) {
				logger.debug("Activity not found", { activityId });
				return null;
			}

			const activity = this.dynamoItemToActivity(
				result as unknown as DynamoDBActivityItem,
			);

			logger.debug("Activity retrieved successfully", {
				activityId,
				name: activity.name,
			});

			return activity;
		} catch (error) {
			logger.error("Failed to get activity by ID", error as Error, {
				activityId,
			});

			throw new RepositoryError(
				`Failed to get activity ${activityId}: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Update an existing activity
	 */
	async updateActivity(
		activityId: string,
		updates: UpdateActivityData,
	): Promise<Activity> {
		try {
			logger.debug("Updating activity", { activityId, updates });

			// First get the existing activity
			const existingActivity = await this.getActivityById(activityId);
			if (!existingActivity) {
				throw new RepositoryError(
					`Activity ${activityId} not found`,
					RepositoryErrorType.NOT_FOUND_ERROR,
				);
			}

			// Merge updates with existing activity
			const updatedActivity: Activity = {
				...existingActivity,
				...updates,
				activityId, // Ensure ID doesn't change
				updatedAt: new Date().toISOString(),
			};

			const dynamoItem = this.activityToDynamoItem(updatedActivity);

			await this.dynamoService.putItem(dynamoItem);

			logger.info("Activity updated successfully", {
				activityId,
				name: updatedActivity.name,
			});

			return updatedActivity;
		} catch (error) {
			logger.error("Failed to update activity", error as Error, {
				activityId,
			});

			throw new RepositoryError(
				`Failed to update activity ${activityId}: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Delete an activity
	 */
	async deleteActivity(activityId: string): Promise<void> {
		try {
			logger.debug("Deleting activity", { activityId });

			// Check if activity exists first
			const exists = await this.activityExists(activityId);
			if (!exists) {
				throw new RepositoryError(
					`Activity ${activityId} not found`,
					RepositoryErrorType.NOT_FOUND_ERROR,
				);
			}

			await this.dynamoService.deleteItem({ activityId });

			logger.info("Activity deleted successfully", { activityId });
		} catch (error) {
			logger.error("Failed to delete activity", error as Error, {
				activityId,
			});

			throw new RepositoryError(
				`Failed to delete activity ${activityId}: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Search activities for schedule generation
	 */
	async searchActivitiesForSchedule(
		criteria: ScheduleCriteria,
	): Promise<Activity[]> {
		try {
			logger.debug("Searching activities for schedule", { criteria });

			const filters: ActivityFilters = {
				theme: criteria.theme,
				region: criteria.region,
				maxPrice: criteria.maxPrice,
				isActive: true,
				limit: 100, // Get more results for schedule generation
			};

			const result = await this.getActivities(filters);
			let activities = result.activities;

			// Filter by working hours if specified
			if (criteria.workingHours) {
				activities = activities.filter((activity) => {
					const day = criteria.workingHours?.day;
					if (!day) return false;

					const daySchedule = activity.workingHours[day];
					if (!daySchedule?.isOpen) return false;

					if (
						daySchedule.openTime &&
						daySchedule.closeTime &&
						criteria.workingHours?.time
					) {
						const requestedTime = criteria.workingHours.time;
						return (
							requestedTime >= daySchedule.openTime &&
							requestedTime <= daySchedule.closeTime
						);
					}

					return true;
				});
			}

			logger.debug("Activities found for schedule", {
				count: activities.length,
				theme: criteria.theme,
			});

			return activities;
		} catch (error) {
			logger.error("Failed to search activities for schedule", error as Error, {
				criteria,
			});

			throw new RepositoryError(
				`Failed to search activities for schedule: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Search activities by theme and region
	 */
	async searchByThemeAndRegion(
		theme: string,
		region?: string,
	): Promise<Activity[]> {
		try {
			logger.debug("Searching activities by theme and region", {
				theme,
				region,
			});

			const filters: ActivityFilters = {
				theme: theme as ActivityTheme,
				region,
				isActive: true,
			};

			const result = await this.getActivities(filters);

			logger.debug("Activities found by theme and region", {
				count: result.activities.length,
				theme,
				region,
			});

			return result.activities;
		} catch (error) {
			logger.error("Failed to search by theme and region", error as Error, {
				theme,
				region,
			});

			throw new RepositoryError(
				`Failed to search by theme and region: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Search activities by price range
	 */
	async searchByPriceRange(
		minPrice?: number,
		maxPrice?: number,
	): Promise<Activity[]> {
		try {
			logger.debug("Searching activities by price range", {
				minPrice,
				maxPrice,
			});

			const filters: ActivityFilters = {
				minPrice,
				maxPrice,
				isActive: true,
			};

			const result = await this.getActivities(filters);

			logger.debug("Activities found by price range", {
				count: result.activities.length,
				minPrice,
				maxPrice,
			});

			return result.activities;
		} catch (error) {
			logger.error("Failed to search by price range", error as Error, {
				minPrice,
				maxPrice,
			});

			throw new RepositoryError(
				`Failed to search by price range: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Check if an activity exists
	 */
	async activityExists(activityId: string): Promise<boolean> {
		try {
			const activity = await this.getActivityById(activityId);
			return activity !== null;
		} catch (error) {
			logger.error("Failed to check activity existence", error as Error, {
				activityId,
			});
			return false;
		}
	}

	/**
	 * Convert Activity to DynamoDB item
	 */
	private activityToDynamoItem(activity: Activity): DynamoDBActivityItem {
		return {
			activityId: activity.activityId,
			name: activity.name,
			theme: activity.theme,
			region: activity.location.region,
			price: activity.price.amount,
			workingHours: JSON.stringify(activity.workingHours),
			location: JSON.stringify(activity.location),
			priceDetails: JSON.stringify(activity.price),
			description: activity.description,
			images: activity.images,
			contactInfo: activity.contactInfo
				? JSON.stringify(activity.contactInfo)
				: undefined,
			amenities: activity.amenities,
			isActive: activity.isActive,
			createdAt: activity.createdAt,
			updatedAt: activity.updatedAt,
		};
	}

	/**
	 * Convert DynamoDB item to Activity
	 */
	private dynamoItemToActivity(item: DynamoDBActivityItem): Activity {
		return {
			activityId: item.activityId,
			name: item.name,
			theme: item.theme as ActivityTheme,
			workingHours: JSON.parse(item.workingHours) as WorkingHours,
			location: JSON.parse(item.location) as Location,
			price: JSON.parse(item.priceDetails) as Price,
			description: item.description,
			images: item.images,
			contactInfo: item.contactInfo
				? (JSON.parse(item.contactInfo) as ContactInfo)
				: undefined,
			amenities: item.amenities,
			isActive: item.isActive,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};
	}

	/**
	 * Generate a unique activity ID
	 */
	private generateActivityId(): string {
		return `activity_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
	}

	/**
	 * Get sort value for activity sorting
	 */
	private getSortValue(
		activity: Activity,
		sortBy: "name" | "theme" | "price" | "createdAt",
	): string | number {
		switch (sortBy) {
			case "name":
				return activity.name.toLowerCase();
			case "theme":
				return activity.theme;
			case "price":
				return activity.price.amount;
			case "createdAt":
				return activity.createdAt;
			default:
				return activity.createdAt;
		}
	}

	/**
	 * Map AWS SDK errors to repository error types
	 */
	private mapErrorType(error: unknown): RepositoryErrorType {
		if (!(error instanceof Error)) {
			return RepositoryErrorType.UNKNOWN_ERROR;
		}

		const errorName = error.name;
		const errorMessage = error.message.toLowerCase();

		// AWS SDK specific error mapping
		if (
			errorName === "ValidationException" ||
			errorMessage.includes("validation")
		) {
			return RepositoryErrorType.VALIDATION_ERROR;
		}

		if (errorName === "ConditionalCheckFailedException") {
			return RepositoryErrorType.DUPLICATE_ERROR;
		}

		if (
			errorName === "ResourceNotFoundException" ||
			errorMessage.includes("not found")
		) {
			return RepositoryErrorType.NOT_FOUND_ERROR;
		}

		if (
			errorName === "AccessDeniedException" ||
			errorName === "UnauthorizedException" ||
			errorMessage.includes("access denied") ||
			errorMessage.includes("unauthorized")
		) {
			return RepositoryErrorType.PERMISSION_ERROR;
		}

		if (
			errorName === "ProvisionedThroughputExceededException" ||
			errorName === "ThrottlingException" ||
			errorMessage.includes("throttl") ||
			errorMessage.includes("rate limit")
		) {
			return RepositoryErrorType.CONNECTION_ERROR;
		}

		if (
			errorName === "ServiceUnavailableException" ||
			errorName === "InternalServerError" ||
			errorMessage.includes("timeout") ||
			errorMessage.includes("connection")
		) {
			return RepositoryErrorType.CONNECTION_ERROR;
		}

		return RepositoryErrorType.UNKNOWN_ERROR;
	}
}
