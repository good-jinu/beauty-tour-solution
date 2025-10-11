<script lang="ts">
import { Check, CircleAlert, TriangleAlert } from "@lucide/svelte";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "$lib/components/ui/accordion";
import { Badge } from "$lib/components/ui/badge";
import type { StepperState } from "$lib/types";
import { STEP_LABELS, TOTAL_STEPS } from "$lib/types";

interface Props {
	stepperState: StepperState;
	onStepClick: (step: number) => void;
	children: import("svelte").Snippet<[{ step: number }]>;
}

let { stepperState, onStepClick, children }: Props = $props();

// Current open accordion item - only the current step should be open
let openValue = $state(`step-${stepperState.currentStep}`);

// Update openValue when current step changes
$effect(() => {
	openValue = `step-${stepperState.currentStep}`;
});

function getStepStatus(
	step: number,
): "pending" | "current" | "completed" | "error" {
	if (stepperState.completedSteps.has(step)) {
		const stepErrors =
			stepperState.errors[`step${step}` as keyof typeof stepperState.errors];
		if (stepErrors && Object.values(stepErrors).some((error) => error)) {
			return "error";
		}
		return "completed";
	}

	if (step === stepperState.currentStep) {
		const stepErrors =
			stepperState.errors[`step${step}` as keyof typeof stepperState.errors];
		if (stepErrors && Object.values(stepErrors).some((error) => error)) {
			return "error";
		}
		return "current";
	}

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

function handleAccordionChange(value: string | undefined) {
	if (value) {
		const stepNumber = parseInt(value.replace("step-", ""), 10);
		if (stepNumber && stepNumber !== stepperState.currentStep) {
			// Only allow clicking on completed steps or the next available step
			const maxAllowedStep = Math.max(...stepperState.completedSteps, 0) + 1;
			if (stepNumber <= maxAllowedStep) {
				onStepClick(stepNumber);
			}
		}
	}
}

function isStepAccessible(step: number): boolean {
	const maxAllowedStep = Math.max(...stepperState.completedSteps, 0) + 1;
	return step <= maxAllowedStep;
}
</script>

<div class="accordion-stepper">
    <!-- Mobile progress indicator -->
    <div class="mobile-progress">
        <div class="progress-bar">
            <div
                class="progress-fill"
                style="width: {(stepperState.currentStep / TOTAL_STEPS) * 100}%"
            ></div>
        </div>
        <div class="progress-text">
            Step {stepperState.currentStep} of {TOTAL_STEPS}
        </div>
    </div>

    <Accordion
        bind:value={openValue}
        onValueChange={handleAccordionChange}
        class="stepper-accordion"
        type="single"
    >
        {#each Array(TOTAL_STEPS) as _, index}
            {@const step = index + 1}
            {@const status = getStepStatus(step)}
            {@const isAccessible = isStepAccessible(step)}
            {@const errorCount = getStepErrorCount(step)}

            <AccordionItem
                value="step-{step}"
                class="step-accordion-item {status}"
                disabled={!isAccessible}
            >
                <AccordionTrigger
                    class="step-trigger {status}"
                    disabled={!isAccessible}
                >
                    <div class="step-header">
                        <div class="step-indicator {status}">
                            {#if status === "completed"}
                                <Check class="checkmark" size={18} />
                            {:else if status === "error"}
                                <div class="error-indicator">
                                    <CircleAlert class="error-icon" size={18} />
                                    {#if errorCount > 1}
                                        <span class="error-count"
                                            >{errorCount}</span
                                        >
                                    {/if}
                                </div>
                            {:else}
                                <span class="step-number">{step}</span>
                            {/if}
                        </div>
                        <div class="step-info">
                            <h3 class="step-title">{STEP_LABELS[index]}</h3>
                            {#if status === "completed"}
                                <Badge variant="default">Completed</Badge>
                            {:else if status === "error"}
                                <Badge variant="destructive">
                                    {errorCount} error{errorCount > 1
                                        ? "s"
                                        : ""}
                                </Badge>
                            {:else if status === "current"}
                                <Badge variant="secondary">In progress</Badge>
                            {:else}
                                <Badge variant="outline">Pending</Badge>
                            {/if}
                        </div>
                    </div>
                </AccordionTrigger>

                <AccordionContent class="step-content">
                    {@render children({ step })}
                </AccordionContent>
            </AccordionItem>
        {/each}
    </Accordion>

    <!-- Global Warning Display -->
    {#if stepperState.errors.global}
        <div class="global-warning">
            <div class="warning-content">
                <TriangleAlert class="warning-icon" size={18} />
                <span class="warning-text">{stepperState.errors.global}</span>
            </div>
        </div>
    {/if}
</div>

<style>
    .accordion-stepper {
        width: 100%;
        margin-bottom: 2rem;
    }

    .mobile-progress {
        display: block;
        margin-bottom: 1rem;
    }

    .progress-bar {
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
        font-size: 0.875rem;
        color: hsl(var(--muted-foreground));
    }

    :global(.stepper-accordion) {
        border: 1px solid hsl(var(--border));
        border-radius: 0.5rem;
        overflow: hidden;
    }

    :global(.step-accordion-item) {
        border-bottom: 1px solid hsl(var(--border));
    }

    :global(.step-accordion-item:last-child) {
        border-bottom: none;
    }

    :global(.step-accordion-item.completed) {
        background: hsl(var(--muted) / 0.3);
    }

    :global(.step-accordion-item.current) {
        background: hsl(var(--primary) / 0.05);
        border-color: hsl(var(--primary) / 0.3);
    }

    :global(.step-accordion-item.error) {
        background: hsl(var(--destructive) / 0.05);
        border-color: hsl(var(--destructive) / 0.3);
    }

    :global(.step-trigger) {
        padding: 1rem 1.5rem;
        width: 100%;
    }

    :global(.step-trigger:disabled) {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .step-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
    }

    .step-indicator {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
        transition: all 0.3s ease;
    }

    .step-indicator.pending {
        border-color: hsl(var(--muted-foreground));
        color: hsl(var(--muted-foreground));
        background: hsl(var(--muted));
    }

    .step-indicator.current {
        border-color: hsl(var(--primary));
        color: hsl(var(--primary));
        background: hsl(var(--primary) / 0.1);
    }

    .step-indicator.completed {
        border-color: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        background: hsl(var(--primary));
    }

    .step-indicator.error {
        border-color: hsl(var(--destructive));
        color: hsl(var(--destructive));
        background: hsl(var(--destructive) / 0.1);
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
        background: hsl(var(--destructive));
        color: hsl(var(--destructive-foreground));
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

    .step-info {
        flex: 1;
        text-align: left;
    }

    .step-title {
        font-size: 1rem;
        font-weight: 600;
        color: hsl(var(--foreground));
        margin: 0 0 0.25rem 0;
    }

    :global(.step-content) {
        padding: 0 1.5rem 1.5rem 1.5rem;
    }

    /* Global Warning Styles */
    .global-warning {
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: hsl(var(--warning) / 0.1);
        border: 1px solid hsl(var(--warning) / 0.3);
        border-radius: 0.5rem;
        animation: slideIn 0.3s ease-out;
    }

    .warning-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    :global(.warning-icon) {
        color: hsl(var(--warning));
        flex-shrink: 0;
    }

    .warning-text {
        font-size: 0.875rem;
        color: hsl(var(--warning-foreground));
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

    /* Mobile responsive */
    @media (max-width: 640px) {
        .accordion-stepper {
            margin-bottom: 1rem;
        }

        :global(.step-trigger) {
            padding: 0.75rem 1rem;
        }

        .step-indicator {
            width: 36px;
            height: 36px;
            font-size: 0.75rem;
        }

        .step-title {
            font-size: 0.875rem;
        }

        :global(.step-content) {
            padding: 0 1rem 1rem 1rem;
        }
    }
</style>
