/**
 * Activity management types and interfaces for the Beauty Tour System
 */

export enum ActivityTheme {
	PLASTIC_SURGERY_EYE = "plastic_surgery_eye",
	PLASTIC_SURGERY_NOSE = "plastic_surgery_nose",
	PLASTIC_SURGERY_FACE = "plastic_surgery_face",
	HAIR_SALON = "hair_salon",
	NAIL_SALON = "nail_salon",
	SPA_WELLNESS = "spa_wellness",
	DENTAL = "dental",
	DERMATOLOGY = "dermatology",
}

export interface TimeSlot {
	isOpen: boolean;
	openTime?: string; // "09:00"
	closeTime?: string; // "18:00"
}

export interface WorkingHours {
	monday: TimeSlot;
	tuesday: TimeSlot;
	wednesday: TimeSlot;
	thursday: TimeSlot;
	friday: TimeSlot;
	saturday: TimeSlot;
	sunday: TimeSlot;
}

export interface Location {
	name: string; // "Kim's Plastic Surgery Clinic"
	address: string;
	district: string; // "Gangnam"
	city: string; // "Seoul"
	region: string; // "Seoul"
	coordinates?: {
		latitude: number;
		longitude: number;
	};
}

export interface Price {
	currency: string; // "KRW"
	amount: number;
	type: "fixed" | "starting_from" | "range";
	maxAmount?: number; // for range pricing
}

export interface ContactInfo {
	phone?: string;
	email?: string;
	website?: string;
}

export interface Activity {
	activityId: string;
	name: string;
	theme: ActivityTheme;
	workingHours: WorkingHours;
	location: Location;
	price: Price;
	description?: string;
	images?: string[];
	contactInfo?: ContactInfo;
	amenities?: string[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// API Request/Response Types

export interface CreateActivityData {
	name: string;
	theme: ActivityTheme;
	workingHours: WorkingHours;
	location: Location;
	price: Price;
	description?: string;
	images?: string[];
	contactInfo?: ContactInfo;
	amenities?: string[];
	isActive?: boolean;
}

export interface UpdateActivityData {
	name?: string;
	theme?: ActivityTheme;
	workingHours?: WorkingHours;
	location?: Location;
	price?: Price;
	description?: string;
	images?: string[];
	contactInfo?: ContactInfo;
	amenities?: string[];
	isActive?: boolean;
}

export interface ActivityFilters {
	page?: number;
	limit?: number;
	search?: string;
	theme?: ActivityTheme;
	region?: string;
	minPrice?: number;
	maxPrice?: number;
	isActive?: boolean;
	sortBy?: "name" | "theme" | "price" | "createdAt";
	sortOrder?: "asc" | "desc";
}

export interface PaginatedActivities {
	activities: Activity[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export interface ScheduleCriteria {
	theme: ActivityTheme;
	region?: string;
	maxPrice?: number;
	workingHours?: {
		day: keyof WorkingHours;
		time: string; // "14:00"
	};
}

export interface ValidationResult {
	isValid: boolean;
	errors: ValidationError[];
}

export interface ValidationError {
	field: string;
	message: string;
	code: string;
}

// DynamoDB Item Structure
export interface DynamoDBActivityItem extends Record<string, unknown> {
	activityId: string; // Partition Key
	name: string;
	theme: string;
	region: string; // For LocationIndex GSI
	price: number; // For PriceIndex GSI
	workingHours: string; // JSON stringified WorkingHours
	location: string; // JSON stringified Location
	priceDetails: string; // JSON stringified Price
	description?: string;
	images?: string[]; // Array of image URLs
	contactInfo?: string; // JSON stringified ContactInfo
	amenities?: string[];
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// API Response Types
export interface ActivityResponse {
	success: true;
	data: Activity;
}

export interface ActivitiesResponse {
	success: true;
	data: PaginatedActivities;
}

export interface ErrorResponse {
	success: false;
	error: {
		code: string;
		message: string;
		field?: string; // For validation errors
		details?: any;
	};
}

export interface SuccessResponse<T> {
	success: true;
	data: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
