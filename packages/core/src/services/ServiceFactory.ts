import type { SavedPlan } from "../types/plan";
import type { IPlanRepository } from "./PlanService";

export interface ServiceFactoryConfig {
	// Configuration for different repository implementations
	repositoryType: "memory" | "custom";
	// Custom repository implementation
	customRepository?: IPlanRepository;
}

export class ServiceFactory {
	static async createPlanRepository(
		config: ServiceFactoryConfig,
	): Promise<IPlanRepository> {
		switch (config.repositoryType) {
			case "custom": {
				if (!config.customRepository) {
					throw new Error("Custom repository implementation is required");
				}
				return config.customRepository;
			}
			case "memory": {
				// For testing or development
				return new InMemoryPlanRepository();
			}
			default:
				throw new Error(
					`Unsupported repository type: ${config.repositoryType}`,
				);
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
