import type { RepositoryConfig, ServiceResult } from "../types";
import type { GenerateScheduleRequest, ScheduleDay } from "../types/schedule";

/**
 * Stored schedule interface for database operations
 */
export interface StoredSchedule {
	guestId: string; // Partition key
	scheduleId: string; // Sort key
	title?: string;
	request: GenerateScheduleRequest;
	schedule: ScheduleDay[];
	createdAt: string;
	updatedAt: string;
}

/**
 * DynamoDB item structure for schedules
 */
export interface DynamoDBScheduleItem {
	guestId: string; // Partition Key
	scheduleId: string; // Sort Key
	title?: string;
	request: string; // JSON stringified GenerateScheduleRequest
	schedule: string; // JSON stringified ScheduleDay[]
	createdAt: string;
	updatedAt: string;
	ttl?: number; // Optional TTL for data cleanup
	[key: string]: unknown; // Index signature for DynamoDB compatibility
}

/**
 * Abstract interface for schedule repository operations
 */
export interface IScheduleRepository {
	/**
	 * Save a schedule to storage
	 */
	saveSchedule(schedule: StoredSchedule): Promise<StoredSchedule>;

	/**
	 * Get schedules for a specific guest ID
	 */
	getSchedulesByGuestId(guestId: string): Promise<StoredSchedule[]>;

	/**
	 * Get a specific schedule by guest ID and schedule ID
	 */
	getSchedule(
		guestId: string,
		scheduleId: string,
	): Promise<StoredSchedule | null>;

	/**
	 * Update an existing schedule
	 */
	updateSchedule(schedule: StoredSchedule): Promise<StoredSchedule>;

	/**
	 * Delete a schedule
	 */
	deleteSchedule(guestId: string, scheduleId: string): Promise<void>;

	/**
	 * Delete all schedules for a specific guest ID (for privacy compliance)
	 */
	deleteSchedulesByGuestId(guestId: string): Promise<void>;

	/**
	 * Check if a schedule with the given ID already exists
	 */
	scheduleExists(guestId: string, scheduleId: string): Promise<boolean>;
}

/**
 * Schedule repository error types
 */
export enum ScheduleRepositoryErrorType {
	CONNECTION_ERROR = "CONNECTION_ERROR",
	VALIDATION_ERROR = "VALIDATION_ERROR",
	DUPLICATE_ERROR = "DUPLICATE_ERROR",
	NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
	PERMISSION_ERROR = "PERMISSION_ERROR",
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Schedule repository error class
 */
export class ScheduleRepositoryError extends Error {
	public readonly type: ScheduleRepositoryErrorType;
	public readonly originalError?: Error;

	constructor(
		message: string,
		type: ScheduleRepositoryErrorType = ScheduleRepositoryErrorType.UNKNOWN_ERROR,
		originalError?: Error,
	) {
		super(message);
		this.name = "ScheduleRepositoryError";
		this.type = type;
		this.originalError = originalError;
	}
}

/**
 * Extended repository interface with additional operations
 */
export interface IScheduleRepositoryExtended extends IScheduleRepository {
	/**
	 * Health check for repository connection
	 */
	healthCheck(): Promise<ServiceResult<boolean>>;

	/**
	 * Get repository statistics
	 */
	getStats(): Promise<
		ServiceResult<{
			totalSchedules: number;
			schedulesByRegion: Record<string, number>;
			oldestSchedule?: string;
			newestSchedule?: string;
		}>
	>;

	/**
	 * Get schedules by region
	 */
	getSchedulesByRegion(region: string): Promise<StoredSchedule[]>;
}

/**
 * Factory interface for creating schedule repositories
 */
export interface IScheduleRepositoryFactory {
	/**
	 * Create a schedule repository instance based on configuration
	 */
	createScheduleRepository(config: RepositoryConfig): IScheduleRepository;

	/**
	 * Create an extended schedule repository instance
	 */
	createExtendedScheduleRepository(
		config: RepositoryConfig,
	): IScheduleRepositoryExtended;
}

/**
 * Schedule repository configuration validation
 */
export function validateScheduleRepositoryConfig(
	config: RepositoryConfig,
): ServiceResult<boolean> {
	const errors: string[] = [];

	if (!config.repositoryType) {
		errors.push("repositoryType is required");
	} else if (config.repositoryType !== "dynamodb") {
		errors.push("Only dynamodb repository type is currently supported");
	}

	if (!config.tableName || typeof config.tableName !== "string") {
		errors.push("tableName is required and must be a string");
	}

	if (config.region && typeof config.region !== "string") {
		errors.push("region must be a string if provided");
	}

	return {
		success: errors.length === 0,
		error: errors.length > 0 ? errors.join(", ") : undefined,
	};
}

/**
 * Query options for schedule retrieval
 */
export interface ScheduleQueryOptions {
	limit?: number;
	startKey?: string;
	region?: string;
	startDate?: string;
	endDate?: string;
	sortOrder?: "asc" | "desc";
}

/**
 * Paginated query result for schedules
 */
export interface PaginatedScheduleResult {
	schedules: StoredSchedule[];
	lastEvaluatedKey?: string;
	count: number;
	scannedCount?: number;
}

/**
 * Advanced repository interface with pagination support
 */
export interface IScheduleRepositoryAdvanced extends IScheduleRepository {
	/**
	 * Get schedules with pagination support
	 */
	getSchedulesPaginated(
		guestId: string,
		options?: ScheduleQueryOptions,
	): Promise<PaginatedScheduleResult>;

	/**
	 * Get schedules by region with pagination support
	 */
	getSchedulesByRegionPaginated(
		region: string,
		options?: ScheduleQueryOptions,
	): Promise<PaginatedScheduleResult>;

	/**
	 * Count schedules for a guest ID
	 */
	countSchedulesByGuestId(guestId: string): Promise<number>;

	/**
	 * Count schedules by region
	 */
	countSchedulesByRegion(region: string): Promise<number>;
}
