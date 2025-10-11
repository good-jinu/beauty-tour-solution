import { BedrockConversationService } from "@bts/infra";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { JourneyGenerator } from "../src/agent/JourneyGenerator";
import type { GenerateJourneyRequest } from "../src/types";

// Mock the infra service
vi.mock("@bts/infra", () => ({
	BedrockConversationService: vi.fn(),
}));

describe("JourneyGenerator", () => {
	let journeyGenerator: JourneyGenerator;
	let mockConversationService: {
		generateResponse: Mock;
	};

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Create mock implementation
		mockConversationService = {
			generateResponse: vi.fn(),
		};

		// Mock the service constructor
		(BedrockConversationService as unknown as Mock).mockImplementation(
			() => mockConversationService,
		);

		journeyGenerator = new JourneyGenerator({
			awsRegion: "us-east-1",
			modelId: "test-model",
		});
	});

	describe("constructor", () => {
		it("should initialize with default config", () => {
			new JourneyGenerator();
			expect(BedrockConversationService).toHaveBeenCalledWith({
				region: undefined,
				modelId: undefined,
			});
		});

		it("should initialize with custom config", () => {
			const config = {
				awsRegion: "eu-west-1",
				modelId: "custom-model",
			};

			new JourneyGenerator(config);

			expect(BedrockConversationService).toHaveBeenCalledWith({
				region: "eu-west-1",
				modelId: "custom-model",
			});
		});
	});

	describe("generateJourney", () => {
		const validRequest: GenerateJourneyRequest = {
			region: "south-korea",
			startDate: "2024-03-15",
			endDate: "2024-03-22",
			theme: "plastic-surgery",
			budget: 10000,
			travelers: 2,
			addOns: {
				flights: true,
				hotels: true,
				activities: false,
				transport: true,
			},
			specialRequests: "Need English-speaking staff",
		};

		it("should generate successful journey recommendation", async () => {
			const mockResponse = `# Beauty Journey Plan for South Korea

## Executive Summary
A comprehensive 7-day plastic surgery journey in Seoul...

## Recommended Clinics
1. **Seoul National University Hospital**
   - World-class plastic surgery department
   - Estimated cost: $5,000-8,000
   - English-speaking staff available

## Day-by-Day Itinerary
**Day 1:** Arrival and consultation
**Day 2:** Pre-surgery preparations
...`;

			mockConversationService.generateResponse.mockResolvedValueOnce({
				success: true,
				response: mockResponse,
			});

			const result = await journeyGenerator.generateJourney(validRequest);

			expect(result).toEqual({
				success: true,
				recommendation: mockResponse,
				formData: validRequest,
			});

			// Verify the conversation service was called with correct parameters
			expect(mockConversationService.generateResponse).toHaveBeenCalledWith({
				prompt: expect.stringContaining("South Korea - Seoul"),
				maxTokens: 4096,
				temperature: 0.7,
				topP: 0.9,
			});
		});

		it("should handle conversation service failure", async () => {
			mockConversationService.generateResponse.mockResolvedValueOnce({
				success: false,
				error: "Model unavailable",
				details: "Service temporarily down",
			});

			const result = await journeyGenerator.generateJourney(validRequest);

			expect(result).toEqual({
				success: false,
				error: "Model unavailable",
				details: "Service temporarily down",
			});
		});

		it("should handle conversation service success without response", async () => {
			mockConversationService.generateResponse.mockResolvedValueOnce({
				success: true,
				response: null,
			});

			const result = await journeyGenerator.generateJourney(validRequest);

			expect(result).toEqual({
				success: false,
				error: "Failed to generate beauty journey recommendations",
				details: undefined,
			});
		});

		it("should create proper prompt with all request data", async () => {
			mockConversationService.generateResponse.mockResolvedValueOnce({
				success: true,
				response: "Test response",
			});

			await journeyGenerator.generateJourney(validRequest);

			const callArgs =
				mockConversationService.generateResponse.mock.calls[0][0];
			const prompt = callArgs.prompt;

			// Check that prompt contains key information
			expect(prompt).toContain("South Korea - Seoul");
			expect(prompt).toContain("2024-03-15 to 2024-03-22");
			expect(prompt).toContain("7 days");
			expect(prompt).toContain("Plastic Surgery");
			expect(prompt).toContain("2 person(s)");
			expect(prompt).toContain("$10000 USD");
			expect(prompt).toContain(
				"flights, recovery accommodation, medical transport",
			);
			expect(prompt).toContain("Need English-speaking staff");
		});

		it("should handle request without special requests", async () => {
			const requestWithoutSpecialRequests = {
				...validRequest,
				specialRequests: null,
			};

			mockConversationService.generateResponse.mockResolvedValueOnce({
				success: true,
				response: "Test response",
			});

			await journeyGenerator.generateJourney(requestWithoutSpecialRequests);

			const callArgs =
				mockConversationService.generateResponse.mock.calls[0][0];
			const prompt = callArgs.prompt;

			expect(prompt).not.toContain("Special Requests:");
		});

		it("should handle request with no add-ons", async () => {
			const requestWithNoAddOns = {
				...validRequest,
				addOns: {
					flights: false,
					hotels: false,
					activities: false,
					transport: false,
				},
			};

			mockConversationService.generateResponse.mockResolvedValueOnce({
				success: true,
				response: "Test response",
			});

			await journeyGenerator.generateJourney(requestWithNoAddOns);

			const callArgs =
				mockConversationService.generateResponse.mock.calls[0][0];
			const prompt = callArgs.prompt;

			expect(prompt).toContain("treatments only");
		});

		it("should calculate duration correctly for different date ranges", async () => {
			const testCases = [
				{ start: "2024-03-15", end: "2024-03-16", expectedDays: 1 },
				{ start: "2024-03-15", end: "2024-03-22", expectedDays: 7 },
				{ start: "2024-03-01", end: "2024-03-31", expectedDays: 30 },
			];

			for (const testCase of testCases) {
				const request = {
					...validRequest,
					startDate: testCase.start,
					endDate: testCase.end,
				};

				mockConversationService.generateResponse.mockResolvedValueOnce({
					success: true,
					response: "Test response",
				});

				await journeyGenerator.generateJourney(request);

				const callArgs =
					mockConversationService.generateResponse.mock.calls[0][0];
				const prompt = callArgs.prompt;

				expect(prompt).toContain(`${testCase.expectedDays} days`);

				// Reset mock for next iteration
				mockConversationService.generateResponse.mockClear();
			}
		});

		it("should handle all valid regions and themes", async () => {
			const validRegions = [
				"south-korea",
				"thailand",
				"brazil",
				"japan",
				"france",
				"turkey",
				"germany",
				"mexico",
				"usa-new-york",
				"usa-los-angeles",
			];

			const validThemes = [
				"plastic-surgery",
				"hair-treatments",
				"skin-clinic",
				"diet-activities",
				"nail",
				"makeup",
			];

			for (const region of validRegions) {
				for (const theme of validThemes) {
					const request = {
						...validRequest,
						region,
						theme,
					};

					mockConversationService.generateResponse.mockResolvedValueOnce({
						success: true,
						response: "Test response",
					});

					const result = await journeyGenerator.generateJourney(request);
					expect(result.success).toBe(true);

					// Reset mock for next iteration
					mockConversationService.generateResponse.mockClear();
				}
			}
		});

		it("should handle single traveler correctly", async () => {
			const singleTravelerRequest = {
				...validRequest,
				travelers: 1,
			};

			mockConversationService.generateResponse.mockResolvedValueOnce({
				success: true,
				response: "Test response",
			});

			await journeyGenerator.generateJourney(singleTravelerRequest);

			const callArgs =
				mockConversationService.generateResponse.mock.calls[0][0];
			const prompt = callArgs.prompt;

			expect(prompt).toContain("1 person(s)");
		});

		it("should format budget correctly", async () => {
			const budgetTestCases = [1000, 5000, 15000, 50000];

			for (const budget of budgetTestCases) {
				const request = {
					...validRequest,
					budget,
				};

				mockConversationService.generateResponse.mockResolvedValueOnce({
					success: true,
					response: "Test response",
				});

				await journeyGenerator.generateJourney(request);

				const callArgs =
					mockConversationService.generateResponse.mock.calls[0][0];
				const prompt = callArgs.prompt;

				expect(prompt).toContain(`$${budget} USD`);

				// Reset mock for next iteration
				mockConversationService.generateResponse.mockClear();
			}
		});
	});

	describe("prompt generation", () => {
		it("should include all required sections in prompt", async () => {
			mockConversationService.generateResponse.mockResolvedValueOnce({
				success: true,
				response: "Test response",
			});

			const request: GenerateJourneyRequest = {
				region: "thailand",
				startDate: "2024-04-01",
				endDate: "2024-04-10",
				theme: "skin-clinic",
				budget: 8000,
				travelers: 1,
				addOns: {
					flights: true,
					hotels: true,
					activities: true,
					transport: false,
				},
				specialRequests: "Vegetarian meals preferred",
			};

			await journeyGenerator.generateJourney(request);

			const callArgs =
				mockConversationService.generateResponse.mock.calls[0][0];
			const prompt = callArgs.prompt;

			// Check for required prompt sections
			expect(prompt).toContain("Executive Summary");
			expect(prompt).toContain("Recommended Clinics/Facilities");
			expect(prompt).toContain("Day-by-Day Itinerary");
			expect(prompt).toContain("Accommodation Recommendations");
			expect(prompt).toContain("Budget Breakdown");
			expect(prompt).toContain("Important Considerations");
			expect(prompt).toContain("Tips for This Destination");
			expect(prompt).toContain("markdown formatting");
		});
	});
});
