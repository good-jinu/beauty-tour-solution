import type { IPlanRepository, SavedPlan } from "@bts/core";

// Dynamic import to avoid bundling infra in client-side code
export async function createDynamoDBPlanRepository(): Promise<IPlanRepository> {
	// Dynamically import the infra package
	const { DynamoDBPlanService } = await import("@bts/infra");
	const dynamoService = new DynamoDBPlanService();

	// Create adapter to make DynamoDBPlanService compatible with IPlanRepository
	return new DynamoDBPlanRepositoryAdapter(dynamoService);
}

// Adapter to make DynamoDBPlanService compatible with IPlanRepository interface
class DynamoDBPlanRepositoryAdapter implements IPlanRepository {
	constructor(private dynamoService: any) {}

	async savePlan(plan: SavedPlan) {
		// Convert SavedPlan to SavePlanRequest format for DynamoDBPlanService
		const request = {
			guestId: plan.guestId,
			planData: plan.planData,
			title: plan.title,
		};
		return await this.dynamoService.savePlan(request);
	}

	async getPlansByGuestId(guestId: string) {
		const request = { guestId };
		return await this.dynamoService.getPlansByGuestId(request);
	}
}
