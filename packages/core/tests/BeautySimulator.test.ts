import { BedrockService, S3Service } from "@bts/infra";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { BeautySimulator } from "../src/agent/BeautySimulator";
import type { BeautySimulationRequest } from "../src/types";

// Mock the infra services
vi.mock("@bts/infra", () => ({
	BedrockService: vi.fn(),
	S3Service: vi.fn(),
}));

describe("BeautySimulator", () => {
	let beautySimulator: BeautySimulator;
	let mockBedrockService: {
		generateImage: Mock;
	};
	let mockS3Service: {
		uploadImage: Mock;
		getPublicUrl: Mock;
	};

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Create mock implementations
		mockBedrockService = {
			generateImage: vi.fn(),
		};

		mockS3Service = {
			uploadImage: vi.fn(),
			getPublicUrl: vi.fn(),
		};

		// Mock the service constructors
		(BedrockService as unknown as Mock).mockImplementation(
			() => mockBedrockService,
		);
		(S3Service as unknown as Mock).mockImplementation(() => mockS3Service);

		beautySimulator = new BeautySimulator({
			awsRegion: "us-east-1",
			modelId: "test-model",
			maxImageSize: 1024,
			bucketName: "test-bucket",
		});
	});

	describe("constructor", () => {
		it("should initialize with default config", () => {
			new BeautySimulator();
			expect(BedrockService).toHaveBeenCalledWith({
				region: undefined,
				modelId: undefined,
				maxImageSize: undefined,
			});
			expect(S3Service).toHaveBeenCalledWith({
				region: undefined,
				bucketName: undefined,
			});
		});

		it("should initialize with custom config", () => {
			const config = {
				awsRegion: "eu-west-1",
				modelId: "custom-model",
				maxImageSize: 2048,
				bucketName: "custom-bucket",
			};

			new BeautySimulator(config);

			expect(BedrockService).toHaveBeenCalledWith({
				region: "eu-west-1",
				modelId: "custom-model",
				maxImageSize: 2048,
			});
			expect(S3Service).toHaveBeenCalledWith({
				region: "eu-west-1",
				bucketName: "custom-bucket",
			});
		});
	});

	describe("simulateBeauty", () => {
		const validRequest: BeautySimulationRequest = {
			image: "base64-encoded-image",
			theme: "plastic-surgery",
			imageFormat: "jpeg",
		};

		it("should return error for invalid theme", async () => {
			const invalidRequest = {
				...validRequest,
				theme: "invalid-theme",
			};

			const result = await beautySimulator.simulateBeauty(invalidRequest);

			expect(result).toEqual({
				success: false,
				error: "Invalid beauty theme",
				details: "Theme 'invalid-theme' is not supported",
			});
		});

		it("should return error when input image upload fails", async () => {
			mockS3Service.uploadImage.mockResolvedValueOnce({
				success: false,
				error: "Upload failed",
			});

			const result = await beautySimulator.simulateBeauty(validRequest);

			expect(result).toEqual({
				success: false,
				error: "Failed to store input image",
				details: "Upload failed",
			});
		});

		it("should return error when Bedrock generation fails", async () => {
			mockS3Service.uploadImage.mockResolvedValueOnce({
				success: true,
				key: "input-key",
			});

			mockBedrockService.generateImage.mockResolvedValueOnce({
				success: false,
				error: "Generation failed",
				details: "Model error",
			});

			const result = await beautySimulator.simulateBeauty(validRequest);

			expect(result).toEqual({
				success: false,
				error: "Generation failed",
				details: "Model error",
				storage: {
					inputKey: "input-key",
					outputKey: null,
				},
			});
		});

		it("should handle successful simulation with output upload failure", async () => {
			mockS3Service.uploadImage
				.mockResolvedValueOnce({
					success: true,
					key: "input-key",
				})
				.mockResolvedValueOnce({
					success: false,
					error: "Output upload failed",
				});

			mockBedrockService.generateImage.mockResolvedValueOnce({
				success: true,
				simulatedImage: "simulated-base64-image",
				processingTime: 5000,
			});

			mockS3Service.getPublicUrl.mockReturnValue(
				"https://example.com/input-key",
			);

			const result = await beautySimulator.simulateBeauty(validRequest);

			expect(result).toEqual({
				success: true,
				originalImage: "base64-encoded-image",
				simulatedImage: "simulated-base64-image",
				theme: "plastic-surgery",
				processingTime: 5000,
				storage: {
					inputKey: "input-key",
					outputKey: null,
					inputUrl: "https://example.com/input-key",
					outputUrl: null,
				},
			});
		});

		it("should handle completely successful simulation", async () => {
			mockS3Service.uploadImage
				.mockResolvedValueOnce({
					success: true,
					key: "input-key",
				})
				.mockResolvedValueOnce({
					success: true,
					key: "output-key",
				});

			mockBedrockService.generateImage.mockResolvedValueOnce({
				success: true,
				simulatedImage: "simulated-base64-image",
				processingTime: 3000,
			});

			mockS3Service.getPublicUrl
				.mockReturnValueOnce("https://example.com/input-key")
				.mockReturnValueOnce("https://example.com/output-key");

			const result = await beautySimulator.simulateBeauty(validRequest);

			expect(result).toEqual({
				success: true,
				originalImage: "base64-encoded-image",
				simulatedImage: "simulated-base64-image",
				theme: "plastic-surgery",
				processingTime: 3000,
				storage: {
					inputKey: "input-key",
					outputKey: "output-key",
					inputUrl: "https://example.com/input-key",
					outputUrl: "https://example.com/output-key",
				},
			});

			// Verify service calls
			expect(mockS3Service.uploadImage).toHaveBeenCalledTimes(2);
			expect(mockS3Service.uploadImage).toHaveBeenNthCalledWith(
				1,
				"base64-encoded-image",
				"jpeg",
				"input",
			);
			expect(mockS3Service.uploadImage).toHaveBeenNthCalledWith(
				2,
				"simulated-base64-image",
				"jpeg",
				"output",
			);

			expect(mockBedrockService.generateImage).toHaveBeenCalledWith({
				image: "base64-encoded-image",
				themePrompt: {
					text: "Enhanced facial features with natural-looking cosmetic improvements, subtle refinements, professional results, beautiful face",
					negativeText:
						"unnatural, overdone, artificial, bad quality, distorted, unrealistic, deformed",
				},
				imageFormat: "jpeg",
			});
		});

		it("should handle unexpected errors gracefully", async () => {
			mockS3Service.uploadImage.mockRejectedValueOnce(
				new Error("Network error"),
			);

			const result = await beautySimulator.simulateBeauty(validRequest);

			expect(result).toEqual({
				success: false,
				error: "Failed to generate beauty simulation",
				details: "Network error",
			});
		});

		it("should handle Bedrock response without simulatedImage", async () => {
			mockS3Service.uploadImage.mockResolvedValueOnce({
				success: true,
				key: "input-key",
			});

			mockBedrockService.generateImage.mockResolvedValueOnce({
				success: true,
				simulatedImage: null,
			});

			const result = await beautySimulator.simulateBeauty(validRequest);

			expect(result).toEqual({
				success: false,
				error: "Failed to generate beauty simulation",
				details: undefined,
				storage: {
					inputKey: "input-key",
					outputKey: null,
				},
			});
		});
	});

	describe("theme validation", () => {
		it("should accept all valid beauty themes", async () => {
			const validThemes = [
				"plastic-surgery",
				"hair-treatments",
				"skin-clinic",
				"diet-activities",
				"nail",
				"makeup",
			];

			for (const theme of validThemes) {
				mockS3Service.uploadImage.mockResolvedValueOnce({
					success: true,
					key: "input-key",
				});

				mockBedrockService.generateImage.mockResolvedValueOnce({
					success: true,
					simulatedImage: "simulated-image",
					processingTime: 1000,
				});

				mockS3Service.uploadImage.mockResolvedValueOnce({
					success: true,
					key: "output-key",
				});

				const request: BeautySimulationRequest = {
					image: "test-image",
					theme,
					imageFormat: "jpeg",
				};

				const result = await beautySimulator.simulateBeauty(request);
				expect(result.success).toBe(true);
			}
		});
	});
});
