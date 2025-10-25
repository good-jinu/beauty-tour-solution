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
	travelers?: number;
	solutionType?: "topranking" | "premium" | "budget";
	moreRequests?: string;
}

export interface GenerateScheduleResponse {
	success: boolean;
	schedule?: ScheduleDay[];
	costBreakdown?: {
		treatments: number;
		accommodation: number;
		transportation: number;
		activities: number;
		total: number;
		budgetUtilization: number;
	};
	summary?: {
		totalDays: number;
		totalActivities: number;
		totalThemes: number;
		estimatedCost: number;
	};
	error?: string;
	details?: string;
}
