export interface StepperFormData {
	// Optional - Country Selection (only when country step is enabled)
	selectedCountry?: string;

	// Required - Date Selection
	startDate: string;
	endDate: string;

	// Required - Theme Selection (multiple selection)
	selectedThemes: string[]; // Updated to support multiple selection as required

	// Required - Budget Selection
	budget: number;
	currency?: "USD" | "EUR" | "GBP"; // Optional currency selection

	// Optional - More Requests
	moreRequests?: string;
}

// Partial interface for step-by-step validation
export interface PartialStepperFormData {
	selectedCountry?: string;
	startDate?: string;
	endDate?: string;
	selectedThemes?: string[];
	budget?: number;
	currency?: "USD" | "EUR" | "GBP";
	moreRequests?: string;
}

// Step-specific error interfaces
export interface CountryStepErrors {
	country?: string;
	general?: string;
}

export interface DateStepErrors {
	startDate?: string;
	endDate?: string;
	dateRange?: string;
	general?: string;
}

export interface ThemeStepErrors {
	themes?: string;
	compatibility?: string;
	selection?: string;
	general?: string;
}

export interface BudgetStepErrors {
	budget?: string;
	currency?: string;
	range?: string;
	general?: string;
}

export interface AdditionalRequestStepErrors {
	length?: string;
	content?: string;
	general?: string;
}

// Union type for all step errors
export type AnyStepErrors =
	| CountryStepErrors
	| DateStepErrors
	| ThemeStepErrors
	| BudgetStepErrors
	| AdditionalRequestStepErrors;

// Main stepper errors interface
export interface StepperErrors {
	step1?: AnyStepErrors;
	step2?: AnyStepErrors;
	step3?: AnyStepErrors;
	step4?: AnyStepErrors;
	step5?: AnyStepErrors; // Support for more steps if needed
	global?: string; // For cross-step validation errors
}

// Helper type to get the correct error type for a step ID
export type StepErrorType<T extends string> = T extends "country"
	? CountryStepErrors
	: T extends "dates"
		? DateStepErrors
		: T extends "themes"
			? ThemeStepErrors
			: T extends "budget"
				? BudgetStepErrors
				: T extends "more-requests"
					? AdditionalRequestStepErrors
					: never;

export interface StepperState {
	currentStep: number;
	completedSteps: Set<number>;
	formData: StepperFormData;
	errors: StepperErrors;
	isLoading: boolean;
	enabledSteps: string[]; // Dynamic list of enabled steps
	stepMapping: Record<number, string>; // Maps step numbers to step IDs
}

// Dynamic step configuration - steps can be optional
export interface StepConfig {
	id: string;
	label: string;
	component: string;
	optional: boolean;
	defaultOrder: number;
}

export const AVAILABLE_STEPS: Record<string, StepConfig> = {
	country: {
		id: "country",
		label: "Select Country",
		component: "CountrySelection",
		optional: true, // Now optional by default
		defaultOrder: 1,
	},
	dates: {
		id: "dates",
		label: "Choose Dates",
		component: "DateSelection",
		optional: false,
		defaultOrder: 2,
	},
	themes: {
		id: "themes",
		label: "Pick Themes",
		component: "ThemeSelection",
		optional: false,
		defaultOrder: 3,
	},
	budget: {
		id: "budget",
		label: "Set Budget",
		component: "BudgetSelection",
		optional: false,
		defaultOrder: 4,
	},
	"more-requests": {
		id: "more-requests",
		label: "Additional Requests",
		component: "AdditionalRequestStep",
		optional: true,
		defaultOrder: 5,
	},
};

// Default steps (without optional country selection)
export const DEFAULT_STEP_ORDER = [
	"dates",
	"themes",
	"budget",
	"more-requests",
];

// Helper function to get total steps based on enabled steps
export function getTotalSteps(enabledSteps: string[]): number {
	return enabledSteps.length;
}

// Helper function to get step labels based on enabled steps
export function getStepLabels(enabledSteps: string[]): string[] {
	return enabledSteps.map(
		(stepId) => AVAILABLE_STEPS[stepId]?.label || "Unknown Step",
	);
}

// Backward compatibility exports
export const TOTAL_STEPS = 4; // Keep for backward compatibility
export const STEP_LABELS = [
	"Select Country",
	"Choose Dates",
	"Pick Themes",
	"Set Budget",
]; // Keep for backward compatibility

// Validation helper functions for each step
export const StepValidation = {
	// Country Selection validation (when enabled)
	validateCountryStep: (
		data: PartialStepperFormData,
	): CountryStepErrors | null => {
		const errors: CountryStepErrors = {};

		if (!data.selectedCountry || data.selectedCountry.trim() === "") {
			errors.country = "Please select a country for your beauty tour";
		}

		return Object.keys(errors).length > 0 ? errors : null;
	},

	// Date Selection validation
	validateDatesStep: (data: PartialStepperFormData): DateStepErrors | null => {
		const errors: DateStepErrors = {};

		if (!data.startDate) {
			errors.startDate = "Please select a start date";
		}

		if (!data.endDate) {
			errors.endDate = "Please select an end date";
		}

		if (data.startDate && data.endDate) {
			const startDate = new Date(data.startDate);
			const endDate = new Date(data.endDate);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (startDate < today) {
				errors.startDate = "Start date must be in the future";
			}

			if (endDate <= startDate) {
				errors.dateRange = "End date must be after start date";
			}

			// Check minimum stay (2 days)
			const daysDiff = Math.ceil(
				(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
			);
			if (daysDiff < 2) {
				errors.dateRange = "Minimum stay is 2 days";
			}

			// Check maximum stay (30 days)
			if (daysDiff > 30) {
				errors.dateRange = "Maximum stay is 30 days";
			}
		}

		return Object.keys(errors).length > 0 ? errors : null;
	},

	// Theme Selection validation
	validateThemesStep: (
		data: PartialStepperFormData,
	): ThemeStepErrors | null => {
		const errors: ThemeStepErrors = {};

		if (!data.selectedThemes || data.selectedThemes.length === 0) {
			errors.themes = "Please select at least one treatment theme";
		}

		// Check for theme compatibility (placeholder for future enhancement)
		if (data.selectedThemes && data.selectedThemes.length > 1) {
			// This could be enhanced with actual compatibility rules
			const incompatibleCombinations = [
				["plastic-surgery", "wellness-spa"], // Example incompatible combination
			];

			for (const combo of incompatibleCombinations) {
				if (
					combo.every((theme) => data.selectedThemes?.includes(theme) ?? false)
				) {
					errors.compatibility = `${combo.join(" and ")} treatments may not be suitable together. Please consult with our specialists.`;
				}
			}
		}

		return Object.keys(errors).length > 0 ? errors : null;
	},

	// Budget Selection validation
	validateBudgetStep: (
		data: PartialStepperFormData,
	): BudgetStepErrors | null => {
		const errors: BudgetStepErrors = {};

		if (!data.budget || data.budget <= 0) {
			errors.budget = "Please set a budget for your beauty tour";
		}

		if (data.budget && data.budget < 500) {
			errors.range = "Minimum budget is $500 for a quality beauty tour";
		}

		if (data.budget && data.budget > 50000) {
			errors.range =
				"Maximum budget is $50,000. Please contact us for premium packages.";
		}

		return Object.keys(errors).length > 0 ? errors : null;
	},

	// More Requests validation
	validateMoreRequestsStep: (
		data: PartialStepperFormData,
	): AdditionalRequestStepErrors | null => {
		const errors: AdditionalRequestStepErrors = {};

		// This step is optional, so empty requests are valid
		if (data.moreRequests && data.moreRequests.trim().length > 0) {
			// Validate length constraints
			if (data.moreRequests.trim().length < 10) {
				errors.length =
					"Please provide more detailed information about your specific requests";
			}

			if (data.moreRequests.trim().length > 1000) {
				errors.length = "Please keep your request under 1000 characters";
			}

			// Basic content validation
			const hasOnlySpecialChars = /^[^a-zA-Z0-9\s]*$/.test(
				data.moreRequests.trim(),
			);
			if (hasOnlySpecialChars) {
				errors.content = "Please provide meaningful text in your request";
			}
		}

		return Object.keys(errors).length > 0 ? errors : null;
	},

	// Validate step by step ID
	validateStepById: (
		stepId: string,
		data: PartialStepperFormData,
	): AnyStepErrors | null => {
		switch (stepId) {
			case "country":
				return StepValidation.validateCountryStep(data);
			case "dates":
				return StepValidation.validateDatesStep(data);
			case "themes":
				return StepValidation.validateThemesStep(data);
			case "budget":
				return StepValidation.validateBudgetStep(data);
			case "more-requests":
				return StepValidation.validateMoreRequestsStep(data);
			default:
				return null;
		}
	},

	// Validate all enabled steps
	validateAllSteps: (
		data: PartialStepperFormData,
		enabledSteps: string[],
	): StepperErrors | null => {
		const errors: StepperErrors = {};

		enabledSteps.forEach((stepId, index) => {
			const stepNumber = index + 1;
			const stepErrors = StepValidation.validateStepById(stepId, data);

			if (stepErrors) {
				// Use type assertion to safely assign to dynamic keys
				(errors as Record<string, AnyStepErrors | undefined>)[
					`step${stepNumber}`
				] = stepErrors;
			}
		});

		return Object.keys(errors).length > 0 ? errors : null;
	},
};

// Type guards for step data validation
export const StepTypeGuards = {
	// Check if country data is valid (when country step is enabled)
	isValidCountryData: (data: PartialStepperFormData): boolean => {
		return (
			typeof data.selectedCountry === "string" &&
			data.selectedCountry.trim() !== ""
		);
	},

	// Check if date data is valid
	isValidDatesData: (data: PartialStepperFormData): boolean => {
		if (typeof data.startDate !== "string" || typeof data.endDate !== "string")
			return false;

		const startDate = new Date(data.startDate);
		const endDate = new Date(data.endDate);

		return (
			!Number.isNaN(startDate.getTime()) &&
			!Number.isNaN(endDate.getTime()) &&
			endDate > startDate
		);
	},

	// Check if theme data is valid
	isValidThemesData: (data: PartialStepperFormData): boolean => {
		return Array.isArray(data.selectedThemes) && data.selectedThemes.length > 0;
	},

	// Check if budget data is valid
	isValidBudgetData: (data: PartialStepperFormData): boolean => {
		return typeof data.budget === "number" && data.budget > 0;
	},

	// Check if more requests data is valid (always valid since it's optional)
	isValidMoreRequestsData: (data: PartialStepperFormData): boolean => {
		// This step is optional, so it's always valid
		// But if there is content, it should meet minimum requirements
		if (!data.moreRequests || data.moreRequests.trim().length === 0) {
			return true; // Empty is valid
		}

		// If there is content, validate it
		const trimmed = data.moreRequests.trim();
		const hasValidLength = trimmed.length >= 10 && trimmed.length <= 1000;
		const hasValidContent = !/^[^a-zA-Z0-9\s]*$/.test(trimmed);

		return hasValidLength && hasValidContent;
	},

	// Check if data is valid for a specific step ID
	isValidStepData: (stepId: string, data: PartialStepperFormData): boolean => {
		switch (stepId) {
			case "country":
				return StepTypeGuards.isValidCountryData(data);
			case "dates":
				return StepTypeGuards.isValidDatesData(data);
			case "themes":
				return StepTypeGuards.isValidThemesData(data);
			case "budget":
				return StepTypeGuards.isValidBudgetData(data);
			case "more-requests":
				return StepTypeGuards.isValidMoreRequestsData(data);
			default:
				return false;
		}
	},

	// Check if data is complete for enabled steps
	isCompleteStepperFormData: (
		data: PartialStepperFormData,
		enabledSteps: string[],
	): data is StepperFormData => {
		// Check all enabled steps are valid
		const allStepsValid = enabledSteps.every((stepId) =>
			StepTypeGuards.isValidStepData(stepId, data),
		);

		// Check required fields are present
		const hasRequiredFields =
			data.startDate !== undefined &&
			data.endDate !== undefined &&
			data.selectedThemes !== undefined &&
			data.budget !== undefined;

		// If country step is enabled, check country is present
		const hasCountryIfRequired =
			!enabledSteps.includes("country") || data.selectedCountry !== undefined;

		return allStepsValid && hasRequiredFields && hasCountryIfRequired;
	},
};

// Import the FormData type from beauty-tour for conversion utilities
import type { FormData } from "./beauty-tour";

// Utility functions for data conversion
export const StepperUtils = {
	// Convert stepper form data to legacy form data
	stepperToLegacyFormData: (
		stepperData: StepperFormData,
		additionalData: Partial<FormData> = {},
	): FormData => {
		return {
			selectedRegion: stepperData.selectedCountry || "", // Handle optional country
			startDate: stepperData.startDate,
			endDate: stepperData.endDate,
			selectedTheme: stepperData.selectedThemes[0] || "", // Use first theme for legacy compatibility
			budget: stepperData.budget,
			includeFlights: additionalData.includeFlights ?? true,
			includeHotels: additionalData.includeHotels ?? true,
			includeActivities: additionalData.includeActivities ?? true,
			includeTransport: additionalData.includeTransport ?? true,
			travelers: additionalData.travelers ?? 1,
			specialRequests: additionalData.specialRequests ?? "",
			moreRequests: stepperData.moreRequests || "",
		};
	},

	// Convert legacy form data to stepper form data
	legacyToStepperFormData: (legacyData: FormData): StepperFormData => {
		return {
			selectedCountry: legacyData.selectedRegion,
			startDate: legacyData.startDate,
			endDate: legacyData.endDate,
			selectedThemes: legacyData.selectedTheme
				? [legacyData.selectedTheme]
				: [],
			budget: legacyData.budget,
			currency: "USD", // Default currency
			moreRequests: legacyData.moreRequests || "",
		};
	},

	// Get current step number for enabled steps
	getCurrentStep: (
		data: PartialStepperFormData,
		enabledSteps: string[],
	): number => {
		for (let i = 0; i < enabledSteps.length; i++) {
			const stepId = enabledSteps[i];
			if (!StepTypeGuards.isValidStepData(stepId, data)) {
				return i + 1; // Return 1-based step number
			}
		}
		return enabledSteps.length; // All steps complete
	},

	// Get completed steps for enabled steps
	getCompletedSteps: (
		data: PartialStepperFormData,
		enabledSteps: string[],
	): Set<number> => {
		const completed = new Set<number>();

		enabledSteps.forEach((stepId, index) => {
			if (StepTypeGuards.isValidStepData(stepId, data)) {
				completed.add(index + 1); // 1-based step numbers
			}
		});

		return completed;
	},

	// Create step mapping from step numbers to step IDs
	createStepMapping: (enabledSteps: string[]): Record<number, string> => {
		const mapping: Record<number, string> = {};
		enabledSteps.forEach((stepId, index) => {
			mapping[index + 1] = stepId;
		});
		return mapping;
	},

	// Create empty stepper form data
	createEmptyStepperFormData: (): PartialStepperFormData => ({
		startDate: "",
		endDate: "",
		selectedThemes: [],
		budget: 0,
		currency: "USD",
		moreRequests: "",
	}),
};
