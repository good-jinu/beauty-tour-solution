import { beforeEach, describe, expect, it } from "vitest";
import { AuthMiddleware } from "../../src/lib/server/middleware/auth";
import { isValidUUID } from "../../src/lib/utils/guest";

// Mock SvelteKit cookies interface
class MockCookies {
	private cookies: Map<string, string> = new Map();
	private cookieOptions: Map<string, any> = new Map();

	get(name: string): string | undefined {
		return this.cookies.get(name);
	}

	set(name: string, value: string, options?: any): void {
		this.cookies.set(name, value);
		if (options) {
			this.cookieOptions.set(name, options);
		}
	}

	delete(name: string, options?: any): void {
		this.cookies.delete(name);
		this.cookieOptions.delete(name);
	}

	getOptions(name: string): any {
		return this.cookieOptions.get(name);
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

			authMiddleware.setGuestIdCookie(mockCookies as any, guestId);

			expect(mockCookies.get("beauty-tour-guest-id")).toBe(guestId);
		});

		it("should set cookie with correct security options in development", () => {
			const guestId = authMiddleware.createGuestId();

			authMiddleware.setGuestIdCookie(mockCookies as any, guestId);

			const options = mockCookies.getOptions("beauty-tour-guest-id");
			expect(options.httpOnly).toBe(true);
			expect(options.secure).toBe(false); // Development mode
			expect(options.sameSite).toBe("lax");
			expect(options.path).toBe("/");
			expect(options.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
		});

		it("should throw error for invalid guest ID", () => {
			const invalidGuestId = "invalid-uuid";

			expect(() => {
				authMiddleware.setGuestIdCookie(mockCookies as any, invalidGuestId);
			}).toThrow("Invalid guest ID format");
		});
	});

	describe("validateGuestId", () => {
		it("should return existing valid guest ID", () => {
			const existingGuestId = authMiddleware.createGuestId();
			mockCookies.set("beauty-tour-guest-id", existingGuestId);

			const result = authMiddleware.validateGuestId(mockCookies as any);

			expect(result.guestId).toBe(existingGuestId);
			expect(result.isNewGuest).toBe(false);
		});

		it("should create new guest ID when none exists", () => {
			const result = authMiddleware.validateGuestId(mockCookies as any);

			expect(isValidUUID(result.guestId)).toBe(true);
			expect(result.isNewGuest).toBe(true);
			expect(mockCookies.get("beauty-tour-guest-id")).toBe(result.guestId);
		});

		it("should create new guest ID when existing is invalid", () => {
			mockCookies.set("beauty-tour-guest-id", "invalid-uuid");

			const result = authMiddleware.validateGuestId(mockCookies as any);

			expect(isValidUUID(result.guestId)).toBe(true);
			expect(result.isNewGuest).toBe(true);
			expect(mockCookies.get("beauty-tour-guest-id")).toBe(result.guestId);
		});
	});

	describe("regenerateGuestId", () => {
		it("should create new guest ID and update cookie", () => {
			const oldGuestId = authMiddleware.createGuestId();
			mockCookies.set("beauty-tour-guest-id", oldGuestId);

			const newGuestId = authMiddleware.regenerateGuestId(mockCookies as any);

			expect(isValidUUID(newGuestId)).toBe(true);
			expect(newGuestId).not.toBe(oldGuestId);
			expect(mockCookies.get("beauty-tour-guest-id")).toBe(newGuestId);
		});
	});

	describe("clearGuestId", () => {
		it("should clear guest ID cookie", () => {
			const guestId = authMiddleware.createGuestId();
			mockCookies.set("beauty-tour-guest-id", guestId);

			authMiddleware.clearGuestId(mockCookies as any);

			expect(mockCookies.get("beauty-tour-guest-id")).toBeUndefined();
		});
	});

	describe("production mode", () => {
		it("should set secure flag in production", () => {
			const prodAuthMiddleware = new AuthMiddleware(true);
			const guestId = prodAuthMiddleware.createGuestId();

			prodAuthMiddleware.setGuestIdCookie(mockCookies as any, guestId);

			const options = mockCookies.getOptions("beauty-tour-guest-id");
			expect(options.secure).toBe(true);
		});
	});
});
