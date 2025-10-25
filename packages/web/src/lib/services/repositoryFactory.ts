// biome-ignore-all lint: Resource could have any field
import { createPlanRepository, type IPlanRepository } from "@bts/core";

export async function createDynamoDBPlanRepository(): Promise<IPlanRepository> {
	const { Resource } = await import("sst");
	const tableName = (Resource as any).BeautyTourPlans.name;
	return createPlanRepository({ repositoryType: "dynamodb", tableName });
}
