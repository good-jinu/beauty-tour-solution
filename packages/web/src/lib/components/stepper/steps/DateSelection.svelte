<script lang="ts">
import type { StepperErrors } from "$lib/types/stepper.js";

interface Props {
	startDate: string;
	endDate: string;
	errors?: StepperErrors["step2"];
	onDateChange: (field: "startDate" | "endDate", value: string) => void;
}

let { startDate = "", endDate = "", errors, onDateChange }: Props = $props();

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split("T")[0];

// Calculate minimum end date (start date + 1 day)
const minEndDate = $derived(() => {
	if (!startDate) return today;
	const start = new Date(startDate);
	start.setDate(start.getDate() + 1);
	return start.toISOString().split("T")[0];
});

// Calculate maximum date (1 year from today)
const maxDate = (() => {
	const max = new Date();
	max.setFullYear(max.getFullYear() + 1);
	return max.toISOString().split("T")[0];
})();

// Calculate trip duration
const tripDuration = $derived(() => {
	if (!startDate || !endDate) return null;
	const start = new Date(startDate);
	const end = new Date(endDate);
	const diffTime = end.getTime() - start.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays > 0 ? diffDays : null;
});

function handleStartDateChange(event: Event) {
	const target = event.target as HTMLInputElement;
	onDateChange("startDate", target.value);

	// If end date is before new start date, clear it
	if (endDate && target.value && new Date(endDate) <= new Date(target.value)) {
		onDateChange("endDate", "");
	}
}

function handleEndDateChange(event: Event) {
	const target = event.target as HTMLInputElement;
	onDateChange("endDate", target.value);
}

// Real-time validation feedback
let dateValidationMessage = $state("");

$effect(() => {
	if (startDate && endDate) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (start < today) {
			dateValidationMessage = "Start date should be in the future";
		} else if (end <= start) {
			dateValidationMessage = "End date must be after start date";
		} else {
			const daysDiff = Math.ceil(
				(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
			);
			if (daysDiff < 2) {
				dateValidationMessage = "Minimum stay is 2 days";
			} else if (daysDiff > 30) {
				dateValidationMessage = "Maximum stay is 30 days";
			} else if (daysDiff >= 7) {
				dateValidationMessage = `Great! ${daysDiff} days allows for comprehensive treatments`;
			} else {
				dateValidationMessage = "";
			}
		}
	} else {
		dateValidationMessage = "";
	}
});
</script>

<div class="space-y-6">
    <!-- Header -->
    <div class="text-center space-y-2">
        <h2 class="text-2xl font-bold">Select Your Travel Dates</h2>
        <p class="text-muted-foreground">
            Choose when you'd like to start and end your beauty journey
        </p>
    </div>

    <!-- Date Selection Cards -->
    <div class="grid gap-4 sm:gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
        <!-- Start Date -->
        <div class="space-y-3">
            <label for="start-date" class="block text-sm font-medium">
                Departure Date
            </label>
            <div class="relative">
                <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    min={today}
                    max={maxDate}
                    onchange={handleStartDateChange}
                    autocomplete="off"
                    inputmode="none"
                    class="w-full px-3 py-3 sm:px-4 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-base sm:text-lg min-h-[48px] {errors?.startDate
                        ? 'border-destructive'
                        : ''}"
                />
            </div>
            {#if errors?.startDate}
                <p class="text-sm text-destructive flex items-center gap-2">
                    <svg
                        class="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
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

        <!-- End Date -->
        <div class="space-y-3">
            <label for="end-date" class="block text-sm font-medium">
                Return Date
            </label>
            <div class="relative">
                <input
                    id="end-date"
                    type="date"
                    value={endDate}
                    min={minEndDate()}
                    max={maxDate}
                    onchange={handleEndDateChange}
                    disabled={!startDate}
                    autocomplete="off"
                    inputmode="none"
                    class="w-full px-3 py-3 sm:px-4 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-base sm:text-lg min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed {errors?.endDate
                        ? 'border-destructive'
                        : ''}"
                />
            </div>
            {#if errors?.endDate}
                <p class="text-sm text-destructive flex items-center gap-2">
                    <svg
                        class="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
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

    <!-- Trip Duration Display -->
    {#if tripDuration() && tripDuration()! > 0}
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <span class="text-sm font-medium">
                    {tripDuration()!}
                    {tripDuration() === 1 ? "day" : "days"} trip
                </span>
            </div>
        </div>
    {/if}

    <!-- Real-time validation feedback -->
    {#if dateValidationMessage}
        <div class="text-center">
            <p
                class="text-sm flex items-center justify-center gap-2 {dateValidationMessage.includes(
                    'Great',
                )
                    ? 'text-green-600'
                    : 'text-amber-600'}"
            >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    {#if dateValidationMessage.includes("Great")}
                        <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd"
                        />
                    {:else}
                        <path
                            fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                        />
                    {/if}
                </svg>
                {dateValidationMessage}
            </p>
        </div>
    {/if}

    <!-- Date Range Error -->
    {#if errors?.dateRange}
        <div class="text-center">
            <p
                class="text-sm text-destructive flex items-center justify-center gap-2"
            >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    />
                </svg>
                {errors.dateRange}
            </p>
        </div>
    {/if}

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
            Travel Guidelines
        </h4>
        <ul class="text-sm text-muted-foreground space-y-1">
            <li>• Minimum stay: 2 days for most treatments</li>
            <li>• Recommended: 5-7 days for surgical procedures</li>
            <li>• Consider recovery time when planning your return</li>
            <li>• Book at least 2 weeks in advance for better availability</li>
        </ul>
    </div>
</div>
