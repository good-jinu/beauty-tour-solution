<script lang="ts">
import { EVENT_TYPES } from "@bts/core";
import ResultsSection from "$lib/components/ResultsSection.svelte";
import {
	AccordionStepperWrapper,
	StepperContainer,
} from "$lib/components/stepper";
import type { StepperFormData } from "$lib/types";
import { trackCustomEvent } from "$lib/utils/tracking";

// Application flow state
type AppFlow = "tour-planning" | "results";
let currentFlow: AppFlow = $state("tour-planning");

// Stepper state
let isLoading = $state(false);

// Results state
let showResults = $state(false);
let currentFormData = $state<StepperFormData | null>(null);

async function handleStepperComplete(stepperData: StepperFormData) {
	isLoading = true;
	showResults = false;
	currentFormData = stepperData;

	// Track form completion
	try {
		await trackCustomEvent(EVENT_TYPES.CLICK, {
			element_tag: "form",
			element_text: "tour_planning_completed",
		});
	} catch (error) {
		console.warn("Failed to track form completion:", error);
	}

	// Simply show the schedule without API call
	currentFlow = "results";
	showResults = true;
	isLoading = false;

	// Scroll to results
	setTimeout(() => {
		document.getElementById("results-section")?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}, 100);
}

function resetForm() {
	// Track form reset
	try {
		trackCustomEvent(EVENT_TYPES.CLICK, {
			element_tag: "button",
			element_text: "form_reset",
		});
	} catch (error) {
		console.warn("Failed to track form reset:", error);
	}

	// Reset results display
	showResults = false;
	currentFormData = null;

	// Reset to tour planning flow
	currentFlow = "tour-planning";

	// Scroll back to the top of the form
	setTimeout(() => {
		document.getElementById("tour-planning-section")?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}, 100);
}
</script>

<svelte:head>
	<title>Plan Your Beauty Tour - Beauty Tour Solution</title>
	<meta
		name="description"
		content="Create your perfect beauty and wellness tour with our AI-powered tour planner"
	/>
</svelte:head>

<!-- Main Container with Mobile-First Responsive Layout -->
<div
	class="min-h-screen bg-gradient-to-b from-muted/20 via-background to-muted/10"
>
	<!-- Tour Planning Section -->
	{#if currentFlow === "tour-planning"}
		<div id="tour-planning-section" class="px-4 sm:px-6 lg:px-8">
			<StepperContainer oncomplete={handleStepperComplete}>
				{#snippet children({
					stepperState,
					goToStep,
					nextStep,
					previousStep,
					canGoNext,
					canGoPrevious,
					isLastStep,
					hasCurrentStepErrors,
					globalWarning,
					clearStepErrors,
					clearAllErrors,
					hasStepErrors,
					getStepErrorCount,
				}: any)}
					<AccordionStepperWrapper
						{stepperState}
						{goToStep}
						{nextStep}
						{previousStep}
						{canGoNext}
						{canGoPrevious}
						{isLastStep}
						{hasCurrentStepErrors}
						{globalWarning}
						{clearStepErrors}
						{clearAllErrors}
						{hasStepErrors}
						{getStepErrorCount}
						isLoading={isLoading || stepperState.isLoading}
					/>
				{/snippet}
			</StepperContainer>
		</div>
	{/if}

	<!-- Results Section -->
	{#if currentFlow === "results" && showResults && currentFormData}
		<div id="results-section" class="px-4 sm:px-6 lg:px-8">
			<ResultsSection formData={currentFormData} onReset={resetForm} />
		</div>
	{/if}
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
