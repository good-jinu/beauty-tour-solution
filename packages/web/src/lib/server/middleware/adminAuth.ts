/**
 * Admin authentication middleware
 * Handles admin session management and route protection
 */

import type { Cookies } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { getServerEventTrackingConfig } from "$lib/config/server";

const ADMIN_SESSION_COOKIE_NAME = "beauty-tour-admin-session";
const ADMIN_PASSWORD = "admin123"; // In production, this should be from environment variables

/**
 * Interface for admin authentication result
 */
export interface AdminAuthResult {
	isAuthenticated: boolean;
	sessionId?: string;
}

/**
 * Interface for admin session cookie configuration
 */
export interface AdminSessionCookieConfig {
	name: string;
	httpOnly: boolean;
	secure: boolean;
	sameSite: "strict" | "lax" | "none";
	maxAge: number;
	path: string;
}

/**
 * Admin authentication middleware class
 */
export class AdminAuthMiddleware {
	private readonly cookieConfig: AdminSessionCookieConfig;
	private readonly activeSessions: Set<string> = new Set();

	constructor(isProduction: boolean = !dev) {
		const _serverConfig = getServerEventTrackingConfig();

		this.cookieConfig = {
			name: ADMIN_SESSION_COOKIE_NAME,
			httpOnly: true,
			secure: isProduction,
			sameSite: "lax",
			maxAge: 24 * 60 * 60, // 24 hours
			path: "/admin",
		};
	}

	/**
	 * Generates a new session ID
	 */
	private generateSessionId(): string {
		return crypto.randomUUID();
	}

	/**
	 * Validates admin credentials
	 */
	validateCredentials(password: string): boolean {
		// In production, this should use proper password hashing
		return password === ADMIN_PASSWORD;
	}

	/**
	 * Creates a new admin session
	 */
	createSession(cookies: Cookies): string {
		const sessionId = this.generateSessionId();
		this.activeSessions.add(sessionId);

		cookies.set(this.cookieConfig.name, sessionId, {
			httpOnly: this.cookieConfig.httpOnly,
			secure: this.cookieConfig.secure,
			sameSite: this.cookieConfig.sameSite,
			maxAge: this.cookieConfig.maxAge,
			path: this.cookieConfig.path,
		});

		return sessionId;
	}

	/**
	 * Validates admin session
	 */
	validateSession(cookies: Cookies): AdminAuthResult {
		try {
			const sessionId = cookies.get(this.cookieConfig.name);

			if (!sessionId || !this.activeSessions.has(sessionId)) {
				return { isAuthenticated: false };
			}

			return {
				isAuthenticated: true,
				sessionId,
			};
		} catch (error) {
			console.error("Error validating admin session:", error);
			return { isAuthenticated: false };
		}
	}

	/**
	 * Destroys admin session
	 */
	destroySession(cookies: Cookies): void {
		try {
			const sessionId = cookies.get(this.cookieConfig.name);

			if (sessionId) {
				this.activeSessions.delete(sessionId);
			}

			cookies.delete(this.cookieConfig.name, {
				path: this.cookieConfig.path,
			});
		} catch (error) {
			console.error("Error destroying admin session:", error);
		}
	}

	/**
	 * Middleware function to protect admin routes
	 */
	requireAuth(cookies: Cookies): AdminAuthResult {
		return this.validateSession(cookies);
	}
}

/**
 * Default admin auth middleware instance
 */
export const adminAuthMiddleware = new AdminAuthMiddleware();

/**
 * Convenience function for validating admin authentication
 */
export function validateAdminAuth(cookies: Cookies): AdminAuthResult {
	return adminAuthMiddleware.validateSession(cookies);
}

/**
 * Convenience function for creating admin session
 */
export function createAdminSession(cookies: Cookies): string {
	return adminAuthMiddleware.createSession(cookies);
}

/**
 * Convenience function for destroying admin session
 */
export function destroyAdminSession(cookies: Cookies): void {
	adminAuthMiddleware.destroySession(cookies);
}

/**
 * Convenience function for validating admin credentials
 */
export function validateAdminCredentials(password: string): boolean {
	return adminAuthMiddleware.validateCredentials(password);
}
