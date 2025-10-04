<script lang="ts">
import { FormSection, HeroSection, ResultsSection } from "$lib/components";
import type { FormData, FormErrors } from "$lib/types";
import type {
	GenerateJourneyRequest,
	GenerateJourneyResponse,
} from "./api/generate-journey/$types";

// Form state
let formData = $state<FormData>({
	selectedRegion: "",
	startDate: "",
	endDate: "",
	selectedTheme: "",
	budget: 2500,
	includeFlights: false,
	includeHotels: true,
	includeActivities: true,
	includeTransport: false,
	travelers: 2,
	specialRequests: "",
});

let isLoading = $state(false);
let errors = $state<FormErrors>({});

// AI Response state
let aiRecommendation = $state("");
let showResults = $state(false);

function validateForm(): boolean {
	const newErrors: FormErrors = {};

	if (!formData.selectedRegion) {
		newErrors.region = "Please select a destination";
	}
	if (!formData.startDate) {
		newErrors.startDate = "Please select a start date";
	}
	if (!formData.endDate) {
		newErrors.endDate = "Please select an end date";
	}
	if (
		formData.startDate &&
		formData.endDate &&
		new Date(formData.startDate) >= new Date(formData.endDate)
	) {
		newErrors.endDate = "End date must be after start date";
	}
	if (!formData.selectedTheme) {
		newErrors.theme = "Please select beauty services";
	}
	if (formData.travelers < 1) {
		newErrors.travelers = "Number of travelers must be at least 1";
	}

	errors = newErrors;
	return Object.keys(newErrors).length === 0;
}

async function handleSubmit(event: Event) {
	event.preventDefault();
	if (!validateForm()) {
		return;
	}

	isLoading = true;
	showResults = false;
	aiRecommendation = "";

	const requestData: GenerateJourneyRequest = {
		region: formData.selectedRegion,
		startDate: formData.startDate,
		endDate: formData.endDate,
		theme: formData.selectedTheme,
		budget: formData.budget,
		travelers: formData.travelers,
		addOns: {
			flights: formData.includeFlights,
			hotels: formData.includeHotels,
			activities: formData.includeActivities,
			transport: formData.includeTransport,
		},
		specialRequests: formData.specialRequests,
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

	// Reset form fields
	formData = {
		selectedRegion: "",
		startDate: "",
		endDate: "",
		selectedTheme: "",
		budget: 2500,
		includeFlights: false,
		includeHotels: true,
		includeActivities: true,
		includeTransport: false,
		travelers: 2,
		specialRequests: "",
	};

	// Clear any errors
	errors = {};

	// Scroll back to the top of the form
	setTimeout(() => {
		document.getElementById("planning-form")?.scrollIntoView({
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

<!-- Main Container with Optimized Layout -->
<div
  class="min-h-screen bg-gradient-to-b from-muted/20 via-background to-muted/10"
>
  <!-- Hero Section -->
  <HeroSection />

  <!-- Form Section -->
  <FormSection bind:formData {errors} {isLoading} onSubmit={handleSubmit} />

  <!-- Results Section -->
  {#if showResults && aiRecommendation}
    <ResultsSection {aiRecommendation} onReset={resetForm} />
  {/if}
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>
