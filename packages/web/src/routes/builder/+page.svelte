<script lang="ts">
import Button from "$lib/components/ui/button/button.svelte";
import Input from "$lib/components/ui/input/input.svelte";
import type {
	GenerateJourneyRequest,
	GenerateJourneyResponse,
} from "../api/generate-journey/$types";

// Form state
let selectedRegion = $state("");
let startDate = $state("");
let endDate = $state("");
let selectedTheme = $state("");
let budget = $state(2500);
let includeFlights = $state(false);
let includeHotels = $state(true);
let includeActivities = $state(true);
let includeTransport = $state(false);
let travelers = $state(2);
let specialRequests = $state("");

let isLoading = $state(false);
let errors = $state<{ [key: string]: string }>({});

// AI Response state
let aiRecommendation = $state("");
let showResults = $state(false);

// Form options
const regions = [
	{ value: "south-korea", label: "South Korea - K-Beauty & Plastic Surgery" },
	{ value: "thailand", label: "Thailand - Spa & Wellness Retreats" },
	{ value: "turkey", label: "Turkey - Hair Transplant & Medical Tourism" },
	{ value: "uae", label: "UAE - Luxury Cosmetic Treatments" },
	{ value: "brazil", label: "Brazil - Cosmetic Surgery & Beach Recovery" },
	{ value: "india", label: "India - Ayurvedic Treatments & Wellness" },
	{ value: "mexico", label: "Mexico - Dental Tourism & Spa Treatments" },
	{
		value: "costa-rica",
		label: "Costa Rica - Medical Tourism & Eco-Wellness",
	},
];

const themes = [
	{ value: "skincare", label: "Skincare & Anti-Aging Treatments" },
	{
		value: "plastic-surgery",
		label: "Plastic Surgery & Cosmetic Procedures",
	},
	{ value: "wellness-spa", label: "Wellness & Spa Retreats" },
	{ value: "hair-treatments", label: "Hair Transplant & Hair Treatments" },
	{ value: "dental-tourism", label: "Dental Tourism & Smile Makeovers" },
	{ value: "weight-loss", label: "Weight Loss & Body Contouring" },
	{
		value: "holistic-wellness",
		label: "Holistic Wellness & Alternative Medicine",
	},
	{ value: "luxury-beauty", label: "Luxury Beauty & Premium Treatments" },
	{ value: "recovery-vacation", label: "Recovery & Healing Vacation" },
	{ value: "preventive-care", label: "Preventive Care & Health Checkups" },
];

function validateForm() {
	const newErrors: { [key: string]: string } = {};

	if (!selectedRegion) {
		newErrors.region = "Please select a destination";
	}
	if (!startDate) {
		newErrors.startDate = "Please select a start date";
	}
	if (!endDate) {
		newErrors.endDate = "Please select an end date";
	}
	if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
		newErrors.endDate = "End date must be after start date";
	}
	if (!selectedTheme) {
		newErrors.theme = "Please select beauty services";
	}
	if (travelers < 1) {
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

	const formData: GenerateJourneyRequest = {
		region: selectedRegion,
		startDate,
		endDate,
		theme: selectedTheme,
		budget,
		travelers,
		addOns: {
			flights: includeFlights,
			hotels: includeHotels,
			activities: includeActivities,
			transport: includeTransport,
		},
		specialRequests,
	};

	try {
		const response = await fetch("/api/generate-journey", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(formData),
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
	showResults = false;
	aiRecommendation = "";
}

const formatBudget = $derived.by(() => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(budget);
});
</script>

<svelte:head>
  <title>Plan Your Beauty Journey - Beauty Tour Solution</title>
  <meta
    name="description"
    content="Create your perfect beauty and wellness journey with our AI-powered beauty tour builder"
  />
</svelte:head>

<div
  class="py-16 bg-gradient-to-b from-muted/30 to-background min-h-[calc(100vh-80px)]"
>
  <div class="container mx-auto px-4">
    <!-- Header -->
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold mb-4">Plan Your Perfect Beauty Journey</h1>
      <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
        Tell us about your beauty goals and travel preferences, and let our AI
        create a personalized beauty and wellness experience for you.
      </p>
    </div>

    <!-- Form -->
    <form onsubmit={handleSubmit}>
      <!-- Basic Information -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 pb-3 border-b">
          Basic Information
        </h2>
        <div class="space-y-6">
          <div class="space-y-2">
            <label for="region-select" class="text-sm font-medium"
              >Where would you like to have your beauty treatments?</label
            >
            <select
              id="region-select"
              bind:value={selectedRegion}
              class="w-full h-10 rounded-md border bg-background px-3 text-sm"
              required
            >
              <option value="">Select a destination</option>
              {#each regions as region}
                <option value={region.value}>{region.label}</option>
              {/each}
            </select>
            {#if errors.region}
              <p class="text-sm text-destructive">{errors.region}</p>
            {/if}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label for="start-date" class="text-sm font-medium"
                >Start Date</label
              >
              <Input
                id="start-date"
                bind:value={startDate}
                type="date"
                required
              />
              {#if errors.startDate}
                <p class="text-sm text-destructive">{errors.startDate}</p>
              {/if}
            </div>
            <div class="space-y-2">
              <label for="end-date" class="text-sm font-medium">End Date</label>
              <Input id="end-date" bind:value={endDate} type="date" required />
              {#if errors.endDate}
                <p class="text-sm text-destructive">{errors.endDate}</p>
              {/if}
            </div>
          </div>

          <div class="space-y-2">
            <label for="treatment-type" class="text-sm font-medium"
              >What type of beauty treatments are you interested in?</label
            >
            <select
              id="treatment-type"
              bind:value={selectedTheme}
              class="w-full h-10 rounded-md border bg-background px-3 text-sm"
              required
            >
              <option value="">Select beauty services</option>
              {#each themes as theme}
                <option value={theme.value}>{theme.label}</option>
              {/each}
            </select>
            {#if errors.theme}
              <p class="text-sm text-destructive">{errors.theme}</p>
            {/if}
          </div>

          <div class="space-y-2">
            <label for="number-of-travelers" class="text-sm font-medium"
              >Number of Travelers</label
            >
            <Input
              id="number-of-travelers"
              bind:value={travelers}
              type="number"
              min={1}
              max={20}
              required
            />
            {#if errors.travelers}
              <p class="text-sm text-destructive">{errors.travelers}</p>
            {/if}
          </div>
        </div>
      </section>

      <!-- Budget -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 pb-3 border-b">Budget</h2>
        <div class="bg-muted/50 p-6 rounded-xl border">
          <div class="flex items-center justify-center gap-3 mb-6">
            <span class="text-lg text-muted-foreground">Your budget:</span>
            <span class="text-3xl font-bold text-primary">{formatBudget}</span>
          </div>
          <div class="space-y-2">
            <input
              type="range"
              min="500"
              max="15000"
              step="250"
              bind:value={budget}
              class="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer slider"
            />
            <div class="flex justify-between text-sm text-muted-foreground">
              <span>$500</span>
              <span>$15,000+</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Add-ons -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 pb-3 border-b">
          What should we include in your package?
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <label
            class="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition hover:border-primary"
            class:border-primary={includeFlights}
            class:bg-primary={includeFlights}
            class:text-primary-foreground={includeFlights}
          >
            <input
              type="checkbox"
              bind:checked={includeFlights}
              class="sr-only"
            />
            <div class="text-2xl">✈️</div>
            <div>
              <h3 class="font-semibold">Flights</h3>
              <p class="text-sm opacity-80">Round-trip airfare</p>
            </div>
          </label>

          <label
            class="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition hover:border-primary"
            class:border-primary={includeHotels}
            class:bg-primary={includeHotels}
            class:text-primary-foreground={includeHotels}
          >
            <input
              type="checkbox"
              bind:checked={includeHotels}
              class="sr-only"
            />
            <div class="text-2xl">🏨</div>
            <div>
              <h3 class="font-semibold">Recovery Accommodation</h3>
              <p class="text-sm opacity-80">
                Specialized recovery hotels & spas
              </p>
            </div>
          </label>

          <label
            class="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition hover:border-primary"
            class:border-primary={includeActivities}
            class:bg-primary={includeActivities}
            class:text-primary-foreground={includeActivities}
          >
            <input
              type="checkbox"
              bind:checked={includeActivities}
              class="sr-only"
            />
            <div class="text-2xl">💆‍♀️</div>
            <div>
              <h3 class="font-semibold">Wellness Activities</h3>
              <p class="text-sm opacity-80">Spa treatments & sightseeing</p>
            </div>
          </label>

          <label
            class="flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition hover:border-primary"
            class:border-primary={includeTransport}
            class:bg-primary={includeTransport}
            class:text-primary-foreground={includeTransport}
          >
            <input
              type="checkbox"
              bind:checked={includeTransport}
              class="sr-only"
            />
            <div class="text-2xl">🚗</div>
            <div>
              <h3 class="font-semibold">Medical Transport</h3>
              <p class="text-sm opacity-80">Airport & clinic transfers</p>
            </div>
          </label>
        </div>
      </section>

      <!-- Special Requests -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 pb-3 border-b">
          Special Requests
        </h2>
        <div class="space-y-2">
          <label for="special-requests" class="text-sm font-medium">
            Any special medical conditions, allergies, or preferences?
            (Optional)
          </label>
          <textarea
            id="special-requests"
            bind:value={specialRequests}
            placeholder="Tell us about medical conditions, allergies, recovery preferences, dietary restrictions, specific treatment goals, or anything else we should know for your beauty journey..."
            class="w-full min-h-[100px] p-3 border rounded-md bg-background text-sm resize-y"
            rows="4"
          ></textarea>
        </div>
      </section>

      <!-- Submit -->
      <div class="text-center pt-8 border-t">
        <Button
          type="submit"
          size="lg"
          class="w-full md:w-auto min-w-[300px]"
          disabled={isLoading}
        >
          {isLoading
            ? "Creating Your Beauty Journey..."
            : "Get My Beauty Journey Recommendations"}
        </Button>
      </div>
    </form>

    <!-- AI Results Section -->
    {#if showResults && aiRecommendation}
      <section id="results-section" class="mt-16 pt-16 border-t">
        <div class="mb-8 flex items-center justify-between">
          <h2 class="text-3xl font-bold">Your Personalized Beauty Journey</h2>
          <Button onclick={resetForm} variant="outline">Create New Plan</Button>
        </div>

        <div class="bg-card border rounded-xl p-8 shadow-lg">
          <div class="prose prose-slate max-w-none dark:prose-invert">
            {@html aiRecommendation
              .replace(/\n/g, "<br>")
              .replace(
                /#{3}\s(.+)/g,
                '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>',
              )
              .replace(
                /#{2}\s(.+)/g,
                '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>',
              )
              .replace(
                /#{1}\s(.+)/g,
                '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>',
              )
              .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              .replace(/\*(.+?)\*/g, "<em>$1</em>")}
          </div>
        </div>

        <div class="mt-8 text-center">
          <p class="text-sm text-muted-foreground mb-4">
            This is an AI-generated recommendation. Please consult with medical
            professionals before making any decisions.
          </p>
          <div class="flex gap-4 justify-center">
            <Button size="lg">Save This Plan</Button>
            <Button size="lg" variant="outline">Share with Doctor</Button>
          </div>
        </div>
      </section>
    {/if}
  </div>
</div>

<style>
  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
    border: 3px solid hsl(var(--background));
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .slider::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
    border: 3px solid hsl(var(--background));
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .prose {
    line-height: 1.8;
  }
</style>
