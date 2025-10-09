<script lang="ts">
import type {
	GenerateJourneyRequest,
	GenerateJourneyResponse,
} from "@bts/core";
import { BeautySimulationContainer } from "$lib/components/beauty-simulation";
import ResultsSection from "$lib/components/ResultsSection.svelte";
import {
	StepperContainer,
	StepperHeader,
	StepperNavigation,
} from "$lib/components/stepper";
import ErrorRecovery from "$lib/components/stepper/ErrorRecovery.svelte";
import {
	BudgetSelection,
	CountrySelection,
	DateSelection,
	ThemeSelection,
} from "$lib/components/stepper/steps";
import { stepperState } from "$lib/stores/stepper.js";
import type { StepperFormData } from "$lib/types";
import { StepperUtils } from "$lib/types";

// Application flow state
type AppFlow = "beauty-simulation" | "journey-planning" | "results";
let currentFlow: AppFlow = $state("beauty-simulation");

// Beauty simulation state
let simulationData = $state<{
	theme: string;
	originalImage: string;
	simulatedImage: string;
} | null>(null);

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

// Handle beauty simulation completion
function handleSimulationComplete(data: {
	theme: string;
	originalImage: string;
	simulatedImage: string;
}) {
	simulationData = data;

	// If a theme was selected from simulation, pre-populate it in the stepper
	if (data.theme) {
		stepperState.update((state) => ({
			...state,
			formData: {
				...state.formData,
				selectedThemes: [data.theme],
			},
		}));
	}

	// Navigate to journey planning
	currentFlow = "journey-planning";

	// Scroll to journey planning section
	setTimeout(() => {
		document.getElementById("journey-planning-section")?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}, 100);
}

// Handle skipping beauty simulation
function handleSkipSimulation() {
	simulationData = null;
	currentFlow = "journey-planning";

	// Scroll to journey planning section
	setTimeout(() => {
		document.getElementById("journey-planning-section")?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}, 100);
}

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

	// Reset to beauty simulation flow
	currentFlow = "beauty-simulation";
	simulationData = null;

	// Scroll back to the top of the form
	setTimeout(() => {
		document.getElementById("beauty-simulation-section")?.scrollIntoView({
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
		content="Create your perfect beauty and wellness journey with our AI-powered beauty tour builder"
	/>
</svelte:head>

<!-- Main Container with Mobile-First Responsive Layout -->
<div
	class="min-h-screen bg-gradient-to-b from-muted/20 via-background to-muted/10"
>
	<!-- Beauty Simulation Section -->
	{#if currentFlow === "beauty-simulation"}
		<div id="beauty-simulation-section" class="px-4 sm:px-6 lg:px-8">
			<BeautySimulationContainer
				onComplete={handleSimulationComplete}
				onStepChange={(step) => {
					// Handle step changes if needed for analytics or state management
				}}
				showSkipOption={true}
				className="beauty-simulation-main"
			/>
		</div>
	{/if}

	<!-- Journey Planning Section -->
	{#if currentFlow === "journey-planning"}
		<div id="journey-planning-section" class="px-4 sm:px-6 lg:px-8">
			<!-- Navigation back to simulation -->
			<div class="mb-6 text-center">
				<button
					type="button"
					onclick={() => {
						currentFlow = "beauty-simulation";
						setTimeout(() => {
							document
								.getElementById("beauty-simulation-section")
								?.scrollIntoView({
									behavior: "smooth",
									block: "start",
								});
						}, 100);
					}}
					class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<svg
						class="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back to Beauty Simulation
				</button>
			</div>

			<!-- Show simulation results summary if available -->
			{#if simulationData && simulationData.theme}
				<div class="mb-8 p-4 bg-muted/50 rounded-lg border">
					<div class="flex items-center gap-3 mb-2">
						<div class="w-2 h-2 bg-green-500 rounded-full"></div>
						<h3 class="font-semibold text-sm">
							Beauty Simulation Complete
						</h3>
					</div>
					<p class="text-sm text-muted-foreground">
						Selected theme: <span
							class="font-medium text-foreground"
							>{simulationData.theme}</span
						>
					</p>
				</div>
			{/if}

			<StepperContainer oncomplete={handleStepperComplete}>
				{#snippet children({
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
				}: any)}
					<!-- Stepper Header -->
					<StepperHeader {stepperState} onStepClick={goToStep} />

					<!-- Step Content -->
					<div class="stepper-content mt-8">
						{#if stepperState.currentStep === 1}
							<CountrySelection />
						{:else if stepperState.currentStep === 2}
							<DateSelection />
						{:else if stepperState.currentStep === 3}
							<ThemeSelection />
						{:else if stepperState.currentStep === 4}
							<BudgetSelection />
						{/if}
					</div>

					<!-- Error Recovery System -->
					{#if hasCurrentStepErrors || globalWarning}
						<div class="mt-6">
							<ErrorRecovery
								{stepperState}
								onGoToStep={goToStep}
								onClearErrors={clearAllErrors}
								onRetryValidation={() => {
									// Trigger validation by updating form data with current values
									updateFormData({});
								}}
								showInline={true}
							/>
						</div>
					{/if}

					<!-- Stepper Navigation -->
					<StepperNavigation
						{canGoPrevious}
						{canGoNext}
						{isLastStep}
						isLoading={isLoading || stepperState.isLoading}
						onprevious={previousStep}
						onnext={nextStep}
						onsubmit={nextStep}
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

	.stepper-content {
		min-height: 400px;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	@media (max-width: 768px) {
		.stepper-content {
			min-height: 300px;
		}
	}
</style>
