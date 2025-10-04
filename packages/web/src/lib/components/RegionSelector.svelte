<script lang="ts">
import { type FormErrors, REGIONS } from "$lib/types";

interface Props {
	selectedRegion: string;
	errors: FormErrors;
}

let { selectedRegion = $bindable(), errors }: Props = $props();
</script>

<div class="space-y-4">
    <div class="space-y-2">
        <h4 class="text-base font-medium">
            Where would you like to have your beauty treatments?
        </h4>
        <p class="text-sm text-muted-foreground">
            Choose your preferred destination based on specialties and budget
        </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {#each REGIONS as region}
            <label
                class="group relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md {selectedRegion ===
                region.value
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:bg-muted/30'}"
            >
                <input
                    type="radio"
                    bind:group={selectedRegion}
                    value={region.value}
                    class="sr-only"
                    required
                />

                <div class="flex items-start justify-between mb-3">
                    <h4
                        class="font-semibold text-sm sm:text-base leading-tight pr-2"
                    >
                        {region.label}
                    </h4>
                    <span
                        class="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                    >
                        {region.priceRange}
                    </span>
                </div>

                <p
                    class="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed"
                >
                    {region.description}
                </p>

                <div class="text-xs sm:text-sm text-muted-foreground">
                    <span class="font-medium">Specialties:</span>
                    <span class="ml-1">{region.specialty}</span>
                </div>

                <!-- Selection indicator -->
                {#if selectedRegion === region.value}
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

    {#if errors.region}
        <p class="text-sm text-destructive flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                />
            </svg>
            {errors.region}
        </p>
    {/if}
</div>
