/**
 * Guest ID management utilities for cookie-based user identification
 */

import { browser } from "$app/environment";
import {
	areCookiesSupported,
	deleteCookie,
	getCookie,
	setCookie,
} from "./cookies";

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
 * Retrieves the guest ID from cookies (client-side only)
 * @returns The guest ID if it exists and is valid, null otherwise
 */
export async function getGuestIdFromCookies(): Promise<string | null> {
	if (!browser) {
		return null;
	}

	try {
		const guestId = await getCookie(GUEST_ID_COOKIE_NAME);

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
export async function setClientCookie(
	name: string,
	value: string,
	options: Partial<GuestCookieOptions> = {},
): Promise<boolean> {
	if (!browser) {
		return false;
	}

	return await setCookie(name, value, {
		maxAge: options.maxAge,
		path: options.path,
		sameSite: options.sameSite,
		secure: options.secure,
	});
}

/**
 * Gets the existing guest ID from cookies or creates a new one
 * Note: This is client-side only and has limitations. Server-side handling is preferred.
 * @returns A valid guest ID
 */
export async function getOrCreateGuestId(): Promise<string> {
	// First try to get existing guest ID from cookies
	const existingId = await getGuestIdFromCookies();
	if (existingId) {
		return existingId;
	}

	// Generate new guest ID
	const newGuestId = generateUUID();

	// Try to set it as a cookie (client-side, limited functionality)
	if (browser) {
		const options = getGuestCookieOptions(false); // Assume dev environment for client-side
		const success = await setClientCookie(GUEST_ID_COOKIE_NAME, newGuestId, {
			maxAge: options.maxAge,
			path: options.path,
			sameSite: options.sameSite,
		});

		if (!success) {
			console.warn(
				"Failed to set guest ID cookie - Cookie Store API not available",
			);
		}
	}

	return newGuestId;
}

/**
 * Clears the guest ID cookie (client-side)
 */
export async function clearGuestId(): Promise<boolean> {
	if (!browser) {
		return false;
	}

	return await deleteCookie(GUEST_ID_COOKIE_NAME, "/");
}

/**
 * Checks if cookie functionality is available
 */
export function isGuestIdAvailable(): boolean {
	return browser && areCookiesSupported();
}

// Legacy function for backward compatibility
export async function getGuestId(): Promise<string | null> {
	return await getGuestIdFromCookies();
}
