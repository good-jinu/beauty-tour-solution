/**
 * Server-side configuration management for event tracking
 */

import { env } from "$env/dynamic/private";

/**
 * Server-side event tracking configuration interface
 */
export interface ServerEventTrackingConfig {
	// Feature flags
	enabled: boolean;
	batchingEnabled: boolean;

	// Performance settings
	batchSize: number;
	batchTimeout: number;
	rateLimitPerMinute: number;

	// Cookie configuration
	guestCookieMaxAge: number;
	guestCookieSecure: boolean;
	guestCookieSameSite: "strict" | "lax" | "none";

	// Database configuration
	eventsTableName: string;
	awsRegion: string;

	// Privacy and security
	enableOptOut: boolean;
	sanitizeData: boolean;
	logLevel: "debug" | "info" | "warn" | "error";
}

/**
 * Default server configuration values
 */
const DEFAULT_SERVER_CONFIG: ServerEventTrackingConfig = {
	enabled: true,
	batchingEnabled: true,
	batchSize: 10,
	batchTimeout: 5000,
	rateLimitPerMinute: 100,
	guestCookieMaxAge: 2592000, // 30 days
	guestCookieSecure: true,
	guestCookieSameSite: "lax",
	eventsTableName: "BeautyTourEvents",
	awsRegion: "us-east-1",
	enableOptOut: true,
	sanitizeData: true,
	logLevel: "info",
};

/**
 * Parse boolean from environment variable
 */
function parseBoolean(
	value: string | undefined,
	defaultValue: boolean,
): boolean {
	if (!value) return defaultValue;
	return value.toLowerCase() === "true";
}

/**
 * Parse number from environment variable
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
	if (!value) return defaultValue;
	const parsed = parseInt(value, 10);
	return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse string from environment variable with validation
 */
function parseString<T extends string>(
	value: string | undefined,
	defaultValue: T,
	validValues?: T[],
): T {
	if (!value) return defaultValue;
	if (validValues && !validValues.includes(value as T)) {
		console.warn(
			`Invalid config value "${value}", using default "${defaultValue}"`,
		);
		return defaultValue;
	}
	return value as T;
}

/**
 * Get server-side event tracking configuration from environment variables
 */
export function getServerEventTrackingConfig(): ServerEventTrackingConfig {
	return {
		enabled: parseBoolean(
			env.EVENT_TRACKING_ENABLED,
			DEFAULT_SERVER_CONFIG.enabled,
		),
		batchingEnabled: parseBoolean(
			env.EVENT_BATCHING_ENABLED,
			DEFAULT_SERVER_CONFIG.batchingEnabled,
		),
		batchSize: parseNumber(
			env.EVENT_BATCH_SIZE,
			DEFAULT_SERVER_CONFIG.batchSize,
		),
		batchTimeout: parseNumber(
			env.EVENT_BATCH_TIMEOUT,
			DEFAULT_SERVER_CONFIG.batchTimeout,
		),
		rateLimitPerMinute: parseNumber(
			env.RATE_LIMIT_PER_MINUTE,
			DEFAULT_SERVER_CONFIG.rateLimitPerMinute,
		),
		guestCookieMaxAge: parseNumber(
			env.GUEST_COOKIE_MAX_AGE,
			DEFAULT_SERVER_CONFIG.guestCookieMaxAge,
		),
		guestCookieSecure: parseBoolean(
			env.GUEST_COOKIE_SECURE,
			DEFAULT_SERVER_CONFIG.guestCookieSecure,
		),
		guestCookieSameSite: parseString(
			env.GUEST_COOKIE_SAME_SITE,
			DEFAULT_SERVER_CONFIG.guestCookieSameSite,
			["strict", "lax", "none"],
		),
		eventsTableName:
			env.EVENTS_TABLE_NAME || DEFAULT_SERVER_CONFIG.eventsTableName,
		awsRegion: env.APP_AWS_REGION || DEFAULT_SERVER_CONFIG.awsRegion,
		enableOptOut: parseBoolean(
			env.EVENT_TRACKING_ENABLE_OPT_OUT,
			DEFAULT_SERVER_CONFIG.enableOptOut,
		),
		sanitizeData: parseBoolean(
			env.EVENT_TRACKING_SANITIZE_DATA,
			DEFAULT_SERVER_CONFIG.sanitizeData,
		),
		logLevel: parseString(
			env.EVENT_TRACKING_LOG_LEVEL,
			DEFAULT_SERVER_CONFIG.logLevel,
			["debug", "info", "warn", "error"],
		),
	};
}

/**
 * Validate server configuration
 */
export function validateServerConfig(config: ServerEventTrackingConfig): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (config.batchSize <= 0) {
		errors.push("Batch size must be greater than 0");
	}

	if (config.batchTimeout <= 0) {
		errors.push("Batch timeout must be greater than 0");
	}

	if (config.rateLimitPerMinute <= 0) {
		errors.push("Rate limit must be greater than 0");
	}

	if (config.guestCookieMaxAge <= 0) {
		errors.push("Guest cookie max age must be greater than 0");
	}

	if (!config.eventsTableName) {
		errors.push("Events table name is required");
	}

	if (!config.awsRegion) {
		errors.push("AWS region is required");
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Get client-safe configuration (excludes sensitive server-only settings)
 */
export function getClientSafeConfig(serverConfig: ServerEventTrackingConfig) {
	return {
		enabled: serverConfig.enabled,
		batchingEnabled: serverConfig.batchingEnabled,
		batchSize: serverConfig.batchSize,
		batchTimeout: serverConfig.batchTimeout,
		enableOptOut: serverConfig.enableOptOut,
	};
}
