import {
	BedrockRuntimeClient,
	InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { BedrockConfig } from "../types/index.js";

export interface BedrockImageGenerationRequest {
	image: string; // base64 encoded
	theme: string;
	imageFormat: string;
}

export interface BedrockImageGenerationResponse {
	success: boolean;
	simulatedImage?: string;
	error?: string;
	details?: string;
	processingTime?: number;
}

// Theme-to-prompt mapping for different beauty treatments
const THEME_PROMPTS = {
	"plastic-surgery": {
		text: "Enhanced facial features with natural-looking cosmetic improvements, subtle refinements, professional results, beautiful face",
		negativeText:
			"unnatural, overdone, artificial, bad quality, distorted, unrealistic, deformed",
	},
	"hair-treatments": {
		text: "Healthy, voluminous, styled hair with professional treatment results, lustrous shine, full coverage, beautiful hair",
		negativeText: "damaged hair, thin hair, bad quality, patchy, uneven, bald",
	},
	"skin-clinic": {
		text: "Clear, smooth, radiant skin with professional skincare treatment results, even tone, healthy glow, flawless skin",
		negativeText:
			"blemishes, wrinkles, dull skin, bad quality, uneven texture, acne",
	},
	"diet-activities": {
		text: "Toned, fit physique with healthy body contouring results, natural proportions, athletic appearance, fit body",
		negativeText:
			"unnatural proportions, bad quality, distorted body, unrealistic, overweight",
	},
	nail: {
		text: "Beautiful, well-manicured nails with professional nail care results, healthy cuticles, perfect shape, elegant nails",
		negativeText: "damaged nails, poor quality, uneven, chipped, dirty nails",
	},
	makeup: {
		text: "Professional makeup application with flawless finish, enhanced natural beauty, expert technique, glamorous makeup",
		negativeText:
			"overdone makeup, bad quality, uneven application, unnatural colors, smudged makeup",
	},
} as const;

export class BedrockService {
	private client: BedrockRuntimeClient;
	private modelId: string;
	private maxImageSize: number;

	constructor(config: BedrockConfig = {}) {
		const region = config.region ?? process.env.APP_AWS_REGION ?? "us-east-1";
		this.client = new BedrockRuntimeClient({ region });
		this.modelId = config.modelId ?? "amazon.titan-image-generator-v2:0";
		this.maxImageSize = config.maxImageSize ?? 1024;
	}

	async generateImage(
		request: BedrockImageGenerationRequest,
	): Promise<BedrockImageGenerationResponse> {
		const startTime = Date.now();

		try {
			// Validate and process the image
			const processedImage = this.prepareImageForBedrock(
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

			// Create the prompt based on theme
			const prompt = this.createPrompt(request.theme);

			// Use IMAGE_VARIATION instead of INPAINTING for better compatibility
			const payload = {
				taskType: "IMAGE_VARIATION",
				imageVariationParams: {
					text: prompt.text,
					negativeText: prompt.negativeText,
					images: [processedImage],
					similarityStrength: 0.7, // Keep some similarity to original
				},
				imageGenerationConfig: {
					numberOfImages: 1,
					quality: "standard",
					cfgScale: 8.0,
					height: this.maxImageSize,
					width: this.maxImageSize,
					seed: Math.floor(Math.random() * 2147483647),
				},
			};

			const command = new InvokeModelCommand({
				modelId: this.modelId,
				body: JSON.stringify(payload),
				contentType: "application/json",
				accept: "application/json",
			});

			const response = await this.client.send(command);

			if (!response.body) {
				return {
					success: false,
					error: "No response from image generation service",
					details: "AWS Bedrock returned empty response",
				};
			}

			// Parse the response
			const responseBody = JSON.parse(new TextDecoder().decode(response.body));

			if (!responseBody.images || responseBody.images.length === 0) {
				return {
					success: false,
					error: "No images generated",
					details: "Image generation service did not return any images",
				};
			}

			const processingTime = Date.now() - startTime;

			return {
				success: true,
				simulatedImage: responseBody.images[0],
				processingTime,
			};
		} catch (error) {
			console.error("Bedrock Image Generation Error:", error);

			// Handle specific AWS errors
			if (error instanceof Error) {
				if (error.name === "ThrottlingException") {
					return {
						success: false,
						error: "Service temporarily unavailable",
						details: "Too many requests. Please try again in a moment.",
					};
				}

				if (error.name === "ValidationException") {
					return {
						success: false,
						error: "Invalid request data",
						details: error.message,
					};
				}
			}

			return {
				success: false,
				error: "Failed to generate beauty simulation",
				details: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Prepares image for Bedrock by validating format and size
	 */
	private prepareImageForBedrock(
		imageBase64: string,
		format: string,
	): string | null {
		try {
			// Validate image format
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
	 * Creates prompt based on beauty theme
	 */
	private createPrompt(theme: string): {
		text: string;
		negativeText: string;
	} {
		const themePrompt = THEME_PROMPTS[theme as keyof typeof THEME_PROMPTS];

		if (!themePrompt) {
			// Fallback for unknown themes
			return {
				text: "Enhanced appearance with professional beauty treatment results, improved features",
				negativeText: "bad quality, unnatural, distorted, deformed",
			};
		}

		return themePrompt;
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
