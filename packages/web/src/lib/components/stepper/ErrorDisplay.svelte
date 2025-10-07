<script lang="ts">
import type { StepperErrors } from "$lib/types/stepper";
import { generateErrorSummary, getErrorSeverity } from "$lib/utils/validation";

interface Props {
	errors: StepperErrors | string[];
	currentStep?: number;
	onRetryStep?: (step: number) => void;
	onClearErrors?: () => void;
	showSummary?: boolean;
}

let {
	errors,
	currentStep = 0,
	onRetryStep = () => {},
	onClearErrors = () => {},
	showSummary = false,
}: Props = $props();

const isStringArray = Array.isArray(errors);

const errorSummary = $derived(
	!isStringArray ? generateErrorSummary(errors as StepperErrors) : "",
);

const errorList = $derived(() => {
	if (isStringArray) {
		return (errors as string[]).map((msg) => ({
			step: 0,
			field: "general",
			message: msg,
			severity: getErrorSeverity(msg),
		}));
	}

	const allErrors: {
		step: number;
		field: string;
		message: string;
		severity: "error" | "warning" | "info";
	}[] = [];
	Object.entries(errors).forEach(([stepKey, stepErrors]) => {
		if (stepKey === "global" || !stepErrors) return;
		const stepNumber = parseInt(stepKey.replace("step", ""), 10);
		Object.entries(stepErrors).forEach(([field, message]) => {
			if (message) {
				allErrors.push({
					step: stepNumber,
					field,
					message: message as string,
					severity: getErrorSeverity(message as string),
				});
			}
		});
	});
	return allErrors;
});
</script>

<div class="space-y-4">
	{#if showSummary && errorSummary}
		<div class="summary">
			<p>{errorSummary}</p>
		</div>
	{/if}

	{#each errorList() as error}
		<div class="error-item {error.severity}">
			<span>{error.message}</span>
			{#if !isStringArray && error.step !== currentStep}
				<button onclick={() => onRetryStep(error.step)}>Fix</button>
			{/if}
		</div>
	{/each}
</div>

<style>
	.summary {
		padding: 0.75rem;
		background-color: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
		border-radius: 0.375rem;
		margin-bottom: 1rem;
	}
	.error-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		border-radius: 0.375rem;
	}
	.error-item.error {
		background-color: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}
	.error-item.warning {
		background-color: #fffbeb;
		color: #92400e;
		border: 1px solid #fde68a;
	}
	.error-item button {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		border: 1px solid;
		cursor: pointer;
	}
</style>
