<script lang="ts">
import type { StepperErrors, StepperState } from "$lib/types/stepper";
import { getErrorSeverity } from "$lib/utils/validation";
import Button from "../ui/button/button.svelte";
import ErrorDisplay from "./ErrorDisplay.svelte";

interface Props {
	stepperState: StepperState;
	onGoToStep: (step: number) => void;
	onClearErrors: () => void;
	onRetryValidation: () => void;
	showInline?: boolean;
}

let {
	stepperState,
	onGoToStep,
	onClearErrors,
	onRetryValidation,
	showInline = false,
}: Props = $props();

// Check if there are any errors
const hasErrors = $derived(
	Object.values(stepperState.errors).some((stepErrors) => {
		if (typeof stepErrors === "string") return true;
		if (typeof stepErrors === "object" && stepErrors) {
			return Object.values(stepErrors).some((error) => error);
		}
		return false;
	}),
);

// Get error statistics
const errorStats = $derived(() => {
	let totalErrors = 0;
	let totalWarnings = 0;
	let stepsWithErrors = new Set<number>();

	Object.entries(stepperState.errors).forEach(([stepKey, stepErrors]) => {
		if (stepKey === "global") {
			if (stepErrors) {
				const severity = getErrorSeverity(stepErrors as string);
				if (severity === "error") totalErrors++;
				else if (severity === "warning") totalWarnings++;
			}
		} else {
			const stepNumber = parseInt(stepKey.replace("step", ""), 10);
			if (stepErrors && typeof stepErrors === "object") {
				let hasStepErrors = false;
				Object.values(stepErrors).forEach((error) => {
					if (error) {
						const severity = getErrorSeverity(error.toString());
						if (severity === "error") {
							totalErrors++;
							hasStepErrors = true;
						} else if (severity === "warning") {
							totalWarnings++;
						}
					}
				});
				if (hasStepErrors) {
					stepsWithErrors.add(stepNumber);
				}
			}
		}
	});

	return {
		totalErrors,
		totalWarnings,
		stepsWithErrors: Array.from(stepsWithErrors).sort(),
	};
});

// Recovery suggestions based on current state
const recoverySuggestions = $derived.by(() => {
	const suggestions: Array<{
		title: string;
		description: string;
		action: () => void;
		priority: "high" | "medium" | "low";
	}> = [];

	const stats = errorStats();

	// Suggest going to first step with errors
	if (stats.stepsWithErrors.length > 0) {
		const firstErrorStep = stats.stepsWithErrors[0];
		suggestions.push({
			title: `Fix Step ${firstErrorStep}`,
			description: `Go to step ${firstErrorStep} to resolve validation errors`,
			action: () => onGoToStep(firstErrorStep),
			priority: "high",
		});
	}

	// Suggest retrying validation
	if (stats.totalErrors > 0) {
		suggestions.push({
			title: "Retry Validation",
			description: "Re-run validation to check if issues are resolved",
			action: onRetryValidation,
			priority: "medium",
		});
	}

	// Suggest clearing errors if there are warnings only
	if (stats.totalErrors === 0 && stats.totalWarnings > 0) {
		suggestions.push({
			title: "Clear Warnings",
			description: "Dismiss warning messages and continue",
			action: onClearErrors,
			priority: "low",
		});
	}

	return suggestions.sort((a, b) => {
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		return priorityOrder[b.priority] - priorityOrder[a.priority];
	});
});

function handleGoToStep(step: number) {
	onGoToStep(step);
}

function handleClearErrors() {
	onClearErrors();
}

function handleRetryValidation() {
	onRetryValidation();
}

function getPriorityColor(priority: "high" | "medium" | "low") {
	switch (priority) {
		case "high":
			return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
		case "medium":
			return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
		case "low":
			return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
		default:
			return "";
	}
}
</script>

{#if hasErrors}
    <div
        class="error-recovery {showInline
            ? 'inline-recovery'
            : 'modal-recovery'}"
    >
        {#if !showInline}
            <!-- Modal-style recovery (for serious errors) -->
            <div class="recovery-modal">
                <Button
                    type="button"
                    class="modal-backdrop"
                    onclick={handleClearErrors}
                ></Button>
                <div class="modal-content">
                    <div class="modal-header">
                        <h2
                            class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                        >
                            Validation Issues Found
                        </h2>
                        <Button
                            type="button"
                            onclick={handleClearErrors}
                            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg
                                class="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                        </Button>
                    </div>

                    <div class="modal-body">
                        <ErrorDisplay
                            errors={stepperState.errors}
                            currentStep={stepperState.currentStep}
                            onRetryStep={handleGoToStep}
                            onClearErrors={handleClearErrors}
                            showSummary={true}
                        />
                    </div>

                    <div class="modal-footer">
                        <div class="flex flex-col sm:flex-row gap-3">
                            {#each recoverySuggestions.slice(0, 2) as suggestion}
                                <button
                                    type="button"
                                    onclick={suggestion.action}
                                    class="px-4 py-2 rounded-lg border font-medium text-sm transition-colors {getPriorityColor(
                                        suggestion.priority,
                                    )}"
                                >
                                    {suggestion.title}
                                </button>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <!-- Inline recovery (for minor issues) -->
            <div class="inline-recovery-content">
                <ErrorDisplay
                    errors={stepperState.errors}
                    currentStep={stepperState.currentStep}
                    onRetryStep={handleGoToStep}
                    onClearErrors={handleClearErrors}
                    showSummary={false}
                />

                {#if recoverySuggestions.length > 0}
                    <div
                        class="recovery-suggestions mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                        <h4
                            class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
                        >
                            Suggested Actions:
                        </h4>
                        <div class="space-y-2">
                            {#each recoverySuggestions as suggestion}
                                <button
                                    type="button"
                                    onclick={suggestion.action}
                                    class="w-full text-left p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <div>
                                            <div
                                                class="text-sm font-medium text-gray-900 dark:text-gray-100"
                                            >
                                                {suggestion.title}
                                            </div>
                                            <div
                                                class="text-xs text-gray-600 dark:text-gray-400"
                                            >
                                                {suggestion.description}
                                            </div>
                                        </div>
                                        <div
                                            class="text-xs px-2 py-1 rounded {getPriorityColor(
                                                suggestion.priority,
                                            )}"
                                        >
                                            {suggestion.priority}
                                        </div>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
{/if}

<style>
    .error-recovery {
        z-index: 1000;
    }

    .recovery-modal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
    }

    .modal-content {
        position: relative;
        background: white;
        border-radius: 0.75rem;
        box-shadow:
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        max-width: 90vw;
        max-height: 90vh;
        width: 100%;
        max-width: 600px;
        overflow: hidden;
        animation: modalSlideIn 0.3s ease-out;
    }

    :global([data-theme="dark"]) .modal-content {
        background: hsl(var(--background));
        border: 1px solid hsl(var(--border));
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid hsl(var(--border));
    }

    .modal-body {
        padding: 1.5rem;
        max-height: 60vh;
        overflow-y: auto;
    }

    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid hsl(var(--border));
        background: hsl(var(--muted) / 0.3);
    }

    .inline-recovery-content {
        animation: slideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
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

    /* Mobile responsive */
    @media (max-width: 640px) {
        .modal-content {
            margin: 1rem;
            max-width: calc(100vw - 2rem);
            max-height: calc(100vh - 2rem);
        }

        .modal-header,
        .modal-body,
        .modal-footer {
            padding: 1rem;
        }

        .modal-body {
            max-height: calc(100vh - 200px);
        }
    }
</style>
