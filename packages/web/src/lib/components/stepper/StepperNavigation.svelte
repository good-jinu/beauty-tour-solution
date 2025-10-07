<script lang="ts">
import { onDestroy, onMount } from "svelte";
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
    <button
        class="nav-button secondary"
        disabled={!canGoPrevious || isLoading}
        onclick={handlePrevious}
        aria-label="Go to previous step"
    >
        <svg
            class="button-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        >
            <polyline points="15,18 9,12 15,6"></polyline>
        </svg>
        Previous
    </button>

    <button
        class="nav-button primary"
        disabled={!canGoNext || isLoading}
        onclick={handleNext}
        aria-label={isLastStep ? "Submit form" : "Go to next step"}
    >
        {#if isLoading}
            <Spinner />
            {isLastStep ? "Generating..." : "Loading..."}
        {:else}
            {isLastStep ? "Get my Beauty Tour" : "Next"}
            {#if !isLastStep}
                <svg
                    class="button-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
            {/if}
        {/if}
    </button>
</div>

<style>
    .stepper-navigation {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    .nav-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.2s ease;
        cursor: pointer;
        border: 2px solid;
        min-height: 48px;
        min-width: 120px;
        justify-content: center;
    }

    .nav-button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    .nav-button.primary {
        background: #3b82f6;
        border-color: #3b82f6;
        color: white;
    }

    .nav-button.primary:hover:not(:disabled) {
        background: #2563eb;
        border-color: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .nav-button.primary:active:not(:disabled) {
        transform: translateY(0);
    }

    .nav-button.secondary {
        background: transparent;
        border-color: #d1d5db;
        color: #374151;
    }

    .nav-button.secondary:hover:not(:disabled) {
        background: #f9fafb;
        border-color: #9ca3af;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .nav-button.secondary:active:not(:disabled) {
        transform: translateY(0);
    }

    .button-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }

    .button-icon.loading {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    /* Mobile responsive design */
    @media (max-width: 768px) {
        .stepper-navigation {
            flex-direction: column;
            gap: 0.75rem;
            margin-top: 1.5rem;
            padding-top: 1rem;
        }

        .nav-button {
            width: 100%;
            padding: 1rem 1.5rem;
            font-size: 1.125rem;
            min-height: 52px;
        }

        .button-icon {
            width: 22px;
            height: 22px;
        }
    }

    /* Tablet responsive design */
    @media (max-width: 1024px) and (min-width: 769px) {
        .nav-button {
            padding: 0.875rem 1.75rem;
            min-width: 140px;
        }
    }

    /* Dark mode support */
    :global([data-theme="dark"]) .stepper-navigation {
        border-top-color: #4b5563;
    }

    :global([data-theme="dark"]) .nav-button.secondary {
        border-color: #4b5563;
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .nav-button.secondary:hover:not(:disabled) {
        background: #374151;
        border-color: #6b7280;
    }

    /* Focus styles for accessibility */
    .nav-button:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
    }

    :global([data-theme="dark"]) .nav-button:focus-visible {
        outline-color: #60a5fa;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
        .nav-button {
            border-width: 3px;
        }

        .nav-button.primary {
            background: #1d4ed8;
            border-color: #1d4ed8;
        }

        .nav-button.secondary {
            border-color: #000;
            color: #000;
        }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
        .nav-button {
            transition: none;
        }

        .nav-button:hover:not(:disabled) {
            transform: none;
        }

        .button-icon.loading {
            animation: none;
        }
    }
</style>
