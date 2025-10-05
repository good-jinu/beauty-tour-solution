<script lang="ts">
interface Props {
	budget: number;
}

let { budget = $bindable() }: Props = $props();

const formatBudget = $derived.by(() => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(budget);
});
</script>

<div
    class="bg-gradient-to-br from-muted/30 to-muted/50 p-6 lg:p-8 rounded-2xl border shadow-sm"
>
    <div class="text-center mb-8">
        <div class="space-y-2">
            <span class="text-sm text-muted-foreground">Your budget</span>
            <div class="text-4xl lg:text-5xl font-bold text-primary">
                {formatBudget}
            </div>
        </div>
    </div>

    <div class="space-y-4">
        <input
            type="range"
            min="500"
            max="15000"
            step="250"
            bind:value={budget}
            class="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer slider"
        />
        <div class="flex justify-between text-sm text-muted-foreground px-1">
            <span class="font-medium">$500</span>
            <span class="font-medium">$15,000+</span>
        </div>
    </div>
</div>

<style>
    .slider {
        background: linear-gradient(
            to right,
            hsl(var(--primary)) 0%,
            hsl(var(--primary)) var(--value, 0%),
            hsl(var(--muted)) var(--value, 0%),
            hsl(var(--muted)) 100%
        );
    }

    .slider::-webkit-slider-thumb {
        appearance: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: hsl(var(--primary));
        cursor: pointer;
        border: 4px solid hsl(var(--background));
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.15),
            0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    }

    .slider::-webkit-slider-thumb:hover {
        transform: scale(1.1);
        box-shadow:
            0 6px 16px rgba(0, 0, 0, 0.2),
            0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .slider::-moz-range-thumb {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: hsl(var(--primary));
        cursor: pointer;
        border: 4px solid hsl(var(--background));
        box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.15),
            0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
    }

    .slider::-moz-range-thumb:hover {
        transform: scale(1.1);
        box-shadow:
            0 6px 16px rgba(0, 0, 0, 0.2),
            0 2px 6px rgba(0, 0, 0, 0.15);
    }
</style>
