<script lang="ts">
import Input from "$lib/components/ui/input/input.svelte";
import type { FormErrors } from "$lib/types";

interface Props {
	startDate: string;
	endDate: string;
	errors: FormErrors;
}

let {
	startDate = $bindable(),
	endDate = $bindable(),
	errors,
}: Props = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
    <div class="space-y-3">
        <label for="start-date" class="text-sm font-medium block"
            >Start Date</label
        >
        <Input
            id="start-date"
            bind:value={startDate}
            type="date"
            required
            class="h-12"
        />
        {#if errors.startDate}
            <p class="text-sm text-destructive flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    />
                </svg>
                {errors.startDate}
            </p>
        {/if}
    </div>

    <div class="space-y-3">
        <label for="end-date" class="text-sm font-medium block">End Date</label>
        <Input
            id="end-date"
            bind:value={endDate}
            type="date"
            required
            class="h-12"
        />
        {#if errors.endDate}
            <p class="text-sm text-destructive flex items-center gap-2">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    />
                </svg>
                {errors.endDate}
            </p>
        {/if}
    </div>
</div>
