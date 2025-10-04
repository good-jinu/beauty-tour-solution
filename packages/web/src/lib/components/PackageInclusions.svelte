<script lang="ts">
interface Props {
	includeFlights: boolean;
	includeHotels: boolean;
	includeActivities: boolean;
	includeTransport: boolean;
}

let {
	includeFlights = $bindable(),
	includeHotels = $bindable(),
	includeActivities = $bindable(),
	includeTransport = $bindable(),
}: Props = $props();

const inclusions = $derived([
	{
		key: "flights",
		icon: "✈️",
		title: "Flights",
		description: "Round-trip airfare included",
		checked: includeFlights,
	},
	{
		key: "hotels",
		icon: "🏨",
		title: "Recovery Accommodation",
		description: "Specialized recovery hotels & spas",
		checked: includeHotels,
	},
	{
		key: "activities",
		icon: "💆‍♀️",
		title: "Wellness Activities",
		description: "Spa treatments & sightseeing",
		checked: includeActivities,
	},
	{
		key: "transport",
		icon: "🚗",
		title: "Medical Transport",
		description: "Airport & clinic transfers",
		checked: includeTransport,
	},
]);

function handleInclusionChange(key: string, checked: boolean) {
	switch (key) {
		case "flights":
			includeFlights = checked;
			break;
		case "hotels":
			includeHotels = checked;
			break;
		case "activities":
			includeActivities = checked;
			break;
		case "transport":
			includeTransport = checked;
			break;
	}
}
</script>

<div class="grid gap-4 sm:grid-cols-2 lg:gap-6">
    {#each inclusions as inclusion}
        <label
            class="group relative flex items-center gap-4 p-5 lg:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md {inclusion.checked
                ? 'border-primary bg-primary text-primary-foreground shadow-md'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'}"
        >
            <input
                type="checkbox"
                checked={inclusion.checked}
                onchange={(e) =>
                    handleInclusionChange(
                        inclusion.key,
                        e.currentTarget.checked,
                    )}
                class="sr-only"
            />

            <div class="text-3xl">{inclusion.icon}</div>

            <div class="flex-1">
                <h4 class="font-semibold text-base mb-1">{inclusion.title}</h4>
                <p class="text-sm opacity-90">{inclusion.description}</p>
            </div>

            <div
                class="w-5 h-5 border-2 rounded border-current flex items-center justify-center {inclusion.checked
                    ? 'bg-primary-foreground'
                    : ''}"
            >
                {#if inclusion.checked}
                    <svg
                        class="w-3 h-3 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                        />
                    </svg>
                {/if}
            </div>
        </label>
    {/each}
</div>
