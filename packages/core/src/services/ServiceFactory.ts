import { DynamoDBPlanRepository } from "../repositories";
import type { SavedPlan } from "../types/plan";
import type { IPlanRepository } from "./PlanService";

export type ServiceFactoryConfig =
	| { repositoryType: "memory" }
	| { repositoryType: "dynamodb"; tableName: string };

export async function createPlanRepository(
	config: ServiceFactoryConfig,
): Promise<IPlanRepository> {
	switch (config.repositoryType) {
		case "dynamodb": {
			return new DynamoDBPlanRepository(config.tableName);
		}
		case "memory": {
			// For testing or development
			return new InMemoryPlanRepository();
		}
		default: {
			const exhaustiveCheck: never = config;
			throw new Error(`Unsupported repository type: ${exhaustiveCheck}`);
		}
	}
}

// Simple in-memory implementation for testing
class InMemoryPlanRepository implements IPlanRepository {
	private plans: Map<string, SavedPlan[]> = new Map();

	async savePlan(plan: SavedPlan) {
		const guestPlans = this.plans.get(plan.guestId) || [];
		guestPlans.push(plan);
		this.plans.set(plan.guestId, guestPlans);
		return plan;
	}

	async getPlansByGuestId(guestId: string) {
		return this.plans.get(guestId) || [];
	}
}
