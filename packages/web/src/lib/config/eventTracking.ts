/**
 * Event tracking configuration for client-side usage
 */

import { browser } from "$app/environment";

/**
 * Event tracking configuration interface
 */
export interface ClientEventTrackingConfig {
	enabled: boolean;
	batchingEnabled: boolean;
	batchSize: number;
	batchTimeout: number;
	apiEndpoint: string;
	maxRetries: number;
	retryDelay: number;
	scrollThrottleMs: number;
	clickDebounceMs: number;
	enableOptOut: boolean;
	optOutCookieName: string;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: ClientEventTrackingConfig = {
	enabled: true,
	batchingEnabled: true,
	batchSize: 10,
	batchTimeout: 5000,
	apiEndpoint: "/api/events",
	maxRetries: 3,
	retryDelay: 1000,
	scrollThrottleMs: 250,
	clickDebounceMs: 100,
	enableOptOut: true,
	optOutCookieName: "beauty-tour-opt-out",
};

/**
 * Get event tracking configuration from server-provided data
 * Configuration is passed from server to client via global window object
 */
function getConfigFromServer(): Partial<ClientEventTrackingConfig> {
	if (!browser || typeof window === "undefined") {
		return {};
	}

	const config: Partial<ClientEventTrackingConfig> = {};

	// Read from global config object set by the server
	const globalConfig = (window as any).__EVENT_TRACKING_CONFIG__;
	if (globalConfig && typeof globalConfig === "object") {
		if (typeof globalConfig.enabled === "boolean") {
			config.enabled = globalConfig.enabled;
		}
		if (typeof globalConfig.batchingEnabled === "boolean") {
			config.batchingEnabled = globalConfig.batchingEnabled;
		}
		if (
			typeof globalConfig.batchSize === "number" &&
			globalConfig.batchSize > 0
		) {
			config.batchSize = globalConfig.batchSize;
		}
		if (
			typeof globalConfig.batchTimeout === "number" &&
			globalConfig.batchTimeout > 0
		) {
			config.batchTimeout = globalConfig.batchTimeout;
		}
		if (typeof globalConfig.enableOptOut === "boolean") {
			config.enableOptOut = globalConfig.enableOptOut;
		}
	}

	return config;
}

/**
 * Get the complete event tracking configuration
 */
export function getEventTrackingConfig(): ClientEventTrackingConfig {
	const serverConfig = getConfigFromServer();
	return { ...DEFAULT_CONFIG, ...serverConfig };
}

/**
 * Check if user has opted out of tracking
 */
export function hasUserOptedOut(): boolean {
	if (!browser || typeof document === "undefined") {
		return false;
	}

	const config = getEventTrackingConfig();
	if (!config.enableOptOut) {
		return false;
	}

	// Check for opt-out cookie
	const cookies = document.cookie.split(";");
	for (const cookie of cookies) {
		const [name, value] = cookie.trim().split("=");
		if (name === config.optOutCookieName && value === "true") {
			return true;
		}
	}

	return false;
}

/**
 * Check if event tracking is enabled and user hasn't opted out
 */
export function isEventTrackingEnabled(): boolean {
	const config = getEventTrackingConfig();
	return config.enabled && browser && !hasUserOptedOut();
}

/**
 * Opt user out of event tracking
 */
export function optOutOfTracking(): void {
	if (!browser || typeof document === "undefined") {
		return;
	}

	const config = getEventTrackingConfig();
	if (!config.enableOptOut) {
		console.warn("Opt-out is not enabled in configuration");
		return;
	}

	// Set opt-out cookie
	const maxAge = 365 * 24 * 60 * 60; // 1 year
	document.cookie = `${config.optOutCookieName}=true; Max-Age=${maxAge}; Path=/; SameSite=Lax`;

	// Clear any existing tracking data
	if (typeof window !== "undefined" && (window as any).__eventLogger) {
		(window as any).__eventLogger.disable();
	}
}

/**
 * Opt user back into event tracking
 */
export function optInToTracking(): void {
	if (!browser || typeof document === "undefined") {
		return;
	}

	const config = getEventTrackingConfig();

	// Remove opt-out cookie
	document.cookie = `${config.optOutCookieName}=; Max-Age=0; Path=/; SameSite=Lax`;

	// Re-enable tracking if available
	if (typeof window !== "undefined" && (window as any).__eventLogger) {
		(window as any).__eventLogger.enable();
	}
}

/**
 * Get configuration for the EventLogger class
 */
export function getEventLoggerConfig() {
	const config = getEventTrackingConfig();

	return {
		apiEndpoint: config.apiEndpoint,
		batchSize: config.batchingEnabled ? config.batchSize : 1,
		batchTimeout: config.batchTimeout,
		maxRetries: config.maxRetries,
		retryDelay: config.retryDelay,
		scrollThrottleMs: config.scrollThrottleMs,
		clickDebounceMs: config.clickDebounceMs,
		enabled: config.enabled,
	};
}
