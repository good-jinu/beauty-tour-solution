export interface BeautySimulationRequest {
	image: string; // base64 encoded image
	theme: string; // beauty theme value
	imageFormat: string; // 'jpeg' | 'png' | 'webp'
}

export interface StorageInfo {
	inputKey?: string;
	outputKey?: string | null;
	inputUrl?: string;
	outputUrl?: string | null;
}

export interface BeautySimulationSuccessResponse {
	success: true;
	originalImage: string; // base64 encoded
	simulatedImage: string; // base64 encoded
	theme: string;
	processingTime: number; // milliseconds
	storage?: StorageInfo;
}

export interface BeautySimulationErrorResponse {
	success: false;
	error: string;
	details?: string;
	storage?: StorageInfo;
}

export type BeautySimulationResponse =
	| BeautySimulationSuccessResponse
	| BeautySimulationErrorResponse;
