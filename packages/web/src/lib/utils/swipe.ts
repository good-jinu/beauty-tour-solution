/**
 * Swipe gesture utility for mobile navigation
 */

export interface SwipeConfig {
	threshold?: number; // Minimum distance for swipe (default: 50px)
	restraint?: number; // Maximum perpendicular distance (default: 100px)
	allowedTime?: number; // Maximum time for swipe (default: 300ms)
}

export interface SwipeHandlers {
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	onSwipeUp?: () => void;
	onSwipeDown?: () => void;
}

export function createSwipeHandler(
	element: HTMLElement,
	handlers: SwipeHandlers,
	config: SwipeConfig = {},
) {
	const { threshold = 50, restraint = 100, allowedTime = 300 } = config;

	let startX = 0;
	let startY = 0;
	let startTime = 0;
	let isTracking = false;

	function handleTouchStart(e: TouchEvent) {
		const touch = e.touches[0];
		startX = touch.clientX;
		startY = touch.clientY;
		startTime = Date.now();
		isTracking = true;
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!isTracking) return;

		const touch = e.changedTouches[0];
		const endX = touch.clientX;
		const endY = touch.clientY;
		const endTime = Date.now();

		const deltaX = endX - startX;
		const deltaY = endY - startY;
		const deltaTime = endTime - startTime;

		// Check if swipe is within time limit
		if (deltaTime > allowedTime) {
			isTracking = false;
			return;
		}

		// Determine swipe direction
		const absX = Math.abs(deltaX);
		const absY = Math.abs(deltaY);

		// Horizontal swipe
		if (absX >= threshold && absY <= restraint) {
			if (deltaX > 0) {
				handlers.onSwipeRight?.();
			} else {
				handlers.onSwipeLeft?.();
			}
		}
		// Vertical swipe
		else if (absY >= threshold && absX <= restraint) {
			if (deltaY > 0) {
				handlers.onSwipeDown?.();
			} else {
				handlers.onSwipeUp?.();
			}
		}

		isTracking = false;
	}

	function handleTouchCancel() {
		isTracking = false;
	}

	// Add event listeners
	element.addEventListener("touchstart", handleTouchStart, { passive: true });
	element.addEventListener("touchend", handleTouchEnd, { passive: true });
	element.addEventListener("touchcancel", handleTouchCancel, { passive: true });

	// Return cleanup function
	return () => {
		element.removeEventListener("touchstart", handleTouchStart);
		element.removeEventListener("touchend", handleTouchEnd);
		element.removeEventListener("touchcancel", handleTouchCancel);
	};
}

/**
 * Svelte action for swipe gestures
 */
export function swipe(
	element: HTMLElement,
	options: { handlers: SwipeHandlers; config?: SwipeConfig },
) {
	const cleanup = createSwipeHandler(element, options.handlers, options.config);

	return {
		destroy: cleanup,
	};
}
