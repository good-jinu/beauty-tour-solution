<script lang="ts">
import type { StepperErrors } from "$lib/types/stepper.js";

interface Props {
	budget: number;
	errors?: StepperErrors["step4"];
	onBudgetChange: (budget: number) => void;
}

let { budget = 0, errors, onBudgetChange }: Props = $props();

// Budget configuration
const MIN_BUDGET = 500;
const MAX_BUDGET = 15000;
const STEP = 250;

// Budget ranges with recommendations
const budgetRanges = [
	{
		min: 500,
		max: 2000,
		label: "Budget-Friendly",
		description: "Basic treatments and wellness packages",
		color:
			"text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
		treatments: ["Spa treatments", "Basic skincare", "Wellness retreats"],
	},
	{
		min: 2000,
		max: 5000,
		label: "Standard",
		description: "Quality treatments with good facilities",
		color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
		treatments: ["Cosmetic procedures", "Dental work", "Advanced skincare"],
	},
	{
		min: 5000,
		max: 10000,
		label: "Premium",
		description: "High-end treatments with luxury amenities",
		color:
			"text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
		treatments: ["Plastic surgery", "Luxury recovery", "Premium facilities"],
	},
	{
		min: 10000,
		max: 15000,
		label: "Luxury",
		description: "Top-tier treatments with exclusive services",
		color:
			"text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
		treatments: [
			"Exclusive procedures",
			"VIP treatment",
			"Luxury accommodations",
		],
	},
];

// Get current budget range
const currentRange = $derived(
	budgetRanges.find((range) => budget >= range.min && budget <= range.max) ||
		budgetRanges[0],
);

// Format currency
function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

// Handle slider change
function handleSliderChange(event: Event) {
	const target = event.target as HTMLInputElement;
	const newBudget = parseInt(target.value, 10);
	onBudgetChange(newBudget);
}

// Handle preset budget selection
function handlePresetSelect(amount: number) {
	onBudgetChange(amount);
}

// Real-time budget validation
let budgetFeedback = $state("");

$effect(() => {
	if (budget > 0) {
		if (budget < 500) {
			budgetFeedback = "Consider increasing budget for quality treatments";
		} else if (budget >= 500 && budget < 2000) {
			budgetFeedback = "Good for basic treatments and wellness packages";
		} else if (budget >= 2000 && budget < 5000) {
			budgetFeedback = "Excellent for quality treatments with good facilities";
		} else if (budget >= 5000 && budget < 10000) {
			budgetFeedback = "Perfect for premium treatments with luxury amenities";
		} else if (budget >= 10000) {
			budgetFeedback = "Ideal for top-tier treatments with exclusive services";
		}
	} else {
		budgetFeedback = "";
	}
});

// Quick preset amounts
const presetAmounts = [1000, 2500, 5000, 7500, 10000, 12500];
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="text-center space-y-2">
        <h2 class="text-2xl font-bold">Set Your Budget</h2>
        <p class="text-muted-foreground">
            Choose your budget range to get personalized recommendations
        </p>
    </div>

    <!-- Current Budget Display -->
    <div class="text-center">
        <div
            class="inline-flex flex-col items-center gap-2 px-6 py-4 bg-primary/10 rounded-2xl"
        >
            <div class="text-3xl font-bold text-primary">
                {formatCurrency(budget)}
            </div>
            {#if currentRange}
                <div class="flex items-center gap-2">
                    <span
                        class="text-sm font-medium px-3 py-1 rounded-full {currentRange.color}"
                    >
                        {currentRange.label}
                    </span>
                </div>
            {/if}
        </div>
    </div>

    <!-- Budget Slider -->
    <div class="space-y-4 max-w-2xl mx-auto">
        <div class="relative">
            <input
                type="range"
                min={MIN_BUDGET}
                max={MAX_BUDGET}
                step={STEP}
                value={budget}
                onchange={handleSliderChange}
                oninput={handleSliderChange}
                class="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer slider"
            />

            <!-- Range markers -->
            <div
                class="flex justify-between text-xs text-muted-foreground mt-2"
            >
                <span>{formatCurrency(MIN_BUDGET)}</span>
                <span>{formatCurrency(MAX_BUDGET)}</span>
            </div>
        </div>

        <!-- Quick Preset Buttons -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {#each presetAmounts as amount}
                <button
                    type="button"
                    onclick={() => handlePresetSelect(amount)}
                    class="px-2 py-2 sm:px-3 text-xs sm:text-sm border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors min-h-[44px] flex items-center justify-center {budget ===
                    amount
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : ''}"
                >
                    {formatCurrency(amount)}
                </button>
            {/each}
        </div>
    </div>

    <!-- Budget Range Information -->
    {#if currentRange}
        <div class="max-w-2xl mx-auto">
            <div class="bg-muted/30 rounded-lg p-6 space-y-4">
                <div class="flex items-center gap-3">
                    <div class="w-3 h-3 rounded-full bg-primary"></div>
                    <h3 class="text-lg font-semibold">
                        {currentRange.label} Range
                    </h3>
                    <span
                        class="text-sm font-medium px-3 py-1 rounded-full {currentRange.color}"
                    >
                        {formatCurrency(currentRange.min)} - {formatCurrency(
                            currentRange.max,
                        )}
                    </span>
                </div>

                <p class="text-muted-foreground">
                    {currentRange.description}
                </p>

                <div class="space-y-2">
                    <h4 class="text-sm font-medium">
                        What's typically included:
                    </h4>
                    <ul class="text-sm text-muted-foreground space-y-1">
                        {#each currentRange.treatments as treatment}
                            <li class="flex items-center gap-2">
                                <svg
                                    class="w-4 h-4 text-primary"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                {treatment}
                            </li>
                        {/each}
                    </ul>
                </div>
            </div>
        </div>
    {/if}

    <!-- Budget Breakdown -->
    <div class="max-w-2xl mx-auto">
        <div class="bg-muted/30 rounded-lg p-4 space-y-3">
            <h4 class="text-sm font-medium flex items-center gap-2">
                <svg
                    class="w-4 h-4 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
                Typical Budget Breakdown
            </h4>
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Treatments:</span>
                        <span class="font-medium">40-60%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Accommodation:</span
                        >
                        <span class="font-medium">20-30%</span>
                    </div>
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Flights:</span>
                        <span class="font-medium">15-25%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground"
                            >Meals & Extras:</span
                        >
                        <span class="font-medium">10-15%</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Real-time budget feedback -->
    {#if budgetFeedback}
        <div class="text-center">
            <p
                class="text-sm text-green-600 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg"
            >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                    />
                </svg>
                {budgetFeedback}
            </p>
        </div>
    {/if}

    <!-- Error Display -->
    {#if errors?.budget}
        <div class="text-center">
            <p
                class="text-sm text-destructive flex items-center justify-center gap-2"
            >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    />
                </svg>
                {errors.budget}
            </p>
        </div>
    {/if}

    {#if errors?.range}
        <div class="text-center">
            <p
                class="text-sm text-destructive flex items-center justify-center gap-2"
            >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    />
                </svg>
                {errors.range}
            </p>
        </div>
    {/if}
</div>

<style>
    /* Custom slider styling */
    .slider::-webkit-slider-thumb {
        appearance: none;
        height: 24px;
        width: 24px;
        border-radius: 50%;
        background: hsl(var(--primary));
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .slider::-moz-range-thumb {
        height: 24px;
        width: 24px;
        border-radius: 50%;
        background: hsl(var(--primary));
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .slider::-webkit-slider-track {
        height: 12px;
        border-radius: 6px;
        background: hsl(var(--muted));
    }

    .slider::-moz-range-track {
        height: 12px;
        border-radius: 6px;
        background: hsl(var(--muted));
    }
</style>
