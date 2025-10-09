import {
	BedrockRuntimeClient,
	InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type {
	BeautySimulationRequest,
	BeautySimulationResponse,
} from "../types";
import { BEAUTY_THEMES } from "../types";

export interface BeautySimulatorConfig {
	awsRegion?: string;
	modelId?: string;
	maxImageSize?: number;
}

// Theme-to-prompt mapping for different beauty treatments
const THEME_PROMPTS = {
	"plastic-surgery": {
		text: "Enhanced facial features with natural-looking cosmetic improvements, subtle refinements, professional results",
		negativeText:
			"unnatural, overdone, artificial, bad quality, distorted, unrealistic",
		maskPrompt: "face, facial features",
	},
	"hair-treatments": {
		text: "Healthy, voluminous, styled hair with professional treatment results, lustrous shine, full coverage",
		negativeText: "damaged hair, thin hair, bad quality, patchy, uneven",
		maskPrompt: "hair, scalp",
	},
	"skin-clinic": {
		text: "Clear, smooth, radiant skin with professional skincare treatment results, even tone, healthy glow",
		negativeText: "blemishes, wrinkles, dull skin, bad quality, uneven texture",
		maskPrompt: "face, skin, facial skin",
	},
	"diet-activities": {
		text: "Toned, fit physique with healthy body contouring results, natural proportions, athletic appearance",
		negativeText:
			"unnatural proportions, bad quality, distorted body, unrealistic",
		maskPrompt: "body, torso, silhouette",
	},
	nail: {
		text: "Beautiful, well-manicured nails with professional nail care results, healthy cuticles, perfect shape",
		negativeText: "damaged nails, poor quality, uneven, chipped",
		maskPrompt: "hands, nails, fingers",
	},
	makeup: {
		text: "Professional makeup application with flawless finish, enhanced natural beauty, expert technique",
		negativeText:
			"overdone makeup, bad quality, uneven application, unnatural colors",
		maskPrompt: "face, makeup areas",
	},
} as const;

export class BeautySimulator {
	private client: BedrockRuntimeClient;
	private modelId: string;
	private maxImageSize: number;

	constructor(config: BeautySimulatorConfig = {}) {
		const awsRegion = config.awsRegion ?? "us-east-1";
		this.client = new BedrockRuntimeClient({ region: awsRegion });
		this.modelId = config.modelId ?? "amazon.titan-image-generator-v1";
		this.maxImageSize = config.maxImageSize ?? 1024;
	}

	async simulateBeauty(
		request: BeautySimulationRequest,
	): Promise<BeautySimulationResponse> {
		const startTime = Date.now();

		try {
			// Validate the theme
			if (!this.isValidTheme(request.theme)) {
				return {
					success: false,
					error: "Invalid beauty theme",
					details: `Theme '${request.theme}' is not supported`,
				};
			}

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

			// Create the inpainting prompt based on theme
			const prompt = this.createInpaintingPrompt(request.theme);

			// Prepare the request payload for Titan Image Generator
			const payload = {
				taskType: "INPAINTING",
				inPaintingParams: {
					text: prompt.text,
					negativeText: prompt.negativeText,
					image: processedImage,
					maskPrompt: prompt.maskPrompt,
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
				originalImage: request.image,
				simulatedImage: responseBody.images[0],
				theme: request.theme,
				processingTime,
			};
		} catch (error) {
			console.error("Beauty Simulation Error:", error);

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
	 * Validates if the provided theme is supported
	 */
	private isValidTheme(theme: string): boolean {
		return BEAUTY_THEMES.some((t) => t.value === theme);
	}

	/**
	 * Prepares image for Bedrock by validating format and size
	 */
	private prepareImageForBedrock(
		imageBase64: string,
		format: string,
	): string | null {
		try {
			// Validate base64 format
			if (!this.isValidBase64(imageBase64)) {
				return null;
			}

			// Validate image format
			if (!["jpeg", "jpg", "png", "webp"].includes(format.toLowerCase())) {
				return null;
			}

			// For now, return the image as-is
			// In a production environment, you might want to:
			// 1. Decode the base64 image
			// 2. Resize if larger than maxImageSize
			// 3. Convert to JPEG if needed for optimization
			// 4. Re-encode to base64

			return imageBase64;
		} catch (error) {
			console.error("Image processing error:", error);
			return null;
		}
	}

	/**
	 * Creates inpainting prompt based on beauty theme
	 */
	private createInpaintingPrompt(theme: string): {
		text: string;
		negativeText: string;
		maskPrompt: string;
	} {
		const themePrompt = THEME_PROMPTS[theme as keyof typeof THEME_PROMPTS];

		if (!themePrompt) {
			// Fallback for unknown themes
			return {
				text: "Enhanced appearance with professional beauty treatment results",
				negativeText: "bad quality, unnatural, distorted",
				maskPrompt: "face, features",
			};
		}

		return themePrompt;
	}

	/**
	 * Validates base64 string format
	 */
	private isValidBase64(str: string): boolean {
		try {
			// Remove data URL prefix if present
			const base64Data = str.replace(/^data:image\/[a-z]+;base64,/, "");

			// Check if it's valid base64
			return btoa(atob(base64Data)) === base64Data;
		} catch (_error) {
			return false;
		}
	}
}
