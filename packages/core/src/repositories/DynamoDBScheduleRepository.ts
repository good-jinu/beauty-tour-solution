import { DynamoDBService } from "@bts/infra";
import type { GenerateScheduleRequest, ScheduleDay } from "../types/schedule";
import { logger } from "../utils/logger";
import type {
	DynamoDBScheduleItem,
	IScheduleRepository,
	StoredSchedule,
} from "./ScheduleRepository";
import {
	ScheduleRepositoryError,
	ScheduleRepositoryErrorType,
} from "./ScheduleRepository";

export class DynamoDBScheduleRepository implements IScheduleRepository {
	private dynamoDBService: DynamoDBService;

	constructor(tableName: string, region?: string) {
		if (!tableName) {
			throw new Error(
				"DynamoDB table name is required for DynamoDBScheduleRepository.",
			);
		}
		this.dynamoDBService = new DynamoDBService({ tableName, region });
	}

	async saveSchedule(schedule: StoredSchedule): Promise<StoredSchedule> {
		try {
			const dynamoItem = this.transformToDynamoItem(schedule);
			await this.dynamoDBService.putItem(dynamoItem);
			return schedule;
		} catch (error) {
			logger.error("Failed to save schedule:", error as Error);
			throw this.mapErrorType(error);
		}
	}

	async getSchedulesByGuestId(guestId: string): Promise<StoredSchedule[]> {
		try {
			const items = await this.dynamoDBService.queryItems({
				KeyConditionExpression: "guestId = :guestId",
				ExpressionAttributeValues: {
					":guestId": guestId,
				},
				ScanIndexForward: false, // Most recent first
			});

			if (!items) {
				return [];
			}

			return items.map((item) =>
				this.transformFromDynamoItem(item as unknown as DynamoDBScheduleItem),
			);
		} catch (error) {
			logger.error("Failed to get schedules by guest ID:", error as Error);
			throw this.mapErrorType(error);
		}
	}

	async getSchedule(
		guestId: string,
		scheduleId: string,
	): Promise<StoredSchedule | null> {
		try {
			const item = await this.dynamoDBService.getItem({
				guestId,
				scheduleId,
			});

			if (!item) {
				return null;
			}

			return this.transformFromDynamoItem(
				item as unknown as DynamoDBScheduleItem,
			);
		} catch (error) {
			logger.error("Failed to get schedule:", error as Error);
			throw this.mapErrorType(error);
		}
	}

	async updateSchedule(schedule: StoredSchedule): Promise<StoredSchedule> {
		try {
			// Update the updatedAt timestamp
			const updatedSchedule = {
				...schedule,
				updatedAt: new Date().toISOString(),
			};

			const dynamoItem = this.transformToDynamoItem(updatedSchedule);
			await this.dynamoDBService.putItem(dynamoItem);
			return updatedSchedule;
		} catch (error) {
			logger.error("Failed to update schedule:", error as Error);
			throw this.mapErrorType(error);
		}
	}

	async deleteSchedule(guestId: string, scheduleId: string): Promise<void> {
		try {
			await this.dynamoDBService.deleteItem({
				guestId,
				scheduleId,
			});
		} catch (error) {
			logger.error("Failed to delete schedule:", error as Error);
			throw this.mapErrorType(error);
		}
	}

	async deleteSchedulesByGuestId(guestId: string): Promise<void> {
		try {
			// First, get all schedules for the guest
			const schedules = await this.getSchedulesByGuestId(guestId);

			// Delete each schedule
			const deletePromises = schedules.map((schedule) =>
				this.deleteSchedule(schedule.guestId, schedule.scheduleId),
			);

			await Promise.all(deletePromises);
		} catch (error) {
			logger.error("Failed to delete schedules by guest ID:", error as Error);
			throw this.mapErrorType(error);
		}
	}

	async scheduleExists(guestId: string, scheduleId: string): Promise<boolean> {
		try {
			const schedule = await this.getSchedule(guestId, scheduleId);
			return schedule !== null;
		} catch (error) {
			logger.error("Failed to check if schedule exists:", error as Error);
			throw this.mapErrorType(error);
		}
	}

	/**
	 * Transform StoredSchedule to DynamoDB item format
	 */
	private transformToDynamoItem(
		schedule: StoredSchedule,
	): DynamoDBScheduleItem {
		return {
			guestId: schedule.guestId,
			scheduleId: schedule.scheduleId,
			title: schedule.title,
			request: JSON.stringify(schedule.request),
			schedule: JSON.stringify(schedule.schedule),
			createdAt: schedule.createdAt,
			updatedAt: schedule.updatedAt,
			ttl:
				Math.floor(new Date(schedule.createdAt).getTime() / 1000) +
				365 * 24 * 60 * 60, // 1 year TTL
		};
	}

	/**
	 * Transform DynamoDB item to StoredSchedule format
	 */
	private transformFromDynamoItem(item: DynamoDBScheduleItem): StoredSchedule {
		let request: GenerateScheduleRequest;
		let schedule: ScheduleDay[];

		try {
			request =
				typeof item.request === "string"
					? JSON.parse(item.request)
					: item.request;
		} catch (error) {
			logger.error("Failed to parse schedule request JSON:", error as Error);
			throw new Error("Invalid schedule request format in database");
		}

		try {
			schedule =
				typeof item.schedule === "string"
					? JSON.parse(item.schedule)
					: item.schedule;
		} catch (error) {
			logger.error("Failed to parse schedule data JSON:", error as Error);
			throw new Error("Invalid schedule data format in database");
		}

		return {
			guestId: item.guestId,
			scheduleId: item.scheduleId,
			title: item.title,
			request,
			schedule,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
		};
	}

	/**
	 * Map AWS SDK errors to repository error types
	 */
	private mapErrorType(error: unknown): ScheduleRepositoryError {
		if (error instanceof Error) {
			const errorMessage = error.message.toLowerCase();

			if (
				errorMessage.includes("network") ||
				errorMessage.includes("timeout")
			) {
				return new ScheduleRepositoryError(
					"Connection error occurred",
					ScheduleRepositoryErrorType.CONNECTION_ERROR,
					error,
				);
			}

			if (
				errorMessage.includes("validation") ||
				errorMessage.includes("invalid")
			) {
				return new ScheduleRepositoryError(
					"Validation error occurred",
					ScheduleRepositoryErrorType.VALIDATION_ERROR,
					error,
				);
			}

			if (
				errorMessage.includes("duplicate") ||
				errorMessage.includes("exists")
			) {
				return new ScheduleRepositoryError(
					"Duplicate schedule error",
					ScheduleRepositoryErrorType.DUPLICATE_ERROR,
					error,
				);
			}

			if (
				errorMessage.includes("not found") ||
				errorMessage.includes("does not exist")
			) {
				return new ScheduleRepositoryError(
					"Schedule not found",
					ScheduleRepositoryErrorType.NOT_FOUND_ERROR,
					error,
				);
			}

			if (
				errorMessage.includes("permission") ||
				errorMessage.includes("access")
			) {
				return new ScheduleRepositoryError(
					"Permission denied",
					ScheduleRepositoryErrorType.PERMISSION_ERROR,
					error,
				);
			}
		}

		return new ScheduleRepositoryError(
			"Unknown error occurred",
			ScheduleRepositoryErrorType.UNKNOWN_ERROR,
			error instanceof Error ? error : undefined,
		);
	}
}
