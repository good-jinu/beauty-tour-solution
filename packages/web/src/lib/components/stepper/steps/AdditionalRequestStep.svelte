<script module lang="ts">
import type { AdditionalRequestStepErrors } from "$lib/types/stepper.js";

export function validate(
	moreRequests: string,
	realTime = false,
): {
	isValid: boolean;
	errors: AdditionalRequestStepErrors | undefined;
} {
	const errors: AdditionalRequestStepErrors = {};

	// This step is optional, so empty requests are valid
	if (moreRequests && moreRequests.trim().length > 0) {
		// Validate length constraints
		if (moreRequests.trim().length < 10) {
			errors.length = realTime
				? "Please provide more details (minimum 10 characters)"
				: "Please provide more detailed information about your specific requests";
		}

		if (moreRequests.trim().length > 1000) {
			errors.length = "Please keep your request under 1000 characters";
		}

		// Basic content validation
		const hasOnlySpecialChars = /^[^a-zA-Z0-9\s]*$/.test(moreRequests.trim());
		if (hasOnlySpecialChars) {
			errors.content = "Please provide meaningful text in your request";
		}
	}

	const isValid = Object.keys(errors).length === 0;
	return { isValid, errors: isValid ? undefined : errors };
}
</script>

<script lang="ts">
	import { stepperState } from "$lib/stores/stepper.js";
	import ErrorDisplay from "../ErrorDisplay.svelte";

	function handleTextareaInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		$stepperState.formData.moreRequests = target.value;
	}

	function handleClearText() {
		$stepperState.formData.moreRequests = "";
	}

	const displayErrors = $derived.by(() => {
		const stepErrors = $stepperState.errors.step5; // Assuming this will be step 5
		if (!stepErrors) return [];
		return Object.values(stepErrors).filter(Boolean) as string[];
	});

	const characterCount = $derived.by(() => {
		return $stepperState.formData.moreRequests?.length || 0;
	});

	const isNearLimit = $derived.by(() => characterCount > 800);
	const isOverLimit = $derived.by(() => characterCount > 1000);
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="text-center space-y-2">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white">
			Additional Requests
		</h2>
		<p class="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
			Tell us more about what you're looking for. Any specific treatments, preferences, or special requirements?
		</p>
	</div>

	<!-- Error Display -->
	{#if displayErrors.length > 0}
		<ErrorDisplay errors={displayErrors} />
	{/if}

	<!-- Main Content -->
	<div class="max-w-2xl mx-auto">
		<div class="space-y-4">
			<!-- Textarea -->
			<div class="relative">
				<label
					for="more-requests"
					class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
				>
					Describe your specific needs or preferences (optional)
				</label>
				<textarea
					id="more-requests"
					name="more-requests"
					rows="6"
					class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
						   focus:ring-2 focus:ring-blue-500 focus:border-transparent
						   dark:bg-gray-700 dark:text-white
						   resize-none transition-colors duration-200
						   {isOverLimit ? 'border-red-500 focus:ring-red-500' : ''}"
					placeholder="I want Kpop idol style like Blackpink Rose hair and makeup. Blonde straight hair and bright skin."
					value={$stepperState.formData.moreRequests || ""}
					on:input={handleTextareaInput}
					maxlength="1000"
				></textarea>

				<!-- Character Counter -->
				<div class="flex justify-between items-center mt-2">
					<div class="text-xs text-gray-500 dark:text-gray-400">
						This information helps us personalize your beauty journey
					</div>
					<div class="text-xs {isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-gray-500'}">
						{characterCount}/1000 characters
					</div>
				</div>

				<!-- Clear button -->
				{#if characterCount > 0}
					<button
						type="button"
						on:click={handleClearText}
						class="absolute top-8 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
							   transition-colors duration-200"
						aria-label="Clear text"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				{/if}
			</div>

			<!-- Skip option -->
			<div class="text-center">
				<p class="text-sm text-gray-500 dark:text-gray-400">
					This step is optional. You can skip it and we'll create a personalized plan based on your previous selections.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	textarea:focus {
		outline: none;
	}
	
	/* Custom scrollbar for textarea */
	textarea::-webkit-scrollbar {
		width: 8px;
	}
	
	textarea::-webkit-scrollbar-track {
		background: transparent;
	}
	
	textarea::-webkit-scrollbar-thumb {
		background-color: rgba(156, 163, 175, 0.5);
		border-radius: 4px;
	}
	
	textarea::-webkit-scrollbar-thumb:hover {
		background-color: rgba(156, 163, 175, 0.7);
	}
	
	/* Dark mode scrollbar */
	@media (prefers-color-scheme: dark) {
		textarea::-webkit-scrollbar-thumb {
			background-color: rgba(75, 85, 99, 0.5);
		}
		
		textarea::-webkit-scrollbar-thumb:hover {
			background-color: rgba(75, 85, 99, 0.7);
		}
	}
</style>