<script lang="ts">
import {
	BeautySimulationUtils,
	BeautySimulationValidation,
	beautySimulationState,
} from "$lib/stores/beauty-simulation.js";
import { BEAUTY_THEMES } from "$lib/types/beauty-journey.js";

interface Props {
	selectedTheme?: string | null;
	onThemeSelect?: (theme: string | null) => void;
	disabled?: boolean;
	showValidation?: boolean;
}

let {
	selectedTheme = $bindable(),
	onThemeSelect,
	disabled = false,
	showValidation = true,
}: Props = $props();

// Use store if no external selectedTheme is provided
const currentTheme = $derived(
	selectedTheme !== undefined
		? selectedTheme
		: $beautySimulationState.selectedTheme,
);

// Validation error for theme selection
const themeError = $derived(
	showValidation
		? BeautySimulationValidation.validateTheme(currentTheme)
		: null,
);

function handleThemeClick(themeValue: string) {
	if (disabled) return;

	// Toggle selection - if already selected, deselect it
	const newSelection = currentTheme === themeValue ? null : themeValue;

	// Update external binding if provided
	if (selectedTheme !== undefined) {
		selectedTheme = newSelection;
	}

	// Update store
	BeautySimulationUtils.setTheme(newSelection);

	// Call external handler if provided
	if (onThemeSelect) {
		onThemeSelect(newSelection);
	}
}

function isThemeSelected(themeValue: string): boolean {
	return currentTheme === themeValue;
}
</script>

<div class="space-y-6 theme-selector">
    <!-- Header -->
    <div class="space-y-2">
        <h3 class="text-lg font-semibold">Choose Your Beauty Treatment</h3>
        <p class="text-sm text-muted-foreground">
            Select the treatment you'd like to simulate on your photo
        </p>
    </div>

    <!-- Theme Grid -->
    <div
        class="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
        {#each BEAUTY_THEMES as theme (theme.value)}
            <button
                type="button"
                onclick={() => handleThemeClick(theme.value)}
                {disabled}
                aria-label="Select {theme.label} treatment theme"
                aria-pressed={isThemeSelected(theme.value)}
                class="relative flex flex-col p-4 md:p-5 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-200 text-left group min-h-[120px] md:min-h-[140px]
					{disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-primary hover:shadow-md active:scale-[0.98]'}
					{isThemeSelected(theme.value)
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                    : 'border-border hover:bg-muted/30'}"
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

                <!-- Theme Content -->
                <div class="flex items-center gap-3 mb-3">
                    <span
                        class="text-xl md:text-2xl"
                        role="img"
                        aria-hidden="true">{theme.icon}</span
                    >
                    <h4
                        class="font-semibold text-sm md:text-base pr-6 group-hover:text-primary transition-colors leading-tight"
                    >
                        {theme.label}
                    </h4>
                </div>

                <p
                    class="text-xs md:text-sm text-muted-foreground leading-relaxed flex-1"
                >
                    {theme.description}
                </p>
            </button>
        {/each}
    </div>

    <!-- Validation Error -->
    {#if themeError}
        <div
            class="flex items-center gap-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg"
        >
            <svg
                class="w-4 h-4 text-destructive"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                />
            </svg>
            <p class="text-sm text-destructive">{themeError}</p>
        </div>
    {/if}

    <!-- Selection Status -->
    {#if currentTheme}
        {@const selectedThemeData = BEAUTY_THEMES.find(
            (t) => t.value === currentTheme,
        )}
        {#if selectedThemeData}
            <div
                class="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg"
            >
                <span class="text-lg">{selectedThemeData.icon}</span>
                <div>
                    <p class="text-sm font-medium">
                        Selected: {selectedThemeData.label}
                    </p>
                    <p class="text-xs text-muted-foreground">
                        {selectedThemeData.description}
                    </p>
                </div>
            </div>
        {/if}
    {:else if !themeError}
        <div
            class="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-lg"
        >
            <svg
                class="w-4 h-4 text-muted-foreground"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"
                />
            </svg>
            <p class="text-sm text-muted-foreground">
                Please select a treatment to continue
            </p>
        </div>
    {/if}
</div>

<style>
    /* Mobile-first responsive design for theme selector */

    /* Touch-friendly interactions */
    @media (hover: none) and (pointer: coarse) {
        /* Mobile touch devices - remove hover effects */
        :global(.theme-selector button:hover) {
            border-color: hsl(var(--border));
            background-color: transparent;
            box-shadow: none;
        }

        :global(.theme-selector button:hover h4) {
            color: inherit;
        }

        /* Improve touch feedback */
        :global(.theme-selector button) {
            -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
        }
    }

    /* Small mobile devices */
    @media (max-width: 480px) {
        :global(.theme-selector .grid) {
            grid-template-columns: 1fr;
            gap: 0.75rem;
        }

        :global(.theme-selector button) {
            min-height: 100px;
            padding: 1rem;
        }

        :global(.theme-selector h4) {
            font-size: 0.875rem;
        }

        :global(.theme-selector p) {
            font-size: 0.75rem;
        }
    }

    /* Landscape mobile optimizations */
    @media (max-height: 600px) and (orientation: landscape) {
        :global(.theme-selector .space-y-6) {
            gap: 1rem;
        }

        :global(.theme-selector .grid) {
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.75rem;
        }

        :global(.theme-selector button) {
            min-height: 80px;
            padding: 0.75rem;
        }

        :global(.theme-selector .space-y-2) {
            gap: 0.5rem;
        }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
        :global(.theme-selector button) {
            border-width: 3px;
        }

        :global(.theme-selector button[aria-pressed="true"]) {
            border-width: 4px;
        }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        :global(.theme-selector button) {
            transition: none;
        }

        :global(.theme-selector h4) {
            transition: none;
        }
    }

    /* Focus improvements for keyboard navigation */
    :global(.theme-selector button:focus-visible) {
        outline: 3px solid hsl(var(--primary));
        outline-offset: 2px;
    }

    /* Improve readability on larger screens */
    @media (min-width: 1280px) {
        :global(.theme-selector .grid) {
            gap: 1.5rem;
        }

        :global(.theme-selector button) {
            min-height: 160px;
            padding: 1.5rem;
        }
    }
</style>
