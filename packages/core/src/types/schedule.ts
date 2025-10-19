export interface ScheduleActivity {
	time: string;
	activity: string;
	location: string;
	duration: string;
	cost: number;
	description?: string;
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
	notes?: string;
}

export interface ScheduleRecommendation {
	clinics: {
		name: string;
		rating: number;
		specialties: string[];
		location: string;
		estimatedCost: number;
		description: string;
	}[];
	accommodation: {
		name: string;
		type: "hotel" | "medical-hotel" | "recovery-center";
		rating: number;
		amenities: string[];
		location: string;
		pricePerNight: number;
		description: string;
	}[];
	transportation: {
		type: "airport-transfer" | "medical-transport" | "local-transport";
		provider: string;
		estimatedCost: number;
		description: string;
	}[];
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
	recommendations?: ScheduleRecommendation;
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
