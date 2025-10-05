<script lang="ts">
import { type FormErrors, THEMES } from "$lib/types";

interface Props {
	selectedTheme: string;
	errors: FormErrors;
}

let { selectedTheme = $bindable(), errors }: Props = $props();
</script>

<div class="space-y-4">
    <div class="space-y-2">
        <h4 class="text-base font-medium">
            What type of beauty treatments are you interested in?
        </h4>
        <p class="text-sm text-muted-foreground">
            Select the treatment category that best matches your goals
        </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {#each THEMES as theme}
            <label
                class="group relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md {selectedTheme ===
                theme.value
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:bg-muted/30'}"
            >
                <input
                    type="radio"
                    bind:group={selectedTheme}
                    value={theme.value}
                    class="sr-only"
                    required
                />

                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                        <span class="text-xl">{theme.icon}</span>
                        <h4
                            class="font-semibold text-sm sm:text-base leading-tight pr-2"
                        >
                            {theme.label}
                        </h4>
                    </div>
                    <span
                        class="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                    >
                        {theme.recoveryTime}
                    </span>
                </div>

                <p
                    class="text-xs sm:text-sm text-muted-foreground leading-relaxed"
                >
                    {theme.description}
                </p>

                <!-- Selection indicator -->
                {#if selectedTheme === theme.value}
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
            </label>
        {/each}
    </div>

    {#if errors.theme}
        <p class="text-sm text-destructive flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                />
            </svg>
            {errors.theme}
        </p>
    {/if}
</div>
