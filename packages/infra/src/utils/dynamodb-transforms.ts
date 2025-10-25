import type { DynamoDBPlanItem, PlanData, SavedPlan } from "../types/plan.js";

/**
 * Utility functions for transforming data between application models and DynamoDB items
 */

/**
 * Transform SavedPlan to DynamoDB item format
 */
export function transformToDynamoItem(plan: SavedPlan): DynamoDBPlanItem {
	return {
		guestId: plan.guestId,
		planId: plan.planId,
		title: plan.title,
		planData: JSON.stringify(plan.planData),
		createdAt: plan.createdAt,
		updatedAt: plan.updatedAt,
		// Optional TTL - set to 1 year from creation for automatic cleanup
		ttl:
			Math.floor(new Date(plan.createdAt).getTime() / 1000) +
			365 * 24 * 60 * 60,
	};
}

/**
 * Transform DynamoDB item to SavedPlan format
 */
export function transformFromDynamoItem(item: DynamoDBPlanItem): SavedPlan {
	let planData: PlanData;

	try {
		planData =
			typeof item.planData === "string"
				? JSON.parse(item.planData)
				: item.planData;
	} catch (error) {
		console.error("Failed to parse plan data JSON:", error);
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

/**
 * Validate and sanitize plan data before transformation
 */
export function validatePlanDataForStorage(planData: PlanData): PlanData {
	// Ensure required fields are present
	if (!planData.formData) {
		throw new Error("Plan data must include form data");
	}

	if (!planData.preferences) {
		throw new Error("Plan data must include preferences");
	}

	// Sanitize and validate preferences
	const sanitizedPreferences = {
		region: String(planData.preferences.region || ""),
		budget: Number(planData.preferences.budget) || 0,
		travelers: Number(planData.preferences.travelers) || 1,
		dates: {
			startDate: String(planData.preferences.dates?.startDate || ""),
			endDate: String(planData.preferences.dates?.endDate || ""),
		},
		theme: String(planData.preferences.theme || ""),
		inclusions: Array.isArray(planData.preferences.inclusions)
			? planData.preferences.inclusions.map(String)
			: [],
		specialRequests: planData.preferences.specialRequests
			? String(planData.preferences.specialRequests)
			: undefined,
	};

	return {
		...planData,
		preferences: sanitizedPreferences,
	};
}

/**
 * Create a batch of DynamoDB items from multiple SavedPlan objects
 */
export function transformToDynamoItemBatch(
	plans: SavedPlan[],
): DynamoDBPlanItem[] {
	return plans.map(transformToDynamoItem);
}

/**
 * Transform a batch of DynamoDB items to SavedPlan objects
 */
export function transformFromDynamoItemBatch(
	items: DynamoDBPlanItem[],
): SavedPlan[] {
	return items.map(transformFromDynamoItem);
}

/**
 * Handle DynamoDB-specific data type conversions
 */
export class DynamoDBTypeConverter {
	/**
	 * Convert JavaScript Date to DynamoDB-compatible ISO string
	 */
	static dateToISOString(date: Date): string {
		return date.toISOString();
	}

	/**
	 * Convert ISO string to JavaScript Date
	 */
	static isoStringToDate(isoString: string): Date {
		const date = new Date(isoString);
		if (isNaN(date.getTime())) {
			throw new Error(`Invalid ISO date string: ${isoString}`);
		}
		return date;
	}

	/**
	 * Convert number to DynamoDB Number (string representation)
	 */
	static numberToDynamoNumber(num: number): string {
		if (!Number.isFinite(num)) {
			throw new Error(`Invalid number for DynamoDB: ${num}`);
		}
		return num.toString();
	}

	/**
	 * Convert DynamoDB Number (string) to JavaScript number
	 */
	static dynamoNumberToNumber(dynamoNum: string): number {
		const num = Number(dynamoNum);
		if (!Number.isFinite(num)) {
			throw new Error(`Invalid DynamoDB number: ${dynamoNum}`);
		}
		return num;
	}

	/**
	 * Safely stringify JSON for DynamoDB storage
	 */
	static safeStringify(obj: any): string {
		try {
			return JSON.stringify(obj);
		} catch (error) {
			console.error("Failed to stringify object for DynamoDB:", error);
			throw new Error("Object cannot be serialized to JSON");
		}
	}

	/**
	 * Safely parse JSON from DynamoDB storage
	 */
	static safeParse<T = any>(jsonString: string): T {
		try {
			return JSON.parse(jsonString);
		} catch (error) {
			console.error("Failed to parse JSON from DynamoDB:", error);
			throw new Error("Invalid JSON format in stored data");
		}
	}

	/**
	 * Convert array to DynamoDB List format (if needed for raw DynamoDB operations)
	 */
	static arrayToDynamoList(arr: any[]): any[] {
		return arr.map((item) => {
			if (typeof item === "string") return { S: item };
			if (typeof item === "number") return { N: item.toString() };
			if (typeof item === "boolean") return { BOOL: item };
			if (item === null) return { NULL: true };
			if (typeof item === "object") return { S: JSON.stringify(item) };
			return { S: String(item) };
		});
	}

	/**
	 * Convert DynamoDB List to JavaScript array (if needed for raw DynamoDB operations)
	 */
	static dynamoListToArray(dynamoList: any[]): any[] {
		return dynamoList.map((item) => {
			if (item.S !== undefined) return item.S;
			if (item.N !== undefined) return Number(item.N);
			if (item.BOOL !== undefined) return item.BOOL;
			if (item.NULL) return null;
			return item.S || item;
		});
	}
}
