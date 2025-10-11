<script lang="ts">
import {
	DateFormatter,
	type DateValue,
	getLocalTimeZone,
	parseDate,
} from "@internationalized/date";
import CalendarIcon from "@lucide/svelte/icons/calendar";
import type { DateRange } from "bits-ui";
import { buttonVariants } from "$lib/components/ui/button/index.js";
import * as Popover from "$lib/components/ui/popover/index.js";
import { RangeCalendar } from "$lib/components/ui/range-calendar/index.js";
import type { FormErrors } from "$lib/types";
import { cn } from "$lib/utils.js";

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

const df = new DateFormatter("en-US", {
	dateStyle: "medium",
});

// Convert string dates to DateRange object
let value = $state<DateRange>({
	start: startDate ? parseDate(startDate) : undefined,
	end: endDate ? parseDate(endDate) : undefined,
});

let startValue = $state<DateValue | undefined>(undefined);

// Update string values when DateRange changes
$effect(() => {
	if (value.start) {
		startDate = value.start.toString();
	} else {
		startDate = "";
	}

	if (value.end) {
		endDate = value.end.toString();
	} else {
		endDate = "";
	}
});

// Update DateRange when string values change (for external updates)
$effect(() => {
	try {
		const newStart = startDate ? parseDate(startDate) : undefined;
		const newEnd = endDate ? parseDate(endDate) : undefined;

		if (
			newStart?.toString() !== value.start?.toString() ||
			newEnd?.toString() !== value.end?.toString()
		) {
			value = {
				start: newStart,
				end: newEnd,
			};
		}
	} catch {
		// Invalid date format, ignore
	}
});

// Determine if there are any errors to show
const hasErrors = $derived(() => {
	return errors.startDate || errors.endDate;
});
</script>

<div class="space-y-3">
    <div class="text-sm font-medium">Travel Dates</div>
    <div class="grid gap-2">
        <Popover.Root>
            <Popover.Trigger
                class={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full h-12 justify-start text-left font-normal",
                    !value.start && !value.end && "text-muted-foreground",
                    hasErrors() && "border-destructive",
                )}
            >
                <CalendarIcon class="mr-2 size-4" />
                {#if value && value.start}
                    {#if value.end}
                        {df.format(value.start.toDate(getLocalTimeZone()))} - {df.format(
                            value.end.toDate(getLocalTimeZone()),
                        )}
                    {:else}
                        {df.format(value.start.toDate(getLocalTimeZone()))}
                    {/if}
                {:else if startValue}
                    {df.format(startValue.toDate(getLocalTimeZone()))}
                {:else}
                    Select travel dates
                {/if}
            </Popover.Trigger>
            <Popover.Content class="w-auto p-0" align="start">
                <RangeCalendar
                    bind:value
                    onStartValueChange={(v) => {
                        startValue = v;
                    }}
                    numberOfMonths={2}
                />
            </Popover.Content>
        </Popover.Root>
    </div>

    <!-- Error Messages -->
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
