// Guest User Types
export interface GuestUser {
	guestId: string;
	createdAt: string;
	lastActiveAt: string;
}

// Plan Data Types - Basic structure for infra layer
export interface PlanData {
	formData: any; // Will be typed more specifically in core layer
	schedule?: any; // Will be typed more specifically in core layer
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
		details?: any;
	};
}

export interface SuccessResponse<T = any> {
	success: true;
	data: T;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

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
