/**
 * Client-side event logger for user interaction tracking
 * Captures page visits, clicks, and scroll events and sends them to the API
 */

import type { UserEvent, ValidEventType } from "@bts/core";
import { EVENT_TYPES } from "@bts/core";
import {
	sanitizeElementData,
	sanitizeUrl,
	sanitizeUserAgent,
	shouldExcludeElement,
} from "./dataSanitizer";

/**
 * Event logger configuration
 */
interface EventLoggerConfig {
	apiEndpoint: string;
	batchSize: number;
	batchTimeout: number;
	maxRetries: number;
	retryDelay: number;
	scrollThrottleMs: number;
	clickDebounceMs: number;
	enabled: boolean;
	enableOptOut: boolean;
	optOutCookieName: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: EventLoggerConfig = {
	apiEndpoint: "/api/events",
	batchSize: 10,
	batchTimeout: 5000, // 5 seconds
	maxRetries: 3,
	retryDelay: 1000, // 1 second
	scrollThrottleMs: 250,
	clickDebounceMs: 100,
	enabled: true,
	enableOptOut: true,
	optOutCookieName: "beauty-tour-opt-out",
};

/**
 * Event queue item with retry information
 */
interface QueuedEvent {
	event: UserEvent;
	retryCount: number;
	timestamp: number;
}

/**
 * Scroll tracking state
 */
interface ScrollState {
	lastScrollPercent: number;
	lastScrollTime: number;
	scrollTimeout: number | null;
}

/**
 * Click tracking state
 */
interface ClickState {
	lastClickTime: number;
	lastClickElement: HTMLElement | null;
	clickTimeout: number | null;
}

/**
 * Event logger class for capturing and sending user events
 */
export class EventLogger {
	private config: EventLoggerConfig;
	private eventQueue: QueuedEvent[] = [];
	private batchTimer: number | null = null;
	private scrollState: ScrollState = {
		lastScrollPercent: 0,
		lastScrollTime: 0,
		scrollTimeout: null,
	};
	private clickState: ClickState = {
		lastClickTime: 0,
		lastClickElement: null,
		clickTimeout: null,
	};
	private isInitialized = false;
	private abortController: AbortController | null = null;

	constructor(config: Partial<EventLoggerConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Check if user has opted out of tracking
	 */
	private hasUserOptedOut(): boolean {
		if (!this.config.enableOptOut || typeof document === "undefined") {
			return false;
		}

		// Check for opt-out cookie
		const cookies = document.cookie.split(";");
		for (const cookie of cookies) {
			const [name, value] = cookie.trim().split("=");
			if (name === this.config.optOutCookieName && value === "true") {
				return true;
			}
		}

		return false;
	}

	/**
	 * Initialize the event logger and set up event listeners
	 */
	public initialize(): void {
		if (this.isInitialized || !this.config.enabled) {
			return;
		}

		if (typeof window === "undefined") {
			console.warn("EventLogger: Cannot initialize in server-side environment");
			return;
		}

		// Check if user has opted out
		if (this.hasUserOptedOut()) {
			console.info("EventLogger: User has opted out of tracking");
			return;
		}

		this.abortController = new AbortController();
		const { signal } = this.abortController;

		// Set up event listeners
		this.setupPageVisitTracking();
		this.setupClickTracking(signal);
		this.setupScrollTracking(signal);

		// Track initial page visit
		this.trackPageVisit();

		this.isInitialized = true;
		console.info("EventLogger: Initialized successfully");
	}

	/**
	 * Cleanup event listeners and pending operations
	 */
	public destroy(): void {
		if (!this.isInitialized) {
			return;
		}

		// Cancel any pending operations
		if (this.abortController) {
			this.abortController.abort();
		}

		// Clear timers
		if (this.batchTimer) {
			clearTimeout(this.batchTimer);
			this.batchTimer = null;
		}

		if (this.scrollState.scrollTimeout) {
			clearTimeout(this.scrollState.scrollTimeout);
			this.scrollState.scrollTimeout = null;
		}

		if (this.clickState.clickTimeout) {
			clearTimeout(this.clickState.clickTimeout);
			this.clickState.clickTimeout = null;
		}

		// Flush any remaining events
		if (this.eventQueue.length > 0) {
			this.flushEvents();
		}

		this.isInitialized = false;
		console.info("EventLogger: Destroyed successfully");
	}

	/**
	 * Track a page visit event
	 */
	public async trackPageVisit(): Promise<void> {
		if (
			!this.config.enabled ||
			typeof window === "undefined" ||
			this.hasUserOptedOut()
		) {
			return;
		}

		const event: UserEvent = {
			event_type: EVENT_TYPES.PAGE_VISIT,
			timestamp: new Date().toISOString(),
			page_url: sanitizeUrl(window.location.href),
			user_agent: sanitizeUserAgent(navigator.userAgent),
			viewport_width: window.innerWidth,
			viewport_height: window.innerHeight,
		};

		await this.queueEvent(event);
	}

	/**
	 * Track a click event
	 */
	public async trackClick(element: HTMLElement): Promise<void> {
		if (
			!this.config.enabled ||
			typeof window === "undefined" ||
			this.hasUserOptedOut()
		) {
			return;
		}

		// Check if element should be excluded from tracking
		if (shouldExcludeElement(element)) {
			return;
		}

		// Debounce rapid clicks on the same element
		const now = Date.now();
		if (
			this.clickState.lastClickElement === element &&
			now - this.clickState.lastClickTime < this.config.clickDebounceMs
		) {
			return;
		}

		this.clickState.lastClickElement = element;
		this.clickState.lastClickTime = now;

		// Sanitize element data
		const elementData = sanitizeElementData(element);

		const event: UserEvent = {
			event_type: EVENT_TYPES.CLICK,
			timestamp: new Date().toISOString(),
			page_url: sanitizeUrl(window.location.href),
			user_agent: sanitizeUserAgent(navigator.userAgent),
			viewport_width: window.innerWidth,
			viewport_height: window.innerHeight,
			element_tag: elementData.tag,
			element_id: elementData.id,
			element_text: elementData.text,
		};

		await this.queueEvent(event);
	}

	/**
	 * Track a scroll event
	 */
	public async trackScroll(scrollPercent: number): Promise<void> {
		if (
			!this.config.enabled ||
			typeof window === "undefined" ||
			this.hasUserOptedOut()
		) {
			return;
		}

		// Only track at 25% intervals
		const roundedPercent = Math.floor(scrollPercent / 25) * 25;

		// Don't track if we haven't crossed a new threshold
		if (roundedPercent <= this.scrollState.lastScrollPercent) {
			return;
		}

		this.scrollState.lastScrollPercent = roundedPercent;

		const event: UserEvent = {
			event_type: EVENT_TYPES.SCROLL,
			timestamp: new Date().toISOString(),
			page_url: sanitizeUrl(window.location.href),
			user_agent: sanitizeUserAgent(navigator.userAgent),
			viewport_width: window.innerWidth,
			viewport_height: window.innerHeight,
			scroll_percent: roundedPercent,
		};

		await this.queueEvent(event);
	}

	/**
	 * Send a custom event
	 */
	public async sendEvent(
		eventType: ValidEventType,
		data?: Partial<UserEvent>,
	): Promise<void> {
		if (
			!this.config.enabled ||
			typeof window === "undefined" ||
			this.hasUserOptedOut()
		) {
			return;
		}

		const event: UserEvent = {
			event_type: eventType,
			timestamp: new Date().toISOString(),
			page_url: sanitizeUrl(window.location.href),
			user_agent: sanitizeUserAgent(navigator.userAgent),
			viewport_width: window.innerWidth,
			viewport_height: window.innerHeight,
			...data,
		};

		await this.queueEvent(event);
	}

	/**
	 * Enable event tracking (opt back in)
	 */
	public enable(): void {
		this.config.enabled = true;
		if (!this.isInitialized) {
			this.initialize();
		}
	}

	/**
	 * Disable event tracking (opt out)
	 */
	public disable(): void {
		this.config.enabled = false;
		this.destroy();
	}

	/**
	 * Set up page visit tracking for navigation events
	 */
	private setupPageVisitTracking(): void {
		// Track browser navigation events
		const originalPushState = history.pushState;
		const originalReplaceState = history.replaceState;

		history.pushState = (...args) => {
			originalPushState.apply(history, args);
			setTimeout(() => this.trackPageVisit(), 0);
		};

		history.replaceState = (...args) => {
			originalReplaceState.apply(history, args);
			setTimeout(() => this.trackPageVisit(), 0);
		};

		window.addEventListener("popstate", () => {
			setTimeout(() => this.trackPageVisit(), 0);
		});
	}

	/**
	 * Set up click event tracking
	 */
	private setupClickTracking(signal: AbortSignal): void {
		document.addEventListener(
			"click",
			(event) => {
				const target = event.target as HTMLElement;
				if (target && target.nodeType === Node.ELEMENT_NODE) {
					this.trackClick(target);
				}
			},
			{ signal, passive: true },
		);
	}

	/**
	 * Set up scroll event tracking with throttling
	 */
	private setupScrollTracking(signal: AbortSignal): void {
		let isThrottled = false;

		const handleScroll = () => {
			if (isThrottled) return;

			isThrottled = true;
			setTimeout(() => {
				isThrottled = false;
			}, this.config.scrollThrottleMs);

			const scrollPercent = this.calculateScrollPercent();
			this.trackScroll(scrollPercent);
		};

		window.addEventListener("scroll", handleScroll, { signal, passive: true });
	}

	/**
	 * Calculate current scroll percentage
	 */
	private calculateScrollPercent(): number {
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollHeight = document.documentElement.scrollHeight;
		const clientHeight = document.documentElement.clientHeight;

		if (scrollHeight <= clientHeight) {
			return 100; // Page doesn't scroll
		}

		const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
		return Math.min(100, Math.max(0, scrollPercent));
	}

	/**
	 * Add event to queue and trigger batch processing
	 */
	private async queueEvent(event: UserEvent): Promise<void> {
		const queuedEvent: QueuedEvent = {
			event,
			retryCount: 0,
			timestamp: Date.now(),
		};

		this.eventQueue.push(queuedEvent);

		// Trigger immediate flush if batch size reached
		if (this.eventQueue.length >= this.config.batchSize) {
			this.flushEvents();
		} else {
			// Set up batch timer if not already set
			if (!this.batchTimer) {
				this.batchTimer = window.setTimeout(() => {
					this.flushEvents();
				}, this.config.batchTimeout);
			}
		}
	}

	/**
	 * Flush events from queue to API
	 */
	private async flushEvents(): Promise<void> {
		if (this.eventQueue.length === 0) {
			return;
		}

		// Clear batch timer
		if (this.batchTimer) {
			clearTimeout(this.batchTimer);
			this.batchTimer = null;
		}

		// Take events from queue
		const eventsToSend = this.eventQueue.splice(0, this.config.batchSize);
		const events = eventsToSend.map((qe) => qe.event);

		try {
			if (events.length === 1) {
				// Send single event
				await this.sendSingleEvent(events[0]);
			} else {
				// Send batch
				await this.sendBatchEvents(events);
			}
		} catch (error) {
			console.warn("EventLogger: Failed to send events", error);

			// Re-queue events with incremented retry count
			const retriableEvents = eventsToSend
				.filter((qe) => qe.retryCount < this.config.maxRetries)
				.map((qe) => ({ ...qe, retryCount: qe.retryCount + 1 }));

			if (retriableEvents.length > 0) {
				// Add back to front of queue for retry
				this.eventQueue.unshift(...retriableEvents);

				// Schedule retry with exponential backoff
				const delay =
					this.config.retryDelay * 2 ** (retriableEvents[0].retryCount - 1);
				setTimeout(() => {
					this.flushEvents();
				}, delay);
			}
		}
	}

	/**
	 * Send a single event to the API
	 */
	private async sendSingleEvent(event: UserEvent): Promise<void> {
		const response = await fetch(this.config.apiEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(event),
			signal: this.abortController?.signal,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
	}

	/**
	 * Send multiple events to the API in batch
	 */
	private async sendBatchEvents(events: UserEvent[]): Promise<void> {
		const response = await fetch(this.config.apiEndpoint, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ events }),
			signal: this.abortController?.signal,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
	}
}

/**
 * Global event logger instance
 */
let globalEventLogger: EventLogger | null = null;

/**
 * Initialize the global event logger
 */
export function initializeEventLogger(
	config?: Partial<EventLoggerConfig>,
): EventLogger {
	if (globalEventLogger) {
		console.warn(
			"EventLogger: Already initialized, returning existing instance",
		);
		return globalEventLogger;
	}

	globalEventLogger = new EventLogger(config);
	globalEventLogger.initialize();

	// Store reference in window for opt-out functionality
	if (typeof window !== "undefined") {
		// biome-ignore lint/suspicious/noExplicitAny: allow any
		(window as any).__eventLogger = globalEventLogger;

		// Cleanup on page unload
		window.addEventListener("beforeunload", () => {
			if (globalEventLogger) {
				globalEventLogger.destroy();
			}
		});
	}

	return globalEventLogger;
}

/**
 * Get the global event logger instance
 */
export function getEventLogger(): EventLogger | null {
	return globalEventLogger;
}

/**
 * Destroy the global event logger
 */
export function destroyEventLogger(): void {
	if (globalEventLogger) {
		globalEventLogger.destroy();
		globalEventLogger = null;
	}
}

/**
 * Convenience functions for tracking events
 */
export const trackPageVisit = async (): Promise<void> => {
	const logger = getEventLogger();
	if (logger) {
		await logger.trackPageVisit();
	}
};

export const trackClick = async (element: HTMLElement): Promise<void> => {
	const logger = getEventLogger();
	if (logger) {
		await logger.trackClick(element);
	}
};

export const trackScroll = async (scrollPercent: number): Promise<void> => {
	const logger = getEventLogger();
	if (logger) {
		await logger.trackScroll(scrollPercent);
	}
};

export const sendCustomEvent = async (
	eventType: ValidEventType,
	data?: Partial<UserEvent>,
): Promise<void> => {
	const logger = getEventLogger();
	if (logger) {
		await logger.sendEvent(eventType, data);
	}
};
