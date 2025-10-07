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

	// Theme compatibility validation
	if (selectedThemes && selectedThemes.length > 1) {
		// Check for incompatible combinations
		const incompatibleCombinations = [
			{
				themes: ["plastic-surgery", "wellness-spa"],
				message:
					"Surgical procedures and spa treatments may require separate visits for optimal recovery",
			},
			{
				themes: ["weight-loss", "plastic-surgery"],
				message:
					"Weight loss and plastic surgery procedures should be carefully timed - consult with specialists",
			},
		];

		for (const combo of incompatibleCombinations) {
			if (combo.themes.every((theme) => selectedThemes?.includes(theme))) {
				errors.compatibility = combo.message;
				break;
			}
		}

		// Check for too many themes (more than 3 might be overwhelming)
		if (selectedThemes.length > 3) {
			errors.selection =
				"Consider limiting to 3 themes for a focused treatment plan";
		}
	}

	const isValid = Object.keys(errors).length === 0;
	return { isValid, errors: isValid ? undefined : errors };
}
</script>

<script lang="ts">
	import { stepperState } from '$lib/stores/stepper.js';
	import { THEMES } from '$lib/types/beauty-journey.js';
	import ErrorDisplay from '../ErrorDisplay.svelte';

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

// Real-time compatibility checking
let compatibilityWarnings = $state<string[]>([]);

$effect(() => {
	compatibilityWarnings = [];

	if ($stepperState.formData.selectedThemes.length > 1) {
		// Check for incompatible combinations
		const incompatibleCombinations = [
			{
				themes: ["plastic-surgery", "wellness-spa"],
				message:
					"Surgical procedures and spa treatments may require separate visits for optimal recovery",
			},
			{
				themes: ["weight-loss", "plastic-surgery"],
				message:
					"Weight loss and plastic surgery procedures should be carefully timed",
			},
			{
				themes: ["hair-treatments", "skincare"],
				message:
					"Hair and skin treatments can be combined but may extend recovery time",
			},
		];

		for (const combo of incompatibleCombinations) {
			if (
				combo.themes.every((theme) =>
					$stepperState.formData.selectedThemes.includes(theme),
				)
			) {
				compatibilityWarnings.push(combo.message);
			}
		}

		// Check for too many themes
		if ($stepperState.formData.selectedThemes.length > 3) {
			compatibilityWarnings.push(
				"Consider limiting to 3 themes for a focused treatment plan",
			);
		}
	}
});

const displayErrors = $derived(() => {
	const stepErrors = $stepperState.errors.step3;
	if (!stepErrors) return [];
	return Object.values(stepErrors).filter(Boolean) as string[];
});

// Group themes by category for better organization
const themeCategories = $derived(() => {
	const surgical = THEMES.filter(
		(theme) =>
			theme.value === "plastic-surgery" ||
			theme.value === "hair-treatments" ||
			theme.value === "weight-loss",
	);

	const nonSurgical = THEMES.filter(
		(theme) =>
			theme.value === "skincare" ||
			theme.value === "wellness-spa" ||
			theme.value === "dental-tourism",
	);

	const specialized = THEMES.filter(
		(theme) =>
			theme.value === "holistic-wellness" ||
			theme.value === "luxury-beauty" ||
			theme.value === "recovery-vacation" ||
			theme.value === "preventive-care",
	);

	return { surgical, nonSurgical, specialized };
});
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="text-center space-y-2">
        <h2 class="text-2xl font-bold">Choose Your Beauty Themes</h2>
        <p class="text-muted-foreground">
            Select one or more treatment categories that match your goals
        </p>
    </div>

    <!-- Selected Count -->
    {#if $stepperState.formData.selectedThemes.length > 0}
        <div class="text-center">
            <div
                class="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full"
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
                        d="M5 13l4 4L19 7"
                    />
                </svg>
                <span class="text-sm font-medium">
                    {$stepperState.formData.selectedThemes.length}
                    {$stepperState.formData.selectedThemes.length === 1
						? "theme"
						: "themes"} selected
                </span>
            </div>
        </div>
    {/if}

    <!-- Surgical Procedures -->
    <div class="space-y-4">
        <h3 class="text-base sm:text-lg font-semibold text-center">
            Surgical Procedures
        </h3>
        <div class="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each themeCategories().surgical as theme (theme.value)}
                <button
                    type="button"
                    onclick={() => handleThemeToggle(theme.value)}
                    class="group relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-lg text-left {isThemeSelected(
                        theme.value,
                    )
                        ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20'
                        : 'border-border hover:bg-muted/30'}"
                >
                    <!-- Selection indicator -->
                    {#if isThemeSelected(theme.value)}
                        <div
                            class="absolute top-4 right-4 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                        >
                            <svg
                                class="w-4 h-4"
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

                    <!-- Theme Header -->
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">{theme.icon}</span>
                            <div>
                                <h4
                                    class="font-semibold text-sm leading-tight pr-8"
                                >
                                    {theme.label}
                                </h4>
                            </div>
                        </div>
                    </div>

                    <!-- Recovery Time Badge -->
                    <div class="mb-3">
                        <span
                            class="text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-full"
                        >
                            Recovery: {theme.recoveryTime}
                        </span>
                    </div>

                    <!-- Description -->
                    <p class="text-xs text-muted-foreground leading-relaxed">
                        {theme.description}
                    </p>

                    <!-- Hover effect -->
                    <div
                        class="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    ></div>
                </button>
            {/each}
        </div>
    </div>

    <!-- Non-Surgical Treatments -->
    <div class="space-y-4">
        <h3 class="text-base sm:text-lg font-semibold text-center">
            Non-Surgical Treatments
        </h3>
        <div class="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each themeCategories().nonSurgical as theme (theme.value)}
                <button
                    type="button"
                    onclick={() => handleThemeToggle(theme.value)}
                    class="group relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-lg text-left {isThemeSelected(
                        theme.value,
                    )
                        ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20'
                        : 'border-border hover:bg-muted/30'}"
                >
                    <!-- Selection indicator -->
                    {#if isThemeSelected(theme.value)}
                        <div
                            class="absolute top-4 right-4 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                        >
                            <svg
                                class="w-4 h-4"
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

                    <!-- Theme Header -->
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">{theme.icon}</span>
                            <div>
                                <h4
                                    class="font-semibold text-sm leading-tight pr-8"
                                >
                                    {theme.label}
                                </h4>
                            </div>
                        </div>
                    </div>

                    <!-- Recovery Time Badge -->
                    <div class="mb-3">
                        <span
                            class="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full"
                        >
                            Recovery: {theme.recoveryTime}
                        </span>
                    </div>

                    <!-- Description -->
                    <p class="text-xs text-muted-foreground leading-relaxed">
                        {theme.description}
                    </p>

                    <!-- Hover effect -->
                    <div
                        class="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    ></div>
                </button>
            {/each}
        </div>
    </div>

    <!-- Specialized Services -->
    <div class="space-y-4">
        <h3 class="text-base sm:text-lg font-semibold text-center">
            Specialized Services
        </h3>
        <div
            class="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
            {#each themeCategories().specialized as theme (theme.value)}
                <button
                    type="button"
                    onclick={() => handleThemeToggle(theme.value)}
                    class="group relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-lg text-left {isThemeSelected(
                        theme.value,
                    )
                        ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20'
                        : 'border-border hover:bg-muted/30'}"
                >
                    <!-- Selection indicator -->
                    {#if isThemeSelected(theme.value)}
                        <div
                            class="absolute top-4 right-4 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                        >
                            <svg
                                class="w-4 h-4"
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

                    <!-- Theme Header -->
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">{theme.icon}</span>
                            <div>
                                <h4
                                    class="font-semibold text-sm leading-tight pr-8"
                                >
                                    {theme.label}
                                </h4>
                            </div>
                        </div>
                    </div>

                    <!-- Recovery Time Badge -->
                    <div class="mb-3">
                        <span
                            class="text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full"
                        >
                            Recovery: {theme.recoveryTime}
                        </span>
                    </div>

                    <!-- Description -->
                    <p class="text-xs text-muted-foreground leading-relaxed">
                        {theme.description}
                    </p>

                    <!-- Hover effect -->
                    <div
                        class="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    ></div>
                </button>
            {/each}
        </div>
    </div>

    <!-- Error Display -->
    <ErrorDisplay errors={displayErrors()} />

    <!-- Real-time compatibility warnings -->
    {#each compatibilityWarnings as warning}
        <div class="text-center">
            <p
                class="text-sm text-amber-600 flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-lg"
            >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    />
                </svg>
                {warning}
            </p>
        </div>
    {/each}

    <!-- Guidelines -->
    <div class="bg-muted/30 rounded-lg p-4 space-y-2">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            Treatment Guidelines
        </h4>
        <ul class="text-sm text-muted-foreground space-y-1">
            <li>
                • You can select multiple themes to create a comprehensive
                treatment plan
            </li>
            <li>
                • Consider recovery times when combining surgical and
                non-surgical treatments
            </li>
            <li>
                • Surgical procedures may require longer stays and more recovery
                time
            </li>
            <li>
                • Consult with medical professionals about treatment
                combinations
            </li>
        </ul>
    </div>
</div>
