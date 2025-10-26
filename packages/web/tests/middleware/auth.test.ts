import type { Cookies } from "@sveltejs/kit";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthMiddleware } from "../../src/lib/server/middleware/auth";
import { isValidUUID } from "../../src/lib/utils/guest";

// Mock SvelteKit cookies interface
interface MockCookieOptions {
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: boolean | "strict" | "lax" | "none";
	maxAge?: number;
	path?: string;
	domain?: string;
}

class MockCookies implements Cookies {
	private cookies: Map<string, string> = new Map();
	private cookieOptions: Map<string, MockCookieOptions> = new Map();

	get(name: string): string | undefined {
		return this.cookies.get(name);
	}

	set(name: string, value: string, options?: MockCookieOptions): void {
		this.cookies.set(name, value);
		if (options) {
			this.cookieOptions.set(name, options);
		}
	}

	delete(name: string, _options?: MockCookieOptions): void {
		this.cookies.delete(name);
		this.cookieOptions.delete(name);
	}

	getOptions(name: string): MockCookieOptions | undefined {
		return this.cookieOptions.get(name);
	}

	getAll(): Array<{ name: string; value: string }> {
		return Array.from(this.cookies.entries()).map(([name, value]) => ({
			name,
			value,
		}));
	}

	serialize(name: string, value: string, _options?: MockCookieOptions): string {
		// Simple mock implementation
		return `${name}=${value}`;
	}

	clear(): void {
		this.cookies.clear();
		this.cookieOptions.clear();
	}
}

describe("AuthMiddleware", () => {
	let authMiddleware: AuthMiddleware;
	let mockCookies: MockCookies;

	beforeEach(() => {
		authMiddleware = new AuthMiddleware(false); // Development mode
		mockCookies = new MockCookies();
	});

	describe("createGuestId", () => {
		it("should create a valid UUID v4", () => {
			const guestId = authMiddleware.createGuestId();
			expect(isValidUUID(guestId)).toBe(true);
		});

		it("should create unique guest IDs", () => {
			const id1 = authMiddleware.createGuestId();
			const id2 = authMiddleware.createGuestId();
			expect(id1).not.toBe(id2);
		});
	});

	describe("setGuestIdCookie", () => {
		it("should set cookie with valid guest ID", () => {
			const guestId = authMiddleware.createGuestId();

			authMiddleware.setGuestIdCookie(mockCookies, guestId);

			expect(mockCookies.get("beauty-tour-guest-id")).toBe(guestId);
		});

		it("should set cookie with correct security options in development", () => {
			const guestId = authMiddleware.createGuestId();

			authMiddleware.setGuestIdCookie(mockCookies, guestId);

			const options = mockCookies.getOptions("beauty-tour-guest-id");
			expect(options).toBeDefined();
			expect(options?.httpOnly).toBe(true);
			expect(options?.secure).toBe(false); // Development mode
			expect(options?.sameSite).toBe("lax");
			expect(options?.path).toBe("/");
			expect(options?.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
		});

		it("should throw error for invalid guest ID", () => {
			const invalidGuestId = "invalid-uuid";

			expect(() => {
				authMiddleware.setGuestIdCookie(mockCookies, invalidGuestId);
			}).toThrow("Invalid guest ID format");
		});
	});

	describe("validateGuestId", () => {
		it("should return existing valid guest ID", () => {
			const existingGuestId = authMiddleware.createGuestId();
			mockCookies.set("beauty-tour-guest-id", existingGuestId);

			const result = authMiddleware.validateGuestId(mockCookies);

			expect(result.guestId).toBe(existingGuestId);
			expect(result.isNewGuest).toBe(false);
		});

		it("should create new guest ID when none exists", () => {
			const result = authMiddleware.validateGuestId(mockCookies);

			expect(isValidUUID(result.guestId)).toBe(true);
			expect(result.isNewGuest).toBe(true);
			expect(mockCookies.get("beauty-tour-guest-id")).toBe(result.guestId);
		});

		it("should create new guest ID when existing is invalid", () => {
			mockCookies.set("beauty-tour-guest-id", "invalid-uuid");

			const result = authMiddleware.validateGuestId(mockCookies);

			expect(isValidUUID(result.guestId)).toBe(true);
			expect(result.isNewGuest).toBe(true);
			expect(mockCookies.get("beauty-tour-guest-id")).toBe(result.guestId);
		});
	});

	describe("regenerateGuestId", () => {
		it("should create new guest ID and update cookie", () => {
			const oldGuestId = authMiddleware.createGuestId();
			mockCookies.set("beauty-tour-guest-id", oldGuestId);

			const newGuestId = authMiddleware.regenerateGuestId(mockCookies);

			expect(isValidUUID(newGuestId)).toBe(true);
			expect(newGuestId).not.toBe(oldGuestId);
			expect(mockCookies.get("beauty-tour-guest-id")).toBe(newGuestId);
		});
	});

	describe("clearGuestId", () => {
		it("should clear guest ID cookie", () => {
			const guestId = authMiddleware.createGuestId();
			mockCookies.set("beauty-tour-guest-id", guestId);

			authMiddleware.clearGuestId(mockCookies);

			expect(mockCookies.get("beauty-tour-guest-id")).toBeUndefined();
		});
	});

	describe("production mode", () => {
		it("should set secure flag in production", () => {
			const prodAuthMiddleware = new AuthMiddleware(true);
			const guestId = prodAuthMiddleware.createGuestId();

			prodAuthMiddleware.setGuestIdCookie(mockCookies, guestId);

			const options = mockCookies.getOptions("beauty-tour-guest-id");
			expect(options).toBeDefined();
			expect(options?.secure).toBe(true);
		});
	});
});
