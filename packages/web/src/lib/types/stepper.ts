export interface StepperFormData {
	// Step 1 - Country Selection
	selectedCountry: string;

	// Step 2 - Date Selection
	startDate: string;
	endDate: string;

	// Step 3 - Theme Selection (multiple selection)
	selectedThemes: string[]; // Updated to support multiple selection as required

	// Step 4 - Budget Selection
	budget: number;
	currency?: "USD" | "EUR" | "GBP"; // Optional currency selection
}

// Partial interface for step-by-step validation
export interface PartialStepperFormData {
	selectedCountry?: string;
	startDate?: string;
	endDate?: string;
	selectedThemes?: string[];
	budget?: number;
	currency?: "USD" | "EUR" | "GBP";
}

// Step-specific error interfaces
export interface Step1Errors {
	country?: string;
	general?: string;
}

export interface Step2Errors {
	startDate?: string;
	endDate?: string;
	dateRange?: string;
	general?: string;
}

export interface Step3Errors {
	themes?: string;
	compatibility?: string;
	selection?: string;
	general?: string;
}

export interface Step4Errors {
	budget?: string;
	currency?: string;
	range?: string;
	general?: string;
}

// Main stepper errors interface
export interface StepperErrors {
	step1?: Step1Errors;
	step2?: Step2Errors;
	step3?: Step3Errors;
	step4?: Step4Errors;
	global?: string; // For cross-step validation errors
}

export interface StepperState {
	currentStep: number;
	completedSteps: Set<number>;
	formData: StepperFormData;
	errors: StepperErrors;
	isLoading: boolean;
}

export const TOTAL_STEPS = 4;

export const STEP_LABELS = [
	"Select Country",
	"Choose Dates",
	"Pick Themes",
	"Set Budget",
];

// Validation helper functions for each step
export const StepValidation = {
	// Step 1: Country Selection validation
	validateStep1: (data: PartialStepperFormData): Step1Errors | null => {
		const errors: Step1Errors = {};

		if (!data.selectedCountry || data.selectedCountry.trim() === "") {
			errors.country = "Please select a country for your beauty tour";
		}

		return Object.keys(errors).length > 0 ? errors : null;
	},

	// Step 2: Date Selection validation
	validateStep2: (data: PartialStepperFormData): Step2Errors | null => {
		const errors: Step2Errors = {};

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

	// Step 3: Theme Selection validation
	validateStep3: (data: PartialStepperFormData): Step3Errors | null => {
		const errors: Step3Errors = {};

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

	// Step 4: Budget Selection validation
	validateStep4: (data: PartialStepperFormData): Step4Errors | null => {
		const errors: Step4Errors = {};

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

	// Validate all steps
	validateAllSteps: (data: PartialStepperFormData): StepperErrors | null => {
		const errors: StepperErrors = {};

		const step1Errors = StepValidation.validateStep1(data);
		const step2Errors = StepValidation.validateStep2(data);
		const step3Errors = StepValidation.validateStep3(data);
		const step4Errors = StepValidation.validateStep4(data);

		if (step1Errors) errors.step1 = step1Errors;
		if (step2Errors) errors.step2 = step2Errors;
		if (step3Errors) errors.step3 = step3Errors;
		if (step4Errors) errors.step4 = step4Errors;

		return Object.keys(errors).length > 0 ? errors : null;
	},
};

// Type guards for step data validation
export const StepTypeGuards = {
	// Check if data is valid for step 1
	isValidStep1Data: (data: PartialStepperFormData): boolean => {
		return (
			typeof data.selectedCountry === "string" &&
			data.selectedCountry.trim() !== ""
		);
	},

	// Check if data is valid for step 2
	isValidStep2Data: (data: PartialStepperFormData): boolean => {
		if (!StepTypeGuards.isValidStep1Data(data)) return false;

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

	// Check if data is valid for step 3
	isValidStep3Data: (data: PartialStepperFormData): boolean => {
		if (!StepTypeGuards.isValidStep2Data(data)) return false;

		return Array.isArray(data.selectedThemes) && data.selectedThemes.length > 0;
	},

	// Check if data is valid for step 4 (complete form)
	isValidStep4Data: (data: PartialStepperFormData): boolean => {
		if (!StepTypeGuards.isValidStep3Data(data)) return false;

		return typeof data.budget === "number" && data.budget > 0;
	},

	// Check if data is complete stepper form data
	isCompleteStepperFormData: (
		data: PartialStepperFormData,
	): data is StepperFormData => {
		return (
			StepTypeGuards.isValidStep4Data(data) &&
			data.selectedCountry !== undefined &&
			data.startDate !== undefined &&
			data.endDate !== undefined &&
			data.selectedThemes !== undefined &&
			data.budget !== undefined
		);
	},
};

// Import the FormData type from beauty-journey for conversion utilities
import type { FormData } from "./beauty-journey";

// Utility functions for data conversion
export const StepperUtils = {
	// Convert stepper form data to legacy form data
	stepperToLegacyFormData: (
		stepperData: StepperFormData,
		additionalData: Partial<FormData> = {},
	): FormData => {
		return {
			selectedRegion: stepperData.selectedCountry,
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
		};
	},

	// Get step number for current data state
	getCurrentStep: (data: PartialStepperFormData): number => {
		if (!StepTypeGuards.isValidStep1Data(data)) return 1;
		if (!StepTypeGuards.isValidStep2Data(data)) return 2;
		if (!StepTypeGuards.isValidStep3Data(data)) return 3;
		if (!StepTypeGuards.isValidStep4Data(data)) return 4;
		return 4; // Complete
	},

	// Get completed steps
	getCompletedSteps: (data: PartialStepperFormData): Set<number> => {
		const completed = new Set<number>();

		if (StepTypeGuards.isValidStep1Data(data)) completed.add(1);
		if (StepTypeGuards.isValidStep2Data(data)) completed.add(2);
		if (StepTypeGuards.isValidStep3Data(data)) completed.add(3);
		if (StepTypeGuards.isValidStep4Data(data)) completed.add(4);

		return completed;
	},

	// Create empty stepper form data
	createEmptyStepperFormData: (): PartialStepperFormData => ({
		selectedCountry: "",
		startDate: "",
		endDate: "",
		selectedThemes: [],
		budget: 0,
		currency: "USD",
	}),
};
