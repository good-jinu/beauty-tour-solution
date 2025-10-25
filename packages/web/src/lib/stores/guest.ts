import { derived, writable } from "svelte/store";
import { browser } from "$app/environment";
import {
	clearGuestId,
	getGuestIdFromCookies,
	getOrCreateGuestId,
	isValidUUID,
} from "$lib/utils/guest";

/**
 * Store for managing the guest ID throughout the application with cookie support
 */
function createGuestStore() {
	const { subscribe, set, update } = writable<string | null>(null);

	return {
		subscribe,

		/**
		 * Initialize the guest ID from cookies - should be called once when the app starts
		 * This will read from cookies and update the store reactively
		 */
		initialize: () => {
			if (browser) {
				try {
					const guestId = getGuestIdFromCookies();
					if (guestId) {
						set(guestId);
					} else {
						// If no valid cookie exists, create a new guest ID
						// Note: This will use client-side cookie setting which has limitations
						const newGuestId = getOrCreateGuestId();
						set(newGuestId);
					}
				} catch (error) {
					console.error("Error initializing guest store from cookies:", error);
					// Fallback to generating a new ID without cookie persistence
					const fallbackId = getOrCreateGuestId();
					set(fallbackId);
				}
			}
		},

		/**
		 * Get the current guest ID, creating one if it doesn't exist
		 * This method will update the store and attempt to set cookies
		 */
		getOrCreate: () => {
			if (browser) {
				try {
					const guestId = getOrCreateGuestId();
					set(guestId);
					return guestId;
				} catch (error) {
					console.error("Error getting or creating guest ID:", error);
					return null;
				}
			}
			return null;
		},

		/**
		 * Get the current guest ID from cookies without creating a new one
		 * This is a read-only operation that doesn't modify the store
		 */
		getCurrent: () => {
			if (browser) {
				try {
					return getGuestIdFromCookies();
				} catch (error) {
					console.error("Error getting current guest ID from cookies:", error);
					return null;
				}
			}
			return null;
		},

		/**
		 * Manually set the guest ID (useful for testing or server-side initialization)
		 * @param id The guest ID to set
		 * @param validateUUID Whether to validate the UUID format (default: true)
		 */
		setGuestId: (id: string, validateUUID: boolean = true) => {
			try {
				if (validateUUID && !isValidUUID(id)) {
					console.error("Invalid UUID format provided to setGuestId:", id);
					return false;
				}
				set(id);
				return true;
			} catch (error) {
				console.error("Error setting guest ID:", error);
				return false;
			}
		},

		/**
		 * Update the guest ID from cookies (useful for reactive updates when cookies change)
		 * This can be called when the component detects cookie changes
		 */
		refreshFromCookies: () => {
			if (browser) {
				try {
					const cookieGuestId = getGuestIdFromCookies();
					update((currentId) => {
						// Only update if the cookie value is different from current store value
						if (cookieGuestId !== currentId) {
							return cookieGuestId;
						}
						return currentId;
					});
				} catch (error) {
					console.error("Error refreshing guest ID from cookies:", error);
				}
			}
		},

		/**
		 * Clear the guest ID from both store and cookies
		 */
		clear: () => {
			try {
				set(null);
				if (browser) {
					clearGuestId();
				}
			} catch (error) {
				console.error("Error clearing guest ID:", error);
			}
		},

		/**
		 * Check if the current guest ID is valid
		 */
		isValid: () => {
			if (browser) {
				const currentId = getGuestIdFromCookies();
				return currentId !== null && isValidUUID(currentId);
			}
			return false;
		},
	};
}

export const guestStore = createGuestStore();

/**
 * Derived store that provides the guest ID status
 */
export const guestStatus = derived(guestStore, ($guestId) => ({
	hasGuestId: $guestId !== null,
	isValid: $guestId !== null && isValidUUID($guestId),
	guestId: $guestId,
}));
