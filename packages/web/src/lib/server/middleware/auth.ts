/**
 * Authentication middleware for guest ID management
 * Handles cookie-based guest identification with proper security settings
 */

import type { Cookies } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { getServerEventTrackingConfig } from "$lib/config/server";
import {
	generateUUID,
	getGuestCookieOptions,
	isValidUUID,
} from "$lib/utils/guest";

const GUEST_ID_COOKIE_NAME = "beauty-tour-guest-id";

/**
 * Interface for the authentication middleware result
 */
export interface AuthResult {
	guestId: string;
	isNewGuest: boolean;
}

/**
 * Interface for guest ID cookie configuration
 */
export interface GuestIdCookieConfig {
	name: string;
	httpOnly: boolean;
	secure: boolean;
	sameSite: "strict" | "lax" | "none";
	maxAge: number;
	path: string;
}

/**
 * Authentication middleware class for managing guest IDs
 */
export class AuthMiddleware {
	private readonly cookieConfig: GuestIdCookieConfig;

	constructor(isProduction: boolean = !dev) {
		const serverConfig = getServerEventTrackingConfig();
		const options = getGuestCookieOptions(isProduction);

		this.cookieConfig = {
			name: options.name,
			httpOnly: options.httpOnly ?? true,
			secure: serverConfig.guestCookieSecure ?? isProduction,
			sameSite: serverConfig.guestCookieSameSite ?? "lax",
			maxAge: serverConfig.guestCookieMaxAge ?? 30 * 24 * 60 * 60,
			path: options.path ?? "/",
		};
	}

	/**
	 * Validates an existing guest ID from cookies
	 * @param cookies SvelteKit cookies object
	 * @returns Valid guest ID or null if invalid/missing
	 */
	private validateExistingGuestId(cookies: Cookies): string | null {
		try {
			const existingGuestId = cookies.get(GUEST_ID_COOKIE_NAME);

			if (!existingGuestId) {
				return null;
			}

			// Validate UUID format
			if (!isValidUUID(existingGuestId)) {
				console.warn(
					`Invalid guest ID format found in cookie: ${existingGuestId}`,
				);
				return null;
			}

			return existingGuestId;
		} catch (error) {
			console.error("Error validating existing guest ID:", error);
			return null;
		}
	}

	/**
	 * Creates a new guest ID
	 * @returns A new UUID v4 guest ID
	 */
	createGuestId(): string {
		return generateUUID();
	}

	/**
	 * Sets the guest ID cookie with appropriate security flags
	 * @param cookies SvelteKit cookies object
	 * @param guestId The guest ID to set
	 */
	setGuestIdCookie(cookies: Cookies, guestId: string): void {
		try {
			// Validate the guest ID before setting
			if (!isValidUUID(guestId)) {
				throw new Error(`Invalid guest ID format: ${guestId}`);
			}

			cookies.set(this.cookieConfig.name, guestId, {
				httpOnly: this.cookieConfig.httpOnly,
				secure: this.cookieConfig.secure,
				sameSite: this.cookieConfig.sameSite,
				maxAge: this.cookieConfig.maxAge,
				path: this.cookieConfig.path,
			});
		} catch (error) {
			console.error("Error setting guest ID cookie:", error);
			throw error;
		}
	}

	/**
	 * Validates and retrieves guest ID from cookies, creating a new one if necessary
	 * @param cookies SvelteKit cookies object
	 * @returns AuthResult containing guest ID and whether it's a new guest
	 */
	validateGuestId(cookies: Cookies): AuthResult {
		try {
			// Try to get existing valid guest ID
			const existingGuestId = this.validateExistingGuestId(cookies);

			if (existingGuestId) {
				return {
					guestId: existingGuestId,
					isNewGuest: false,
				};
			}

			// Create new guest ID if none exists or existing is invalid
			const newGuestId = this.createGuestId();
			this.setGuestIdCookie(cookies, newGuestId);

			return {
				guestId: newGuestId,
				isNewGuest: true,
			};
		} catch (error) {
			console.error("Error in validateGuestId:", error);

			// Fallback: create a new guest ID even if cookie setting fails
			const fallbackGuestId = this.createGuestId();

			try {
				this.setGuestIdCookie(cookies, fallbackGuestId);
			} catch (cookieError) {
				console.error("Failed to set fallback guest ID cookie:", cookieError);
				// Continue with the fallback ID even if cookie setting fails
			}

			return {
				guestId: fallbackGuestId,
				isNewGuest: true,
			};
		}
	}

	/**
	 * Regenerates the guest ID (useful for security purposes)
	 * @param cookies SvelteKit cookies object
	 * @returns New guest ID
	 */
	regenerateGuestId(cookies: Cookies): string {
		const newGuestId = this.createGuestId();
		this.setGuestIdCookie(cookies, newGuestId);
		return newGuestId;
	}

	/**
	 * Clears the guest ID cookie
	 * @param cookies SvelteKit cookies object
	 */
	clearGuestId(cookies: Cookies): void {
		try {
			cookies.delete(this.cookieConfig.name, {
				path: this.cookieConfig.path,
			});
		} catch (error) {
			console.error("Error clearing guest ID cookie:", error);
			throw error;
		}
	}

	/**
	 * Gets the current cookie configuration
	 * @returns Current cookie configuration
	 */
	getCookieConfig(): GuestIdCookieConfig {
		return { ...this.cookieConfig };
	}
}

/**
 * Default auth middleware instance
 */
export const authMiddleware = new AuthMiddleware();

/**
 * Convenience function for validating guest ID in request handlers
 * @param cookies SvelteKit cookies object
 * @returns AuthResult containing guest ID and whether it's a new guest
 */
export function validateGuestId(cookies: Cookies): AuthResult {
	return authMiddleware.validateGuestId(cookies);
}

/**
 * Convenience function for creating a new guest ID
 * @returns New UUID v4 guest ID
 */
export function createGuestId(): string {
	return authMiddleware.createGuestId();
}

/**
 * Convenience function for setting guest ID cookie
 * @param cookies SvelteKit cookies object
 * @param guestId The guest ID to set
 */
export function setGuestIdCookie(cookies: Cookies, guestId: string): void {
	authMiddleware.setGuestIdCookie(cookies, guestId);
}
