<script lang="ts">
import type { StepperState } from "$lib/types";
import AccordionStepper from "./AccordionStepper.svelte";
import ErrorRecovery from "./ErrorRecovery.svelte";
import StepperNavigation from "./StepperNavigation.svelte";
import BudgetSelection from "./steps/BudgetSelection.svelte";
import CountrySelection from "./steps/CountrySelection.svelte";
import DateSelection from "./steps/DateSelection.svelte";
import ThemeSelection from "./steps/ThemeSelection.svelte";

interface Props {
	stepperState: StepperState;
	goToStep: (step: number) => void;
	nextStep: () => void;
	previousStep: () => void;
	canGoNext: boolean;
	canGoPrevious: boolean;
	isLastStep: boolean;
	hasCurrentStepErrors: boolean;
	globalWarning: string | undefined;
	clearStepErrors: (step: number) => void;
	clearAllErrors: () => void;
	hasStepErrors: (step: number) => boolean;
	getStepErrorCount: (step: number) => number;
	isLoading: boolean;
}

let {
	stepperState,
	goToStep,
	nextStep,
	previousStep,
	canGoNext,
	canGoPrevious,
	isLastStep,
	hasCurrentStepErrors,
	globalWarning,
	clearStepErrors,
	clearAllErrors,
	hasStepErrors,
	getStepErrorCount,
	isLoading,
}: Props = $props();

function handleStepClick(step: number) {
	goToStep(step);
}
</script>

<div class="accordion-stepper-wrapper">
    <AccordionStepper {stepperState} onStepClick={handleStepClick}>
        {#snippet children({ step })}
            <div class="step-content-wrapper">
                {#if stepperState.stepMapping[step] === "country"}
                    <CountrySelection />
                {:else if stepperState.stepMapping[step] === "dates"}
                    <DateSelection />
                {:else if stepperState.stepMapping[step] === "themes"}
                    <ThemeSelection />
                {:else if stepperState.stepMapping[step] === "budget"}
                    <BudgetSelection />
                {/if}

                <!-- Error Recovery for current step -->
                {#if step === stepperState.currentStep && (hasCurrentStepErrors || globalWarning)}
                    <div class="error-recovery">
                        <ErrorRecovery
                            {stepperState}
                            onGoToStep={goToStep}
                            onClearErrors={clearAllErrors}
                            onRetryValidation={() => {
                                // Trigger validation by updating form data with current values
                                // This will be handled by the parent component
                            }}
                            showInline={true}
                        />
                    </div>
                {/if}

                <!-- Navigation for the current step -->
                {#if step === stepperState.currentStep}
                    <div class="step-navigation">
                        <StepperNavigation
                            {canGoNext}
                            {canGoPrevious}
                            {isLastStep}
                            {isLoading}
                            onprevious={previousStep}
                            onnext={nextStep}
                            onsubmit={nextStep}
                        />
                    </div>
                {/if}
            </div>
        {/snippet}
    </AccordionStepper>
</div>

<style>
    .accordion-stepper-wrapper {
        width: 100%;
    }

    .step-content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .error-recovery {
        border-top: 1px solid hsl(var(--border));
        padding-top: 1rem;
    }

    .step-navigation {
        border-top: 1px solid hsl(var(--border));
        padding-top: 1.5rem;
        margin-top: 1rem;
    }

    /* Mobile responsive */
    @media (max-width: 640px) {
        .step-content-wrapper {
            gap: 1rem;
        }

        .step-navigation {
            padding-top: 1rem;
            margin-top: 0.5rem;
        }

        .error-recovery {
            padding-top: 0.75rem;
        }
    }
</style>
