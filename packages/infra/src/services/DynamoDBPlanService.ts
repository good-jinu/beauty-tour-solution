import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DeleteCommand,
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	QueryCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
	DynamoDBPlanItem,
	GetPlansRequest,
	SavedPlan,
	SavePlanRequest,
} from "../types/plan.js";

import {
	transformFromDynamoItem,
	transformToDynamoItem,
	validatePlanDataForStorage,
} from "../utils/dynamodb-transforms.js";
import { getCurrentTimestamp } from "../utils/timestamp.js";

export interface DynamoDBConfig {
	region?: string;
	tableName?: string;
}

export class DynamoDBPlanService {
	private client: DynamoDBDocumentClient;
	private tableName: string;

	constructor(config: DynamoDBConfig = {}) {
		const region = config.region ?? process.env.APP_AWS_REGION ?? "us-east-1";

		// Use SST Resource if available, otherwise fall back to config or env
		let sstTableName: string | undefined;
		try {
			// Try to import SST Resource dynamically
			const { Resource } = require("sst");
			sstTableName = Resource?.BeautyTourPlans?.name;
		} catch {
			// SST not available in development/testing
		}

		this.tableName =
			config.tableName ??
			sstTableName ??
			process.env.PLANS_TABLE_NAME ??
			"BeautyTourPlans";

		if (!this.tableName) {
			throw new Error(
				"DynamoDB table name is required. Set PLANS_TABLE_NAME environment variable or provide tableName in config.",
			);
		}

		const dynamoClient = new DynamoDBClient({ region });
		this.client = DynamoDBDocumentClient.from(dynamoClient);
	}

	/**
	 * Save a plan to DynamoDB
	 */
	async savePlan(request: SavePlanRequest): Promise<SavedPlan> {
		try {
			// Validate and sanitize plan data
			const validatedPlanData = validatePlanDataForStorage(request.planData);

			const planId = this.generatePlanId();
			const now = getCurrentTimestamp();

			const savedPlan: SavedPlan = {
				guestId: request.guestId,
				planId,
				title: request.title,
				planData: validatedPlanData,
				createdAt: now,
				updatedAt: now,
			};

			// Transform to DynamoDB item
			const dynamoItem = transformToDynamoItem(savedPlan);

			const command = new PutCommand({
				TableName: this.tableName,
				Item: dynamoItem,
				// Prevent overwriting existing items with same keys
				ConditionExpression:
					"attribute_not_exists(guestId) AND attribute_not_exists(planId)",
			});

			await this.client.send(command);

			return savedPlan;
		} catch (error: any) {
			console.error("Failed to save plan to DynamoDB:", error);

			if (error?.name === "ConditionalCheckFailedException") {
				throw new Error("Plan with this ID already exists");
			}

			throw new Error(
				`Failed to save plan: ${error?.message || "Unknown error"}`,
			);
		}
	}

	/**
	 * Get all plans for a guest user
	 */
	async getPlansByGuestId(request: GetPlansRequest): Promise<SavedPlan[]> {
		try {
			const command = new QueryCommand({
				TableName: this.tableName,
				KeyConditionExpression: "guestId = :guestId",
				ExpressionAttributeValues: {
					":guestId": request.guestId,
				},
				ScanIndexForward: false, // Sort by planId descending (newest first)
			});

			const result = await this.client.send(command);

			if (!result.Items) {
				return [];
			}

			return result.Items.map((item) =>
				transformFromDynamoItem(item as DynamoDBPlanItem),
			);
		} catch (error: any) {
			console.error("Failed to get plans from DynamoDB:", error);
			throw new Error(
				`Failed to retrieve plans: ${error?.message || "Unknown error"}`,
			);
		}
	}

	/**
	 * Get a specific plan by guestId and planId
	 */
	async getPlan(guestId: string, planId: string): Promise<SavedPlan | null> {
		try {
			const command = new GetCommand({
				TableName: this.tableName,
				Key: {
					guestId,
					planId,
				},
			});

			const result = await this.client.send(command);

			if (!result.Item) {
				return null;
			}

			return transformFromDynamoItem(result.Item as DynamoDBPlanItem);
		} catch (error: any) {
			console.error("Failed to get plan from DynamoDB:", error);
			throw new Error(
				`Failed to retrieve plan: ${error?.message || "Unknown error"}`,
			);
		}
	}

	/**
	 * Update an existing plan
	 */
	async updatePlan(
		guestId: string,
		planId: string,
		updates: Partial<Pick<SavedPlan, "title" | "planData">>,
	): Promise<SavedPlan> {
		try {
			const now = getCurrentTimestamp();

			// Build update expression dynamically
			const updateExpressions: string[] = ["updatedAt = :updatedAt"];
			const expressionAttributeValues: Record<string, any> = {
				":updatedAt": now,
			};

			if (updates.title !== undefined) {
				updateExpressions.push("title = :title");
				expressionAttributeValues[":title"] = updates.title;
			}

			if (updates.planData !== undefined) {
				const validatedPlanData = validatePlanDataForStorage(updates.planData);
				updateExpressions.push("planData = :planData");
				expressionAttributeValues[":planData"] =
					JSON.stringify(validatedPlanData);
			}

			const command = new UpdateCommand({
				TableName: this.tableName,
				Key: {
					guestId,
					planId,
				},
				UpdateExpression: `SET ${updateExpressions.join(", ")}`,
				ExpressionAttributeValues: expressionAttributeValues,
				ConditionExpression:
					"attribute_exists(guestId) AND attribute_exists(planId)",
				ReturnValues: "ALL_NEW",
			});

			const result = await this.client.send(command);

			if (!result.Attributes) {
				throw new Error("Failed to update plan - no attributes returned");
			}

			return transformFromDynamoItem(result.Attributes as DynamoDBPlanItem);
		} catch (error: any) {
			console.error("Failed to update plan in DynamoDB:", error);

			if (error?.name === "ConditionalCheckFailedException") {
				throw new Error("Plan not found");
			}

			throw new Error(
				`Failed to update plan: ${error?.message || "Unknown error"}`,
			);
		}
	}

	/**
	 * Delete a plan
	 */
	async deletePlan(guestId: string, planId: string): Promise<void> {
		try {
			const command = new DeleteCommand({
				TableName: this.tableName,
				Key: {
					guestId,
					planId,
				},
				ConditionExpression:
					"attribute_exists(guestId) AND attribute_exists(planId)",
			});

			await this.client.send(command);
		} catch (error: any) {
			console.error("Failed to delete plan from DynamoDB:", error);

			if (error?.name === "ConditionalCheckFailedException") {
				throw new Error("Plan not found");
			}

			throw new Error(
				`Failed to delete plan: ${error?.message || "Unknown error"}`,
			);
		}
	}

	/**
	 * Generate a unique plan ID
	 */
	private generatePlanId(): string {
		// Generate a UUID-like string using timestamp and random values
		const timestamp = Date.now().toString(36);
		const randomPart = Math.random().toString(36).substring(2, 15);
		return `plan_${timestamp}_${randomPart}`;
	}

	/**
	 * Get the configured table name
	 */
	getTableName(): string {
		return this.tableName;
	}
}
