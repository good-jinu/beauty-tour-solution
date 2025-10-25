<script lang="ts">
import { Eye } from "@lucide/svelte";
import ResultsSection from "$lib/components/ResultsSection.svelte";
import {
	AccordionStepperWrapper,
	StepperContainer,
} from "$lib/components/stepper";
import Button from "$lib/components/ui/button/button.svelte";
import type { StepperFormData } from "$lib/types";

// Application flow state
type AppFlow = "journey-planning" | "results";
let currentFlow: AppFlow = $state("journey-planning");

// Stepper state
let isLoading = $state(false);

// Results state
let showResults = $state(false);
let currentFormData = $state<StepperFormData | null>(null);

// Demo mode for testing
function showDemo() {
	const demoFormData: StepperFormData = {
		startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0], // 1 week from now
		endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0], // 12 days from now
		selectedThemes: ["skincare", "wellness-spa"],
		budget: 5000,
		currency: "USD",
	};

	currentFormData = demoFormData;
	currentFlow = "results";
	showResults = true;

	setTimeout(() => {
		document.getElementById("results-section")?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}, 100);
}

async function handleStepperComplete(stepperData: StepperFormData) {
	isLoading = true;
	showResults = false;
	currentFormData = stepperData;

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
	// Reset results display
	showResults = false;
	currentFormData = null;

	// Reset to journey planning flow
	currentFlow = "journey-planning";

	// Scroll back to the top of the form
	setTimeout(() => {
		document.getElementById("journey-planning-section")?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}, 100);
}
</script>

<svelte:head>
	<title>Plan Your Beauty Journey - Beauty Tour Solution</title>
	<meta
		name="description"
		content="Create your perfect beauty and wellness journey with our AI-powered journey planner"
	/>
</svelte:head>

<!-- Main Container with Mobile-First Responsive Layout -->
<div
	class="min-h-screen bg-gradient-to-b from-muted/20 via-background to-muted/10"
>
	<!-- Journey Planning Section -->
	{#if currentFlow === "journey-planning"}
		<div id="journey-planning-section" class="px-4 sm:px-6 lg:px-8">
			<!-- Demo Button -->
			<div class="text-center mb-8">
				<Button
					onclick={showDemo}
					variant="outline"
					size="lg"
					class="mb-4"
				>
					<Eye class="w-4 h-4 mr-2" />
					View Demo Schedule
				</Button>
				<p class="text-sm text-muted-foreground">
					See a sample beauty journey schedule with skincare and
					wellness treatments
				</p>
			</div>

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
