export interface GenerateTourRequest {
	region: string; // e.g. "south-korea", "thailand"
	startDate: string; // ISO date string (YYYY-MM-DD)
	endDate: string; // ISO date string (YYYY-MM-DD)
	theme: string; // e.g. "skincare", "plastic-surgery"
	budget: number; // USD amount
	specialRequests?: string | null; // optional free-text
}

export interface GenerateTourSuccessResponse {
	success: true;
	recommendation: string | null; // AI-generated markdown/plain text
	formData: GenerateTourRequest; // echo of submitted data
}

export interface GenerateTourErrorResponse {
	success: false;
	error: string; // short error message
	details?: string; // optional debug/details
}

export type GenerateTourResponse =
	| GenerateTourSuccessResponse
	| GenerateTourErrorResponse;
