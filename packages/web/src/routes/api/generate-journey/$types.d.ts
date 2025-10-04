/**
 * Types for the /api/generate-journey endpoint
 *
 * These describe the shape of the JSON payload sent from the client
 * (`+page.svelte`) and the JSON returned by the server (`+server.ts`).
 */

/** Add-on flags that indicate optional package inclusions */
export interface GenerateJourneyAddOns {
	flights: boolean;
	hotels: boolean; // recovery accommodation
	activities: boolean; // wellness activities / sightseeing
	transport: boolean; // medical/airport transport
}

/** Request payload sent to POST /api/generate-journey */
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

/** Successful response shape from the server */
export interface GenerateJourneySuccessResponse {
	success: true;
	recommendation: string | null; // AI-generated markdown/plain text
	formData: GenerateJourneyRequest; // echo of submitted data
}

/** Error response shape from the server */
export interface GenerateJourneyErrorResponse {
	success: false;
	error: string; // short error message
	details?: string; // optional debug/details (may be omitted in production)
}

/** Union type representing any response from the endpoint */
export type GenerateJourneyResponse =
	| GenerateJourneySuccessResponse
	| GenerateJourneyErrorResponse;

/**
 * Example usage in Svelte files:
 *
 * import type { GenerateJourneyRequest, GenerateJourneyResponse } from './$types';
 */
