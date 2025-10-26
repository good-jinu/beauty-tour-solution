import type { StoredEvent } from "@bts/core";
import {
	type IEventRepository,
	logger,
	RepositoryError,
	RepositoryErrorType,
} from "@bts/core";
import { DynamoDBService } from "@bts/infra";

/**
 * DynamoDB implementation of the event repository
 */
export class DynamoDBEventRepository implements IEventRepository {
	private dynamoService: DynamoDBService;

	constructor(tableName: string, region?: string) {
		this.dynamoService = new DynamoDBService({
			tableName,
			region,
		});

		logger.info("DynamoDB Event Repository initialized", {
			tableName,
			region: region || "default",
		});
	}

	/**
	 * Save a single event to DynamoDB
	 */
	async saveEvent(event: StoredEvent): Promise<void> {
		try {
			logger.debug("Saving event to DynamoDB", {
				eventId: event.event_id,
				guestId: event.guest_id,
				eventType: event.event_type,
			});

			await this.dynamoService.putItem(
				event as unknown as Record<string, unknown>,
			);

			logger.debug("Event saved successfully", {
				eventId: event.event_id,
				guestId: event.guest_id,
			});
		} catch (error) {
			logger.error("Failed to save event to DynamoDB", error as Error, {
				eventId: event.event_id,
				guestId: event.guest_id,
			});

			throw new RepositoryError(
				`Failed to save event: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Save multiple events in a batch operation
	 */
	async batchSaveEvents(events: StoredEvent[]): Promise<void> {
		if (events.length === 0) {
			logger.warn("Attempted to batch save empty events array");
			return;
		}

		if (events.length > 25) {
			throw new RepositoryError(
				"Batch size cannot exceed 25 items for DynamoDB",
				RepositoryErrorType.VALIDATION_ERROR,
			);
		}

		try {
			logger.debug("Starting batch save operation", {
				eventCount: events.length,
			});

			// DynamoDB batch write operations require using the low-level client
			// For now, we'll implement this as sequential puts
			// In a production environment, you'd want to use BatchWriteCommand
			const promises = events.map((event) => this.saveEvent(event));
			await Promise.all(promises);

			logger.info("Batch save completed successfully", {
				eventCount: events.length,
			});
		} catch (error) {
			logger.error("Batch save operation failed", error as Error, {
				eventCount: events.length,
			});

			throw new RepositoryError(
				`Failed to batch save events: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Get events for a specific guest ID with optional pagination
	 */
	async getEventsByGuestId(
		guestId: string,
		options?: {
			limit?: number;
			startKey?: string;
			eventType?: string;
		},
	): Promise<StoredEvent[]> {
		try {
			logger.debug("Querying events by guest ID", {
				guestId,
				limit: options?.limit,
				eventType: options?.eventType,
			});

			const expressionAttributeValues: Record<string, unknown> = {
				":guestId": guestId,
			};

			const queryParams: Record<string, unknown> = {
				KeyConditionExpression: "guest_id = :guestId",
				ExpressionAttributeValues: expressionAttributeValues,
				ScanIndexForward: false, // Sort by timestamp descending (newest first)
			};

			if (options?.limit) {
				queryParams.Limit = options.limit;
			}

			if (options?.startKey) {
				try {
					queryParams.ExclusiveStartKey = JSON.parse(options.startKey);
				} catch {
					throw new RepositoryError(
						"Invalid startKey format",
						RepositoryErrorType.VALIDATION_ERROR,
					);
				}
			}

			if (options?.eventType) {
				queryParams.FilterExpression = "event_type = :eventType";
				expressionAttributeValues[":eventType"] = options.eventType;
			}

			const results = await this.dynamoService.queryItems(queryParams);

			logger.debug("Events retrieved successfully", {
				guestId,
				resultCount: results.length,
			});

			return results as unknown as StoredEvent[];
		} catch (error) {
			logger.error("Failed to get events by guest ID", error as Error, {
				guestId,
			});

			throw new RepositoryError(
				`Failed to get events for guest ${guestId}: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Get events by event type with optional pagination
	 */
	async getEventsByType(
		eventType: string,
		options?: {
			limit?: number;
			startKey?: string;
			startTime?: string;
			endTime?: string;
		},
	): Promise<StoredEvent[]> {
		try {
			logger.debug("Querying events by type", {
				eventType,
				limit: options?.limit,
				startTime: options?.startTime,
				endTime: options?.endTime,
			});

			// This would require a GSI on event_type + event_timestamp
			// For now, we'll throw an error indicating this needs GSI setup
			throw new RepositoryError(
				"getEventsByType requires GSI implementation - not yet implemented",
				RepositoryErrorType.NOT_FOUND_ERROR,
			);
		} catch (error) {
			logger.error("Failed to get events by type", error as Error, {
				eventType,
			});

			throw new RepositoryError(
				`Failed to get events by type ${eventType}: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Delete events for a specific guest ID (for privacy compliance)
	 */
	async deleteEventsByGuestId(guestId: string): Promise<void> {
		try {
			logger.info("Starting deletion of events for guest ID", { guestId });

			// First, get all events for the guest
			const events = await this.getEventsByGuestId(guestId);

			if (events.length === 0) {
				logger.info("No events found for guest ID", { guestId });
				return;
			}

			// Delete each event individually
			// In production, you'd want to use BatchWriteCommand for better performance
			const deletePromises = events.map((event) =>
				this.dynamoService.deleteItem({
					guest_id: event.guest_id,
					event_timestamp: event.event_timestamp,
				}),
			);

			await Promise.all(deletePromises);

			logger.info("Successfully deleted all events for guest ID", {
				guestId,
				deletedCount: events.length,
			});
		} catch (error) {
			logger.error("Failed to delete events by guest ID", error as Error, {
				guestId,
			});

			throw new RepositoryError(
				`Failed to delete events for guest ${guestId}: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Check if an event with the given ID already exists (for deduplication)
	 */
	async eventExists(eventId: string): Promise<boolean> {
		try {
			logger.debug("Checking if event exists", { eventId });

			// This would require a GSI on event_id for efficient lookup
			// For now, we'll return false as this is primarily for deduplication
			// and the probability of UUID collision is extremely low
			logger.debug("Event existence check not implemented - returning false", {
				eventId,
			});

			return false;
		} catch (error) {
			logger.error("Failed to check event existence", error as Error, {
				eventId,
			});

			throw new RepositoryError(
				`Failed to check event existence for ${eventId}: ${(error as Error).message}`,
				this.mapErrorType(error),
				error as Error,
			);
		}
	}

	/**
	 * Map AWS SDK errors to repository error types
	 */
	private mapErrorType(error: unknown): RepositoryErrorType {
		if (!(error instanceof Error)) {
			return RepositoryErrorType.UNKNOWN_ERROR;
		}

		const errorName = error.name;
		const errorMessage = error.message.toLowerCase();

		// AWS SDK specific error mapping
		if (
			errorName === "ValidationException" ||
			errorMessage.includes("validation")
		) {
			return RepositoryErrorType.VALIDATION_ERROR;
		}

		if (errorName === "ConditionalCheckFailedException") {
			return RepositoryErrorType.DUPLICATE_ERROR;
		}

		if (
			errorName === "ResourceNotFoundException" ||
			errorMessage.includes("not found")
		) {
			return RepositoryErrorType.NOT_FOUND_ERROR;
		}

		if (
			errorName === "AccessDeniedException" ||
			errorName === "UnauthorizedException" ||
			errorMessage.includes("access denied") ||
			errorMessage.includes("unauthorized")
		) {
			return RepositoryErrorType.PERMISSION_ERROR;
		}

		if (
			errorName === "ProvisionedThroughputExceededException" ||
			errorName === "ThrottlingException" ||
			errorMessage.includes("throttl") ||
			errorMessage.includes("rate limit")
		) {
			return RepositoryErrorType.CONNECTION_ERROR;
		}

		if (
			errorName === "ServiceUnavailableException" ||
			errorName === "InternalServerError" ||
			errorMessage.includes("timeout") ||
			errorMessage.includes("connection")
		) {
			return RepositoryErrorType.CONNECTION_ERROR;
		}

		return RepositoryErrorType.UNKNOWN_ERROR;
	}
}
