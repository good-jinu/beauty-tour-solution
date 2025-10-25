/**
 * Utility functions for timestamp generation and formatting
 */

/**
 * Generate current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
	return new Date().toISOString();
}

/**
 * Generate timestamp for a specific date
 */
export function getTimestamp(date: Date): string {
	return date.toISOString();
}

/**
 * Parse ISO timestamp to Date object
 */
export function parseTimestamp(timestamp: string): Date {
	const date = new Date(timestamp);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid timestamp format: ${timestamp}`);
	}
	return date;
}

/**
 * Check if a timestamp is valid ISO format
 */
export function isValidTimestamp(timestamp: string): boolean {
	try {
		const date = new Date(timestamp);
		return !Number.isNaN(date.getTime()) && timestamp === date.toISOString();
	} catch {
		return false;
	}
}

/**
 * Generate TTL timestamp (Unix timestamp in seconds)
 * @param daysFromNow Number of days from now for TTL expiration
 */
export function generateTTL(daysFromNow: number = 365): number {
	const now = new Date();
	const ttlDate = new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000);
	return Math.floor(ttlDate.getTime() / 1000);
}

/**
 * Generate TTL from a specific date
 * @param fromDate Base date for TTL calculation
 * @param daysFromDate Number of days from the base date
 */
export function generateTTLFromDate(
	fromDate: Date,
	daysFromDate: number = 365,
): number {
	const ttlDate = new Date(
		fromDate.getTime() + daysFromDate * 24 * 60 * 60 * 1000,
	);
	return Math.floor(ttlDate.getTime() / 1000);
}

/**
 * Convert Unix timestamp (seconds) to Date object
 */
export function ttlToDate(ttl: number): Date {
	return new Date(ttl * 1000);
}

/**
 * Check if a TTL timestamp has expired
 */
export function isTTLExpired(ttl: number): boolean {
	const now = Math.floor(Date.now() / 1000);
	return ttl <= now;
}

/**
 * Format timestamp for display purposes
 */
export function formatTimestamp(
	timestamp: string,
	options?: Intl.DateTimeFormatOptions,
): string {
	const date = parseTimestamp(timestamp);
	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		timeZoneName: "short",
	};

	return date.toLocaleDateString("en-US", { ...defaultOptions, ...options });
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function getRelativeTime(timestamp: string): string {
	const date = parseTimestamp(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSeconds < 60) {
		return "just now";
	} else if (diffMinutes < 60) {
		return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
	} else if (diffHours < 24) {
		return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
	} else if (diffDays < 30) {
		return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
	} else {
		return formatTimestamp(timestamp, {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}
}

/**
 * Create a timestamp range for querying
 */
export interface TimestampRange {
	start: string;
	end: string;
}

/**
 * Generate timestamp range for a specific period
 */
export function getTimestampRange(
	period: "today" | "week" | "month" | "year" | { days: number },
	baseDate: Date = new Date(),
): TimestampRange {
	const base = new Date(baseDate);
	base.setHours(0, 0, 0, 0); // Start of day

	let start: Date;
	let end: Date;

	switch (period) {
		case "today":
			start = new Date(base);
			end = new Date(base);
			end.setDate(end.getDate() + 1);
			break;
		case "week":
			start = new Date(base);
			start.setDate(start.getDate() - start.getDay()); // Start of week (Sunday)
			end = new Date(start);
			end.setDate(end.getDate() + 7);
			break;
		case "month":
			start = new Date(base.getFullYear(), base.getMonth(), 1);
			end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
			break;
		case "year":
			start = new Date(base.getFullYear(), 0, 1);
			end = new Date(base.getFullYear() + 1, 0, 1);
			break;
		default:
			if (typeof period === "object" && "days" in period) {
				start = new Date(base);
				start.setDate(start.getDate() - period.days);
				end = new Date(base);
				end.setDate(end.getDate() + 1);
			} else {
				throw new Error(`Invalid period: ${period}`);
			}
	}

	return {
		start: start.toISOString(),
		end: end.toISOString(),
	};
}

/**
 * Validate timestamp is within acceptable range
 */
export function validateTimestampRange(
	timestamp: string,
	minDate?: Date,
	maxDate?: Date,
): boolean {
	const date = parseTimestamp(timestamp);

	if (minDate && date < minDate) {
		return false;
	}

	if (maxDate && date > maxDate) {
		return false;
	}

	return true;
}
