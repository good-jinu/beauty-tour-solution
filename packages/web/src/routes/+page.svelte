<script lang="ts">
import type {
	GenerateJourneyRequest,
	GenerateJourneyResponse,
} from "@bts/core";
import ResultsSection from "$lib/components/ResultsSection.svelte";
import {
	AccordionStepperWrapper,
	StepperContainer,
} from "$lib/components/stepper";
import type { StepperFormData } from "$lib/types";
import { StepperUtils } from "$lib/types";

// Application flow state
type AppFlow = "journey-planning" | "results";
let currentFlow: AppFlow = $state("journey-planning");

// Stepper state
let isLoading = $state(false);

// AI Response state
let aiRecommendation = $state("");
let showResults = $state(false);

// Default add-ons for legacy API compatibility
const defaultAddOns = {
	includeFlights: true,
	includeHotels: true,
	includeActivities: true,
	includeTransport: true,
	travelers: 1,
	specialRequests: "",
};

async function handleStepperComplete(stepperData: StepperFormData) {
	isLoading = true;
	showResults = false;
	aiRecommendation = "";

	// Convert stepper data to legacy API format
	const legacyFormData = StepperUtils.stepperToLegacyFormData(
		stepperData,
		defaultAddOns,
	);

	const requestData: GenerateJourneyRequest = {
		region: legacyFormData.selectedRegion,
		startDate: legacyFormData.startDate,
		endDate: legacyFormData.endDate,
		theme: legacyFormData.selectedTheme,
		budget: legacyFormData.budget,
		travelers: legacyFormData.travelers,
		addOns: {
			flights: legacyFormData.includeFlights,
			hotels: legacyFormData.includeHotels,
			activities: legacyFormData.includeActivities,
			transport: legacyFormData.includeTransport,
		},
		specialRequests: legacyFormData.specialRequests,
	};

	try {
		const response = await fetch("/api/generate-journey", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestData),
		});

		if (!response.ok) {
			throw new Error("Failed to generate recommendations");
		}

		const data: GenerateJourneyResponse = await response.json();

		if (data.success) {
			aiRecommendation = data.recommendation ?? "";
			currentFlow = "results";
			showResults = true;

			// Scroll to results
			setTimeout(() => {
				document.getElementById("results-section")?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}, 100);
		} else {
			alert(`Error: ${data.error || "Unknown error occurred"}`);
		}
	} catch (error) {
		console.error("Error:", error);
		alert("Failed to generate recommendations. Please try again.");
	} finally {
		isLoading = false;
	}
}

function resetForm() {
	// Reset results display
	showResults = false;
	aiRecommendation = "";

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
	{#if currentFlow === "results" && showResults && aiRecommendation}
		<div id="results-section" class="px-4 sm:px-6 lg:px-8">
			<ResultsSection {aiRecommendation} onReset={resetForm} />
		</div>
	{/if}
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
