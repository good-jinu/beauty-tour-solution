<script lang="ts">
import HeroSection from "$lib/components/HeroSection.svelte";
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
import type { StepperFormData } from "$lib/types";
import { StepperUtils } from "$lib/types";
import type {
	GenerateJourneyRequest,
	GenerateJourneyResponse,
} from "./api/generate-journey/$types";

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

	// Scroll back to the top of the form
	setTimeout(() => {
		document.getElementById("stepper-form")?.scrollIntoView({
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
	<!-- Hero Section -->
	<div class="px-4 sm:px-6 lg:px-8">
		<HeroSection />
	</div>

	<!-- Stepper Form Section -->
	<div id="stepper-form" class="px-4 sm:px-6 lg:px-8">
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
						<CountrySelection
							selectedCountry={stepperState.formData
								.selectedCountry}
							errors={currentStepErrors}
							onSelect={(country) =>
								updateFormData({ selectedCountry: country })}
						/>
					{:else if stepperState.currentStep === 2}
						<DateSelection
							startDate={stepperState.formData.startDate}
							endDate={stepperState.formData.endDate}
							errors={currentStepErrors}
							onDateChange={(field, value) =>
								updateFormData({ [field]: value })}
						/>
					{:else if stepperState.currentStep === 3}
						<ThemeSelection
							selectedThemes={stepperState.formData
								.selectedThemes}
							errors={currentStepErrors}
							onThemeToggle={(themeValue) => {
								const currentThemes =
									stepperState.formData.selectedThemes;
								const newThemes = currentThemes.includes(
									themeValue,
								)
									? currentThemes.filter(
											(t: string) => t !== themeValue,
										)
									: [...currentThemes, themeValue];
								updateFormData({ selectedThemes: newThemes });
							}}
						/>
					{:else if stepperState.currentStep === 4}
						<BudgetSelection
							budget={stepperState.formData.budget}
							errors={currentStepErrors}
							onBudgetChange={(budget) =>
								updateFormData({ budget })}
						/>
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

	<!-- Results Section -->
	{#if showResults && aiRecommendation}
		<div class="px-4 sm:px-6 lg:px-8">
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
