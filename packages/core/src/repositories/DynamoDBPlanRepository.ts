import { DynamoDBService } from "@bts/infra";
import type { IPlanRepository } from "../services/PlanService";
import type { DynamoDBPlanItem, PlanData, SavedPlan } from "../types";
import { logger } from "../utils/logger";

export class DynamoDBPlanRepository implements IPlanRepository {
	private dynamoDBService: DynamoDBService;

	constructor(tableName: string) {
		if (!tableName) {
			throw new Error(
				"DynamoDB table name is required for DynamoDBPlanRepository.",
			);
		}
		this.dynamoDBService = new DynamoDBService({ tableName });
	}

	async savePlan(plan: SavedPlan): Promise<SavedPlan> {
		const dynamoItem = this.transformToDynamoItem(plan);
		await this.dynamoDBService.putItem(dynamoItem);
		return plan;
	}

	async getPlansByGuestId(guestId: string): Promise<SavedPlan[]> {
		const items = await this.dynamoDBService.queryItems({
			KeyConditionExpression: "guestId = :guestId",
			ExpressionAttributeValues: {
				":guestId": guestId,
			},
			ScanIndexForward: false,
		});

		if (!items) {
			return [];
		}

		return items.map((item) =>
			this.transformFromDynamoItem(item as unknown as DynamoDBPlanItem),
		);
	}

	private transformToDynamoItem(plan: SavedPlan): DynamoDBPlanItem {
		return {
			guestId: plan.guestId,
			planId: plan.planId,
			title: plan.title,
			planData: JSON.stringify(plan.planData),
			createdAt: plan.createdAt,
			updatedAt: plan.updatedAt,
			ttl:
				Math.floor(new Date(plan.createdAt).getTime() / 1000) +
				365 * 24 * 60 * 60,
		};
	}

	private transformFromDynamoItem(item: DynamoDBPlanItem): SavedPlan {
		let planData: PlanData;
		try {
			planData =
				typeof item.planData === "string"
					? JSON.parse(item.planData)
					: item.planData;
		} catch (error) {
			logger.error("Failed to parse plan data JSON:", error as Error);
			throw new Error("Invalid plan data format in database");
		}
		return {
			guestId: item.guestId,
			planId: item.planId,
			title: item.title,
			planData,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};
	}
}
