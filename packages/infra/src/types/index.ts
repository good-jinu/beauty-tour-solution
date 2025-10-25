export interface AWSConfig {
	region?: string;
	bucketName?: string;
}

export interface S3UploadResult {
	success: boolean;
	key?: string;
	error?: string;
}

export interface BedrockConfig {
	region?: string;
	modelId?: string;
	maxImageSize?: number;
}

export interface GoogleGenAIConfig {
	apiKey?: string;
	modelId?: string;
	maxImageSize?: number;
}

// Export plan types
