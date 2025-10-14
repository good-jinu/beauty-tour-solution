<script module lang="ts">
import type { DateStepErrors, StepperErrors } from "$lib/types/stepper.js";

export function validate(
	startDate: string,
	endDate: string,
	realTime = false,
): {
	isValid: boolean;
	errors: DateStepErrors | undefined;
} {
	const errors: DateStepErrors = {};
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (!startDate) {
		errors.startDate = realTime
			? "Start date required"
			: "Please select a start date";
	} else {
		const startDateObj = new Date(startDate);
		if (startDateObj < today) {
			errors.startDate = "Start date must be in the future";
		}
	}

	if (!endDate) {
		errors.endDate = realTime
			? "End date required"
			: "Please select an end date";
	}

	// Date range validation
	if (startDate && endDate) {
		const startDateObj = new Date(startDate);
		const endDateObj = new Date(endDate);

		if (endDateObj <= startDateObj) {
			errors.dateRange = "End date must be after start date";
		} else {
			// Check minimum stay (2 days)
			const daysDiff = Math.ceil(
				(endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24),
			);
			if (daysDiff < 2) {
				errors.dateRange = "Minimum stay is 2 days";
			}

			// Check maximum stay (30 days)
			if (daysDiff > 30) {
				errors.dateRange = "Maximum stay is 30 days";
			}

			// Check if dates are too far in the future (1 year)
			const oneYearFromNow = new Date();
			oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
			if (startDateObj > oneYearFromNow) {
				errors.startDate = "Please select a date within the next year";
			}
		}
	}

	const isValid = Object.keys(errors).length === 0;
	return { isValid, errors: isValid ? undefined : errors };
}
</script>

<script lang="ts">
    import { stepperState } from "$lib/stores/stepper.js";
    import ErrorDisplay from "../ErrorDisplay.svelte";
    import DateSelector from "$lib/components/form/DateSelector.svelte";

    // Calculate trip duration
    const tripDuration = $derived(() => {
        if (
            !$stepperState.formData.startDate ||
            !$stepperState.formData.endDate
        )
            return null;
        const start = new Date($stepperState.formData.startDate);
        const end = new Date($stepperState.formData.endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : null;
    });

    // Real-time validation feedback
    let dateValidationMessage = $state("");

    $effect(() => {
        if (
            $stepperState.formData.startDate &&
            $stepperState.formData.endDate
        ) {
            const start = new Date($stepperState.formData.startDate);
            const end = new Date($stepperState.formData.endDate);
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

    // Find which step number corresponds to the dates step
    const dateStepNumber = $derived(() => {
        return Object.keys($stepperState.stepMapping).find(
            (key) => $stepperState.stepMapping[parseInt(key)] === "dates",
        );
    });

    // Convert stepper errors to DateSelector format
    const dateErrors = $derived(() => {
        if (!dateStepNumber()) return {};
        const stepKey = `step${dateStepNumber()}` as keyof StepperErrors;
        const stepErrors = $stepperState.errors[stepKey] as
            | DateStepErrors
            | undefined;
        if (!stepErrors) return {};

        const errors: { [key: string]: string } = {};
        if (stepErrors.startDate) errors.startDate = stepErrors.startDate;
        if (stepErrors.endDate) errors.endDate = stepErrors.endDate;
        return errors;
    });

    const displayErrors = $derived(() => {
        if (!dateStepNumber()) return [];
        const stepKey = `step${dateStepNumber()}` as keyof StepperErrors;
        const stepErrors = $stepperState.errors[stepKey] as
            | DateStepErrors
            | undefined;
        if (!stepErrors) return [];
        // Only show dateRange error in the general error display
        return stepErrors.dateRange ? [stepErrors.dateRange] : [];
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

    <!-- Date Selection -->
    <div class="max-w-2xl mx-auto">
        <DateSelector
            bind:startDate={$stepperState.formData.startDate}
            bind:endDate={$stepperState.formData.endDate}
            errors={dateErrors()}
        />
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

    <ErrorDisplay errors={displayErrors()} />

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
