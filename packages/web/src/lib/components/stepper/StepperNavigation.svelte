<script lang="ts">
import { ChevronLeft, ChevronRight } from "@lucide/svelte";
import { onMount } from "svelte";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

interface Props {
	canGoPrevious: boolean;
	canGoNext: boolean;
	isLastStep: boolean;
	isLoading?: boolean;
	onprevious?: () => void;
	onnext?: () => void;
	onsubmit?: () => void;
}

let {
	canGoPrevious,
	canGoNext,
	isLastStep,
	isLoading = false,
	onprevious,
	onnext,
	onsubmit,
}: Props = $props();

function handlePrevious() {
	if (canGoPrevious && !isLoading) {
		onprevious?.();
	}
}

function handleNext() {
	if (canGoNext && !isLoading) {
		if (isLastStep) {
			onsubmit?.();
		} else {
			onnext?.();
		}
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Enter" && !event.shiftKey) {
		event.preventDefault();
		handleNext();
	}
}

// Add keyboard event listener to the document
onMount(() => {
	document.addEventListener("keydown", handleKeydown);
	return () => document.removeEventListener("keydown", handleKeydown);
});
</script>

<div class="stepper-navigation">
    <Button
        variant="outline"
        size="lg"
        disabled={!canGoPrevious || isLoading}
        onclick={handlePrevious}
        aria-label="Go to previous step"
        class="nav-button-previous"
    >
        <ChevronLeft class="button-icon" size={20} />
        Previous
    </Button>

    <Button
        variant="default"
        size="lg"
        disabled={!canGoNext || isLoading}
        onclick={handleNext}
        aria-label={isLastStep ? "Submit form" : "Go to next step"}
        class="nav-button-next"
    >
        {#if isLoading}
            <Spinner />
            {isLastStep ? "Generating..." : "Loading..."}
        {:else}
            {isLastStep ? "Get my Beauty Tour" : "Next"}
            {#if !isLastStep}
                <ChevronRight class="button-icon" size={20} />
            {/if}
        {/if}
    </Button>
</div>

<style>
    .stepper-navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid hsl(var(--border));
    }

    :global(.button-icon) {
        flex-shrink: 0;
    }

    :global(.nav-button-previous),
    :global(.nav-button-next) {
        min-width: 120px;
    }

    /* Mobile responsive design */
    @media (max-width: 640px) {
        .stepper-navigation {
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1rem;
            padding-top: 0.75rem;
        }

        :global(.nav-button-previous),
        :global(.nav-button-next) {
            width: 100%;
            min-width: unset;
            min-height: 44px;
            font-size: 0.875rem;
        }

        :global(.button-icon) {
            width: 16px;
            height: 16px;
        }
    }

    @media (min-width: 641px) and (max-width: 768px) {
        .stepper-navigation {
            gap: 0.5rem;
        }

        :global(.nav-button-previous),
        :global(.nav-button-next) {
            min-width: 100px;
        }
    }
</style>
