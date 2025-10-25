import type { GenerateScheduleResponse, GenerateTourRequest } from "./index";

// Guest User Types
export interface GuestUser {
	guestId: string;
	createdAt: string;
	lastActiveAt: string;
}

// Plan Data Types
export interface PlanData {
	formData: GenerateTourRequest;
	schedule?: GenerateScheduleResponse;
	preferences: {
		region: string;
		budget: number;
		travelers: number;
		dates: {
			startDate: string;
			endDate: string;
		};
		theme: string;
		inclusions: string[];
		specialRequests?: string;
	};
}

// Saved Plan Types
export interface SavedPlan {
	guestId: string;
	planId: string;
	title?: string;
	planData: PlanData;
	createdAt: string;
	updatedAt: string;
}

// DynamoDB Item Structure
export interface DynamoDBPlanItem {
	guestId: string; // Partition Key
	planId: string; // Sort Key
	title?: string;
	planData: string; // JSON stringified PlanData
	createdAt: string;
	updatedAt: string;
	ttl?: number; // Optional TTL for data cleanup
	[key: string]: unknown; // Index signature for DynamoDB compatibility
}

// Validation Types
export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

export interface ValidationError {
	field: string;
	message: string;
	code: string;
}

// Error Response Types
export interface ErrorResponse {
	success: false;
	error: {
		code: string;
		message: string;
		details?: unknown;
	};
}

export interface SuccessResponse<T = unknown> {
	success: true;
	data: T;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// Plan Service Types
export interface SavePlanRequest {
	guestId: string;
	planData: PlanData;
	title?: string;
}

export type SavePlanResponse = ApiResponse<SavedPlan>;

export interface GetPlansRequest {
	guestId: string;
}

export type GetPlansResponse = ApiResponse<SavedPlan[]>;
