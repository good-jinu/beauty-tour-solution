// biome-ignore-all lint: Resource could have any field

import type { RepositoryConfig, ServiceResult } from "@bts/core";
import {
	createEventRepository,
	createPlanRepository,
	createScheduleRepository,
	DynamoDBActivityRepository,
	type IActivityRepository,
	type IEventRepository,
	type IEventRepositoryFactory,
	type IPlanRepository,
	type IScheduleRepository,
	validateRepositoryConfig,
} from "@bts/core";

export async function createDynamoDBPlanRepository(): Promise<IPlanRepository> {
	const { Resource } = await import("sst");
	const tableName = (Resource as any).BeautyTourPlans.name;
	return createPlanRepository({ repositoryType: "dynamodb", tableName });
}

export async function createDynamoDBScheduleRepository(): Promise<IScheduleRepository> {
	const { Resource } = await import("sst");
	const tableName = (Resource as any).BeautyTourSchedules.name;
	return createScheduleRepository({ repositoryType: "dynamodb", tableName });
}

export async function createDynamoDBActivityRepository(): Promise<IActivityRepository> {
	const { Resource } = await import("sst");
	const tableName = (Resource as any).BeautyTourActivities.name;
	return new DynamoDBActivityRepository(tableName);
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

		// Use the factory from core package - this is synchronous for the interface
		// but the actual creation happens in createDynamoDBEventRepository
		throw new Error(
			"Use createDynamoDBEventRepository() for async repository creation",
		);
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

		const repository = await createEventRepository({
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
 * Create a DynamoDB schedule repository using SST resources
 */
export async function createDynamoDBScheduleRepositoryWithConfig(): Promise<
	ServiceResult<IScheduleRepository>
> {
	try {
		const { Resource } = await import("sst");

		// Get the schedules table name from SST resources
		const tableName = (Resource as any).BeautyTourSchedules?.name;

		if (!tableName) {
			return {
				success: false,
				error:
					"BeautyTourSchedules table not found in SST resources. Make sure the table is defined in sst.config.ts",
			};
		}

		const repository = await createScheduleRepository({
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
			error: `Failed to create schedule repository: ${(error as Error).message}`,
		};
	}
}

/**
 * Create event repository with custom configuration
 */
export async function createEventRepositoryWithConfig(
	config: RepositoryConfig,
): Promise<ServiceResult<IEventRepository>> {
	try {
		const repository = await createEventRepository(config);

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
 * Create schedule repository with custom configuration
 */
export async function createScheduleRepositoryWithConfig(
	config: RepositoryConfig,
): Promise<ServiceResult<IScheduleRepository>> {
	try {
		const repository = await createScheduleRepository(config);

		return {
			success: true,
			data: repository,
		};
	} catch (error) {
		return {
			success: false,
			error: `Failed to create schedule repository: ${(error as Error).message}`,
		};
	}
}
