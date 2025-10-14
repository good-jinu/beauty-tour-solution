<script lang="ts">
import { onMount } from "svelte";
import { toast } from "svelte-sonner";
import { stepperState } from "$lib/stores/stepper";
import type { StepperErrors, StepperFormData, StepperState } from "$lib/types";
import { TOTAL_STEPS } from "$lib/types";

import { validate as validateStep4 } from "./steps/BudgetSelection.svelte";
import { validate as validateStep1 } from "./steps/CountrySelection.svelte";
import { validate as validateStep2 } from "./steps/DateSelection.svelte";
import { validate as validateStep3 } from "./steps/ThemeSelection.svelte";

// Props
interface Props {
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

let { oncomplete, onstepchange, children }: Props = $props();

// Helper function that updates state and returns validation result
function validateStep1WithStateUpdate(realTime = false): boolean {
	const result = validateStep1(
		$stepperState.formData.selectedCountry,
		realTime,
	);
	$stepperState.errors.step1 = result.errors;
	return result.isValid;
}

function validateStep2WithStateUpdate(realTime = false): boolean {
	const result = validateStep2(
		$stepperState.formData.startDate,
		$stepperState.formData.endDate,
		realTime,
	);
	$stepperState.errors.step2 = result.errors;
	return result.isValid;
}

function validateStep3WithStateUpdate(realTime = false): boolean {
	const result = validateStep3($stepperState.formData.selectedThemes, realTime);
	$stepperState.errors.step3 = result.errors;
	return result.isValid;
}

function validateStep4WithStateUpdate(realTime = false): boolean {
	const result = validateStep4(
		$stepperState.formData.budget,
		$stepperState.formData.selectedThemes,
		realTime,
	);
	$stepperState.errors.step4 = result.errors;
	return result.isValid;
}

// Pure validation function for use in derived values (doesn't mutate state)
function validateCurrentStep(realTime = false): boolean {
	switch ($stepperState.currentStep) {
		case 1:
			return validateStep1($stepperState.formData.selectedCountry, realTime)
				.isValid;
		case 2:
			return validateStep2(
				$stepperState.formData.startDate,
				$stepperState.formData.endDate,
				realTime,
			).isValid;
		case 3:
			return validateStep3($stepperState.formData.selectedThemes, realTime)
				.isValid;
		case 4:
			return validateStep4(
				$stepperState.formData.budget,
				$stepperState.formData.selectedThemes,
				realTime,
			).isValid;
		default:
			return false;
	}
}

// Function that validates and updates state
function validateCurrentStepWithStateUpdate(realTime = false): boolean {
	switch ($stepperState.currentStep) {
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

	// Also validate cross-step consistency if we're past step 2
	if ($stepperState.currentStep > 2) {
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
	if (step < 1 || step > TOTAL_STEPS) return;

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

		if ($stepperState.currentStep < TOTAL_STEPS) {
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

	// Clear specific errors for updated fields first
	if (updates.selectedCountry !== undefined) {
		if ($stepperState.errors.step1) {
			$stepperState.errors.step1.country = undefined;
			if (Object.values($stepperState.errors.step1).every((v) => !v)) {
				$stepperState.errors.step1 = undefined;
			}
		}
	}

	if (updates.startDate !== undefined || updates.endDate !== undefined) {
		if ($stepperState.errors.step2) {
			if (updates.startDate !== undefined) {
				$stepperState.errors.step2.startDate = undefined;
			}
			if (updates.endDate !== undefined) {
				$stepperState.errors.step2.endDate = undefined;
			}
			$stepperState.errors.step2.dateRange = undefined;

			if (Object.values($stepperState.errors.step2).every((v) => !v)) {
				$stepperState.errors.step2 = undefined;
			}
		}
	}

	if (updates.selectedThemes !== undefined) {
		if ($stepperState.errors.step3) {
			$stepperState.errors.step3.themes = undefined;
			$stepperState.errors.step3.compatibility = undefined;
			$stepperState.errors.step3.selection = undefined;

			if (Object.values($stepperState.errors.step3).every((v) => !v)) {
				$stepperState.errors.step3 = undefined;
			}
		}
	}

	if (updates.budget !== undefined) {
		if ($stepperState.errors.step4) {
			$stepperState.errors.step4.budget = undefined;
			$stepperState.errors.step4.range = undefined;

			if (Object.values($stepperState.errors.step4).every((v) => !v)) {
				$stepperState.errors.step4 = undefined;
			}
		}
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
let isLastStep = $derived($stepperState.currentStep === TOTAL_STEPS);
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
