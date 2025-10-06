<script lang="ts">
import { onMount } from "svelte";
import { toast } from "svelte-sonner";
import type { StepperErrors, StepperFormData, StepperState } from "$lib/types";
import { TOTAL_STEPS } from "$lib/types";
import { swipe } from "$lib/utils/swipe";

// Props
interface Props {
	initialData?: Partial<StepperFormData>;
	oncomplete?: (data: StepperFormData) => void;
	onstepchange?: (event: { step: number; data: StepperFormData }) => void;
	children: import("svelte").Snippet<
		[
			{
				stepperState: StepperState;
				goToStep: (step: number) => void;
				nextStep: () => void;
				previousStep: () => void;
				updateFormData: (updates: Partial<StepperFormData>) => void;
				setLoading: (loading: boolean) => void;
				canGoNext: boolean;
				canGoPrevious: boolean;
				isLastStep: boolean;
				currentStepErrors: StepperErrors[keyof StepperErrors] | undefined;
				hasCurrentStepErrors: boolean;
				globalWarning: string | undefined;
				clearStepErrors: (step: number) => void;
				clearAllErrors: () => void;
				hasStepErrors: (step: number) => boolean;
				getStepErrorCount: (step: number) => number;
			},
		]
	>;
}

let { initialData = {}, oncomplete, onstepchange, children }: Props = $props();

// Initialize stepper state using Svelte 5 runes for reactivity
let stepperState = $state<StepperState>({
	currentStep: 1,
	completedSteps: new Set<number>(),
	formData: {
		selectedCountry: initialData.selectedCountry || "",
		startDate: initialData.startDate || "",
		endDate: initialData.endDate || "",
		selectedThemes: initialData.selectedThemes || [],
		budget: initialData.budget || 0,
	},
	errors: {},
	isLoading: false,
});

// Enhanced validation functions with real-time feedback
function validateStep1(realTime = false): {
	isValid: boolean;
	errors: StepperErrors["step1"];
} {
	const errors: StepperErrors["step1"] = {};

	if (
		!stepperState.formData.selectedCountry ||
		stepperState.formData.selectedCountry.trim() === ""
	) {
		errors.country = realTime
			? "Please select a destination country"
			: "Please select a country for your beauty tour";
	}

	// Additional validation for country format
	if (
		stepperState.formData.selectedCountry &&
		stepperState.formData.selectedCountry.length < 2
	) {
		errors.country = "Invalid country selection";
	}

	const isValid = Object.keys(errors).length === 0;
	return { isValid, errors: isValid ? undefined : errors };
}

// Helper function that updates state and returns validation result
function validateStep1WithStateUpdate(realTime = false): boolean {
	const result = validateStep1(realTime);
	stepperState.errors.step1 = result.errors;
	return result.isValid;
}

function validateStep2(realTime = false): {
	isValid: boolean;
	errors: StepperErrors["step2"];
} {
	const errors: StepperErrors["step2"] = {};
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (!stepperState.formData.startDate) {
		errors.startDate = realTime
			? "Start date required"
			: "Please select a start date";
	} else {
		const startDate = new Date(stepperState.formData.startDate);
		if (startDate < today) {
			errors.startDate = "Start date must be in the future";
		}
	}

	if (!stepperState.formData.endDate) {
		errors.endDate = realTime
			? "End date required"
			: "Please select an end date";
	}

	// Date range validation
	if (stepperState.formData.startDate && stepperState.formData.endDate) {
		const startDate = new Date(stepperState.formData.startDate);
		const endDate = new Date(stepperState.formData.endDate);

		if (endDate <= startDate) {
			errors.dateRange = "End date must be after start date";
		} else {
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

			// Check if dates are too far in the future (1 year)
			const oneYearFromNow = new Date();
			oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
			if (startDate > oneYearFromNow) {
				errors.startDate = "Please select a date within the next year";
			}
		}
	}

	const isValid = Object.keys(errors).length === 0;
	return { isValid, errors: isValid ? undefined : errors };
}

function validateStep2WithStateUpdate(realTime = false): boolean {
	const result = validateStep2(realTime);
	stepperState.errors.step2 = result.errors;
	return result.isValid;
}

function validateStep3(realTime = false): {
	isValid: boolean;
	errors: StepperErrors["step3"];
} {
	const errors: StepperErrors["step3"] = {};

	if (
		!stepperState.formData.selectedThemes ||
		stepperState.formData.selectedThemes.length === 0
	) {
		errors.themes = realTime
			? "Select at least one theme"
			: "Please select at least one treatment theme";
	}

	// Theme compatibility validation
	if (
		stepperState.formData.selectedThemes &&
		stepperState.formData.selectedThemes.length > 1
	) {
		// Check for incompatible combinations
		const incompatibleCombinations = [
			{
				themes: ["plastic-surgery", "wellness-spa"],
				message:
					"Surgical procedures and spa treatments may require separate visits for optimal recovery",
			},
			{
				themes: ["weight-loss", "plastic-surgery"],
				message:
					"Weight loss and plastic surgery procedures should be carefully timed - consult with specialists",
			},
		];

		for (const combo of incompatibleCombinations) {
			if (
				combo.themes.every((theme) =>
					stepperState.formData.selectedThemes?.includes(theme),
				)
			) {
				errors.compatibility = combo.message;
				break;
			}
		}

		// Check for too many themes (more than 3 might be overwhelming)
		if (stepperState.formData.selectedThemes.length > 3) {
			errors.selection =
				"Consider limiting to 3 themes for a focused treatment plan";
		}
	}

	const isValid = Object.keys(errors).length === 0;
	return { isValid, errors: isValid ? undefined : errors };
}

function validateStep3WithStateUpdate(realTime = false): boolean {
	const result = validateStep3(realTime);
	stepperState.errors.step3 = result.errors;
	return result.isValid;
}

function validateStep4(realTime = false): {
	isValid: boolean;
	errors: StepperErrors["step4"];
} {
	const errors: StepperErrors["step4"] = {};

	if (!stepperState.formData.budget || stepperState.formData.budget <= 0) {
		errors.budget = realTime
			? "Budget amount required"
			: "Please set a budget for your beauty tour";
	} else {
		// Budget range validation
		if (stepperState.formData.budget < 500) {
			errors.range = "Minimum budget is $500 for quality treatments";
		}

		if (stepperState.formData.budget > 50000) {
			errors.range =
				"For budgets over $50,000, please contact us for premium packages";
		}

		// Budget vs theme compatibility
		if (
			stepperState.formData.selectedThemes &&
			stepperState.formData.selectedThemes.length > 0
		) {
			const hasSurgicalThemes = stepperState.formData.selectedThemes.some(
				(theme) =>
					["plastic-surgery", "weight-loss", "hair-treatments"].includes(theme),
			);

			if (hasSurgicalThemes && stepperState.formData.budget < 2000) {
				errors.range =
					"Surgical procedures typically require a minimum budget of $2,000";
			}
		}
	}

	const isValid = Object.keys(errors).length === 0;
	return { isValid, errors: isValid ? undefined : errors };
}

function validateStep4WithStateUpdate(realTime = false): boolean {
	const result = validateStep4(realTime);
	stepperState.errors.step4 = result.errors;
	return result.isValid;
}

// Pure validation function for use in derived values (doesn't mutate state)
function validateCurrentStep(realTime = false): boolean {
	switch (stepperState.currentStep) {
		case 1:
			return validateStep1(realTime).isValid;
		case 2:
			return validateStep2(realTime).isValid;
		case 3:
			return validateStep3(realTime).isValid;
		case 4:
			return validateStep4(realTime).isValid;
		default:
			return false;
	}
}

// Function that validates and updates state
function validateCurrentStepWithStateUpdate(realTime = false): boolean {
	switch (stepperState.currentStep) {
		case 1:
			return validateStep1WithStateUpdate(realTime);
		case 2:
			return validateStep2WithStateUpdate(realTime);
		case 3:
			return validateStep3WithStateUpdate(realTime);
		case 4:
			return validateStep4WithStateUpdate(realTime);
		default:
			return false;
	}
}

// Cross-step validation for data consistency
function validateCrossStepConsistency(): string[] {
	const warnings: string[] = [];

	// Check if travel dates align with selected themes
	if (
		stepperState.formData.startDate &&
		stepperState.formData.endDate &&
		stepperState.formData.selectedThemes
	) {
		const startDate = new Date(stepperState.formData.startDate);
		const endDate = new Date(stepperState.formData.endDate);
		const daysDiff = Math.ceil(
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
		);

		const hasSurgicalThemes = stepperState.formData.selectedThemes.some(
			(theme) =>
				["plastic-surgery", "weight-loss", "hair-treatments"].includes(theme),
		);

		if (hasSurgicalThemes && daysDiff < 5) {
			warnings.push(
				"Surgical procedures typically require 5+ days for proper recovery",
			);
		}

		if (
			stepperState.formData.selectedThemes.includes("wellness-spa") &&
			daysDiff < 3
		) {
			warnings.push(
				"Wellness spa treatments are most effective with 3+ day stays",
			);
		}
	}

	// Check budget vs destination
	if (stepperState.formData.selectedCountry && stepperState.formData.budget) {
		// This could be enhanced with actual country-specific pricing data
		const expensiveDestinations = ["south-korea", "japan", "switzerland"];
		const budgetDestinations = ["turkey", "thailand", "mexico"];

		if (
			expensiveDestinations.includes(stepperState.formData.selectedCountry) &&
			stepperState.formData.budget < 3000
		) {
			warnings.push(
				"Selected destination typically requires higher budgets for quality treatments",
			);
		}

		if (
			budgetDestinations.includes(stepperState.formData.selectedCountry) &&
			stepperState.formData.budget > 10000
		) {
			warnings.push(
				"Your budget allows for premium treatments in this destination",
			);
		}
	}

	return warnings;
}

// Real-time validation trigger
function triggerRealTimeValidation() {
	validateCurrentStepWithStateUpdate(true);

	// Also validate cross-step consistency if we're past step 2
	if (stepperState.currentStep > 2) {
		const warnings = validateCrossStepConsistency();
		if (warnings.length > 0) {
			// Store warnings in global errors for display
			stepperState.errors.global = warnings[0]; // Show first warning
		} else {
			stepperState.errors.global = undefined;
		}
	}
}

// Navigation functions
export function goToStep(step: number) {
	if (step < 1 || step > TOTAL_STEPS) return;

	// Can only navigate to completed steps or the next step
	if (step <= Math.max(...stepperState.completedSteps, 0) + 1) {
		stepperState.currentStep = step;
		onstepchange?.({ step, data: stepperState.formData });
	}
}

export function nextStep() {
	if (validateCurrentStepWithStateUpdate()) {
		// Mark current step as completed
		stepperState.completedSteps.add(stepperState.currentStep);

		if (stepperState.currentStep < TOTAL_STEPS) {
			stepperState.currentStep += 1;
			onstepchange?.({
				step: stepperState.currentStep,
				data: stepperState.formData,
			});
			toast.success(`Step ${stepperState.currentStep - 1} completed!`);
		} else {
			// Final step completed
			toast.success("All steps completed! Generating your beauty journey...");
			oncomplete?.(stepperState.formData);
		}
	} else {
		// Show validation error toast
		const currentStepErrors =
			stepperState.errors[
				`step${stepperState.currentStep}` as keyof StepperErrors
			];
		if (currentStepErrors && typeof currentStepErrors === "object") {
			const errorMessages = Object.values(currentStepErrors).filter(
				(error) => error,
			);
			if (errorMessages.length > 0) {
				toast.error(`Please fix: ${errorMessages[0]}`);
			}
		}
	}
}

export function previousStep() {
	if (stepperState.currentStep > 1) {
		stepperState.currentStep -= 1;
		onstepchange?.({
			step: stepperState.currentStep,
			data: stepperState.formData,
		});
	}
}

export function updateFormData(updates: Partial<StepperFormData>) {
	stepperState.formData = { ...stepperState.formData, ...updates };

	// Clear specific errors for updated fields first
	if (updates.selectedCountry !== undefined) {
		if (stepperState.errors.step1) {
			stepperState.errors.step1.country = undefined;
			if (Object.values(stepperState.errors.step1).every((v) => !v)) {
				stepperState.errors.step1 = undefined;
			}
		}
	}

	if (updates.startDate !== undefined || updates.endDate !== undefined) {
		if (stepperState.errors.step2) {
			if (updates.startDate !== undefined) {
				stepperState.errors.step2.startDate = undefined;
			}
			if (updates.endDate !== undefined) {
				stepperState.errors.step2.endDate = undefined;
			}
			stepperState.errors.step2.dateRange = undefined;

			if (Object.values(stepperState.errors.step2).every((v) => !v)) {
				stepperState.errors.step2 = undefined;
			}
		}
	}

	if (updates.selectedThemes !== undefined) {
		if (stepperState.errors.step3) {
			stepperState.errors.step3.themes = undefined;
			stepperState.errors.step3.compatibility = undefined;
			stepperState.errors.step3.selection = undefined;

			if (Object.values(stepperState.errors.step3).every((v) => !v)) {
				stepperState.errors.step3 = undefined;
			}
		}
	}

	if (updates.budget !== undefined) {
		if (stepperState.errors.step4) {
			stepperState.errors.step4.budget = undefined;
			stepperState.errors.step4.range = undefined;

			if (Object.values(stepperState.errors.step4).every((v) => !v)) {
				stepperState.errors.step4 = undefined;
			}
		}
	}

	// Trigger real-time validation after a short delay to avoid excessive validation
	setTimeout(() => {
		triggerRealTimeValidation();
	}, 300);
}

export function setLoading(loading: boolean) {
	stepperState.isLoading = loading;
}

// Error recovery functions
export function clearStepErrors(step: number) {
	const stepKey = `step${step}` as keyof StepperErrors;
	if (stepperState.errors[stepKey]) {
		stepperState.errors[stepKey] = undefined;
		toast.success(`Step ${step} errors cleared`);
	}
}

export function clearAllErrors() {
	const errorCount = Object.values(stepperState.errors).filter((errors) => {
		if (typeof errors === "string") return true;
		if (typeof errors === "object" && errors) {
			return Object.values(errors).some((error) => error);
		}
		return false;
	}).length;

	stepperState.errors = {};

	if (errorCount > 0) {
		toast.success(`All errors cleared (${errorCount} resolved)`);
	}
}

export function hasStepErrors(step: number): boolean {
	const stepKey = `step${step}` as keyof StepperErrors;
	const stepErrors = stepperState.errors[stepKey];
	return stepErrors ? Object.values(stepErrors).some((error) => error) : false;
}

export function getStepErrorCount(step: number): number {
	const stepKey = `step${step}` as keyof StepperErrors;
	const stepErrors = stepperState.errors[stepKey];
	return stepErrors
		? Object.values(stepErrors).filter((error) => error).length
		: 0;
}

// Computed properties
let canGoNext = $derived(validateCurrentStep());
let canGoPrevious = $derived(stepperState.currentStep > 1);
let isLastStep = $derived(stepperState.currentStep === TOTAL_STEPS);
let currentStepErrors = $derived(
	stepperState.errors[`step${stepperState.currentStep}` as keyof StepperErrors],
);
let hasCurrentStepErrors = $derived(hasStepErrors(stepperState.currentStep));
let globalWarning = $derived(stepperState.errors.global);

// Swipe gesture handlers
function handleSwipeLeft() {
	// Swipe left = next step (on mobile)
	if (canGoNext && !stepperState.isLoading) {
		nextStep();
	}
}

function handleSwipeRight() {
	// Swipe right = previous step (on mobile)
	if (canGoPrevious && !stepperState.isLoading) {
		previousStep();
	}
}

// Mobile detection
let isMobile = false;
onMount(() => {
	// Simple mobile detection based on screen width and touch capability
	isMobile = window.innerWidth <= 768 && "ontouchstart" in window;
});
</script>

<div
	class="stepper-container"
	use:swipe={{
		handlers: {
			onSwipeLeft: handleSwipeLeft,
			onSwipeRight: handleSwipeRight,
		},
		config: {
			threshold: 75,
			restraint: 100,
			allowedTime: 300,
		},
	}}
>
	{@render children({
		stepperState,
		goToStep,
		nextStep,
		previousStep,
		updateFormData,
		setLoading,
		canGoNext,
		canGoPrevious,
		isLastStep,
		currentStepErrors,
		hasCurrentStepErrors,
		globalWarning,
		clearStepErrors,
		clearAllErrors,
		hasStepErrors,
		getStepErrorCount,
	})}
</div>

<style>
	.stepper-container {
		width: 100%;
		max-width: 900px;
		margin: 0 auto;
		padding: 1rem;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* Mobile-first responsive design */
	@media (min-width: 640px) {
		.stepper-container {
			padding: 1.5rem;
		}
	}

	@media (min-width: 768px) {
		.stepper-container {
			padding: 2rem;
			max-width: 1000px;
		}
	}

	@media (min-width: 1024px) {
		.stepper-container {
			padding: 2.5rem;
			max-width: 1200px;
		}
	}

	@media (min-width: 1280px) {
		.stepper-container {
			padding: 3rem;
			max-width: 1400px;
		}
	}

	/* Ensure proper spacing on very small screens */
	@media (max-width: 480px) {
		.stepper-container {
			padding: 0.75rem;
			min-height: calc(100vh - 2rem);
		}
	}

	/* Landscape mobile optimization */
	@media (max-height: 600px) and (orientation: landscape) {
		.stepper-container {
			min-height: auto;
			padding: 1rem;
		}
	}
</style>
