import { GoogleGenAI } from "@google/genai";

export interface ThemePrompt {
	text: string;
	negativeText: string;
}

export interface GoogleGenAIConfig {
	apiKey?: string;
	modelId?: string;
	maxImageSize?: number;
}

export interface GoogleGenAIImageGenerationRequest {
	image: string; // base64 encoded
	themePrompt: ThemePrompt;
	imageFormat: string;
}

export interface GoogleGenAIImageGenerationResponse {
	success: boolean;
	simulatedImage?: string;
	error?: string;
	details?: string;
	processingTime?: number;
}

export class GoogleGenAIService {
	private client: GoogleGenAI;
	private modelId: string;
	private maxImageSize: number;

	constructor(config: GoogleGenAIConfig = {}) {
		const apiKey = config.apiKey ?? process.env.GOOGLE_GENAI_API_KEY;
		if (!apiKey) {
			throw new Error(
				"Google GenAI API key is required. Set GOOGLE_GENAI_API_KEY environment variable.",
			);
		}
		this.client = new GoogleGenAI({ apiKey });
		this.modelId = config.modelId ?? "gemini-2.5-flash-image";
		this.maxImageSize = config.maxImageSize ?? 1024;
	}

	async generateImage(
		request: GoogleGenAIImageGenerationRequest,
	): Promise<GoogleGenAIImageGenerationResponse> {
		const startTime = Date.now();

		try {
			// Validate and process the image
			const processedImage = this.prepareImageForGenAI(
				request.image,
				request.imageFormat,
			);
			if (!processedImage) {
				return {
					success: false,
					error: "Invalid image data",
					details: "Unable to process the provided image",
				};
			}

			// Create the prompt combining theme text and negative text
			const promptText = `${request.themePrompt.text}. Avoid: ${request.themePrompt.negativeText}`;

			// Prepare the prompt for Google GenAI
			const prompt = [
				{ text: promptText },
				{
					inlineData: {
						mimeType: `image/${request.imageFormat}`,
						data: processedImage,
					},
				},
			];

			// Generate content using Google GenAI
			const response = await this.client.models.generateContent({
				model: this.modelId,
				contents: prompt,
			});

			if (!response.candidates || response.candidates.length === 0) {
				return {
					success: false,
					error: "No response from image generation service",
					details: "Google GenAI returned no candidates",
				};
			}

			const candidate = response.candidates[0];
			if (!candidate.content || !candidate.content.parts) {
				return {
					success: false,
					error: "No content in response",
					details: "Google GenAI returned empty content",
				};
			}

			// Find the generated image in the response parts
			let generatedImage: string | null = null;
			for (const part of candidate.content.parts) {
				if (part.inlineData?.data) {
					generatedImage = part.inlineData.data;
					break;
				}
			}

			if (!generatedImage) {
				return {
					success: false,
					error: "No images generated",
					details: "Image generation service did not return any images",
				};
			}

			const processingTime = Date.now() - startTime;

			return {
				success: true,
				simulatedImage: generatedImage,
				processingTime,
			};
		} catch (error) {
			console.error("Google GenAI Image Generation Error:", error);

			// Handle specific Google GenAI errors
			if (error instanceof Error) {
				if (error.message.includes("quota") || error.message.includes("rate")) {
					return {
						success: false,
						error: "Service temporarily unavailable",
						details: "Rate limit exceeded. Please try again in a moment.",
					};
				}

				if (
					error.message.includes("invalid") ||
					error.message.includes("validation")
				) {
					return {
						success: false,
						error: "Invalid request data",
						details: error.message,
					};
				}
			}

			return {
				success: false,
				error: "Failed to generate image",
				details: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Prepares image for Google GenAI by validating format and size
	 */
	private prepareImageForGenAI(
		imageBase64: string,
		format: string,
	): string | null {
		try {
			// Validate image format - Google GenAI supports these formats
			if (!["jpeg", "jpg", "png", "webp"].includes(format.toLowerCase())) {
				return null;
			}

			// Remove data URL prefix if present and get clean base64
			const cleanBase64 = this.extractBase64Data(imageBase64);
			if (!cleanBase64) {
				return null;
			}

			// Validate base64 format
			if (!this.isValidBase64(cleanBase64)) {
				return null;
			}

			return cleanBase64;
		} catch (error) {
			console.error("Image processing error:", error);
			return null;
		}
	}

	/**
	 * Extracts clean base64 data from data URL or raw base64 string
	 */
	private extractBase64Data(str: string): string | null {
		try {
			// If it's a data URL, extract the base64 part
			if (str.startsWith("data:")) {
				const base64Index = str.indexOf("base64,");
				if (base64Index === -1) {
					return null;
				}
				return str.substring(base64Index + 7);
			}

			// Otherwise assume it's already clean base64
			return str;
		} catch (_error) {
			return null;
		}
	}

	/**
	 * Validates base64 string format
	 */
	private isValidBase64(str: string): boolean {
		try {
			// Check if string contains only valid base64 characters
			const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
			if (!base64Regex.test(str)) {
				return false;
			}

			// Try to decode and re-encode to verify it's valid
			const decoded = atob(str);
			const reencoded = btoa(decoded);
			return reencoded === str;
		} catch (_error) {
			return false;
		}
	}
}
