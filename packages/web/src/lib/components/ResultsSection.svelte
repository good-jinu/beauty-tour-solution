<script lang="ts">
import type { PlanData } from "@bts/core";
import { BadgeCheck, Info, Plus, Save, Share2 } from "@lucide/svelte";
import ScheduleSolutions from "$lib/components/ScheduleSolutions.svelte";
import Button from "$lib/components/ui/button/button.svelte";
import type { StepperFormData } from "$lib/types";
import type { SavePlanApiRequest, SavePlanApiResponse } from "$lib/types/api";
import { getOrCreateGuestId } from "$lib/utils/guest";

interface Props {
	formData: StepperFormData;
	onReset: () => void;
}

let { formData, onReset }: Props = $props();

// State management for save functionality
let isSaving = $state(false);
let saveSuccess = $state(false);
let saveError = $state<string | null>(null);

// Transform StepperFormData to PlanData format
function transformToPlanData(stepperData: StepperFormData): PlanData {
	// Validate required fields
	if (!stepperData.startDate || !stepperData.endDate) {
		throw new Error("Start date and end date are required");
	}

	if (!stepperData.selectedThemes || stepperData.selectedThemes.length === 0) {
		throw new Error("At least one theme must be selected");
	}

	if (!stepperData.budget || stepperData.budget <= 0) {
		throw new Error("Budget must be greater than 0");
	}

	const region = stepperData.selectedCountry || "south-korea";
	const primaryTheme = stepperData.selectedThemes[0];
	const travelers = 1; // Default to 1 traveler for now

	return {
		formData: {
			region,
			startDate: stepperData.startDate,
			endDate: stepperData.endDate,
			theme: primaryTheme,
			budget: stepperData.budget,
			travelers,
			addOns: {
				flights: true,
				hotels: true,
				activities: true,
				transport: true,
			},
			specialRequests: stepperData.moreRequests || null,
		},
		preferences: {
			region,
			budget: stepperData.budget,
			travelers,
			dates: {
				startDate: stepperData.startDate,
				endDate: stepperData.endDate,
			},
			theme: primaryTheme,
			inclusions: stepperData.selectedThemes,
			specialRequests: stepperData.moreRequests,
		},
	};
}

// Save plan handler
async function handleSavePlan() {
	if (isSaving) return;

	try {
		isSaving = true;
		saveError = null;
		saveSuccess = false;

		// Get or create guest ID
		const guestId = getOrCreateGuestId();

		if (!guestId) {
			throw new Error(
				"Unable to generate guest ID. Please check your browser settings.",
			);
		}

		// Transform form data to plan data with validation
		let planData: PlanData;
		try {
			planData = transformToPlanData(formData);
		} catch (transformError) {
			const errorMessage =
				transformError instanceof Error
					? transformError.message
					: "Invalid form data";
			throw new Error(`Data validation failed: ${errorMessage}`);
		}

		// Prepare API request
		const requestBody: SavePlanApiRequest = {
			guestId,
			planData,
			title: `Beauty Tour - ${new Date().toLocaleDateString()}`,
		};

		// Call save API with timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

		try {
			const response = await fetch("/api/plans/save", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(requestBody),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			// Check if response is ok
			if (!response.ok) {
				throw new Error(
					`Server error: ${response.status} ${response.statusText}`,
				);
			}

			let result: SavePlanApiResponse;
			try {
				result = await response.json();
			} catch (parseError) {
				throw new Error("Invalid response from server");
			}

			if (result.success) {
				saveSuccess = true;
				console.log("Plan saved successfully:", result.data.planId);

				// Clear success message after 5 seconds
				setTimeout(() => {
					saveSuccess = false;
				}, 5000);
			} else {
				// Handle specific error codes
				let userFriendlyMessage = result.error.message || "Failed to save plan";

				switch (result.error.code) {
					case "VALIDATION_ERROR":
						userFriendlyMessage = "Please check your form data and try again";
						break;
					case "SERVICE_UNAVAILABLE":
						userFriendlyMessage =
							"Service is temporarily unavailable. Please try again later";
						break;
					case "GUEST_ID_REQUIRED":
						userFriendlyMessage =
							"Session error. Please refresh the page and try again";
						break;
					case "SAVE_FAILED":
						userFriendlyMessage = "Unable to save plan. Please try again";
						break;
					default:
						userFriendlyMessage =
							result.error.message ||
							"An error occurred while saving your plan";
				}

				saveError = userFriendlyMessage;
				console.error("Plan save failed:", result.error);
			}
		} catch (fetchError) {
			clearTimeout(timeoutId);

			if (fetchError instanceof Error && fetchError.name === "AbortError") {
				throw new Error(
					"Request timed out. Please check your connection and try again",
				);
			}

			throw fetchError;
		}
	} catch (error) {
		console.error("Error saving plan:", error);

		// Provide user-friendly error messages
		if (error instanceof Error) {
			if (error.message.includes("fetch")) {
				saveError = "Network error. Please check your connection and try again";
			} else if (
				error.message.includes("timeout") ||
				error.message.includes("timed out")
			) {
				saveError = "Request timed out. Please try again";
			} else if (error.message.includes("Data validation failed")) {
				saveError = error.message;
			} else if (error.message.includes("Unable to generate guest ID")) {
				saveError = error.message;
			} else {
				saveError =
					error.message ||
					"An unexpected error occurred while saving your plan";
			}
		} else {
			saveError = "An unexpected error occurred while saving your plan";
		}
	} finally {
		isSaving = false;
	}
}

// Retry save functionality
function retrySave() {
	saveError = null;
	handleSavePlan();
}
</script>

<section
    id="results-section"
    class="py-16 lg:py-24 bg-gradient-to-b from-muted/10 to-background"
>
    <div class="container mx-auto px-4 lg:px-6 max-w-5xl">
        <!-- Results Header -->
        <div class="text-center mb-12">
            <div
                class="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
                <BadgeCheck class="w-4 h-4" />
                Schedule Ready
            </div>

            <div
                class="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8"
            >
                <div class="text-center sm:text-left">
                    <h2 class="text-3xl sm:text-4xl font-bold mb-2">
                        Your Beauty Tour Schedule
                    </h2>
                    <p class="text-muted-foreground">
                        Detailed schedule based on your preferences
                    </p>
                </div>
                <Button
                    onclick={onReset}
                    variant="outline"
                    size="lg"
                    class="flex-shrink-0"
                >
                    <Plus class="w-4 h-4 mr-2" />
                    Create New Plan
                </Button>
            </div>
        </div>

        <!-- Results Content -->
        <div
            class="bg-card/60 backdrop-blur-sm border rounded-3xl shadow-xl overflow-hidden"
        >
            <div class="p-8 lg:p-12">
                <ScheduleSolutions {formData} />
            </div>
        </div>

        <!-- Action Buttons and Disclaimer -->
        <div class="mt-12 space-y-8">
            <!-- Disclaimer -->
            <div
                class="bg-muted/30 border border-muted rounded-2xl p-6 text-center"
            >
                <div class="flex items-center justify-center gap-2 mb-3">
                    <Info class="w-5 h-5 text-muted-foreground" />
                    <span class="text-sm font-medium text-muted-foreground"
                        >Important Notice</span
                    >
                </div>
                <p class="text-sm text-muted-foreground leading-relaxed">
                    This schedule is generated based on your preferences. 
                    Please consult with qualified medical professionals and 
                    conduct thorough research before making any medical tourism decisions.
                </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                    size="lg" 
                    class="min-w-[200px]"
                    onclick={handleSavePlan}
                    disabled={isSaving}
                >
                    {#if isSaving}
                        <div class="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Saving...
                    {:else}
                        <Save class="w-4 h-4 mr-2" />
                        Save This Plan
                    {/if}
                </Button>
                <Button size="lg" variant="outline" class="min-w-[200px]">
                    <Share2 class="w-4 h-4 mr-2" />
                    Share with Doctor
                </Button>
            </div>

            <!-- Success/Error Feedback -->
            {#if saveSuccess}
                <div class="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <BadgeCheck class="w-5 h-5 text-green-600" />
                        <span class="text-sm font-medium text-green-800">Plan Saved Successfully!</span>
                    </div>
                    <p class="text-sm text-green-700">
                        Your beauty tour plan has been saved and can be accessed later.
                    </p>
                </div>
            {/if}

            {#if saveError}
                <div class="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                    <div class="flex items-center justify-center gap-2 mb-2">
                        <Info class="w-5 h-5 text-red-600" />
                        <span class="text-sm font-medium text-red-800">Save Failed</span>
                    </div>
                    <p class="text-sm text-red-700 mb-3">
                        {saveError}
                    </p>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onclick={retrySave}
                        class="text-red-700 border-red-300 hover:bg-red-50"
                    >
                        Try Again
                    </Button>
                </div>
            {/if}
        </div>
    </div>
</section>


