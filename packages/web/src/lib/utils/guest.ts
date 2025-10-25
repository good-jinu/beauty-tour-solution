/**
 * Guest ID management utilities for localStorage-based user identification
 */

const GUEST_ID_KEY = "beauty-tour-guest-id";

/**
 * Generates a new UUID v4 using the Web Crypto API
 */
function generateUUID(): string {
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
 * Safely access localStorage with error handling
 */
function safeLocalStorage() {
	try {
		// Test if localStorage is available and working
		const testKey = "__localStorage_test__";
		localStorage.setItem(testKey, "test");
		localStorage.removeItem(testKey);
		return localStorage;
	} catch (error) {
		console.warn("localStorage is not available:", error);
		return null;
	}
}

/**
 * Retrieves the existing guest ID from localStorage
 * @returns The guest ID if it exists, null otherwise
 */
export function getGuestId(): string | null {
	const storage = safeLocalStorage();
	if (!storage) {
		return null;
	}

	try {
		const guestId = storage.getItem(GUEST_ID_KEY);

		// Validate that the retrieved ID looks like a UUID
		if (
			guestId &&
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
				guestId,
			)
		) {
			return guestId;
		}

		// If invalid, remove it
		if (guestId) {
			storage.removeItem(GUEST_ID_KEY);
		}

		return null;
	} catch (error) {
		console.error("Error retrieving guest ID from localStorage:", error);
		return null;
	}
}

/**
 * Gets the existing guest ID or creates a new one if none exists
 * @returns A valid guest ID
 */
export function getOrCreateGuestId(): string {
	// First try to get existing guest ID
	const existingId = getGuestId();
	if (existingId) {
		return existingId;
	}

	// Generate new guest ID
	const newGuestId = generateUUID();

	// Try to save it to localStorage
	const storage = safeLocalStorage();
	if (storage) {
		try {
			storage.setItem(GUEST_ID_KEY, newGuestId);
		} catch (error) {
			console.error("Error saving guest ID to localStorage:", error);
			// Continue with the generated ID even if we can't save it
		}
	}

	return newGuestId;
}

/**
 * Clears the guest ID from localStorage (useful for testing or reset scenarios)
 */
export function clearGuestId(): void {
	const storage = safeLocalStorage();
	if (storage) {
		try {
			storage.removeItem(GUEST_ID_KEY);
		} catch (error) {
			console.error("Error clearing guest ID from localStorage:", error);
		}
	}
}

/**
 * Checks if guest ID functionality is available (localStorage working)
 */
export function isGuestIdAvailable(): boolean {
	return safeLocalStorage() !== null;
}
