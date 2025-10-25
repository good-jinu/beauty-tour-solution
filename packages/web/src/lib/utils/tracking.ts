/**
 * Convenient tracking utilities for Svelte components
 */

import type { UserEvent, ValidEventType } from "@bts/core";
import { EVENT_TYPES } from "@bts/core";
import { type EventLogger, getEventLogger } from "./eventLogger";

/**
 * Track a page visit (usually called automatically)
 */
export async function trackPageVisit(): Promise<void> {
	const logger = getEventLogger();
	if (logger) {
		await logger.trackPageVisit();
	}
}

/**
 * Track a click event on an element
 */
export async function trackClick(element: HTMLElement): Promise<void> {
	const logger = getEventLogger();
	if (logger) {
		await logger.trackClick(element);
	}
}

/**
 * Track a scroll event with percentage
 */
export async function trackScroll(scrollPercent: number): Promise<void> {
	const logger = getEventLogger();
	if (logger) {
		await logger.trackScroll(scrollPercent);
	}
}

/**
 * Track a custom event
 */
export async function trackCustomEvent(
	eventType: ValidEventType,
	data?: Partial<UserEvent>,
): Promise<void> {
	const logger = getEventLogger();
	if (logger) {
		await logger.sendEvent(eventType, data);
	}
}

/**
 * Svelte action to automatically track clicks on an element
 * Usage: <button use:trackClickAction>Click me</button>
 */
export function trackClickAction(node: HTMLElement) {
	const handleClick = () => {
		trackClick(node);
	};

	node.addEventListener("click", handleClick);

	return {
		destroy() {
			node.removeEventListener("click", handleClick);
		},
	};
}

/**
 * Svelte action to track form submissions
 * Usage: <form use:trackFormSubmit>...</form>
 */
export function trackFormSubmit(node: HTMLFormElement) {
	const handleSubmit = (event: SubmitEvent) => {
		// Track form submission as a custom click event
		trackCustomEvent(EVENT_TYPES.CLICK, {
			element_tag: "form",
			element_id: node.id || undefined,
			element_class: node.className || undefined,
			element_text: "form_submit",
		});
	};

	node.addEventListener("submit", handleSubmit);

	return {
		destroy() {
			node.removeEventListener("submit", handleSubmit);
		},
	};
}

/**
 * Track button clicks with additional context
 */
export async function trackButtonClick(
	button: HTMLElement,
	context?: { action?: string; category?: string },
): Promise<void> {
	const logger = getEventLogger();
	if (logger) {
		await logger.sendEvent(EVENT_TYPES.CLICK, {
			element_tag: button.tagName.toLowerCase(),
			element_id: button.id || undefined,
			element_class: button.className || undefined,
			element_text: context?.action || button.textContent?.trim() || undefined,
		});
	}
}

/**
 * Track navigation events (useful for SPA routing)
 */
export async function trackNavigation(
	from: string,
	to: string,
	method: "push" | "replace" | "back" | "forward" = "push",
): Promise<void> {
	const logger = getEventLogger();
	if (logger) {
		await logger.sendEvent(EVENT_TYPES.PAGE_VISIT, {
			page_url: to,
			// Store navigation context in element_text field
			element_text: `nav_${method}_from_${from}`,
		});
	}
}

/**
 * Track user engagement events
 */
export async function trackEngagement(
	type: "focus" | "blur" | "visibility_change",
	duration?: number,
): Promise<void> {
	const logger = getEventLogger();
	if (logger) {
		await logger.sendEvent(EVENT_TYPES.CLICK, {
			element_tag: "window",
			element_text: type,
			scroll_percent: duration, // Reuse scroll_percent field for duration
		});
	}
}

/**
 * Get the current event logger instance (for advanced usage)
 */
export function getTrackingLogger(): EventLogger | null {
	return getEventLogger();
}

/**
 * Check if tracking is currently active
 */
export function isTrackingActive(): boolean {
	return getEventLogger() !== null;
}
