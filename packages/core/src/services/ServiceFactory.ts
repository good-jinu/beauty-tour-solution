// biome-ignore-all lint/suspicious/noExplicitAny: Allow any in this file
import {
	DynamoDBActivityRepository,
	DynamoDBEventRepository,
	DynamoDBPlanRepository,
	DynamoDBScheduleRepository,
} from "../repositories";
import type { IActivityRepository } from "../repositories/ActivityRepository";
import type { IEventRepository } from "../repositories/EventRepository";
import type {
	IScheduleRepository,
	StoredSchedule,
} from "../repositories/ScheduleRepository";
import type {
	Activity,
	ActivityFilters,
	CreateActivityData,
	PaginatedActivities,
	ScheduleCriteria,
	UpdateActivityData,
} from "../types/activity";
import type { SavedPlan } from "../types/plan";
import { ActivityService, type IActivityService } from "./ActivityService";
import { EnhancedScheduleService } from "./EnhancedScheduleService";
import type { IPlanRepository } from "./PlanService";
import { ScheduleActivityService } from "./ScheduleActivityService";

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

export async function createScheduleRepository(
	config: ServiceFactoryConfig,
): Promise<IScheduleRepository> {
	switch (config.repositoryType) {
		case "dynamodb": {
			return new DynamoDBScheduleRepository(config.tableName, config.region);
		}
		case "memory": {
			// For testing or development
			return new InMemoryScheduleRepository();
		}
		default: {
			const exhaustiveCheck: never = config;
			throw new Error(`Unsupported repository type: ${exhaustiveCheck}`);
		}
	}
}

export async function createActivityRepository(
	config: ServiceFactoryConfig,
): Promise<IActivityRepository> {
	switch (config.repositoryType) {
		case "dynamodb": {
			return new DynamoDBActivityRepository(config.tableName, config.region);
		}
		case "memory": {
			// For testing or development
			return new InMemoryActivityRepository();
		}
		default: {
			const exhaustiveCheck: never = config;
			throw new Error(`Unsupported repository type: ${exhaustiveCheck}`);
		}
	}
}

export async function createActivityService(
	config: ServiceFactoryConfig,
): Promise<IActivityService> {
	const repository = await createActivityRepository(config);
	return new ActivityService(repository);
}

export async function createScheduleActivityService(
	config: ServiceFactoryConfig,
): Promise<ScheduleActivityService> {
	const activityService = await createActivityService(config);
	return new ScheduleActivityService(activityService);
}

export async function createEnhancedScheduleService(
	config: ServiceFactoryConfig,
): Promise<EnhancedScheduleService> {
	const scheduleRepository = await createScheduleRepository(config);
	const scheduleActivityService = await createScheduleActivityService(config);
	return new EnhancedScheduleService(
		scheduleRepository,
		scheduleActivityService,
	);
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

// Simple in-memory implementation for testing
class InMemoryScheduleRepository implements IScheduleRepository {
	private schedules: Map<string, StoredSchedule[]> = new Map();

	async saveSchedule(schedule: StoredSchedule): Promise<StoredSchedule> {
		const guestSchedules = this.schedules.get(schedule.guestId) || [];
		guestSchedules.push(schedule);
		this.schedules.set(schedule.guestId, guestSchedules);
		return schedule;
	}

	async getSchedulesByGuestId(guestId: string): Promise<StoredSchedule[]> {
		return this.schedules.get(guestId) || [];
	}

	async getSchedule(
		guestId: string,
		scheduleId: string,
	): Promise<StoredSchedule | null> {
		const guestSchedules = this.schedules.get(guestId) || [];
		return guestSchedules.find((s) => s.scheduleId === scheduleId) || null;
	}

	async updateSchedule(schedule: StoredSchedule): Promise<StoredSchedule> {
		const guestSchedules = this.schedules.get(schedule.guestId) || [];
		const index = guestSchedules.findIndex(
			(s) => s.scheduleId === schedule.scheduleId,
		);
		if (index >= 0) {
			guestSchedules[index] = schedule;
		}
		return schedule;
	}

	async deleteSchedule(guestId: string, scheduleId: string): Promise<void> {
		const guestSchedules = this.schedules.get(guestId) || [];
		const filtered = guestSchedules.filter((s) => s.scheduleId !== scheduleId);
		this.schedules.set(guestId, filtered);
	}

	async deleteSchedulesByGuestId(guestId: string): Promise<void> {
		this.schedules.delete(guestId);
	}

	async scheduleExists(guestId: string, scheduleId: string): Promise<boolean> {
		const schedule = await this.getSchedule(guestId, scheduleId);
		return schedule !== null;
	}
}

// Simple in-memory implementation for testing
class InMemoryActivityRepository implements IActivityRepository {
	private activities: Map<string, Activity> = new Map();

	async createActivity(activityData: CreateActivityData): Promise<Activity> {
		const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const now = new Date().toISOString();

		const activity: Activity = {
			activityId,
			...activityData,
			isActive: activityData.isActive ?? true,
			createdAt: now,
			updatedAt: now,
		};

		this.activities.set(activityId, activity);
		return activity;
	}

	async getActivities(filters?: ActivityFilters): Promise<PaginatedActivities> {
		const allActivities = Array.from(this.activities.values());

		// Simple filtering for testing
		let filtered = allActivities;

		if (filters?.theme) {
			filtered = filtered.filter((a) => a.theme === filters.theme);
		}

		if (filters?.region) {
			filtered = filtered.filter((a) => a.location?.region === filters.region);
		}

		if (filters?.isActive !== undefined) {
			filtered = filtered.filter((a) => a.isActive === filters.isActive);
		}

		const page = filters?.page || 1;
		const limit = filters?.limit || 50;
		const offset = (page - 1) * limit;
		const paginatedActivities = filtered.slice(offset, offset + limit);

		return {
			activities: paginatedActivities,
			pagination: {
				page,
				limit,
				total: filtered.length,
				totalPages: Math.ceil(filtered.length / limit),
				hasNext: page < Math.ceil(filtered.length / limit),
				hasPrev: page > 1,
			},
		};
	}

	async getActivityById(activityId: string): Promise<Activity | null> {
		return this.activities.get(activityId) || null;
	}

	async updateActivity(
		activityId: string,
		updates: UpdateActivityData,
	): Promise<Activity> {
		const existing = this.activities.get(activityId);
		if (!existing) {
			throw new Error(`Activity ${activityId} not found`);
		}

		const updated: Activity = {
			...existing,
			...updates,
			activityId,
			updatedAt: new Date().toISOString(),
		};

		this.activities.set(activityId, updated);
		return updated;
	}

	async deleteActivity(activityId: string): Promise<void> {
		if (!this.activities.has(activityId)) {
			throw new Error(`Activity ${activityId} not found`);
		}
		this.activities.delete(activityId);
	}

	async searchActivitiesForSchedule(
		criteria: ScheduleCriteria,
	): Promise<Activity[]> {
		const allActivities = Array.from(this.activities.values());

		return allActivities.filter((activity) => {
			if (!activity.isActive) return false;
			if (criteria.theme && activity.theme !== criteria.theme) return false;
			if (criteria.region && activity.location?.region !== criteria.region)
				return false;
			if (criteria.maxPrice && activity.price?.amount > criteria.maxPrice)
				return false;
			return true;
		});
	}

	async searchByThemeAndRegion(
		theme: string,
		region?: string,
	): Promise<Activity[]> {
		return this.searchActivitiesForSchedule({ theme: theme as any, region });
	}

	async searchByPriceRange(
		minPrice?: number,
		maxPrice?: number,
	): Promise<Activity[]> {
		const allActivities = Array.from(this.activities.values());

		return allActivities.filter((activity) => {
			if (!activity.isActive) return false;
			const price = activity.price?.amount || 0;
			if (minPrice !== undefined && price < minPrice) return false;
			if (maxPrice !== undefined && price > maxPrice) return false;
			return true;
		});
	}

	async activityExists(activityId: string): Promise<boolean> {
		return this.activities.has(activityId);
	}
}
