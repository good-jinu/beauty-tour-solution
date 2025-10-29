<script module lang="ts">
import type { CountryStepErrors, StepperErrors } from "$lib/types/stepper.js";

export function validate(
	selectedCountry: string,
	realTime = false,
): {
	isValid: boolean;
	errors: CountryStepErrors | undefined;
} {
	const errors: CountryStepErrors = {};

	if (!selectedCountry || selectedCountry.trim() === "") {
		errors.country = realTime
			? "Please select a destination country"
			: "Please select a country for your beauty tour";
	}

	// Additional validation for country format
	if (selectedCountry && selectedCountry.length < 2) {
		errors.country = "Invalid country selection";
	}

	const isValid = Object.keys(errors).length === 0;
	return { isValid, errors: isValid ? undefined : errors };
}
</script>

<script lang="ts">
    import { stepperState } from "$lib/stores/stepper.js";
    import { REGIONS } from "$lib/types/beauty-tour.js";
    import ErrorDisplay from "../ErrorDisplay.svelte";

    let searchQuery = $state("");

    // Filter regions based on search query
    const filteredRegions = $derived(
        REGIONS.filter(
            (region) =>
                region.label
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                region.city.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    function handleCountrySelect(countryValue: string) {
        $stepperState.formData.selectedCountry = countryValue;
    }

    const displayErrors = $derived(() => {
        // Find which step number corresponds to the country step
        const countryStepNumber = Object.keys($stepperState.stepMapping).find(
            (key) => $stepperState.stepMapping[parseInt(key)] === "country",
        );

        if (!countryStepNumber) return [];
        const stepKey =
            `step${countryStepNumber}` as keyof import("$lib/types/stepper.js").StepperErrors;
        const stepErrors = $stepperState.errors[stepKey] as
            | CountryStepErrors
            | undefined;
        if (!stepErrors) return [];
        return Object.values(stepErrors).filter(Boolean) as string[];
    });
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="text-center space-y-2">
        <h2 class="text-2xl font-bold">Choose Your Destination</h2>
        <p class="text-muted-foreground">
            Select the country where you'd like to have your beauty treatments
        </p>
    </div>

    <!-- Search Bar -->
    <div class="relative max-w-md mx-auto">
        <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
        >
            <svg
                class="h-5 w-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
        </div>
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search destinations..."
            autocomplete="off"
            autocapitalize="words"
            spellcheck="false"
            inputmode="search"
            class="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background min-h-[48px]"
        />
    </div>

    <!-- Country Grid -->
    <div
        class="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
        {#each filteredRegions as region (region.value)}
            <button
                type="button"
                onclick={() => handleCountrySelect(region.value)}
                class="group relative flex flex-col items-center justify-center p-3 sm:p-4 lg:p-5 border-2 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-lg text-center min-h-[100px] sm:min-h-[120px] lg:min-h-[140px] {$stepperState
                    .formData.selectedCountry === region.value
                    ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20'
                    : 'border-border hover:bg-muted/30'}"
            >
                <!-- Selection indicator -->
                {#if $stepperState.formData.selectedCountry === region.value}
                    <div
                        class="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                    >
                        <svg
                            class="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    </div>
                {/if}

                <!-- Flag -->
                <div class="text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2">
                    {region.flag}
                </div>

                <!-- Country Name -->
                <h3
                    class="font-semibold text-sm sm:text-base lg:text-lg mb-1 leading-tight px-1"
                >
                    {region.label}
                </h3>

                <!-- City -->
                <p class="text-xs sm:text-sm text-muted-foreground truncate px-1">
                    {region.city}
                </p>

                <!-- Hover effect -->
                <div
                    class="absolute inset-0 rounded-lg sm:rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                ></div>
            </button>
        {/each}
    </div>

    <!-- No results message -->
    {#if filteredRegions.length === 0 && searchQuery.length > 0}
        <div class="text-center py-12">
            <div class="text-muted-foreground">
                <svg
                    class="mx-auto h-12 w-12 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47.881-6.08 2.33l-.926-.926A9.953 9.953 0 0112 13c2.74 0 5.23 1.1 7.006 2.904l-.926.926A7.963 7.963 0 0012 15z"
                    />
                </svg>
                <p class="text-lg font-medium mb-2">No destinations found</p>
                <p class="text-sm">Try adjusting your search terms</p>
                <button
                    type="button"
                    onclick={() => (searchQuery = "")}
                    class="mt-3 text-sm text-primary hover:text-primary/80 underline"
                >
                    Clear search
                </button>
            </div>
        </div>
    {/if}

    <!-- Error Display -->
    <ErrorDisplay errors={displayErrors()} />
</div>
