import { EventService, PlanService } from "@bts/core";
import {
	createDynamoDBEventRepository,
	createDynamoDBPlanRepository,
} from "$lib/services/repositoryFactory";

// Shared service instances
let planService: PlanService | null = null;
let eventService: EventService | null = null;

export async function getPlanService(): Promise<PlanService> {
	if (!planService) {
		const planRepository = await createDynamoDBPlanRepository();
		planService = new PlanService(planRepository);
	}
	return planService;
}

export async function getEventService(): Promise<EventService> {
	if (!eventService) {
		const repositoryResult = await createDynamoDBEventRepository();
		if (!repositoryResult.success || !repositoryResult.data) {
			throw new Error(
				`Failed to create event service: ${repositoryResult.error}`,
			);
		}
		eventService = new EventService(repositoryResult.data);
	}
	return eventService;
}

// Simple API logger for web layer
export function logApiEvent(
	level: "info" | "warn" | "error",
	message: string,
	context?: unknown,
) {
	const timestamp = new Date().toISOString();
	const contextStr = context ? ` ${JSON.stringify(context)}` : "";
	const logMessage = `[${timestamp}] [${level.toUpperCase()}] [API] ${message}${contextStr}`;

	switch (level) {
		case "info":
			console.info(logMessage);
			break;
		case "warn":
			console.warn(logMessage);
			break;
		case "error":
			console.error(logMessage);
			break;
	}
}

export function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Event-specific logging helpers
export function logEventApiEvent(
	level: "info" | "warn" | "error",
	message: string,
	context?: {
		requestId?: string;
		guestId?: string;
		eventType?: string;
		eventId?: string;
		processingTime?: string;
		error?: unknown;
		[key: string]: unknown;
	},
) {
	const timestamp = new Date().toISOString();
	const contextStr = context ? ` ${JSON.stringify(context)}` : "";
	const logMessage = `[${timestamp}] [${level.toUpperCase()}] [EVENT-API] ${message}${contextStr}`;

	switch (level) {
		case "info":
			console.info(logMessage);
			break;
		case "warn":
			console.warn(logMessage);
			break;
		case "error":
			console.error(logMessage);
			break;
	}
}

// Error classification helper for events
export function classifyEventError(error: unknown): {
	code: string;
	message: string;
	httpStatus: number;
} {
	if (!(error instanceof Error)) {
		return {
			code: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
			httpStatus: 500,
		};
	}

	const errorMessage = error.message.toLowerCase();

	// Database configuration errors
	if (
		errorMessage.includes("beautytourevents table not found") ||
		errorMessage.includes("dynamodb table name is required")
	) {
		return {
			code: "SERVICE_UNAVAILABLE",
			message: "Event tracking service is not properly configured",
			httpStatus: 503,
		};
	}

	// AWS/DynamoDB specific errors
	if (
		errorMessage.includes("accessdenied") ||
		errorMessage.includes("unauthorizedoperation")
	) {
		return {
			code: "SERVICE_UNAVAILABLE",
			message: "Event tracking service access denied",
			httpStatus: 503,
		};
	}

	// Network/timeout errors
	if (errorMessage.includes("timeout") || errorMessage.includes("etimedout")) {
		return {
			code: "TIMEOUT_ERROR",
			message: "Request timed out. Please try again",
			httpStatus: 503,
		};
	}

	// Rate limiting errors
	if (errorMessage.includes("rate limit")) {
		return {
			code: "RATE_LIMIT_ERROR",
			message: "Too many requests. Please try again later",
			httpStatus: 429,
		};
	}

	// Validation errors
	if (errorMessage.includes("validation")) {
		return {
			code: "VALIDATION_ERROR",
			message: "Event data validation failed",
			httpStatus: 400,
		};
	}

	// Database errors
	if (errorMessage.includes("dynamodb") || errorMessage.includes("database")) {
		return {
			code: "DATABASE_ERROR",
			message: "Database operation failed",
			httpStatus: 503,
		};
	}

	// Default to internal error
	return {
		code: "INTERNAL_ERROR",
		message: "An unexpected error occurred while processing the event",
		httpStatus: 500,
	};
}

// Request validation helper
export function validateRequestSize(request: Request): {
	isValid: boolean;
	error?: string;
} {
	const contentLength = request.headers.get("content-length");

	if (contentLength) {
		const size = parseInt(contentLength, 10);
		const maxSize = 1024 * 1024; // 1MB limit

		if (size > maxSize) {
			return {
				isValid: false,
				error: `Request body too large. Maximum size is ${maxSize} bytes`,
			};
		}
	}

	return { isValid: true };
}

// Rate limiting helper (basic implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
	guestId: string,
	maxRequests: number = 100,
	windowMs: number = 60000, // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
	const now = Date.now();
	const key = `event_${guestId}`;

	let record = requestCounts.get(key);

	// Reset if window has passed
	if (!record || now > record.resetTime) {
		record = {
			count: 0,
			resetTime: now + windowMs,
		};
		requestCounts.set(key, record);
	}

	record.count++;

	return {
		allowed: record.count <= maxRequests,
		remaining: Math.max(0, maxRequests - record.count),
		resetTime: record.resetTime,
	};
}
