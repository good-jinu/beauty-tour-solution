export interface GenerateJourneyAddOns {
	flights: boolean;
	hotels: boolean; // recovery accommodation
	activities: boolean; // wellness activities / sightseeing
	transport: boolean; // medical/airport transport
}

export interface GenerateJourneyRequest {
	region: string; // e.g. "south-korea", "thailand"
	startDate: string; // ISO date string (YYYY-MM-DD)
	endDate: string; // ISO date string (YYYY-MM-DD)
	theme: string; // e.g. "skincare", "plastic-surgery"
	budget: number; // USD amount
	travelers: number; // number of travelers
	addOns: GenerateJourneyAddOns;
	specialRequests?: string | null; // optional free-text
}

export interface GenerateJourneySuccessResponse {
	success: true;
	recommendation: string | null; // AI-generated markdown/plain text
	formData: GenerateJourneyRequest; // echo of submitted data
}

export interface GenerateJourneyErrorResponse {
	success: false;
	error: string; // short error message
	details?: string; // optional debug/details
}

export type GenerateJourneyResponse =
	| GenerateJourneySuccessResponse
	| GenerateJourneyErrorResponse;
