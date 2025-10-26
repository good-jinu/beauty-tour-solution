// biome-ignore-all lint/suspicious/noExplicitAny: Allow any in this file
import {
	DynamoDBEventRepository,
	DynamoDBPlanRepository,
} from "../repositories";
import type { IEventRepository } from "../repositories/EventRepository";
import type { SavedPlan } from "../types/plan";
import type { IPlanRepository } from "./PlanService";

export type ServiceFactoryConfig =
	| { repositoryType: "memory" }
	| { repositoryType: "dynamodb"; tableName: string; region?: string };

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

export async function createEventRepository(
	config: ServiceFactoryConfig,
): Promise<IEventRepository> {
	switch (config.repositoryType) {
		case "dynamodb": {
			return new DynamoDBEventRepository(config.tableName, config.region);
		}
		case "memory": {
			// For testing or development
			return new InMemoryEventRepository();
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

// Simple in-memory implementation for testing
class InMemoryEventRepository implements IEventRepository {
	private events: Map<string, any[]> = new Map();

	async saveEvent(event: any): Promise<void> {
		const guestEvents = this.events.get(event.guest_id) || [];
		guestEvents.push(event);
		this.events.set(event.guest_id, guestEvents);
	}

	async batchSaveEvents(events: any[]): Promise<void> {
		for (const event of events) {
			await this.saveEvent(event);
		}
	}

	async getEventsByGuestId(guestId: string): Promise<any[]> {
		return this.events.get(guestId) || [];
	}

	async getEventsByType(): Promise<any[]> {
		return [];
	}

	async deleteEventsByGuestId(guestId: string): Promise<void> {
		this.events.delete(guestId);
	}

	async eventExists(): Promise<boolean> {
		return false;
	}
}
