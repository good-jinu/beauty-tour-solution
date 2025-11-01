export interface ScheduleActivity {
	time: string;
	activity: string;
	location: string;
	duration: string;
	cost: number;
	description: string;
	category:
		| "treatment"
		| "consultation"
		| "recovery"
		| "wellness"
		| "transport";
}

export interface ScheduleDay {
	date: string; // ISO date string
	dayNumber: number;
	activities: ScheduleActivity[];
	totalCost: number;
	notes: string;
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
	};
	error?: string;
	details?: string;
}
