// API Request and Response Types for Plan Persistence

import type { ApiResponse, PlanData, SavedPlan } from "@bts/core";

// API Request Types
export interface SavePlanApiRequest {
	guestId: string;
	planData: PlanData;
	title?: string;
}

export interface GetPlansApiRequest {
	guestId: string;
}

// API Response Types
export type SavePlanApiResponse = ApiResponse<SavedPlan>;
export type GetPlansApiResponse = ApiResponse<SavedPlan[]>;

// Runtime validation schemas for request validation
export interface ValidationSchema<T> {
	validate: (data: unknown) => {
		isValid: boolean;
		data?: T;
		errors?: string[];
	};
}

// Request validation functions
export const validateSavePlanRequest = (
	data: unknown,
): { isValid: boolean; data?: SavePlanApiRequest; errors?: string[] } => {
	const errors: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("Request body must be an object");
		return { isValid: false, errors };
	}

	const request = data as Record<string, unknown>;

	// Validate guestId
	if (
		!request.guestId ||
		typeof request.guestId !== "string" ||
		request.guestId.trim() === ""
	) {
		errors.push("guestId is required and must be a non-empty string");
	}

	// Validate planData
	if (!request.planData || typeof request.planData !== "object") {
		errors.push("planData is required and must be an object");
	} else {
		const planData = request.planData as Record<string, unknown>;

		// Validate formData
		if (!planData.formData || typeof planData.formData !== "object") {
			errors.push("planData.formData is required and must be an object");
		}

		// Validate preferences
		if (!planData.preferences || typeof planData.preferences !== "object") {
			errors.push("planData.preferences is required and must be an object");
		} else {
			const preferences = planData.preferences as Record<string, unknown>;

			if (!preferences.region || typeof preferences.region !== "string") {
				errors.push(
					"planData.preferences.region is required and must be a string",
				);
			}

			if (typeof preferences.budget !== "number" || preferences.budget <= 0) {
				errors.push(
					"planData.preferences.budget is required and must be a positive number",
				);
			}

			if (
				typeof preferences.travelers !== "number" ||
				preferences.travelers <= 0
			) {
				errors.push(
					"planData.preferences.travelers is required and must be a positive number",
				);
			}

			if (!preferences.dates || typeof preferences.dates !== "object") {
				errors.push(
					"planData.preferences.dates is required and must be an object",
				);
			} else {
				const dates = preferences.dates as Record<string, unknown>;
				if (!dates.startDate || typeof dates.startDate !== "string") {
					errors.push(
						"planData.preferences.dates.startDate is required and must be a string",
					);
				}
				if (!dates.endDate || typeof dates.endDate !== "string") {
					errors.push(
						"planData.preferences.dates.endDate is required and must be a string",
					);
				}
			}

			if (!preferences.theme || typeof preferences.theme !== "string") {
				errors.push(
					"planData.preferences.theme is required and must be a string",
				);
			}

			if (!Array.isArray(preferences.inclusions)) {
				errors.push(
					"planData.preferences.inclusions is required and must be an array",
				);
			}
		}
	}

	// Validate optional title
	if (
		request.title !== undefined &&
		(typeof request.title !== "string" || request.title.trim() === "")
	) {
		errors.push("title must be a non-empty string if provided");
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	return {
		isValid: true,
		data: {
			guestId: request.guestId as string,
			planData: request.planData as PlanData,
			title: request.title as string | undefined,
		},
	};
};

export const validateGetPlansRequest = (
	data: unknown,
): { isValid: boolean; data?: GetPlansApiRequest; errors?: string[] } => {
	const errors: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("Request body must be an object");
		return { isValid: false, errors };
	}

	const request = data as Record<string, unknown>;

	// Validate guestId
	if (
		!request.guestId ||
		typeof request.guestId !== "string" ||
		request.guestId.trim() === ""
	) {
		errors.push("guestId is required and must be a non-empty string");
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	return {
		isValid: true,
		data: {
			guestId: request.guestId as string,
		},
	};
};

// Error response helpers
export const createErrorResponse = (
	code: string,
	message: string,
	details?: any,
): ApiResponse<never> => ({
	success: false,
	error: {
		code,
		message,
		details,
	},
});

export const createSuccessResponse = <T>(data: T): ApiResponse<T> => ({
	success: true,
	data,
});

// HTTP Status codes for API responses
export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	INTERNAL_SERVER_ERROR: 500,
	SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes for consistent error handling
export const ERROR_CODES = {
	VALIDATION_ERROR: "VALIDATION_ERROR",
	GUEST_ID_REQUIRED: "GUEST_ID_REQUIRED",
	PLAN_DATA_REQUIRED: "PLAN_DATA_REQUIRED",
	INVALID_PLAN_DATA: "INVALID_PLAN_DATA",
	SAVE_FAILED: "SAVE_FAILED",
	INTERNAL_ERROR: "INTERNAL_ERROR",
	SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;
