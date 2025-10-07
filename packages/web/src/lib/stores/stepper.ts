import { writable } from "svelte/store";
import type { StepperState } from "$lib/types";

const initialState: StepperState = {
	currentStep: 1,
	completedSteps: new Set<number>(),
	formData: {
		selectedCountry: "",
		startDate: "",
		endDate: "",
		selectedThemes: [],
		budget: 0,
	},
	errors: {},
	isLoading: false,
};

export const stepperState = writable<StepperState>(initialState);
