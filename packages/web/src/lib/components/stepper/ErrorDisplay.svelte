<script lang="ts">
import type { StepperErrors } from "$lib/types/stepper";
import { ValidationUtils } from "$lib/utils/validation";

interface Props {
	errors: StepperErrors;
	currentStep: number;
	onRetryStep?: (step: number) => void;
	onClearErrors?: () => void;
	showSummary?: boolean;
}

let {
	errors,
	currentStep,
	onRetryStep,
	onClearErrors,
	showSummary = false,
}: Props = $props();

// Get all error messages for display
const allErrors = $derived(() => {
	const errorList: Array<{
		step: number;
		message: string;
		severity: "error" | "warning" | "info";
	}> = [];

	Object.entries(errors).forEach(([stepKey, stepErrors]) => {
		if (stepKey === "global") {
			if (stepErrors) {
				errorList.push({
					step: 0,
					message: stepErrors as string,
					severity: ValidationUtils.getErrorSeverity(stepErrors as string),
				});
			}
		} else {
			const stepNumber = parseInt(stepKey.replace("step", ""), 10);
			if (stepErrors && typeof stepErrors === "object") {
				Object.values(stepErrors).forEach((error) => {
					if (error && typeof error === "string") {
						errorList.push({
							step: stepNumber,
							message: error,
							severity: ValidationUtils.getErrorSeverity(error),
						});
					}
				});
			}
		}
	});

	return errorList;
});

const errorCount = $derived(
	allErrors().filter((e) => e.severity === "error").length,
);
const warningCount = $derived(
	allErrors().filter((e) => e.severity === "warning").length,
);

function handleRetryStep(step: number) {
	onRetryStep?.(step);
}

function handleClearErrors() {
	onClearErrors?.();
}

function getStepName(step: number): string {
	const stepNames = ["Global", "Country", "Dates", "Themes", "Budget"];
	return stepNames[step] || `Step ${step}`;
}

function getErrorIcon(severity: "error" | "warning" | "info") {
	switch (severity) {
		case "error":
			return "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z";
		case "warning":
			return "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z";
		case "info":
			return "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z";
		default:
			return "";
	}
}

function getErrorColor(severity: "error" | "warning" | "info") {
	switch (severity) {
		case "error":
			return "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400";
		case "warning":
			return "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400";
		case "info":
			return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400";
		default:
			return "";
	}
}
</script>

{#if allErrors().length > 0}
    <div class="error-display space-y-3">
        <!-- Error Summary (if enabled) -->
        {#if showSummary}
            <div
                class="error-summary p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
                <div class="flex items-center gap-3">
                    <svg
                        class="w-5 h-5 text-red-600 dark:text-red-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <div class="flex-1">
                        <h3
                            class="text-sm font-medium text-red-800 dark:text-red-200"
                        >
                            {errorCount > 0
                                ? `${errorCount} error${errorCount > 1 ? "s" : ""}`
                                : ""}
                            {errorCount > 0 && warningCount > 0 ? " and " : ""}
                            {warningCount > 0
                                ? `${warningCount} warning${warningCount > 1 ? "s" : ""}`
                                : ""}
                            found
                        </h3>
                        <p class="text-xs text-red-700 dark:text-red-300 mt-1">
                            Please review and correct the issues below to
                            continue.
                        </p>
                    </div>
                    {#if onClearErrors}
                        <button
                            type="button"
                            onclick={handleClearErrors}
                            class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm underline"
                        >
                            Clear all
                        </button>
                    {/if}
                </div>
            </div>
        {/if}

        <!-- Individual Error Messages -->
        <div class="error-list space-y-2">
            {#each allErrors() as error (error.step + error.message)}
                <div
                    class="error-item p-3 border rounded-lg {getErrorColor(
                        error.severity,
                    )} transition-all duration-200"
                >
                    <div class="flex items-start gap-3">
                        <svg
                            class="w-4 h-4 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fill-rule="evenodd"
                                d={getErrorIcon(error.severity)}
                                clip-rule="evenodd"
                            />
                        </svg>

                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                {#if error.step > 0}
                                    <span
                                        class="text-xs font-medium opacity-75"
                                    >
                                        {getStepName(error.step)}:
                                    </span>
                                {/if}
                                <span
                                    class="text-xs font-medium capitalize opacity-75"
                                >
                                    {error.severity}
                                </span>
                            </div>
                            <p class="text-sm leading-relaxed">
                                {error.message}
                            </p>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex items-center gap-2 flex-shrink-0">
                            {#if error.step > 0 && error.step !== currentStep && onRetryStep}
                                <button
                                    type="button"
                                    onclick={() => handleRetryStep(error.step)}
                                    class="text-xs px-2 py-1 rounded border border-current opacity-75 hover:opacity-100 transition-opacity"
                                    title="Go to {getStepName(error.step)} step"
                                >
                                    Fix
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Recovery Actions -->
        {#if errorCount > 0}
            <div
                class="recovery-actions p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
                <h4
                    class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
                >
                    Quick Actions:
                </h4>
                <div class="flex flex-wrap gap-2">
                    {#if onRetryStep}
                        <button
                            type="button"
                            onclick={() => handleRetryStep(currentStep)}
                            class="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                        >
                            Review Current Step
                        </button>
                    {/if}

                    {#if onClearErrors}
                        <button
                            type="button"
                            onclick={handleClearErrors}
                            class="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Clear All Errors
                        </button>
                    {/if}
                </div>
            </div>
        {/if}
    </div>
{/if}

<style>
    .error-display {
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .error-item {
        animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    /* Responsive adjustments */
    @media (max-width: 640px) {
        .error-item {
            padding: 0.75rem;
        }

        .recovery-actions {
            padding: 0.75rem;
        }

        .recovery-actions .flex {
            flex-direction: column;
        }

        .recovery-actions button {
            width: 100%;
            justify-content: center;
        }
    }
</style>
