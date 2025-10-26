// biome-ignore-all lint: Resource could have any field

import type { RepositoryConfig, ServiceResult } from "@bts/core";
import {
	createPlanRepository,
	type IEventRepository,
	type IEventRepositoryFactory,
	type IPlanRepository,
	validateRepositoryConfig,
} from "@bts/core";
import { DynamoDBEventRepository } from "../repositories/index.js";

export async function createDynamoDBPlanRepository(): Promise<IPlanRepository> {
	const { Resource } = await import("sst");
	const tableName = (Resource as any).BeautyTourPlans.name;
	return createPlanRepository({ repositoryType: "dynamodb", tableName });
}

/**
 * Event repository factory implementation for web package
 */
export class EventRepositoryFactory implements IEventRepositoryFactory {
	/**
	 * Create an event repository instance based on configuration
	 */
	createEventRepository(config: RepositoryConfig): IEventRepository {
		// Validate configuration
		const validation = validateRepositoryConfig(config);
		if (!validation.success) {
			throw new Error(`Invalid repository configuration: ${validation.error}`);
		}

		// Currently only DynamoDB is supported
		if (config.repositoryType === "dynamodb") {
			return new DynamoDBEventRepository(config.tableName, config.region);
		}

		throw new Error(`Unsupported repository type: ${config.repositoryType}`);
	}

	/**
	 * Create an extended event repository instance
	 * Note: Extended functionality not yet implemented
	 */
	createExtendedEventRepository(config: RepositoryConfig): any {
		throw new Error("Extended event repository not yet implemented");
	}
}

/**
 * Create a DynamoDB event repository using SST resources
 */
export async function createDynamoDBEventRepository(): Promise<
	ServiceResult<IEventRepository>
> {
	try {
		const { Resource } = await import("sst");

		// Get the events table name from SST resources
		const tableName = (Resource as any).BeautyTourEvents?.name;

		if (!tableName) {
			return {
				success: false,
				error:
					"BeautyTourEvents table not found in SST resources. Make sure the table is defined in sst.config.ts",
			};
		}

		const factory = new EventRepositoryFactory();
		const repository = factory.createEventRepository({
			repositoryType: "dynamodb",
			tableName,
			region: process.env.APP_AWS_REGION,
		});

		return {
			success: true,
			data: repository,
		};
	} catch (error) {
		return {
			success: false,
			error: `Failed to create event repository: ${(error as Error).message}`,
		};
	}
}

/**
 * Create event repository with custom configuration
 */
export function createEventRepositoryWithConfig(
	config: RepositoryConfig,
): ServiceResult<IEventRepository> {
	try {
		const factory = new EventRepositoryFactory();
		const repository = factory.createEventRepository(config);

		return {
			success: true,
			data: repository,
		};
	} catch (error) {
		return {
			success: false,
			error: `Failed to create event repository: ${(error as Error).message}`,
		};
	}
}
