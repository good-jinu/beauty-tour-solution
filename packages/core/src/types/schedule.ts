export interface ScheduleItem {
	activityId: string; // Reference to Activity entity
	scheduledTime: string; // Time slot for this activity (e.g., "09:00")
	duration: string; // Duration of the appointment (e.g., "2h", "90min")
	status: "planned" | "booked" | "completed" | "cancelled";
	notes?: string; // Schedule-specific notes or instructions
	customPrice?: number; // Override price if negotiated or discounted
	bookingReference?: string; // External booking system reference
}

export interface ScheduleDay {
	date: string; // ISO date string
	dayNumber: number;
	items: ScheduleItem[]; // References to activities, not embedded data
	totalCost: number; // Calculated from referenced activities
	notes: string; // Day-specific notes
}

export interface GenerateScheduleRequest {
	region: string;
	startDate: string;
	endDate: string;
	selectedThemes: string[];
	budget: number;
	solutionType?: "topranking" | "premium" | "budget";
	moreRequests?: string;
	guestId?: string; // Optional guest ID for automatic saving
}

export interface GenerateScheduleResponse {
	success: boolean;
	schedule?: ScheduleDay[];
	summary?: {
		totalDays: number;
		totalActivities: number;
		totalThemes: number;
		estimatedCost: number;
		activitiesUsed: string[]; // Array of activity IDs used in the schedule
	};
	error?: string;
	details?: string;
}

/**
 * Enhanced schedule item with resolved activity data for display purposes
 * This is used when we need to show schedule with full activity details
 */
export interface ScheduleItemWithActivity extends ScheduleItem {
	activity: {
		activityId: string;
		name: string;
		theme: string;
		location: {
			name: string;
			address: string;
			district: string;
		};
		price: {
			currency: string;
			amount: number;
			type: string;
		};
		description?: string;
		contactInfo?: {
			phone?: string;
			email?: string;
			website?: string;
		};
	};
}

/**
 * Schedule day with resolved activity data for display
 */
export interface ScheduleDayWithActivities {
	date: string;
	dayNumber: number;
	items: ScheduleItemWithActivity[];
	totalCost: number;
	notes: string;
}

/**
 * Complete schedule response with resolved activity data
 */
export interface ScheduleWithActivities {
	schedule: ScheduleDayWithActivities[];
	summary: {
		totalDays: number;
		totalActivities: number;
		totalThemes: number;
		estimatedCost: number;
		activitiesUsed: string[];
	};
}
