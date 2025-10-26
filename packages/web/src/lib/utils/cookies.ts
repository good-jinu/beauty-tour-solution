/**
 * Modern cookie utility using Cookie Store API
 * Provides a consistent interface for cookie operations
 */

import { browser } from "$app/environment";

export interface CookieOptions {
	expires?: number | Date;
	maxAge?: number;
	path?: string;
	domain?: string;
	secure?: boolean;
	sameSite?: "strict" | "lax" | "none";
	partitioned?: boolean;
}

/**
 * Check if Cookie Store API is available
 */
function isCookieStoreAvailable(): boolean {
	return browser && typeof window !== "undefined" && "cookieStore" in window;
}

/**
 * Get a cookie value by name
 */
export async function getCookie(name: string): Promise<string | null> {
	if (!isCookieStoreAvailable()) {
		return null;
	}

	try {
		const cookie = await cookieStore.get(name);
		return cookie?.value || null;
	} catch (error) {
		console.error(`Error getting cookie ${name}:`, error);
		return null;
	}
}

/**
 * Set a cookie
 */
export async function setCookie(
	name: string,
	value: string,
	options: CookieOptions = {},
): Promise<boolean> {
	if (!isCookieStoreAvailable()) {
		return false;
	}

	try {
		const cookieInit: {
			name: string;
			value: string;
			expires?: number;
			path?: string;
			domain?: string;
			sameSite?: "strict" | "lax" | "none";
			partitioned?: boolean;
		} = {
			name,
			value,
		};

		if (options.expires) {
			if (options.expires instanceof Date) {
				cookieInit.expires = options.expires.getTime();
			} else {
				cookieInit.expires = options.expires;
			}
		} else if (options.maxAge) {
			cookieInit.expires = Date.now() + options.maxAge * 1000;
		}

		if (options.path) {
			cookieInit.path = options.path;
		}

		if (options.domain) {
			cookieInit.domain = options.domain;
		}

		if (options.sameSite) {
			cookieInit.sameSite = options.sameSite;
		}

		if (options.partitioned) {
			cookieInit.partitioned = options.partitioned;
		}

		await cookieStore.set(cookieInit);
		return true;
	} catch (error) {
		console.error(`Error setting cookie ${name}:`, error);
		return false;
	}
}

/**
 * Delete a cookie
 */
export async function deleteCookie(
	name: string,
	path?: string,
): Promise<boolean> {
	if (!isCookieStoreAvailable()) {
		return false;
	}

	try {
		const deleteOptions: {
			name: string;
			path?: string;
		} = { name };
		if (path) {
			deleteOptions.path = path;
		}
		await cookieStore.delete(deleteOptions);
		return true;
	} catch (error) {
		console.error(`Error deleting cookie ${name}:`, error);
		return false;
	}
}

/**
 * Get all cookies
 */
export async function getAllCookies(): Promise<Record<string, string>> {
	if (!isCookieStoreAvailable()) {
		return {};
	}

	try {
		const cookies = await cookieStore.getAll();
		const result: Record<string, string> = {};
		for (const cookie of cookies) {
			if (cookie.name) {
				result[cookie.name] = cookie.value ?? "";
			}
		}
		return result;
	} catch (error) {
		console.error("Error getting all cookies:", error);
		return {};
	}
}

/**
 * Check if cookies are supported
 */
export function areCookiesSupported(): boolean {
	return isCookieStoreAvailable();
}
