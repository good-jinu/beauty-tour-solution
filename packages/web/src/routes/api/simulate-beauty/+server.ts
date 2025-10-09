import type { BeautySimulationRequest } from "@bts/core";
import { BeautySimulator } from "@bts/core";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

// Use the region from SvelteKit server env if available, otherwise default to us-east-1
const awsRegion = env.AWS_REGION ?? "us-east-1";
const beautySimulator = new BeautySimulator({ awsRegion });

// Constants for validation
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const SUPPORTED_FORMATS = ["jpeg", "jpg", "png", "webp"];
const MAX_BASE64_SIZE = Math.ceil((MAX_IMAGE_SIZE * 4) / 3); // Base64 is ~33% larger

/**
 * Validates the image format
 */
function validateImageFormat(format: string): boolean {
	return SUPPORTED_FORMATS.includes(format.toLowerCase());
}

/**
 * Validates base64 image data
 */
function validateBase64Image(imageData: string): {
	isValid: boolean;
	error?: string;
} {
	try {
		// Check if it's a data URL and extract the base64 part
		let base64Data = imageData;
		if (imageData.startsWith("data:")) {
			const matches = imageData.match(/^data:image\/[a-z]+;base64,(.+)$/);
			if (!matches) {
				return { isValid: false, error: "Invalid data URL format" };
			}
			base64Data = matches[1];
		}

		// Check base64 size (approximate file size check)
		if (base64Data.length > MAX_BASE64_SIZE) {
			return { isValid: false, error: "Image size exceeds 10MB limit" };
		}

		// Validate base64 format
		if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
			return { isValid: false, error: "Invalid base64 encoding" };
		}

		// Try to decode to verify it's valid base64
		try {
			atob(base64Data);
		} catch {
			return { isValid: false, error: "Invalid base64 data" };
		}

		return { isValid: true };
	} catch (_error) {
		return { isValid: false, error: "Failed to validate image data" };
	}
}

/**
 * Validates the beauty theme
 */
function validateTheme(theme: string): boolean {
	// Import BEAUTY_THEMES to validate against available themes
	const validThemes = [
		"plastic-surgery",
		"hair-treatments",
		"skin-clinic",
		"diet-activities",
		"nail",
		"makeup",
	];
	return validThemes.includes(theme);
}

/**
 * Sanitizes and validates the request data
 */
function validateRequest(data: any): {
	isValid: boolean;
	error?: string;
	sanitizedData?: BeautySimulationRequest;
} {
	// Check required fields
	if (!data || typeof data !== "object") {
		return { isValid: false, error: "Invalid request body" };
	}

	const { image, theme, imageFormat } = data;

	// Validate required fields presence
	if (!image || typeof image !== "string") {
		return {
			isValid: false,
			error: "Image data is required and must be a string",
		};
	}

	if (!theme || typeof theme !== "string") {
		return {
			isValid: false,
			error: "Beauty theme is required and must be a string",
		};
	}

	if (!imageFormat || typeof imageFormat !== "string") {
		return {
			isValid: false,
			error: "Image format is required and must be a string",
		};
	}

	// Validate image format
	if (!validateImageFormat(imageFormat)) {
		return {
			isValid: false,
			error: `Unsupported image format '${imageFormat}'. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
		};
	}

	// Validate theme
	if (!validateTheme(theme)) {
		return {
			isValid: false,
			error: `Invalid beauty theme '${theme}'. Please select a valid theme.`,
		};
	}

	// Validate base64 image data
	const imageValidation = validateBase64Image(image);
	if (!imageValidation.isValid) {
		return { isValid: false, error: imageValidation.error };
	}

	// Sanitize the data
	const sanitizedData: BeautySimulationRequest = {
		image: image.trim(),
		theme: theme.trim().toLowerCase(),
		imageFormat: imageFormat.trim().toLowerCase(),
	};

	return { isValid: true, sanitizedData };
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse request body
		let requestData: any;
		try {
			requestData = await request.json();
		} catch (_error) {
			return json(
				{
					success: false,
					error: "Invalid JSON in request body",
					details: "Please ensure the request body contains valid JSON data",
				},
				{ status: 400 },
			);
		}

		// Validate and sanitize request
		const validation = validateRequest(requestData);
		if (!validation.isValid || !validation.sanitizedData) {
			return json(
				{
					success: false,
					error: "Request validation failed",
					details: validation.error,
				},
				{ status: 400 },
			);
		}

		// At this point, we have valid, sanitized data
		const simulationRequest = validation.sanitizedData;

		// Call the BeautySimulator service
		const result = await beautySimulator.simulateBeauty(simulationRequest);

		// Format and return the response
		if (result.success) {
			return json(result, { status: 200 });
		} else {
			// Determine appropriate HTTP status code based on error type
			let statusCode = 500; // Default to internal server error

			if (
				result.error.includes("Invalid") ||
				result.error.includes("validation")
			) {
				statusCode = 400; // Bad request for validation errors
			} else if (
				result.error.includes("unavailable") ||
				result.error.includes("throttl")
			) {
				statusCode = 503; // Service unavailable for rate limiting/throttling
			} else if (result.error.includes("timeout")) {
				statusCode = 504; // Gateway timeout
			}

			return json(result, { status: statusCode });
		}
	} catch (error) {
		console.error("Beauty Simulation API Error:", error);

		// Handle specific error types with appropriate responses
		if (error instanceof Error) {
			// Handle timeout errors
			if (error.name === "TimeoutError" || error.message.includes("timeout")) {
				return json(
					{
						success: false,
						error: "Request timeout",
						details:
							"The beauty simulation request timed out. Please try again.",
					},
					{ status: 504 },
				);
			}

			// Handle network/connection errors
			if (error.name === "NetworkError" || error.message.includes("network")) {
				return json(
					{
						success: false,
						error: "Network error",
						details:
							"Unable to connect to the beauty simulation service. Please try again.",
					},
					{ status: 503 },
				);
			}

			// Handle AWS-specific errors that might bubble up
			if (
				error.name === "CredentialsError" ||
				error.message.includes("credentials")
			) {
				return json(
					{
						success: false,
						error: "Service configuration error",
						details:
							"The beauty simulation service is temporarily unavailable.",
					},
					{ status: 503 },
				);
			}
		}

		// Generic internal server error for unhandled cases
		return json(
			{
				success: false,
				error: "Internal server error",
				details: "An unexpected error occurred while processing your request",
			},
			{ status: 500 },
		);
	}
};
