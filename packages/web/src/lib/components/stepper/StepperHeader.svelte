<script lang="ts">
import type { StepperState } from "$lib/types";
import { STEP_LABELS, TOTAL_STEPS } from "$lib/types";

export let stepperState: StepperState;
export let onStepClick: (step: number) => void;

function getStepStatus(
	step: number,
): "pending" | "current" | "completed" | "error" | "warning" {
	if (stepperState.completedSteps.has(step)) {
		// Check if completed step has lingering errors (shouldn't happen but good to check)
		const stepErrors =
			stepperState.errors[`step${step}` as keyof typeof stepperState.errors];
		if (stepErrors && Object.values(stepErrors).some((error) => error)) {
			return "error";
		}
		return "completed";
	}

	if (step === stepperState.currentStep) {
		// Check if current step has errors
		const stepErrors =
			stepperState.errors[`step${step}` as keyof typeof stepperState.errors];
		if (stepErrors && Object.values(stepErrors).some((error) => error)) {
			return "error";
		}
		return "current";
	}

	// Check if pending step has errors from previous validation attempts
	const stepErrors =
		stepperState.errors[`step${step}` as keyof typeof stepperState.errors];
	if (stepErrors && Object.values(stepErrors).some((error) => error)) {
		return "error";
	}

	return "pending";
}

function getStepErrorCount(step: number): number {
	const stepErrors =
		stepperState.errors[`step${step}` as keyof typeof stepperState.errors];
	return stepErrors
		? Object.values(stepErrors).filter((error) => error).length
		: 0;
}

function getStepErrorMessage(step: number): string {
	const stepErrors =
		stepperState.errors[`step${step}` as keyof typeof stepperState.errors];
	if (!stepErrors) return "";

	const errors = Object.values(stepErrors).filter((error) => error);
	return errors.length > 0 ? errors[0] : "";
}

function handleStepClick(step: number) {
	// Only allow clicking on completed steps or the next available step
	const maxAllowedStep = Math.max(...stepperState.completedSteps, 0) + 1;
	if (step <= maxAllowedStep) {
		onStepClick(step);
	}
}

function isStepClickable(step: number): boolean {
	const maxAllowedStep = Math.max(...stepperState.completedSteps, 0) + 1;
	return step <= maxAllowedStep;
}
</script>

<div class="stepper-header">
    <!-- Mobile progress bar -->
    <div class="mobile-progress-bar">
        <div class="progress-track">
            <div
                class="progress-fill"
                style="width: {(stepperState.currentStep / TOTAL_STEPS) * 100}%"
            ></div>
        </div>
        <div class="progress-text">
            Step {stepperState.currentStep} of {TOTAL_STEPS}
        </div>
    </div>

    <!-- Mobile scroll indicator -->
    <div class="mobile-scroll-indicator">
        <div class="scroll-hint">
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
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                />
            </svg>
            <span>Swipe to navigate</span>
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
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
            </svg>
        </div>
    </div>

    <div class="stepper-progress">
        {#each Array(TOTAL_STEPS) as _, index}
            {@const step = index + 1}
            {@const status = getStepStatus(step)}
            {@const isClickable = isStepClickable(step)}

            <div class="step-item">
                <button
                    class="step-indicator {status}"
                    class:clickable={isClickable}
                    disabled={!isClickable}
                    on:click={() => handleStepClick(step)}
                    aria-label="Step {step}: {STEP_LABELS[
                        index
                    ]}{getStepErrorCount(step) > 0
                        ? ` (${getStepErrorCount(step)} error${getStepErrorCount(step) > 1 ? 's' : ''})`
                        : ''}"
                    title="{STEP_LABELS[index]}{getStepErrorMessage(step)
                        ? `: ${getStepErrorMessage(step)}`
                        : ''}"
                >
                    {#if status === "completed"}
                        <svg
                            class="checkmark"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                    {:else if status === "error"}
                        <div class="error-indicator">
                            <svg
                                class="error-icon"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            {#if getStepErrorCount(step) > 1}
                                <span class="error-count"
                                    >{getStepErrorCount(step)}</span
                                >
                            {/if}
                        </div>
                    {:else}
                        <span class="step-number">{step}</span>
                    {/if}
                </button>

                <div class="step-label">
                    <span class="step-title">{STEP_LABELS[index]}</span>
                </div>

                {#if step < TOTAL_STEPS}
                    <div
                        class="step-connector"
                        class:completed={stepperState.completedSteps.has(step)}
                    ></div>
                {/if}
            </div>
        {/each}
    </div>

    <!-- Global Warning Display -->
    {#if stepperState.errors.global}
        <div class="global-warning">
            <div class="warning-content">
                <svg
                    class="warning-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
                    />
                    <path d="M12 9v4" />
                    <path d="m12 17 .01 0" />
                </svg>
                <span class="warning-text">{stepperState.errors.global}</span>
            </div>
        </div>
    {/if}
</div>

<style>
    .stepper-header {
        width: 100%;
        margin-bottom: 2rem;
        padding: 1rem 0;
    }

    .mobile-progress-bar {
        display: none;
    }

    .progress-track {
        width: 100%;
        height: 4px;
        background: hsl(var(--muted));
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: hsl(var(--primary));
        border-radius: 2px;
        transition: width 0.3s ease;
    }

    .progress-text {
        text-align: center;
        font-size: 0.75rem;
        color: hsl(var(--muted-foreground));
        margin-bottom: 0.5rem;
    }

    .mobile-scroll-indicator {
        display: none;
    }

    .scroll-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: #6b7280;
        margin-bottom: 0.5rem;
        opacity: 0.8;
    }

    .stepper-progress {
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
    }

    .step-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        flex: 1;
    }

    .step-indicator {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.3s ease;
        cursor: default;
        position: relative;
        z-index: 2;
    }

    .step-indicator.pending {
        border-color: #e5e7eb;
        color: #9ca3af;
        background: #f9fafb;
    }

    .step-indicator.current {
        border-color: #3b82f6;
        color: #3b82f6;
        background: #eff6ff;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .step-indicator.completed {
        border-color: #10b981;
        color: white;
        background: #10b981;
    }

    .step-indicator.error {
        border-color: #ef4444;
        color: #ef4444;
        background: #fef2f2;
    }

    .step-indicator.clickable {
        cursor: pointer;
    }

    .step-indicator.clickable:hover:not(.current) {
        transform: scale(1.05);
    }

    .step-indicator:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }

    .checkmark,
    .error-icon {
        width: 20px;
        height: 20px;
    }

    .error-indicator {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .error-count {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #dc2626;
        color: white;
        font-size: 0.625rem;
        font-weight: 600;
        min-width: 16px;
        height: 16px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        line-height: 1;
    }

    .step-number {
        font-size: 1rem;
        font-weight: 600;
    }

    .step-label {
        margin-top: 0.5rem;
        text-align: center;
    }

    .step-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        white-space: nowrap;
    }

    .step-connector {
        position: absolute;
        top: 24px;
        left: 50%;
        right: -50%;
        height: 2px;
        background: #e5e7eb;
        z-index: 1;
        transition: background-color 0.3s ease;
    }

    .step-connector.completed {
        background: #10b981;
    }

    /* Mobile-first responsive design */
    @media (max-width: 640px) {
        .stepper-header {
            margin-bottom: 1rem;
            padding: 0.5rem 0;
        }

        .mobile-progress-bar {
            display: block;
        }

        .mobile-scroll-indicator {
            display: block;
        }

        .stepper-progress {
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0.5rem 1rem;
            scrollbar-width: none;
            -ms-overflow-style: none;
            scroll-behavior: smooth;
            /* Add scroll snap for better UX */
            scroll-snap-type: x mandatory;
        }

        .stepper-progress::-webkit-scrollbar {
            display: none;
        }

        .step-item {
            min-width: 90px;
            margin: 0 0.5rem;
            scroll-snap-align: center;
            flex-shrink: 0;
        }

        .step-indicator {
            width: 36px;
            height: 36px;
            font-size: 0.75rem;
            border-width: 2px;
        }

        .checkmark,
        .error-icon {
            width: 14px;
            height: 14px;
        }

        .step-title {
            font-size: 0.6875rem;
            max-width: 90px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.2;
            margin-top: 0.375rem;
        }

        .step-connector {
            top: 18px;
            height: 2px;
        }
    }

    /* Small mobile screens */
    @media (max-width: 480px) {
        .stepper-progress {
            padding: 0.5rem 0.75rem;
        }

        .step-item {
            min-width: 75px;
            margin: 0 0.25rem;
        }

        .step-indicator {
            width: 32px;
            height: 32px;
            font-size: 0.6875rem;
        }

        .checkmark,
        .error-icon {
            width: 12px;
            height: 12px;
        }

        .step-title {
            font-size: 0.625rem;
            max-width: 75px;
        }

        .step-connector {
            top: 16px;
        }
    }

    /* Tablet responsive design */
    @media (min-width: 641px) and (max-width: 1024px) {
        .stepper-header {
            margin-bottom: 1.75rem;
            padding: 0.75rem 0;
        }

        .step-indicator {
            width: 44px;
            height: 44px;
            font-size: 0.875rem;
        }

        .checkmark,
        .error-icon {
            width: 18px;
            height: 18px;
        }

        .step-title {
            font-size: 0.8125rem;
            margin-top: 0.625rem;
        }

        .step-connector {
            top: 22px;
        }
    }

    /* Desktop responsive design */
    @media (min-width: 1025px) {
        .stepper-header {
            margin-bottom: 2.5rem;
            padding: 1rem 0;
        }

        .step-indicator {
            width: 52px;
            height: 52px;
            font-size: 1.125rem;
        }

        .checkmark,
        .error-icon {
            width: 22px;
            height: 22px;
        }

        .step-title {
            font-size: 1rem;
            margin-top: 0.75rem;
        }

        .step-connector {
            top: 26px;
        }
    }

    /* Landscape mobile optimization */
    @media (max-height: 600px) and (orientation: landscape) {
        .stepper-header {
            margin-bottom: 1rem;
            padding: 0.25rem 0;
        }

        .step-indicator {
            width: 32px;
            height: 32px;
            font-size: 0.75rem;
        }

        .step-title {
            font-size: 0.625rem;
            margin-top: 0.25rem;
        }

        .step-connector {
            top: 16px;
        }
    }

    /* Dark mode support */
    :global([data-theme="dark"]) .step-indicator.pending {
        border-color: #4b5563;
        color: #6b7280;
        background: #1f2937;
    }

    :global([data-theme="dark"]) .step-title {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .step-connector {
        background: #4b5563;
    }

    :global([data-theme="dark"]) .step-connector.completed {
        background: #10b981;
    }

    :global([data-theme="dark"]) .step-indicator.error {
        background: #1f2937;
    }

    /* Global Warning Styles */
    .global-warning {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: #fef3c7;
        border: 1px solid #f59e0b;
        border-radius: 0.5rem;
        animation: slideIn 0.3s ease-out;
    }

    .warning-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .warning-icon {
        width: 18px;
        height: 18px;
        color: #d97706;
        flex-shrink: 0;
    }

    .warning-text {
        font-size: 0.875rem;
        color: #92400e;
        line-height: 1.4;
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

    /* Dark mode for global warning */
    :global([data-theme="dark"]) .global-warning {
        background: #451a03;
        border-color: #d97706;
    }

    :global([data-theme="dark"]) .warning-text {
        color: #fbbf24;
    }

    :global([data-theme="dark"]) .warning-icon {
        color: #fbbf24;
    }
</style>
