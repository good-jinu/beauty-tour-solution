import { PlanService } from "@bts/core";
import { createDynamoDBPlanRepository } from "$lib/services/repositoryFactory";

// Shared plan service instance
let planService: PlanService | null = null;

export async function getPlanService(): Promise<PlanService> {
	if (!planService) {
		const planRepository = await createDynamoDBPlanRepository();
		planService = new PlanService(planRepository);
	}
	return planService;
}

// Simple API logger for web layer
export function logApiEvent(
	level: "info" | "warn" | "error",
	message: string,
	context?: unknown,
) {
	const timestamp = new Date().toISOString();
	const contextStr = context ? ` ${JSON.stringify(context)}` : "";
	const logMessage = `[${timestamp}] [${level.toUpperCase()}] [API] ${message}${contextStr}`;

	switch (level) {
		case "info":
			console.info(logMessage);
			break;
		case "warn":
			console.warn(logMessage);
			break;
		case "error":
			console.error(logMessage);
			break;
	}
}

export function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
