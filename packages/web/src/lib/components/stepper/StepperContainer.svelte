<script lang="ts">
import { toast } from "svelte-sonner";
import { initializeStepper, stepperState } from "$lib/stores/stepper";
import type { StepperErrors, StepperFormData, StepperState } from "$lib/types";
import type { AnyStepErrors } from "$lib/types/stepper";
import { getTotalSteps, StepValidation } from "$lib/types/stepper";

import { validate as validateBudget } from "./steps/BudgetSelection.svelte";
import { validate as validateCountry } from "./steps/CountrySelection.svelte";
import { validate as validateDates } from "./steps/DateSelection.svelte";
import { validate as validateMoreRequests } from "./steps/MoreRequestStep.svelte";
import { validate as validateThemes } from "./steps/ThemeSelection.svelte";

// Props
interface Props {
	oncomplete?: (data: StepperFormData) => void;
	onstepchange?: (event: { step: number; data: StepperFormData }) => void;
	enabledSteps?: string[]; // Optional: specify which steps to enable
	includeCountryStep?: boolean; // Optional: shorthand to include country step
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

let {
	oncomplete,
	onstepchange,
	enabledSteps,
	includeCountryStep = false,
	children,
}: Props = $props();

// Initialize stepper with configured steps
$effect(() => {
	let steps = enabledSteps;

	// If no explicit steps provided, use default behavior
	if (!steps) {
		if (includeCountryStep) {
			steps = ["country", "dates", "themes", "budget", "more-requests"];
		} else {
			steps = ["dates", "themes", "budget", "more-requests"];
		}
	}

	initializeStepper(steps);
});

// Helper function that validates a step by ID and updates state
function validateStepWithStateUpdate(
	stepId: string,
	stepNumber: number,
	realTime = false,
): boolean {
	let result: {
		isValid: boolean;
		errors: AnyStepErrors | undefined;
	} | null = null;

	switch (stepId) {
		case "country":
			result = validateCountry(
				$stepperState.formData.selectedCountry || "",
				realTime,
			);
			break;
		case "dates":
			result = validateDates(
				$stepperState.formData.startDate,
				$stepperState.formData.endDate,
				realTime,
			);
			break;
		case "themes":
			result = validateThemes($stepperState.formData.selectedThemes, realTime);
			break;
		case "budget":
			result = validateBudget(
				$stepperState.formData.budget,
				$stepperState.formData.selectedThemes,
				realTime,
			);
			break;
		case "more-requests":
			result = validateMoreRequests(
				$stepperState.formData.moreRequests || "",
				realTime,
			);
			break;
		default:
			return false;
	}

	if (result) {
		// Use type assertion to safely assign to dynamic keys
		($stepperState.errors as Record<string, AnyStepErrors | undefined>)[
			`step${stepNumber}`
		] = result.errors;
		return result.isValid;
	}

	return false;
}

// Pure validation function for use in derived values (doesn't mutate state)
function validateCurrentStep(realTime = false): boolean {
	const currentStepId = $stepperState.stepMapping[$stepperState.currentStep];
	if (!currentStepId) return false;

	switch (currentStepId) {
		case "country":
			return validateCountry(
				$stepperState.formData.selectedCountry || "",
				realTime,
			).isValid;
		case "dates":
			return validateDates(
				$stepperState.formData.startDate,
				$stepperState.formData.endDate,
				realTime,
			).isValid;
		case "themes":
			return validateThemes($stepperState.formData.selectedThemes, realTime)
				.isValid;
		case "budget":
			return validateBudget(
				$stepperState.formData.budget,
				$stepperState.formData.selectedThemes,
				realTime,
			).isValid;
		case "more-requests":
			return validateMoreRequests(
				$stepperState.formData.moreRequests || "",
				realTime,
			).isValid;
		default:
			return false;
	}
}

// Function that validates and updates state
function validateCurrentStepWithStateUpdate(realTime = false): boolean {
	const currentStepId = $stepperState.stepMapping[$stepperState.currentStep];
	if (!currentStepId) return false;

	return validateStepWithStateUpdate(
		currentStepId,
		$stepperState.currentStep,
		realTime,
	);
}

// Cross-step validation for data consistency
function validateCrossStepConsistency(): string[] {
	const warnings: string[] = [];

	// Check if travel dates align with selected themes
	if (
		$stepperState.formData.startDate &&
		$stepperState.formData.endDate &&
		$stepperState.formData.selectedThemes
	) {
		const startDate = new Date($stepperState.formData.startDate);
		const endDate = new Date($stepperState.formData.endDate);
		const daysDiff = Math.ceil(
			(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
		);

		const hasSurgicalThemes = $stepperState.formData.selectedThemes.some(
			(theme) =>
				["plastic-surgery", "weight-loss", "hair-treatments"].includes(theme),
		);

		if (hasSurgicalThemes && daysDiff < 5) {
			warnings.push(
				"Surgical procedures typically require 5+ days for proper recovery",
			);
		}

		if (
			$stepperState.formData.selectedThemes.includes("wellness-spa") &&
			daysDiff < 3
		) {
			warnings.push(
				"Wellness spa treatments are most effective with 3+ day stays",
			);
		}
	}

	// Check budget vs destination
	if ($stepperState.formData.selectedCountry && $stepperState.formData.budget) {
		// This could be enhanced with actual country-specific pricing data
		const expensiveDestinations = ["south-korea", "japan", "switzerland"];
		const budgetDestinations = ["turkey", "thailand", "mexico"];

		if (
			expensiveDestinations.includes($stepperState.formData.selectedCountry) &&
			$stepperState.formData.budget < 3000
		) {
			warnings.push(
				"Selected destination typically requires higher budgets for quality treatments",
			);
		}

		if (
			budgetDestinations.includes($stepperState.formData.selectedCountry) &&
			$stepperState.formData.budget > 10000
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

	// Also validate cross-step consistency if we have enough data
	// (at least dates and themes should be available)
	const hasDateStep = $stepperState.enabledSteps.includes("dates");
	const hasThemeStep = $stepperState.enabledSteps.includes("themes");
	const dateStepCompleted =
		hasDateStep &&
		$stepperState.formData.startDate &&
		$stepperState.formData.endDate;
	const themeStepCompleted =
		hasThemeStep && $stepperState.formData.selectedThemes.length > 0;

	if (dateStepCompleted && themeStepCompleted) {
		const warnings = validateCrossStepConsistency();
		if (warnings.length > 0) {
			// Store warnings in global errors for display
			$stepperState.errors.global = warnings[0]; // Show first warning
		} else {
			$stepperState.errors.global = undefined;
		}
	}
}

// Navigation functions
export function goToStep(step: number) {
	const totalSteps = getTotalSteps($stepperState.enabledSteps);
	if (step < 1 || step > totalSteps) return;

	// Can only navigate to completed steps or the next step
	if (step <= Math.max(...$stepperState.completedSteps, 0) + 1) {
		$stepperState.currentStep = step;
		onstepchange?.({ step, data: $stepperState.formData });
	}
}

export function nextStep() {
	if (validateCurrentStepWithStateUpdate()) {
		// Mark current step as completed
		$stepperState.completedSteps.add($stepperState.currentStep);

		const totalSteps = getTotalSteps($stepperState.enabledSteps);
		if ($stepperState.currentStep < totalSteps) {
			$stepperState.currentStep += 1;
			onstepchange?.({
				step: $stepperState.currentStep,
				data: $stepperState.formData,
			});
			toast.success(`Step ${$stepperState.currentStep - 1} completed!`);
		} else {
			// Final step completed
			toast.success("All steps completed! Generating your beauty journey...");
			oncomplete?.($stepperState.formData);
		}
	} else {
		// Show validation error toast
		const currentStepErrors =
			$stepperState.errors[
				`step${$stepperState.currentStep}` as keyof StepperErrors
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
	if ($stepperState.currentStep > 1) {
		$stepperState.currentStep -= 1;
		onstepchange?.({
			step: $stepperState.currentStep,
			data: $stepperState.formData,
		});
	}
}

export function updateFormData(updates: Partial<StepperFormData>) {
	$stepperState.formData = { ...$stepperState.formData, ...updates };

	// Clear specific errors for updated fields based on step mapping
	function clearErrorsForStepId(stepId: string, fieldsToClear: string[]) {
		// Find which step number corresponds to this step ID
		const stepNumber = Object.keys($stepperState.stepMapping).find(
			(key) => $stepperState.stepMapping[parseInt(key, 10)] === stepId,
		);

		if (stepNumber) {
			const stepKey = `step${stepNumber}` as keyof StepperErrors;
			const stepErrors = $stepperState.errors[stepKey];

			if (stepErrors && typeof stepErrors === "object") {
				// Clear specific fields
				fieldsToClear.forEach((field) => {
					(stepErrors as Record<string, string | undefined>)[field] = undefined;
				});

				// If all errors are cleared, remove the step errors entirely
				if (Object.values(stepErrors).every((v) => !v)) {
					$stepperState.errors[stepKey] = undefined;
				}
			}
		}
	}

	if (updates.selectedCountry !== undefined) {
		clearErrorsForStepId("country", ["country"]);
	}

	if (updates.startDate !== undefined || updates.endDate !== undefined) {
		const fieldsToClear = ["dateRange"];
		if (updates.startDate !== undefined) fieldsToClear.push("startDate");
		if (updates.endDate !== undefined) fieldsToClear.push("endDate");
		clearErrorsForStepId("dates", fieldsToClear);
	}

	if (updates.selectedThemes !== undefined) {
		clearErrorsForStepId("themes", ["themes", "compatibility", "selection"]);
	}

	if (updates.budget !== undefined) {
		clearErrorsForStepId("budget", ["budget", "range"]);
	}

	if (updates.moreRequests !== undefined) {
		clearErrorsForStepId("more-requests", ["length", "content"]);
	}

	// Trigger real-time validation after a short delay to avoid excessive validation
	setTimeout(() => {
		triggerRealTimeValidation();
	}, 300);
}

export function setLoading(loading: boolean) {
	$stepperState.isLoading = loading;
}

// Error recovery functions
export function clearStepErrors(step: number) {
	const stepKey = `step${step}` as keyof StepperErrors;
	if ($stepperState.errors[stepKey]) {
		$stepperState.errors[stepKey] = undefined;
		toast.success(`Step ${step} errors cleared`);
	}
}

export function clearAllErrors() {
	const errorCount = Object.values($stepperState.errors).filter((errors) => {
		if (typeof errors === "string") return true;
		if (typeof errors === "object" && errors) {
			return Object.values(errors).some((error) => error);
		}
		return false;
	}).length;

	$stepperState.errors = {};

	if (errorCount > 0) {
		toast.success(`All errors cleared (${errorCount} resolved)`);
	}
}

export function hasStepErrors(step: number): boolean {
	const stepKey = `step${step}` as keyof StepperErrors;
	const stepErrors = $stepperState.errors[stepKey];
	return stepErrors ? Object.values(stepErrors).some((error) => error) : false;
}

export function getStepErrorCount(step: number): number {
	const stepKey = `step${step}` as keyof StepperErrors;
	const stepErrors = $stepperState.errors[stepKey];
	return stepErrors
		? Object.values(stepErrors).filter((error) => error).length
		: 0;
}

// Computed properties
let canGoNext = $derived(validateCurrentStep());
let canGoPrevious = $derived($stepperState.currentStep > 1);
let isLastStep = $derived(
	$stepperState.currentStep === getTotalSteps($stepperState.enabledSteps),
);
let currentStepErrors = $derived(
	$stepperState.errors[
		`step${$stepperState.currentStep}` as keyof StepperErrors
	],
);
let hasCurrentStepErrors = $derived(hasStepErrors($stepperState.currentStep));
let globalWarning = $derived($stepperState.errors.global);
</script>

<div
	class="stepper-container"
	role="region"
	aria-label="Beauty Journey Planner"
	aria-live="polite"
	aria-atomic="true"
>
	{@render children({
		stepperState: $stepperState,
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
