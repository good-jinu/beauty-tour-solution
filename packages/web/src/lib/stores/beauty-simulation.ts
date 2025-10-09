import { writable } from "svelte/store";
import { BEAUTY_THEMES } from "$lib/types/beauty-journey.js";

export interface BeautySimulationState {
	// Image upload state
	uploadedImage: File | null;
	imagePreview: string | null;

	// Theme selection state
	selectedTheme: string | null;

	// Simulation state
	isGenerating: boolean;
	simulationResult: string | null; // base64 image
	simulationResultUrl: string | null; // S3 URL for display
	originalImageUrl: string | null; // S3 URL for original image

	// Error state
	error: string | null;

	// Validation state
	isValid: boolean;
}

export interface BeautySimulationErrors {
	image?: string;
	theme?: string;
	simulation?: string;
	general?: string;
}

const initialState: BeautySimulationState = {
	uploadedImage: null,
	imagePreview: null,
	selectedTheme: null,
	isGenerating: false,
	simulationResult: null,
	simulationResultUrl: null,
	originalImageUrl: null,
	error: null,
	isValid: false,
};

export const beautySimulationState =
	writable<BeautySimulationState>(initialState);

// Validation functions
export const BeautySimulationValidation = {
	// Validate theme selection
	validateTheme: (theme: string | null): string | null => {
		if (!theme) {
			return "Please select a beauty treatment theme";
		}

		const isValidTheme = BEAUTY_THEMES.some((t) => t.value === theme);
		if (!isValidTheme) {
			return "Selected theme is not valid";
		}

		return null;
	},

	// Validate image upload
	validateImage: (image: File | null): string | null => {
		if (!image) {
			return "Please upload an image";
		}

		// Check file type
		const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
		if (!allowedTypes.includes(image.type)) {
			return "Please upload a JPEG, PNG, or WebP image";
		}

		// Check file size (10MB max)
		const maxSize = 10 * 1024 * 1024; // 10MB in bytes
		if (image.size > maxSize) {
			return "Image size must be less than 10MB";
		}

		return null;
	},

	// Validate complete simulation state
	validateSimulationState: (
		state: BeautySimulationState,
	): BeautySimulationErrors | null => {
		const errors: BeautySimulationErrors = {};

		const imageError = BeautySimulationValidation.validateImage(
			state.uploadedImage,
		);
		if (imageError) {
			errors.image = imageError;
		}

		const themeError = BeautySimulationValidation.validateTheme(
			state.selectedTheme,
		);
		if (themeError) {
			errors.theme = themeError;
		}

		return Object.keys(errors).length > 0 ? errors : null;
	},

	// Check if simulation can be started
	canStartSimulation: (state: BeautySimulationState): boolean => {
		const errors = BeautySimulationValidation.validateSimulationState(state);
		return errors === null && !state.isGenerating;
	},
};

// Utility functions for state management
export const BeautySimulationUtils = {
	// Reset simulation state
	resetSimulation: () => {
		beautySimulationState.set(initialState);
	},

	// Set image upload
	setImage: (image: File, preview: string) => {
		beautySimulationState.update((state) => ({
			...state,
			uploadedImage: image,
			imagePreview: preview,
			error: null,
			simulationResult: null, // Clear previous result
			isValid: BeautySimulationValidation.canStartSimulation({
				...state,
				uploadedImage: image,
				imagePreview: preview,
			}),
		}));
	},

	// Set theme selection
	setTheme: (theme: string | null) => {
		beautySimulationState.update((state) => ({
			...state,
			selectedTheme: theme,
			error: null,
			simulationResult: null, // Clear previous result
			isValid: BeautySimulationValidation.canStartSimulation({
				...state,
				selectedTheme: theme,
			}),
		}));
	},

	// Set simulation loading state
	setGenerating: (isGenerating: boolean) => {
		beautySimulationState.update((state) => ({
			...state,
			isGenerating,
			error: isGenerating ? null : state.error, // Clear error when starting
		}));
	},

	// Set simulation result
	setSimulationResult: (
		result: string,
		resultUrl?: string,
		originalUrl?: string,
	) => {
		beautySimulationState.update((state) => ({
			...state,
			simulationResult: result,
			simulationResultUrl: resultUrl || null,
			originalImageUrl: originalUrl || null,
			isGenerating: false,
			error: null,
		}));
	},

	// Set error state
	setError: (error: string) => {
		beautySimulationState.update((state) => ({
			...state,
			error,
			isGenerating: false,
		}));
	},

	// Clear error
	clearError: () => {
		beautySimulationState.update((state) => ({
			...state,
			error: null,
		}));
	},

	// Get selected theme data
	getSelectedThemeData: (theme: string | null) => {
		if (!theme) return null;
		return BEAUTY_THEMES.find((t) => t.value === theme) || null;
	},
};
