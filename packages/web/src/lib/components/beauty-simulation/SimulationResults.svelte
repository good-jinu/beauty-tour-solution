<script lang="ts">
import { onMount } from "svelte";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import Button from "$lib/components/ui/button/button.svelte";
import {
	BeautySimulationUtils,
	beautySimulationState,
} from "$lib/stores/beauty-simulation";
import { stepperState } from "$lib/stores/stepper";

interface Props {
	originalImage: string; // base64 image or URL
	simulatedImage: string; // base64 image or URL
	selectedTheme: string;
	onPlanJourney?: () => void;
	onTryAgain?: () => void;
}

let {
	originalImage,
	simulatedImage,
	selectedTheme,
	onPlanJourney,
	onTryAgain,
}: Props = $props();

// Navigation and state management
async function handlePlanJourney() {
	try {
		// Pre-populate stepper with selected theme from simulation
		stepperState.update((state) => ({
			...state,
			formData: {
				...state.formData,
				selectedThemes: selectedTheme ? [selectedTheme] : [],
			},
			currentStep: 1, // Start from country selection
		}));

		// Show success message
		toast.success("Theme pre-selected! Continue with your journey planning.");

		// Call parent callback if provided
		if (onPlanJourney) {
			onPlanJourney();
		} else {
			// Default navigation behavior - scroll to stepper section
			const stepperElement = document.getElementById("stepper-form");
			if (stepperElement) {
				stepperElement.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}
		}
	} catch (error) {
		console.error("Error navigating to journey planning:", error);
		toast.error("Failed to navigate to journey planning. Please try again.");
	}
}

async function handleTryAgain() {
	try {
		// Reset simulation state but preserve the uploaded image for convenience
		const currentState = $beautySimulationState;

		BeautySimulationUtils.setTheme(null);
		beautySimulationState.update((state) => ({
			...state,
			simulationResult: null,
			error: null,
			isGenerating: false,
		}));

		// Show success message
		toast.success(
			"Ready for a new simulation! Select a different theme or upload a new image.",
		);

		// Call parent callback if provided
		if (onTryAgain) {
			onTryAgain();
		} else {
			// Default behavior - scroll to simulation section
			const simulationElement = document.getElementById("beauty-simulation");
			if (simulationElement) {
				simulationElement.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}
		}
	} catch (error) {
		console.error("Error resetting simulation:", error);
		toast.error("Failed to reset simulation. Please refresh the page.");
	}
}

let isZoomed = $state(false);
let zoomedImage = $state<"original" | "simulated" | null>(null);
let comparisonMode = $state<"side-by-side" | "overlay">("side-by-side");
let overlayOpacity = $state(50);
let isMobile = $state(false);

onMount(() => {
	// Detect mobile device
	isMobile = window.innerWidth < 768;

	// Handle window resize
	const handleResize = () => {
		isMobile = window.innerWidth < 768;
	};

	window.addEventListener("resize", handleResize);
	return () => window.removeEventListener("resize", handleResize);
});

function openZoom(imageType: "original" | "simulated") {
	zoomedImage = imageType;
	isZoomed = true;
	document.body.style.overflow = "hidden";
}

function closeZoom() {
	isZoomed = false;
	zoomedImage = null;
	document.body.style.overflow = "";
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Escape" && isZoomed) {
		closeZoom();
	}

	// Keyboard navigation for comparison mode
	if (!isZoomed && event.target === document.body) {
		switch (event.key) {
			case "Tab":
				// Let default tab behavior work
				break;
			case "1":
				event.preventDefault();
				comparisonMode = "side-by-side";
				announceToScreenReader("Switched to side-by-side view");
				break;
			case "2":
				event.preventDefault();
				comparisonMode = "overlay";
				announceToScreenReader("Switched to overlay view");
				break;
			case "ArrowLeft":
				if (comparisonMode === "overlay") {
					event.preventDefault();
					overlayOpacity = Math.max(0, overlayOpacity - 10);
					announceToScreenReader(`Overlay opacity: ${overlayOpacity}%`);
				}
				break;
			case "ArrowRight":
				if (comparisonMode === "overlay") {
					event.preventDefault();
					overlayOpacity = Math.min(100, overlayOpacity + 10);
					announceToScreenReader(`Overlay opacity: ${overlayOpacity}%`);
				}
				break;
		}
	}
}

function announceToScreenReader(message: string) {
	const announcement = document.createElement("div");
	announcement.setAttribute("aria-live", "polite");
	announcement.setAttribute("aria-atomic", "true");
	announcement.className = "sr-only";
	announcement.textContent = message;
	document.body.appendChild(announcement);

	setTimeout(() => {
		document.body.removeChild(announcement);
	}, 1000);
}

function toggleComparisonMode() {
	comparisonMode =
		comparisonMode === "side-by-side" ? "overlay" : "side-by-side";
}

function handleOverlaySlider(event: Event) {
	const target = event.target as HTMLInputElement;
	overlayOpacity = parseInt(target.value);
}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="simulation-results" role="region" aria-labelledby="results-title">
    <!-- Results Header -->
    <div class="results-header">
        <h3 id="results-title" class="results-title">
            Your Beauty Simulation Results
        </h3>
        <p class="results-subtitle">
            See how the {selectedTheme.replace("-", " ")} treatment could transform
            your look
        </p>
    </div>

    <!-- Comparison Controls -->
    <div
        class="comparison-controls"
        role="group"
        aria-labelledby="view-mode-label"
    >
        <div class="control-group">
            <span id="view-mode-label" class="control-label">View Mode:</span>
            <div
                class="toggle-buttons"
                role="radiogroup"
                aria-labelledby="view-mode-label"
            >
                <button
                    class="toggle-button {comparisonMode === 'side-by-side'
                        ? 'active'
                        : ''}"
                    onclick={() => (comparisonMode = "side-by-side")}
                    role="radio"
                    aria-checked={comparisonMode === "side-by-side"}
                    aria-label="View images side by side"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z"
                        />
                    </svg>
                    Side by Side
                </button>
                <button
                    class="toggle-button {comparisonMode === 'overlay'
                        ? 'active'
                        : ''}"
                    onclick={toggleComparisonMode}
                    role="radio"
                    aria-checked={comparisonMode === "overlay"}
                    aria-label="View images as overlay"
                >
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    Overlay
                </button>
            </div>
        </div>

        {#if comparisonMode === "overlay"}
            <div class="control-group">
                <label class="control-label" for="opacity-slider">
                    Opacity: {overlayOpacity}%
                </label>
                <input
                    id="opacity-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={overlayOpacity}
                    oninput={handleOverlaySlider}
                    class="opacity-slider"
                    aria-label="Adjust overlay opacity between original and simulated images"
                />
            </div>
        {/if}
    </div>

    <!-- Image Comparison Area -->
    <div class="comparison-container {comparisonMode}">
        {#if comparisonMode === "side-by-side"}
            <!-- Side by Side View -->
            <div class="image-comparison-grid">
                <div class="image-container">
                    <div class="image-header">
                        <h4 class="image-title">Original</h4>
                        <button
                            class="zoom-button"
                            onclick={() => openZoom("original")}
                            aria-label="Zoom original image"
                        >
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
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                />
                            </svg>
                        </button>
                    </div>
                    <div class="image-wrapper">
                        <button
                            class="image-button"
                            onclick={() => openZoom("original")}
                            aria-label="View original photo in full size"
                        >
                            <img
                                src={originalImage}
                                alt="Original before beauty treatment simulation"
                                class="comparison-image"
                            />
                        </button>
                    </div>
                </div>

                <div class="image-container">
                    <div class="image-header">
                        <h4 class="image-title">Simulated Result</h4>
                        <button
                            class="zoom-button"
                            onclick={() => openZoom("simulated")}
                            aria-label="Zoom simulated image"
                        >
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
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                />
                            </svg>
                        </button>
                    </div>
                    <div class="image-wrapper">
                        <button
                            class="image-button"
                            onclick={() => openZoom("simulated")}
                            aria-label="View simulated result in full size"
                        >
                            <img
                                src={simulatedImage}
                                alt="Simulated result after {selectedTheme.replace(
                                    '-',
                                    ' ',
                                )} beauty treatment"
                                class="comparison-image"
                            />
                        </button>
                    </div>
                </div>
            </div>
        {:else}
            <!-- Overlay View -->
            <div class="overlay-container">
                <div
                    class="overlay-wrapper"
                    role="img"
                    aria-label="Overlay comparison of original photo and simulated result with {selectedTheme.replace(
                        '-',
                        ' ',
                    )} treatment"
                >
                    <img
                        src={originalImage}
                        alt="Original before beauty treatment simulation"
                        class="overlay-base-image"
                    />
                    <img
                        src={simulatedImage}
                        alt="Simulated result (overlay layer at {overlayOpacity}% opacity)"
                        class="overlay-top-image"
                        style="opacity: {overlayOpacity / 100}"
                    />
                </div>
                <div class="overlay-controls">
                    <span class="overlay-label">Original</span>
                    <span class="overlay-label">Simulated</span>
                </div>
            </div>
        {/if}
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
        <Button
            variant="outline"
            size="lg"
            onclick={handleTryAgain}
            class="action-button secondary"
            aria-label="Start a new beauty simulation"
        >
            <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
            </svg>
            Try Another Simulation
        </Button>

        <Button
            size="lg"
            onclick={handlePlanJourney}
            class="action-button primary"
            aria-label="Continue to journey planning with selected theme"
        >
            <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
            </svg>
            Plan Your Beauty Journey
        </Button>
    </div>

    <!-- Navigation Hint -->
    <div class="navigation-hint">
        <p class="hint-text">
            <svg
                class="w-4 h-4 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            Your selected theme ({selectedTheme.replace("-", " ")}) will be
            pre-filled in the journey planner
        </p>
    </div>

    <!-- Keyboard Navigation Hints -->
    <div class="keyboard-hints" aria-label="Keyboard shortcuts">
        <p class="keyboard-hint-text">
            <strong>Keyboard shortcuts:</strong>
            Press 1 for side-by-side view, 2 for overlay view
            {#if comparisonMode === "overlay"}
                , arrow keys to adjust opacity
            {/if}
        </p>
    </div>

    <!-- Zoom Modal -->
    {#if isZoomed && zoomedImage}
        <div
            class="zoom-modal"
            onclick={closeZoom}
            onkeydown={(e) => e.key === "Enter" && closeZoom()}
            role="dialog"
            aria-modal="true"
            aria-label="Image zoom view"
            tabindex="0"
        >
            <div class="zoom-content" role="document">
                <button
                    class="zoom-close"
                    onclick={closeZoom}
                    aria-label="Close zoom view"
                >
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
                <div class="zoom-header">
                    <h4 class="zoom-title">
                        {zoomedImage === "original"
                            ? "Original Photo"
                            : "Simulated Result"}
                    </h4>
                </div>
                <div class="zoom-image-container">
                    <img
                        src={zoomedImage === "original"
                            ? originalImage
                            : simulatedImage}
                        alt={zoomedImage === "original"
                            ? "Original photo - zoomed view"
                            : "Simulated result - zoomed view"}
                        class="zoom-image"
                    />
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .simulation-results {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    .results-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .results-title {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }

    .results-subtitle {
        font-size: 1.125rem;
        color: #6b7280;
        text-transform: capitalize;
    }

    .comparison-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 0.75rem;
        margin-bottom: 2rem;
    }

    .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
    }

    .control-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
    }

    .toggle-buttons {
        display: flex;
        gap: 0.25rem;
        background: white;
        border-radius: 0.5rem;
        padding: 0.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .toggle-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        border: none;
        background: transparent;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .toggle-button.active {
        background: #3b82f6;
        color: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .toggle-button:hover:not(.active) {
        background: #f3f4f6;
        color: #374151;
    }

    .opacity-slider {
        width: 150px;
        height: 6px;
        border-radius: 3px;
        background: #e5e7eb;
        outline: none;
        cursor: pointer;
    }

    .opacity-slider::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .opacity-slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .comparison-container {
        margin-bottom: 2rem;
    }

    .image-comparison-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    .image-container {
        background: white;
        border-radius: 1rem;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
    }

    .image-container:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .image-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }

    .image-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
    }

    .zoom-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 0.375rem;
        border: none;
        background: #e5e7eb;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .zoom-button:hover {
        background: #d1d5db;
        color: #374151;
    }

    .image-wrapper {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
    }

    .image-button {
        width: 100%;
        height: 100%;
        border: none;
        padding: 0;
        background: none;
        cursor: pointer;
        display: block;
    }

    .comparison-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.2s ease;
        display: block;
    }

    .image-button:hover .comparison-image {
        transform: scale(1.05);
    }

    .overlay-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
    }

    .overlay-wrapper {
        position: relative;
        width: 100%;
        max-width: 500px;
        aspect-ratio: 1;
        border-radius: 1rem;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .overlay-base-image,
    .overlay-top-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .overlay-controls {
        display: flex;
        justify-content: space-between;
        width: 100%;
        max-width: 500px;
        padding: 0 1rem;
    }

    .overlay-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #6b7280;
    }

    .action-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
    }

    .action-button {
        min-width: 200px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
    }

    .action-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .navigation-hint {
        text-align: center;
        padding: 1rem;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 0.75rem;
        margin-top: 1rem;
    }

    .hint-text {
        font-size: 0.875rem;
        color: #0369a1;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        text-transform: capitalize;
    }

    .zoom-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 2rem;
    }

    .zoom-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        background: white;
        border-radius: 1rem;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .zoom-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        z-index: 10;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease;
    }

    .zoom-close:hover {
        background: rgba(0, 0, 0, 0.9);
    }

    .zoom-header {
        padding: 1rem;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }

    .zoom-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #374151;
        margin: 0;
    }

    .zoom-image-container {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        min-height: 400px;
    }

    .zoom-image {
        max-width: 100%;
        max-height: 70vh;
        object-fit: contain;
        border-radius: 0.5rem;
    }

    /* Mobile Responsive Design */
    @media (max-width: 768px) {
        .simulation-results {
            padding: 1rem;
        }

        .results-title {
            font-size: 1.5rem;
            line-height: 1.3;
        }

        .results-subtitle {
            font-size: 1rem;
            line-height: 1.4;
        }

        .comparison-controls {
            flex-direction: column;
            gap: 1rem;
            padding: 1rem;
            border-radius: 1rem;
        }

        .control-group {
            width: 100%;
        }

        .toggle-buttons {
            width: 100%;
        }

        .toggle-button {
            flex: 1;
            justify-content: center;
            min-height: 48px;
            /* Better touch targets */
            font-size: 0.875rem;
            padding: 0.75rem 1rem;
        }

        .opacity-slider {
            width: 100%;
            height: 8px;
            /* Larger slider for easier mobile interaction */
        }

        .opacity-slider::-webkit-slider-thumb {
            width: 24px;
            height: 24px;
        }

        .opacity-slider::-moz-range-thumb {
            width: 24px;
            height: 24px;
        }

        .image-comparison-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .image-container {
            border-radius: 1rem;
        }

        .image-container:hover {
            transform: none;
            /* Disable hover transform on mobile */
        }

        .zoom-button {
            width: 2.5rem;
            height: 2.5rem;
            /* Larger touch targets */
        }

        .action-buttons {
            flex-direction: column;
            gap: 1rem;
        }

        .action-button {
            width: 100%;
            min-width: unset;
            min-height: 48px;
            font-size: 1rem;
            font-weight: 600;
        }

        .navigation-hint {
            padding: 1rem;
            border-radius: 1rem;
        }

        .hint-text {
            font-size: 0.875rem;
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
        }

        .zoom-modal {
            padding: 0.5rem;
        }

        .zoom-content {
            max-width: 95vw;
            max-height: 95vh;
            border-radius: 1rem;
        }

        .zoom-close {
            width: 3rem;
            height: 3rem;
            /* Larger close button for mobile */
        }

        .zoom-image {
            max-height: 70vh;
        }

        .overlay-wrapper {
            max-width: 100%;
            border-radius: 1rem;
        }

        .overlay-controls {
            padding: 0 0.5rem;
        }

        .overlay-label {
            font-size: 0.875rem;
            font-weight: 600;
        }
    }

    /* Small mobile devices */
    @media (max-width: 480px) {
        .simulation-results {
            padding: 0.75rem;
        }

        .results-title {
            font-size: 1.25rem;
        }

        .results-subtitle {
            font-size: 0.875rem;
        }

        .comparison-controls {
            padding: 0.75rem;
            gap: 0.75rem;
        }

        .toggle-button {
            padding: 0.5rem 0.75rem;
            font-size: 0.75rem;
        }

        .image-comparison-grid {
            gap: 1rem;
        }

        .action-buttons {
            gap: 0.75rem;
        }

        .action-button {
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
        }

        .navigation-hint {
            padding: 0.75rem;
        }

        .hint-text {
            font-size: 0.75rem;
        }
    }

    /* Tablet Responsive Design */
    @media (max-width: 1024px) and (min-width: 769px) {
        .simulation-results {
            padding: 1.5rem;
            max-width: 900px;
            margin: 0 auto;
        }

        .image-comparison-grid {
            gap: 2rem;
        }

        .action-buttons {
            flex-direction: row;
            justify-content: center;
            gap: 1.5rem;
        }

        .action-button {
            min-width: 200px;
            width: auto;
        }

        .comparison-controls {
            flex-direction: row;
            justify-content: center;
            gap: 2rem;
        }

        .toggle-buttons {
            width: auto;
        }

        .opacity-slider {
            width: 200px;
        }
    }

    /* Large tablet and small desktop */
    @media (min-width: 1025px) and (max-width: 1280px) {
        .simulation-results {
            max-width: 1100px;
            padding: 2rem;
        }

        .image-comparison-grid {
            gap: 2.5rem;
        }

        .action-buttons {
            gap: 2rem;
        }
    }

    /* Dark Mode Support */
    :global([data-theme="dark"]) .results-title {
        color: #f9fafb;
    }

    :global([data-theme="dark"]) .results-subtitle {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .comparison-controls {
        background: #374151;
    }

    :global([data-theme="dark"]) .control-label {
        color: #f3f4f6;
    }

    :global([data-theme="dark"]) .toggle-buttons {
        background: #4b5563;
    }

    :global([data-theme="dark"]) .toggle-button {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .toggle-button:hover:not(.active) {
        background: #6b7280;
        color: #f3f4f6;
    }

    :global([data-theme="dark"]) .image-container {
        background: #374151;
    }

    :global([data-theme="dark"]) .image-header {
        background: #4b5563;
        border-bottom-color: #6b7280;
    }

    :global([data-theme="dark"]) .image-title {
        color: #f3f4f6;
    }

    :global([data-theme="dark"]) .zoom-button {
        background: #6b7280;
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .zoom-button:hover {
        background: #9ca3af;
        color: #f3f4f6;
    }

    :global([data-theme="dark"]) .zoom-content {
        background: #374151;
    }

    :global([data-theme="dark"]) .zoom-header {
        background: #4b5563;
        border-bottom-color: #6b7280;
    }

    :global([data-theme="dark"]) .zoom-title {
        color: #f3f4f6;
    }

    :global([data-theme="dark"]) .overlay-label {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .navigation-hint {
        background: #1e3a8a;
        border-color: #3b82f6;
    }

    :global([data-theme="dark"]) .hint-text {
        color: #93c5fd;
    }

    /* Accessibility Improvements */
    @media (prefers-reduced-motion: reduce) {
        .image-container,
        .comparison-image,
        .toggle-button,
        .zoom-button {
            transition: none;
        }

        .image-container:hover {
            transform: none;
        }

        .comparison-image:hover {
            transform: none;
        }
    }

    /* High Contrast Mode */
    @media (prefers-contrast: high) {
        .image-container {
            border: 2px solid #000;
        }

        .toggle-button.active {
            border: 2px solid #fff;
        }

        .zoom-button {
            border: 1px solid #000;
        }
    }

    /* Focus Styles for Accessibility */
    .toggle-button:focus-visible,
    .zoom-button:focus-visible,
    .zoom-close:focus-visible,
    .action-button:focus-visible,
    .image-button:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
    }

    /* Touch-friendly interactions */
    @media (hover: none) and (pointer: coarse) {
        /* Mobile touch devices */
        .toggle-button:active {
            transform: scale(0.98);
        }

        .action-button:active {
            transform: scale(0.98);
        }

        .zoom-button:active {
            transform: scale(0.95);
        }

        .image-button:active .comparison-image {
            transform: scale(1.02);
        }

        /* Remove hover effects on touch devices */
        .image-container:hover {
            transform: none;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .action-button:hover {
            transform: none;
            box-shadow: none;
        }

        .zoom-button:hover {
            background: #e5e7eb;
            color: #6b7280;
        }

        .toggle-button:hover:not(.active) {
            background: transparent;
            color: #6b7280;
        }

        /* Improve touch feedback */
        .toggle-button {
            transition: all 0.1s ease;
        }

        .action-button {
            transition: all 0.1s ease;
        }

        .zoom-button {
            transition: all 0.1s ease;
        }
    }

    /* Landscape mobile optimizations */
    @media (max-height: 600px) and (orientation: landscape) {
        .simulation-results {
            padding: 1rem;
        }

        .results-header {
            margin-bottom: 1rem;
        }

        .results-title {
            font-size: 1.25rem;
        }

        .results-subtitle {
            font-size: 0.875rem;
        }

        .comparison-controls {
            margin-bottom: 1rem;
            padding: 0.75rem;
        }

        .comparison-container {
            margin-bottom: 1rem;
        }

        .image-comparison-grid {
            gap: 1rem;
        }

        .action-buttons {
            gap: 0.75rem;
        }

        .navigation-hint {
            margin-top: 0.75rem;
        }

        /* Optimize zoom modal for landscape */
        .zoom-image {
            max-height: 80vh;
        }

        .zoom-content {
            max-height: 90vh;
        }
    }

    /* Keyboard navigation hints */
    .keyboard-hints {
        text-align: center;
        margin-top: 1rem;
        padding: 0.75rem;
        background: #f8fafc;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
    }

    .keyboard-hint-text {
        font-size: 0.75rem;
        color: #64748b;
        margin: 0;
    }

    @media (max-width: 768px) {
        .keyboard-hints {
            display: none;
        }
    }

    /* Screen reader only content */
    :global(.sr-only) {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    /* Reduced motion support for action buttons */
    @media (prefers-reduced-motion: reduce) {
        .action-button:hover {
            transform: none;
        }

        .image-button:hover .comparison-image {
            transform: none;
        }

        .toggle-button:active,
        .action-button:active,
        .zoom-button:active {
            transform: none;
        }

        .image-button:active .comparison-image {
            transform: none;
        }
    }
</style>
