import type { BedrockImageGenerationRequest } from "@bts/infra";
import { BedrockService, S3Service } from "@bts/infra";
import type {
	BeautySimulationRequest,
	BeautySimulationResponse,
	ThemePromptKey,
} from "../types";
import { BEAUTY_THEMES, THEME_PROMPTS } from "../types";

export interface BeautySimulatorConfig {
	awsRegion?: string;
	modelId?: string;
	maxImageSize?: number;
	bucketName?: string;
}

export class BeautySimulator {
	private bedrockService: BedrockService;
	private s3Service: S3Service;

	constructor(config: BeautySimulatorConfig = {}) {
		this.bedrockService = new BedrockService({
			region: config.awsRegion,
			modelId: config.modelId,
			maxImageSize: config.maxImageSize,
		});

		this.s3Service = new S3Service({
			region: config.awsRegion,
			bucketName: config.bucketName,
		});
	}

	async simulateBeauty(
		request: BeautySimulationRequest,
	): Promise<BeautySimulationResponse> {
		try {
			// Validate the theme
			if (!this.isValidTheme(request.theme)) {
				return {
					success: false,
					error: "Invalid beauty theme",
					details: `Theme '${request.theme}' is not supported`,
				};
			}

			// Upload input image to S3
			const inputUploadResult = await this.s3Service.uploadImage(
				request.image,
				request.imageFormat,
				"input",
			);

			if (!inputUploadResult.success) {
				return {
					success: false,
					error: "Failed to store input image",
					details: inputUploadResult.error,
				};
			}

			// Get the theme prompt for the requested theme
			const themePrompt = THEME_PROMPTS[request.theme as ThemePromptKey] || {
				text: "Enhanced appearance with professional beauty treatment results, improved features",
				negativeText: "bad quality, unnatural, distorted, deformed",
			};

			// Generate the beauty simulation using Bedrock
			const bedrockRequest: BedrockImageGenerationRequest = {
				image: request.image,
				themePrompt: themePrompt,
				imageFormat: request.imageFormat,
			};

			const bedrockResult =
				await this.bedrockService.generateImage(bedrockRequest);

			if (!bedrockResult.success || !bedrockResult.simulatedImage) {
				return {
					success: false,
					error: bedrockResult.error ?? "Failed to generate beauty simulation",
					details: bedrockResult.details,
					storage: {
						inputKey: inputUploadResult.key,
						outputKey: null,
					},
				};
			}

			// Upload output image to S3
			const outputUploadResult = await this.s3Service.uploadImage(
				bedrockResult.simulatedImage,
				request.imageFormat,
				"output",
			);

			if (!outputUploadResult.success) {
				console.error(
					"Failed to store output image:",
					outputUploadResult.error,
				);
				// Continue with response even if output storage fails
			}

			return {
				success: true,
				originalImage: request.image,
				simulatedImage: bedrockResult.simulatedImage,
				theme: request.theme,
				processingTime: bedrockResult.processingTime ?? 0,
				storage: {
					inputKey: inputUploadResult.key,
					outputKey: outputUploadResult.success ? outputUploadResult.key : null,
					inputUrl: inputUploadResult.key
						? this.s3Service.getPublicUrl(inputUploadResult.key)
						: undefined,
					outputUrl:
						outputUploadResult.success && outputUploadResult.key
							? this.s3Service.getPublicUrl(outputUploadResult.key)
							: null,
				},
			};
		} catch (error) {
			console.error("Beauty Simulation Error:", error);
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
}
