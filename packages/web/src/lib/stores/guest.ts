import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { getGuestId, getOrCreateGuestId } from "$lib/utils/guest";

/**
 * Store for managing the guest ID throughout the application
 */
function createGuestStore() {
	const { subscribe, set, update } = writable<string | null>(null);

	return {
		subscribe,
		/**
		 * Initialize the guest ID - should be called once when the app starts
		 */
		initialize: () => {
			if (browser) {
				const guestId = getOrCreateGuestId();
				set(guestId);
			}
		},
		/**
		 * Get the current guest ID, creating one if it doesn't exist
		 */
		getOrCreate: () => {
			if (browser) {
				const guestId = getOrCreateGuestId();
				set(guestId);
				return guestId;
			}
			return null;
		},
		/**
		 * Get the current guest ID without creating a new one
		 */
		getCurrent: () => {
			if (browser) {
				return getGuestId();
			}
			return null;
		},
		/**
		 * Manually set the guest ID (useful for testing)
		 */
		setGuestId: (id: string) => {
			set(id);
		},
		/**
		 * Clear the guest ID
		 */
		clear: () => {
			set(null);
		},
	};
}

export const guestStore = createGuestStore();
