# Accordion Stepper

The Accordion Stepper is a new UI component that transforms the traditional horizontal stepper into an accordion-style interface. Each step is displayed as an accordion item, and only the current step is expanded and interactive.

## Features

- **Sequential Navigation**: Only the current step is open, previous steps are collapsed but accessible
- **Visual Status Indicators**: Each step shows completion status, errors, and progress
- **Mobile Responsive**: Optimized for mobile devices with touch-friendly interactions
- **Error Handling**: Integrated error display and recovery options
- **Accessibility**: Full keyboard navigation and screen reader support

## Usage

### Basic Implementation

Replace the existing `StepperHeader` with `AccordionStepperWrapper`:

```svelte
<script lang="ts">
import { StepperContainer, AccordionStepperWrapper } from "$lib/components/stepper";
</script>

<StepperContainer oncomplete={handleStepperComplete}>
  {#snippet children({
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
  })}
    <AccordionStepperWrapper
      {stepperState}
      {goToStep}
      {nextStep}
      {previousStep}
      {canGoNext}
      {canGoPrevious}
      {isLastStep}
      {hasCurrentStepErrors}
      {globalWarning}
      {clearStepErrors}
      {clearAllErrors}
      {hasStepErrors}
      {getStepErrorCount}
      isLoading={isLoading || stepperState.isLoading}
    />
  {/snippet}
</StepperContainer>
```

### Demo

Visit `/accordion-demo` to see the accordion stepper in action.

## Components

### AccordionStepper

The core accordion component that handles the step display and navigation.

**Props:**
- `stepperState`: Current stepper state
- `onStepClick`: Function to handle step navigation
- `children`: Snippet for rendering step content

### AccordionStepperWrapper

A wrapper component that integrates the accordion with existing step components and navigation.

**Props:**
- All stepper-related props from `StepperContainer`
- Handles integration with existing step components
- Manages error recovery and navigation

## Behavior

1. **Step Opening**: Only the current step is open by default
2. **Navigation**: Users can click on completed steps or the next available step
3. **Completion**: When a step is completed (Next button clicked), it closes and the next step opens
4. **Error Handling**: Steps with errors are visually indicated and remain accessible
5. **Mobile**: Progress bar shows overall completion, accordion provides step details

## Styling

The accordion stepper uses CSS custom properties for theming:
- `--primary`: Primary color for active states
- `--destructive`: Error color for validation issues
- `--muted`: Background colors for inactive states
- `--border`: Border colors for separators

## Migration from Traditional Stepper

To migrate from the traditional horizontal stepper:

1. Replace `StepperHeader` import with `AccordionStepperWrapper`
2. Remove the separate step content rendering (it's handled internally)
3. Remove the separate `ErrorRecovery` component (integrated)
4. Remove the separate `StepperNavigation` component (integrated)

The accordion stepper maintains the same API and behavior while providing a more mobile-friendly interface.