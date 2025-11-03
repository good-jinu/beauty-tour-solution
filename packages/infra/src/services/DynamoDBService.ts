import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DeleteCommand,
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	QueryCommand,
	ScanCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { logger } from "../utils/logger.js";

export interface DynamoDBServiceConfig {
	region?: string;
	tableName: string;
}

export class DynamoDBService {
	private client: DynamoDBDocumentClient;
	private tableName: string;

	constructor(config: DynamoDBServiceConfig) {
		const region = config.region ?? process.env.APP_AWS_REGION ?? "us-east-1";
		this.tableName = config.tableName;

		if (!this.tableName) {
			const errorMessage = "DynamoDB table name is required.";
			logger.error(errorMessage);
			throw new Error(errorMessage);
		}

		logger.info("Initializing DynamoDB service", {
			region,
			tableName: this.tableName,
		});

		const dynamoClient = new DynamoDBClient({ region });
		this.client = DynamoDBDocumentClient.from(dynamoClient);
	}

	public getTableName(): string {
		return this.tableName;
	}

	public async putItem(
		item: Record<string, unknown>,
	): Promise<Record<string, unknown>> {
		const command = new PutCommand({
			TableName: this.tableName,
			Item: item,
		});
		await this.client.send(command);
		return item;
	}

	public async getItem(
		key: Record<string, unknown>,
	): Promise<Record<string, unknown> | null> {
		const command = new GetCommand({
			TableName: this.tableName,
			Key: key,
		});
		const result = await this.client.send(command);
		return result.Item ?? null;
	}

	public async queryItems(
		params: Omit<QueryCommand["input"], "TableName">,
	): Promise<Record<string, unknown>[]> {
		const command = new QueryCommand({
			TableName: this.tableName,
			...params,
		});
		const result = await this.client.send(command);
		return result.Items ?? [];
	}

	public async updateItem(
		params: Omit<UpdateCommand["input"], "TableName">,
	): Promise<Record<string, unknown> | null> {
		const command = new UpdateCommand({
			TableName: this.tableName,
			...params,
		});
		const result = await this.client.send(command);
		return result.Attributes ?? null;
	}

	public async deleteItem(key: Record<string, unknown>): Promise<void> {
		const command = new DeleteCommand({
			TableName: this.tableName,
			Key: key,
		});
		await this.client.send(command);
	}

	public async scanItems(
		params: Omit<ScanCommand["input"], "TableName">,
	): Promise<Record<string, unknown>[]> {
		const command = new ScanCommand({
			TableName: this.tableName,
			...params,
		});
		const result = await this.client.send(command);
		return result.Items ?? [];
	}
}
