<script module lang="ts">
import type { StepperErrors } from "$lib/types/stepper.js";

export function validate(
	selectedThemes: string[],
	realTime = false,
): {
	isValid: boolean;
	errors: StepperErrors["step3"];
} {
	const errors: StepperErrors["step3"] = {};

	if (!selectedThemes || selectedThemes.length === 0) {
		errors.themes = realTime
			? "Select at least one theme"
			: "Please select at least one treatment theme";
	}

	const isValid = Object.keys(errors).length === 0;
	return { isValid, errors: isValid ? undefined : errors };
}
</script>

<script lang="ts">
    import { stepperState } from "$lib/stores/stepper.js";
    import { BEAUTY_THEMES } from "$lib/types/beauty-journey.js";
    import ErrorDisplay from "../ErrorDisplay.svelte";
    import { onMount } from "svelte";

    // Track which themes were pre-selected from beauty simulation
    let preSelectedThemes = $state<string[]>([]);
    let hasPreSelectedThemes = $derived(preSelectedThemes.length > 0);

    function handleThemeToggle(themeValue: string) {
        const currentThemes = $stepperState.formData.selectedThemes;
        const newThemes = currentThemes.includes(themeValue)
            ? currentThemes.filter((t: string) => t !== themeValue)
            : [...currentThemes, themeValue];
        $stepperState.formData.selectedThemes = newThemes;
    }

    function isThemeSelected(themeValue: string): boolean {
        return $stepperState.formData.selectedThemes.includes(themeValue);
    }

    function isThemePreSelected(themeValue: string): boolean {
        return preSelectedThemes.includes(themeValue);
    }

    const displayErrors = $derived(() => {
        const stepErrors = $stepperState.errors.step3;
        if (!stepErrors) return [];
        return Object.values(stepErrors).filter(Boolean) as string[];
    });

    // Check for pre-selected themes on mount
    onMount(() => {
        const currentThemes = $stepperState.formData.selectedThemes;
        if (currentThemes.length > 0) {
            preSelectedThemes = [...currentThemes];
        }
    });
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="text-center space-y-2">
        <h2 class="text-2xl font-bold">Choose Your Treatment</h2>
        <p class="text-muted-foreground">
            Select one or more treatments that match your goals
        </p>

        <!-- Pre-selection notice -->
        {#if hasPreSelectedThemes}
            <div
                class="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg"
            >
                <div class="flex items-center justify-center gap-2 mb-1">
                    <svg
                        class="w-4 h-4 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span class="text-sm font-medium text-primary"
                        >Beauty Simulation Complete</span
                    >
                </div>
                <p class="text-xs text-muted-foreground">
                    We've pre-selected the treatment from your beauty
                    simulation. You can add more or modify your selection below.
                </p>
            </div>
        {/if}
    </div>

    <!-- Theme Options -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each BEAUTY_THEMES as theme (theme.value)}
            <button
                type="button"
                onclick={() => handleThemeToggle(theme.value)}
                class="relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary text-left {isThemeSelected(
                    theme.value,
                )
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:bg-muted/30'} {isThemePreSelected(
                    theme.value,
                ) && isThemeSelected(theme.value)
                    ? 'ring-2 ring-primary/30'
                    : ''}"
            >
                <!-- Selection indicator -->
                {#if isThemeSelected(theme.value)}
                    <div
                        class="absolute top-3 right-3 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                    >
                        <svg
                            class="w-3 h-3"
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

                <!-- Pre-selection indicator -->
                {#if isThemePreSelected(theme.value)}
                    <div class="absolute top-3 left-3 flex items-center gap-1">
                        <div class="w-2 h-2 bg-primary rounded-full"></div>
                        <span class="text-xs font-medium text-primary"
                            >From Simulation</span
                        >
                    </div>
                {/if}

                <!-- Theme Content -->
                <div
                    class="flex items-center gap-3 mb-2 {isThemePreSelected(
                        theme.value,
                    )
                        ? 'mt-6'
                        : ''}"
                >
                    <span class="text-xl">{theme.icon}</span>
                    <h4 class="font-semibold text-sm pr-6">
                        {theme.label}
                    </h4>
                </div>

                <p class="text-xs text-muted-foreground">
                    {theme.description}
                </p>
            </button>
        {/each}
    </div>

    <!-- Error Display -->
    <ErrorDisplay errors={displayErrors()} />
</div>
