import { writable } from "svelte/store";
import type { StepperState } from "$lib/types";
import { DEFAULT_STEP_ORDER, StepperUtils } from "$lib/types/stepper";

function createInitialState(
	enabledSteps: string[] = DEFAULT_STEP_ORDER,
): StepperState {
	return {
		currentStep: 1,
		completedSteps: new Set<number>(),
		formData: {
			startDate: "",
			endDate: "",
			selectedThemes: [],
			budget: 0,
		},
		errors: {},
		isLoading: false,
		enabledSteps,
		stepMapping: StepperUtils.createStepMapping(enabledSteps),
	};
}

export const stepperState = writable<StepperState>(createInitialState());

// Function to initialize stepper with custom steps
export function initializeStepper(enabledSteps: string[] = DEFAULT_STEP_ORDER) {
	stepperState.set(createInitialState(enabledSteps));
}

// Function to add country step as step 1
export function enableCountryStep() {
	stepperState.update((state) => {
		const newEnabledSteps = [
			"country",
			...state.enabledSteps.filter((step) => step !== "country"),
		];
		return {
			...state,
			enabledSteps: newEnabledSteps,
			stepMapping: StepperUtils.createStepMapping(newEnabledSteps),
			formData: {
				...state.formData,
				selectedCountry: state.formData.selectedCountry || "",
			},
		};
	});
}
