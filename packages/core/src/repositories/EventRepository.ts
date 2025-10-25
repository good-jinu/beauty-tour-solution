import type { RepositoryConfig, ServiceResult, StoredEvent } from "../types";

/**
 * Abstract interface for event repository operations
 */
export interface IEventRepository {
	/**
	 * Save a single event to storage
	 */
	saveEvent(event: StoredEvent): Promise<void>;

	/**
	 * Save multiple events in a batch operation
	 */
	batchSaveEvents(events: StoredEvent[]): Promise<void>;

	/**
	 * Get events for a specific guest ID with optional pagination
	 */
	getEventsByGuestId(
		guestId: string,
		options?: {
			limit?: number;
			startKey?: string;
			eventType?: string;
		},
	): Promise<StoredEvent[]>;

	/**
	 * Get events by event type with optional pagination
	 */
	getEventsByType(
		eventType: string,
		options?: {
			limit?: number;
			startKey?: string;
			startTime?: string;
			endTime?: string;
		},
	): Promise<StoredEvent[]>;

	/**
	 * Delete events for a specific guest ID (for privacy compliance)
	 */
	deleteEventsByGuestId(guestId: string): Promise<void>;

	/**
	 * Check if an event with the given ID already exists (for deduplication)
	 */
	eventExists(eventId: string): Promise<boolean>;
}

/**
 * Repository error types
 */
export enum RepositoryErrorType {
	CONNECTION_ERROR = "CONNECTION_ERROR",
	VALIDATION_ERROR = "VALIDATION_ERROR",
	DUPLICATE_ERROR = "DUPLICATE_ERROR",
	NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
	PERMISSION_ERROR = "PERMISSION_ERROR",
	UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Repository error class
 */
export class RepositoryError extends Error {
	public readonly type: RepositoryErrorType;
	public readonly originalError?: Error;

	constructor(
		message: string,
		type: RepositoryErrorType = RepositoryErrorType.UNKNOWN_ERROR,
		originalError?: Error,
	) {
		super(message);
		this.name = "RepositoryError";
		this.type = type;
		this.originalError = originalError;
	}
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
	successCount: number;
	failureCount: number;
	failures?: Array<{
		event: StoredEvent;
		error: string;
	}>;
}

/**
 * Extended repository interface with batch operations and error handling
 */
export interface IEventRepositoryExtended extends IEventRepository {
	/**
	 * Save multiple events with detailed result information
	 */
	batchSaveEventsWithResult(
		events: StoredEvent[],
	): Promise<BatchOperationResult>;

	/**
	 * Health check for repository connection
	 */
	healthCheck(): Promise<ServiceResult<boolean>>;

	/**
	 * Get repository statistics
	 */
	getStats(): Promise<
		ServiceResult<{
			totalEvents: number;
			eventsByType: Record<string, number>;
			oldestEvent?: string;
			newestEvent?: string;
		}>
	>;
}

/**
 * Factory interface for creating event repositories
 */
export interface IEventRepositoryFactory {
	/**
	 * Create an event repository instance based on configuration
	 */
	createEventRepository(config: RepositoryConfig): IEventRepository;

	/**
	 * Create an extended event repository instance
	 */
	createExtendedEventRepository(
		config: RepositoryConfig,
	): IEventRepositoryExtended;
}

/**
 * Repository configuration validation
 */
export function validateRepositoryConfig(
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
 * Query options for event retrieval
 */
export interface EventQueryOptions {
	limit?: number;
	startKey?: string;
	eventType?: string;
	startTime?: string;
	endTime?: string;
	sortOrder?: "asc" | "desc";
}

/**
 * Paginated query result
 */
export interface PaginatedEventResult {
	events: StoredEvent[];
	lastEvaluatedKey?: string;
	count: number;
	scannedCount?: number;
}

/**
 * Advanced repository interface with pagination support
 */
export interface IEventRepositoryAdvanced extends IEventRepository {
	/**
	 * Get events with pagination support
	 */
	getEventsPaginated(
		guestId: string,
		options?: EventQueryOptions,
	): Promise<PaginatedEventResult>;

	/**
	 * Get events by type with pagination support
	 */
	getEventsByTypePaginated(
		eventType: string,
		options?: EventQueryOptions,
	): Promise<PaginatedEventResult>;

	/**
	 * Count events for a guest ID
	 */
	countEventsByGuestId(guestId: string): Promise<number>;

	/**
	 * Count events by type
	 */
	countEventsByType(eventType: string): Promise<number>;
}
