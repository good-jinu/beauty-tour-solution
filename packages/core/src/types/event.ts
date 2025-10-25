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
	element_class?: string;
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
	element_class?: string;
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
	[key: string]: any;
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
		details?: Record<string, any>;
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
export function isValidEventType(value: any): value is ValidEventType {
	return (
		typeof value === "string" &&
		Object.values(EVENT_TYPES).includes(value as ValidEventType)
	);
}

/**
 * Type guard to check if an object is a valid UserEvent
 */
export function isUserEvent(obj: any): obj is UserEvent {
	if (!obj || typeof obj !== "object") {
		return false;
	}

	// Required fields
	if (!isValidEventType(obj.event_type)) {
		return false;
	}

	if (typeof obj.timestamp !== "string" || !obj.timestamp) {
		return false;
	}

	if (typeof obj.page_url !== "string" || !obj.page_url) {
		return false;
	}

	// Optional fields validation
	if (obj.user_agent !== undefined && typeof obj.user_agent !== "string") {
		return false;
	}

	if (
		obj.viewport_width !== undefined &&
		(typeof obj.viewport_width !== "number" || obj.viewport_width < 0)
	) {
		return false;
	}

	if (
		obj.viewport_height !== undefined &&
		(typeof obj.viewport_height !== "number" || obj.viewport_height < 0)
	) {
		return false;
	}

	if (obj.element_tag !== undefined && typeof obj.element_tag !== "string") {
		return false;
	}

	if (
		obj.element_class !== undefined &&
		typeof obj.element_class !== "string"
	) {
		return false;
	}

	if (obj.element_id !== undefined && typeof obj.element_id !== "string") {
		return false;
	}

	if (obj.element_text !== undefined && typeof obj.element_text !== "string") {
		return false;
	}

	if (
		obj.scroll_percent !== undefined &&
		(typeof obj.scroll_percent !== "number" ||
			obj.scroll_percent < 0 ||
			obj.scroll_percent > 100)
	) {
		return false;
	}

	return true;
}

/**
 * Type guard to check if an object is a valid StoredEvent
 */
export function isStoredEvent(obj: any): obj is StoredEvent {
	if (!obj || typeof obj !== "object") {
		return false;
	}

	// Required fields
	if (typeof obj.guest_id !== "string" || !obj.guest_id) {
		return false;
	}

	if (typeof obj.event_timestamp !== "string" || !obj.event_timestamp) {
		return false;
	}

	if (typeof obj.event_type !== "string" || !obj.event_type) {
		return false;
	}

	if (typeof obj.event_id !== "string" || !obj.event_id) {
		return false;
	}

	if (typeof obj.page_url !== "string" || !obj.page_url) {
		return false;
	}

	if (typeof obj.created_at !== "string" || !obj.created_at) {
		return false;
	}

	return true;
}

/**
 * Validation schema for UserEvent
 */
export function validateUserEvent(event: any): EventValidationResult {
	const errors: string[] = [];

	if (!isValidEventType(event?.event_type)) {
		errors.push(
			`Invalid event_type. Must be one of: ${Object.values(EVENT_TYPES).join(", ")}`,
		);
	}

	if (!event?.timestamp || typeof event.timestamp !== "string") {
		errors.push("timestamp is required and must be a string");
	} else {
		// Validate ISO 8601 format
		const date = new Date(event.timestamp);
		if (isNaN(date.getTime())) {
			errors.push("timestamp must be a valid ISO 8601 date string");
		}
	}

	if (!event?.page_url || typeof event.page_url !== "string") {
		errors.push("page_url is required and must be a string");
	} else if (event.page_url.length > EVENT_VALIDATION.MAX_URL_LENGTH) {
		errors.push(
			`page_url must not exceed ${EVENT_VALIDATION.MAX_URL_LENGTH} characters`,
		);
	}

	// Optional field validations
	if (
		event?.user_agent &&
		(typeof event.user_agent !== "string" ||
			event.user_agent.length > EVENT_VALIDATION.MAX_TEXT_LENGTH)
	) {
		errors.push(
			`user_agent must be a string not exceeding ${EVENT_VALIDATION.MAX_TEXT_LENGTH} characters`,
		);
	}

	if (event?.viewport_width !== undefined) {
		if (
			typeof event.viewport_width !== "number" ||
			event.viewport_width < EVENT_VALIDATION.MIN_VIEWPORT_SIZE ||
			event.viewport_width > EVENT_VALIDATION.MAX_VIEWPORT_SIZE
		) {
			errors.push(
				`viewport_width must be a number between ${EVENT_VALIDATION.MIN_VIEWPORT_SIZE} and ${EVENT_VALIDATION.MAX_VIEWPORT_SIZE}`,
			);
		}
	}

	if (event?.viewport_height !== undefined) {
		if (
			typeof event.viewport_height !== "number" ||
			event.viewport_height < EVENT_VALIDATION.MIN_VIEWPORT_SIZE ||
			event.viewport_height > EVENT_VALIDATION.MAX_VIEWPORT_SIZE
		) {
			errors.push(
				`viewport_height must be a number between ${EVENT_VALIDATION.MIN_VIEWPORT_SIZE} and ${EVENT_VALIDATION.MAX_VIEWPORT_SIZE}`,
			);
		}
	}

	if (
		event?.element_tag &&
		(typeof event.element_tag !== "string" ||
			event.element_tag.length > EVENT_VALIDATION.MAX_TAG_LENGTH)
	) {
		errors.push(
			`element_tag must be a string not exceeding ${EVENT_VALIDATION.MAX_TAG_LENGTH} characters`,
		);
	}

	if (
		event?.element_class &&
		(typeof event.element_class !== "string" ||
			event.element_class.length > EVENT_VALIDATION.MAX_CLASS_LENGTH)
	) {
		errors.push(
			`element_class must be a string not exceeding ${EVENT_VALIDATION.MAX_CLASS_LENGTH} characters`,
		);
	}

	if (
		event?.element_id &&
		(typeof event.element_id !== "string" ||
			event.element_id.length > EVENT_VALIDATION.MAX_ID_LENGTH)
	) {
		errors.push(
			`element_id must be a string not exceeding ${EVENT_VALIDATION.MAX_ID_LENGTH} characters`,
		);
	}

	if (
		event?.element_text &&
		(typeof event.element_text !== "string" ||
			event.element_text.length > EVENT_VALIDATION.MAX_TEXT_LENGTH)
	) {
		errors.push(
			`element_text must be a string not exceeding ${EVENT_VALIDATION.MAX_TEXT_LENGTH} characters`,
		);
	}

	if (event?.scroll_percent !== undefined) {
		if (
			typeof event.scroll_percent !== "number" ||
			event.scroll_percent < EVENT_VALIDATION.MIN_SCROLL_PERCENT ||
			event.scroll_percent > EVENT_VALIDATION.MAX_SCROLL_PERCENT
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
export function validateStoredEvent(event: any): EventValidationResult {
	const errors: string[] = [];

	if (!event?.guest_id || typeof event.guest_id !== "string") {
		errors.push("guest_id is required and must be a string");
	} else {
		// Validate UUID v4 format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(event.guest_id)) {
			errors.push("guest_id must be a valid UUID v4");
		}
	}

	if (!event?.event_timestamp || typeof event.event_timestamp !== "string") {
		errors.push("event_timestamp is required and must be a string");
	} else {
		const date = new Date(event.event_timestamp);
		if (isNaN(date.getTime())) {
			errors.push("event_timestamp must be a valid ISO 8601 date string");
		}
	}

	if (!event?.event_type || typeof event.event_type !== "string") {
		errors.push("event_type is required and must be a string");
	}

	if (!event?.event_id || typeof event.event_id !== "string") {
		errors.push("event_id is required and must be a string");
	} else {
		// Validate UUID format
		const uuidRegex =
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(event.event_id)) {
			errors.push("event_id must be a valid UUID");
		}
	}

	if (!event?.page_url || typeof event.page_url !== "string") {
		errors.push("page_url is required and must be a string");
	} else if (event.page_url.length > EVENT_VALIDATION.MAX_URL_LENGTH) {
		errors.push(
			`page_url must not exceed ${EVENT_VALIDATION.MAX_URL_LENGTH} characters`,
		);
	}

	if (!event?.created_at || typeof event.created_at !== "string") {
		errors.push("created_at is required and must be a string");
	} else {
		const date = new Date(event.created_at);
		if (isNaN(date.getTime())) {
			errors.push("created_at must be a valid ISO 8601 date string");
		}
	}

	if (
		event?.ttl !== undefined &&
		(typeof event.ttl !== "number" || event.ttl < 0)
	) {
		errors.push("ttl must be a positive number");
	}

	return {
		isValid: errors.length === 0,
		errors: errors.length > 0 ? errors : undefined,
	};
}
