/**
 * Core event types for user event tracking system
 */

/**
 * Event type enumeration
 */
export enum EventType {
	PAGE_VISIT = "page_visit",
	CLICK = "click",
	SCROLL = "scroll",
}

/**
 * Event type constants
 */
export const EVENT_TYPES = {
	PAGE_VISIT: "page_visit" as const,
	CLICK: "click" as const,
	SCROLL: "scroll" as const,
} as const;

/**
 * Valid event type union
 */
export type ValidEventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

/**
 * User event data captured on the client side
 */
export interface UserEvent {
	event_type: ValidEventType;
	timestamp: string;
	page_url: string;
	user_agent?: string;
	viewport_width?: number;
	viewport_height?: number;
	// Event-specific data
	element_tag?: string;
	element_id?: string;
	element_text?: string;
	scroll_percent?: number;
}

/**
 * Event data as stored in DynamoDB
 */
export interface StoredEvent {
	// Primary Key
	guest_id: string; // Partition key
	event_timestamp: string; // Sort key (ISO 8601)

	// Event Data
	event_type: string;
	event_id: string; // UUID for deduplication
	page_url: string;
	user_agent?: string;
	viewport_width?: number;
	viewport_height?: number;

	// Event-specific fields
	element_tag?: string;
	element_id?: string;
	element_text?: string;
	scroll_percent?: number;

	// Metadata
	created_at: string; // ISO 8601
	ttl?: number; // Optional TTL for data retention
}

/**
 * Event request payload sent to API
 */
export interface EventRequest {
	event_type: string;
	timestamp: string;
	page_url: string;
	[key: string]: unknown;
}

/**
 * Event API response
 */
export interface EventResponse {
	success: boolean;
	message?: string;
	error?: string;
}

/**
 * Event error response format
 */
export interface EventErrorResponse {
	success: false;
	error: {
		code: string;
		message: string;
		details?: Record<string, unknown>;
	};
	request_id: string;
}

/**
 * Guest ID cookie structure
 */
export interface GuestCookie {
	name: "beauty-tour-guest-id";
	value: string; // UUID v4 format
	options: {
		httpOnly: true;
		secure: boolean; // true in production
		sameSite: "lax";
		maxAge: number; // 30 days in seconds
		path: "/";
	};
}

/**
 * Event tracking configuration
 */
export interface EventTrackingConfig {
	// API Configuration
	EVENT_API_ENDPOINT: string;

	// Cookie Configuration
	GUEST_COOKIE_SECURE: boolean;
	GUEST_COOKIE_MAX_AGE: number;

	// DynamoDB Configuration
	EVENTS_TABLE_NAME: string;
	AWS_REGION: string;

	// Feature Flags
	EVENT_TRACKING_ENABLED: boolean;
	EVENT_BATCHING_ENABLED: boolean;

	// Performance Settings
	EVENT_BATCH_SIZE: number;
	EVENT_BATCH_TIMEOUT: number;
	RATE_LIMIT_PER_MINUTE: number;
}

/**
 * Repository configuration for event storage
 */
export interface RepositoryConfig {
	repositoryType: "dynamodb";
	tableName: string;
	region?: string;
}

/**
 * Event validation result
 */
export interface EventValidationResult {
	isValid: boolean;
	errors?: string[];
}

/**
 * Service result wrapper
 */
export interface ServiceResult<T> {
	success: boolean;
	data?: T;
	error?: string;
}

/**
 * Event validation constants
 */
export const EVENT_VALIDATION = {
	MAX_URL_LENGTH: 2048,
	MAX_TEXT_LENGTH: 500,
	MAX_TAG_LENGTH: 50,
	MAX_CLASS_LENGTH: 200,
	MAX_ID_LENGTH: 100,
	MIN_VIEWPORT_SIZE: 1,
	MAX_VIEWPORT_SIZE: 10000,
	MIN_SCROLL_PERCENT: 0,
	MAX_SCROLL_PERCENT: 100,
} as const;

/**
 * Type guard to check if a value is a valid event type
 */
export function isValidEventType(value: unknown): value is ValidEventType {
	return (
		typeof value === "string" &&
		Object.values(EVENT_TYPES).includes(value as ValidEventType)
	);
}

/**
 * Type guard to check if an object is a valid UserEvent
 */
export function isUserEvent(obj: unknown): obj is UserEvent {
	if (!obj || typeof obj !== "object") {
		return false;
	}

	const record = obj as Record<string, unknown>;

	// Required fields
	if (!isValidEventType(record.event_type)) {
		return false;
	}

	if (typeof record.timestamp !== "string" || !record.timestamp) {
		return false;
	}

	if (typeof record.page_url !== "string" || !record.page_url) {
		return false;
	}

	// Optional fields validation
	if (
		record.user_agent !== undefined &&
		typeof record.user_agent !== "string"
	) {
		return false;
	}

	if (
		record.viewport_width !== undefined &&
		(typeof record.viewport_width !== "number" || record.viewport_width < 0)
	) {
		return false;
	}

	if (
		record.viewport_height !== undefined &&
		(typeof record.viewport_height !== "number" || record.viewport_height < 0)
	) {
		return false;
	}

	if (
		record.element_tag !== undefined &&
		typeof record.element_tag !== "string"
	) {
		return false;
	}

	if (
		record.element_id !== undefined &&
		typeof record.element_id !== "string"
	) {
		return false;
	}

	if (
		record.element_text !== undefined &&
		typeof record.element_text !== "string"
	) {
		return false;
	}

	if (
		record.scroll_percent !== undefined &&
		(typeof record.scroll_percent !== "number" ||
			record.scroll_percent < 0 ||
			record.scroll_percent > 100)
	) {
		return false;
	}

	return true;
}

/**
 * Type guard to check if an object is a valid StoredEvent
 */
export function isStoredEvent(obj: unknown): obj is StoredEvent {
	if (!obj || typeof obj !== "object") {
		return false;
	}

	const record = obj as Record<string, unknown>;

	// Required fields
	if (typeof record.guest_id !== "string" || !record.guest_id) {
		return false;
	}

	if (typeof record.event_timestamp !== "string" || !record.event_timestamp) {
		return false;
	}

	if (typeof record.event_type !== "string" || !record.event_type) {
		return false;
	}

	if (typeof record.event_id !== "string" || !record.event_id) {
		return false;
	}

	if (typeof record.page_url !== "string" || !record.page_url) {
		return false;
	}

	if (typeof record.created_at !== "string" || !record.created_at) {
		return false;
	}

	return true;
}

/**
 * Validation schema for UserEvent
 */
export function validateUserEvent(event: unknown): EventValidationResult {
	const errors: string[] = [];

	if (!event || typeof event !== "object") {
		errors.push("event must be an object");
		return { isValid: false, errors };
	}

	const record = event as Record<string, unknown>;

	if (!isValidEventType(record.event_type)) {
		errors.push(
			`Invalid event_type. Must be one of: ${Object.values(EVENT_TYPES).join(", ")}`,
		);
	}

	if (!record.timestamp || typeof record.timestamp !== "string") {
		errors.push("timestamp is required and must be a string");
	} else {
		// Validate ISO 8601 format
		const date = new Date(record.timestamp);
		if (Number.isNaN(date.getTime())) {
			errors.push("timestamp must be a valid ISO 8601 date string");
		}
	}

	if (!record.page_url || typeof record.page_url !== "string") {
		errors.push("page_url is required and must be a string");
	} else if (record.page_url.length > EVENT_VALIDATION.MAX_URL_LENGTH) {
		errors.push(
			`page_url must not exceed ${EVENT_VALIDATION.MAX_URL_LENGTH} characters`,
		);
	}

	// Optional field validations
	if (
		record.user_agent &&
		(typeof record.user_agent !== "string" ||
			record.user_agent.length > EVENT_VALIDATION.MAX_TEXT_LENGTH)
	) {
		errors.push(
			`user_agent must be a string not exceeding ${EVENT_VALIDATION.MAX_TEXT_LENGTH} characters`,
		);
	}

	if (record.viewport_width !== undefined) {
		if (
			typeof record.viewport_width !== "number" ||
			record.viewport_width < EVENT_VALIDATION.MIN_VIEWPORT_SIZE ||
			record.viewport_width > EVENT_VALIDATION.MAX_VIEWPORT_SIZE
		) {
			errors.push(
				`viewport_width must be a number between ${EVENT_VALIDATION.MIN_VIEWPORT_SIZE} and ${EVENT_VALIDATION.MAX_VIEWPORT_SIZE}`,
			);
		}
	}

	if (record.viewport_height !== undefined) {
		if (
			typeof record.viewport_height !== "number" ||
			record.viewport_height < EVENT_VALIDATION.MIN_VIEWPORT_SIZE ||
			record.viewport_height > EVENT_VALIDATION.MAX_VIEWPORT_SIZE
		) {
			errors.push(
				`viewport_height must be a number between ${EVENT_VALIDATION.MIN_VIEWPORT_SIZE} and ${EVENT_VALIDATION.MAX_VIEWPORT_SIZE}`,
			);
		}
	}

	if (
		record.element_tag &&
		(typeof record.element_tag !== "string" ||
			record.element_tag.length > EVENT_VALIDATION.MAX_TAG_LENGTH)
	) {
		errors.push(
			`element_tag must be a string not exceeding ${EVENT_VALIDATION.MAX_TAG_LENGTH} characters`,
		);
	}

	if (
		record.element_id &&
		(typeof record.element_id !== "string" ||
			record.element_id.length > EVENT_VALIDATION.MAX_ID_LENGTH)
	) {
		errors.push(
			`element_id must be a string not exceeding ${EVENT_VALIDATION.MAX_ID_LENGTH} characters`,
		);
	}

	if (
		record.element_text &&
		(typeof record.element_text !== "string" ||
			record.element_text.length > EVENT_VALIDATION.MAX_TEXT_LENGTH)
	) {
		errors.push(
			`element_text must be a string not exceeding ${EVENT_VALIDATION.MAX_TEXT_LENGTH} characters`,
		);
	}

	if (record.scroll_percent !== undefined) {
		if (
			typeof record.scroll_percent !== "number" ||
			record.scroll_percent < EVENT_VALIDATION.MIN_SCROLL_PERCENT ||
			record.scroll_percent > EVENT_VALIDATION.MAX_SCROLL_PERCENT
		) {
			errors.push(
				`scroll_percent must be a number between ${EVENT_VALIDATION.MIN_SCROLL_PERCENT} and ${EVENT_VALIDATION.MAX_SCROLL_PERCENT}`,
			);
		}
	}

	return {
		isValid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined,
	};
}

/**
 * Validation schema for StoredEvent
 */
export function validateStoredEvent(event: unknown): EventValidationResult {
	const errors: string[] = [];

	if (!event || typeof event !== "object") {
		errors.push("event must be an object");
		return { isValid: false, errors };
	}

	const record = event as Record<string, unknown>;

	if (!record.guest_id || typeof record.guest_id !== "string") {
		errors.push("guest_id is required and must be a string");
	} else {
		// Validate UUID v4 format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(record.guest_id)) {
			errors.push("guest_id must be a valid UUID v4");
		}
	}

	if (!record.event_timestamp || typeof record.event_timestamp !== "string") {
		errors.push("event_timestamp is required and must be a string");
	} else {
		const date = new Date(record.event_timestamp);
		if (Number.isNaN(date.getTime())) {
			errors.push("event_timestamp must be a valid ISO 8601 date string");
		}
	}

	if (!record.event_type || typeof record.event_type !== "string") {
		errors.push("event_type is required and must be a string");
	}

	if (!record.event_id || typeof record.event_id !== "string") {
		errors.push("event_id is required and must be a string");
	} else {
		// Validate UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(record.event_id)) {
			errors.push("event_id must be a valid UUID");
		}
	}

	if (!record.page_url || typeof record.page_url !== "string") {
		errors.push("page_url is required and must be a string");
	} else if (record.page_url.length > EVENT_VALIDATION.MAX_URL_LENGTH) {
		errors.push(
			`page_url must not exceed ${EVENT_VALIDATION.MAX_URL_LENGTH} characters`,
		);
	}

	if (!record.created_at || typeof record.created_at !== "string") {
		errors.push("created_at is required and must be a string");
	} else {
		const date = new Date(record.created_at);
		if (Number.isNaN(date.getTime())) {
			errors.push("created_at must be a valid ISO 8601 date string");
		}
	}

	if (
		record.ttl !== undefined &&
		(typeof record.ttl !== "number" || record.ttl < 0)
	) {
		errors.push("ttl must be a positive number");
	}

	return {
		isValid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined,
	};
}
