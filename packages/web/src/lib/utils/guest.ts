/**
 * Guest ID management utilities for cookie-based user identification
 */

import { browser } from "$app/environment";

const GUEST_ID_COOKIE_NAME = "beauty-tour-guest-id";
const GUEST_ID_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Cookie configuration interface
 */
export interface GuestCookieOptions {
	name: string;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: "strict" | "lax" | "none";
	maxAge?: number;
	path?: string;
}

/**
 * Generates a new UUID v4 using the Web Crypto API
 */
export function generateUUID(): string {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}

	// Fallback for environments without crypto.randomUUID
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Validates if a string is a valid UUID v4
 * @param uuid The string to validate
 * @returns True if valid UUID v4, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(uuid);
}

/**
 * Gets the default cookie options for guest ID cookies
 * @param isProduction Whether we're in production environment
 * @returns Cookie options object
 */
export function getGuestCookieOptions(
	isProduction: boolean = false,
): GuestCookieOptions {
	return {
		name: GUEST_ID_COOKIE_NAME,
		httpOnly: true,
		secure: isProduction,
		sameSite: "lax",
		maxAge: GUEST_ID_MAX_AGE,
		path: "/",
	};
}

/**
 * Parses cookies from a cookie string (client-side)
 * @param cookieString The document.cookie string
 * @returns Object with cookie name-value pairs
 */
function parseCookies(cookieString: string): Record<string, string> {
	const cookies: Record<string, string> = {};

	if (!cookieString) {
		return cookies;
	}

	cookieString.split(";").forEach((cookie) => {
		const [name, ...rest] = cookie.trim().split("=");
		if (name && rest.length > 0) {
			cookies[name] = decodeURIComponent(rest.join("="));
		}
	});

	return cookies;
}

/**
 * Retrieves the guest ID from cookies (client-side only)
 * @returns The guest ID if it exists and is valid, null otherwise
 */
export function getGuestIdFromCookies(): string | null {
	if (!browser || typeof document === "undefined") {
		return null;
	}

	try {
		const cookies = parseCookies(document.cookie);
		const guestId = cookies[GUEST_ID_COOKIE_NAME];

		if (guestId && isValidUUID(guestId)) {
			return guestId;
		}

		return null;
	} catch (error) {
		console.error("Error retrieving guest ID from cookies:", error);
		return null;
	}
}

/**
 * Sets a cookie (client-side only, limited functionality)
 * Note: This is for client-side fallback only. Server-side cookie setting is preferred.
 * @param name Cookie name
 * @param value Cookie value
 * @param options Cookie options
 */
export function setClientCookie(
	name: string,
	value: string,
	options: Partial<GuestCookieOptions> = {},
): void {
	if (!browser || typeof document === "undefined") {
		return;
	}

	try {
		let cookieString = `${name}=${encodeURIComponent(value)}`;

		if (options.maxAge) {
			cookieString += `; Max-Age=${options.maxAge}`;
		}

		if (options.path) {
			cookieString += `; Path=${options.path}`;
		}

		if (options.sameSite) {
			cookieString += `; SameSite=${options.sameSite}`;
		}

		if (options.secure) {
			cookieString += `; Secure`;
		}

		// Note: HttpOnly cannot be set from client-side JavaScript
		document.cookie = cookieString;
	} catch (error) {
		console.error("Error setting client cookie:", error);
	}
}

/**
 * Gets the existing guest ID from cookies or creates a new one
 * Note: This is client-side only and has limitations. Server-side handling is preferred.
 * @returns A valid guest ID
 */
export function getOrCreateGuestId(): string {
	// First try to get existing guest ID from cookies
	const existingId = getGuestIdFromCookies();
	if (existingId) {
		return existingId;
	}

	// Generate new guest ID
	const newGuestId = generateUUID();

	// Try to set it as a cookie (client-side, limited functionality)
	if (browser) {
		const options = getGuestCookieOptions(false); // Assume dev environment for client-side
		setClientCookie(GUEST_ID_COOKIE_NAME, newGuestId, {
			maxAge: options.maxAge,
			path: options.path,
			sameSite: options.sameSite,
		});
	}

	return newGuestId;
}

/**
 * Clears the guest ID cookie (client-side)
 */
export function clearGuestId(): void {
	if (!browser || typeof document === "undefined") {
		return;
	}

	try {
		// Set cookie with past expiration date to delete it
		document.cookie = `${GUEST_ID_COOKIE_NAME}=; Max-Age=0; Path=/`;
	} catch (error) {
		console.error("Error clearing guest ID cookie:", error);
	}
}

/**
 * Checks if cookie functionality is available
 */
export function isGuestIdAvailable(): boolean {
	return browser && typeof document !== "undefined";
}

// Legacy function for backward compatibility
export function getGuestId(): string | null {
	return getGuestIdFromCookies();
}
