<script lang="ts">
import Input from "$lib/components/ui/input/input.svelte";
import type { FormErrors } from "$lib/types";

interface Props {
	travelers: number;
	errors: FormErrors;
}

let { travelers = $bindable(), errors }: Props = $props();
</script>

<div class="space-y-3">
    <label for="number-of-travelers" class="text-sm font-medium block">
        Number of Travelers
    </label>
    <Input
        id="number-of-travelers"
        bind:value={travelers}
        type="number"
        min={1}
        max={20}
        required
        class="h-12"
    />
    {#if errors.travelers}
        <p class="text-sm text-destructive flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                />
            </svg>
            {errors.travelers}
        </p>
    {/if}
</div>
