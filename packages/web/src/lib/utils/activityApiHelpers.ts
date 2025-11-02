import { ActivityService } from "@bts/core";
import { createDynamoDBActivityRepository } from "$lib/services/repositoryFactory";

// Shared service instance
let activityService: ActivityService | null = null;

/**
 * Get or create the ActivityService instance
 */
export async function getActivityService(): Promise<ActivityService> {
	if (!activityService) {
		const activityRepository = await createDynamoDBActivityRepository();
		activityService = new ActivityService(activityRepository);
	}
	return activityService;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetActivityService(): void {
	activityService = null;
}
