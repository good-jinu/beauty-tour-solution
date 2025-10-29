<script module lang="ts">
import type { StepperErrors, ThemeStepErrors } from "$lib/types/stepper.js";

export function validate(
	selectedThemes: string[],
	realTime = false,
): {
	isValid: boolean;
	errors: ThemeStepErrors | undefined;
} {
	const errors: ThemeStepErrors = {};

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
    import { JOURNEY_THEMES } from "$lib/types/beauty-tour.js";
    import ErrorDisplay from "../ErrorDisplay.svelte";

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

    const displayErrors = $derived(() => {
        const stepErrors = $stepperState.errors.step3;
        if (!stepErrors) return [];
        return Object.values(stepErrors).filter(Boolean) as string[];
    });
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="text-center space-y-2">
        <h2 class="text-2xl font-bold">Choose Your Treatment</h2>
        <p class="text-muted-foreground">
            Select one or more treatments that match your goals
        </p>
    </div>

    <!-- Theme Options -->
    <div class="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {#each JOURNEY_THEMES as theme (theme.value)}
            <button
                type="button"
                onclick={() => handleThemeToggle(theme.value)}
                class="relative flex flex-col p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary text-left min-h-[80px] sm:min-h-[100px] {isThemeSelected(
                    theme.value,
                )
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:bg-muted/30'}"
            >
                <!-- Selection indicator -->
                {#if isThemeSelected(theme.value)}
                    <div
                        class="absolute top-2 right-2 sm:top-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                    >
                        <svg
                            class="w-2.5 h-2.5 sm:w-3 sm:h-3"
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

                <!-- Theme Content -->
                <div class="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2 pr-6">
                    <span class="text-lg sm:text-xl flex-shrink-0">{theme.icon}</span>
                    <h4 class="font-semibold text-sm sm:text-base leading-tight">
                        {theme.label}
                    </h4>
                </div>

                <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {theme.description}
                </p>
            </button>
        {/each}
    </div>

    <!-- Error Display -->
    <ErrorDisplay errors={displayErrors()} />
</div>
