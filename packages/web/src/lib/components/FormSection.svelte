<script lang="ts">
import Button from "$lib/components/ui/button/button.svelte";
import type { FormData, FormErrors } from "$lib/types";
import BudgetSlider from "./BudgetSlider.svelte";
import DateSelector from "./DateSelector.svelte";
import PackageInclusions from "./PackageInclusions.svelte";
import RegionSelector from "./RegionSelector.svelte";
import SpecialRequests from "./SpecialRequests.svelte";
import ThemeSelector from "./ThemeSelector.svelte";
import TravelersInput from "./TravelersInput.svelte";

interface Props {
	formData: FormData;
	errors: FormErrors;
	isLoading: boolean;
	onSubmit: (event: Event) => void;
}

let { formData = $bindable(), errors, isLoading, onSubmit }: Props = $props();
</script>

<section id="planning-form" class="py-12 lg:py-16">
    <div class="container mx-auto px-4 lg:px-6 max-w-5xl">
        <div
            class="bg-card/60 backdrop-blur-sm border rounded-3xl shadow-xl overflow-hidden"
        >
            <!-- Form Header -->
            <div
                class="bg-gradient-to-r from-primary/5 to-primary/10 px-6 sm:px-8 py-8 text-center border-b"
            >
                <h2 class="text-2xl sm:text-3xl font-bold mb-3">
                    Let's Plan Your Journey
                </h2>
                <p class="text-muted-foreground max-w-2xl mx-auto">
                    Fill out the details below to get your personalized
                    recommendations
                </p>
            </div>

            <!-- Form Content -->
            <div class="p-6 sm:p-8 lg:p-12">
                <form onsubmit={onSubmit} class="space-y-12 lg:space-y-16">
                    <!-- Basic Information Section -->
                    <section class="space-y-8">
                        <div
                            class="flex items-center gap-4 pb-4 border-b border-border/50"
                        >
                            <div
                                class="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                            >
                                1
                            </div>
                            <div>
                                <h3 class="text-xl sm:text-2xl font-semibold">
                                    Basic Information
                                </h3>
                                <p class="text-sm text-muted-foreground">
                                    Tell us about your travel preferences
                                </p>
                            </div>
                        </div>

                        <div class="space-y-8">
                            <RegionSelector
                                bind:selectedRegion={formData.selectedRegion}
                                {errors}
                            />
                            <DateSelector
                                bind:startDate={formData.startDate}
                                bind:endDate={formData.endDate}
                                {errors}
                            />
                            <ThemeSelector
                                bind:selectedTheme={formData.selectedTheme}
                                {errors}
                            />
                            <TravelersInput
                                bind:travelers={formData.travelers}
                                {errors}
                            />
                        </div>
                    </section>

                    <!-- Budget Section -->
                    <section class="space-y-8">
                        <div
                            class="flex items-center gap-4 pb-4 border-b border-border/50"
                        >
                            <div
                                class="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                            >
                                2
                            </div>
                            <div>
                                <h3 class="text-xl sm:text-2xl font-semibold">
                                    Budget
                                </h3>
                                <p class="text-sm text-muted-foreground">
                                    Set your preferred budget range
                                </p>
                            </div>
                        </div>

                        <BudgetSlider bind:budget={formData.budget} />
                    </section>

                    <!-- Package Add-ons Section -->
                    <section class="space-y-8">
                        <div
                            class="flex items-center gap-4 pb-4 border-b border-border/50"
                        >
                            <div
                                class="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                            >
                                3
                            </div>
                            <div>
                                <h3 class="text-xl sm:text-2xl font-semibold">
                                    Package Inclusions
                                </h3>
                                <p class="text-sm text-muted-foreground">
                                    Choose what to include in your beauty
                                    journey
                                </p>
                            </div>
                        </div>

                        <PackageInclusions
                            bind:includeFlights={formData.includeFlights}
                            bind:includeHotels={formData.includeHotels}
                            bind:includeActivities={formData.includeActivities}
                            bind:includeTransport={formData.includeTransport}
                        />
                    </section>

                    <!-- Special Requests Section -->
                    <section class="space-y-8">
                        <div
                            class="flex items-center gap-4 pb-4 border-b border-border/50"
                        >
                            <div
                                class="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                            >
                                4
                            </div>
                            <div>
                                <h3 class="text-xl sm:text-2xl font-semibold">
                                    Special Requests
                                </h3>
                                <p class="text-sm text-muted-foreground">
                                    Tell us about any specific needs or
                                    preferences
                                </p>
                            </div>
                        </div>

                        <SpecialRequests
                            bind:specialRequests={formData.specialRequests}
                        />
                    </section>

                    <!-- Submit Section -->
                    <div class="pt-8 border-t border-border/50">
                        <div class="text-center space-y-4">
                            <Button
                                type="submit"
                                size="lg"
                                class="w-full sm:w-auto min-w-[320px] h-14 text-base bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
                                disabled={isLoading}
                            >
                                {#if isLoading}
                                    <svg
                                        class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            class="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            stroke-width="4"
                                        ></circle>
                                        <path
                                            class="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Creating Your Beauty Journey...
                                {:else}
                                    Get My Beauty Journey Recommendations
                                {/if}
                            </Button>
                            <p
                                class="text-xs text-muted-foreground max-w-md mx-auto"
                            >
                                By submitting this form, you agree to receive
                                personalized recommendations based on your
                                preferences.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</section>

<style>
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .animate-spin {
        animation: spin 1s linear infinite;
    }
</style>
