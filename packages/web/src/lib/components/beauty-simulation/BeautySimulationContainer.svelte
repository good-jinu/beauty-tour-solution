<script lang="ts">
import { onMount } from "svelte";
import { toast } from "svelte-sonner";
import ImageUpload from "$lib/components/form/ImageUpload.svelte";
import Button from "$lib/components/ui/button/button.svelte";
import Spinner from "$lib/components/ui/spinner/spinner.svelte";
import {
	type BeautySimulationState,
	BeautySimulationUtils,
	BeautySimulationValidation,
	beautySimulationState,
} from "$lib/stores/beauty-simulation.js";
import SimulationErrorRecovery from "./SimulationErrorRecovery.svelte";
import SimulationProgress from "./SimulationProgress.svelte";
import SimulationResults from "./SimulationResults.svelte";
import ThemeSelector from "./ThemeSelector.svelte";

// Props for container configuration
interface Props {
	onComplete?: (data: {
		theme: string;
		originalImage: string;
		simulatedImage: string;
	}) => void;
	onStepChange?: (step: SimulationStep) => void;
	showSkipOption?: boolean;
	className?: string;
}

let {
	onComplete,
	onStepChange,
	showSkipOption = true,
	className = "",
}: Props = $props();

// Simulation flow steps
type SimulationStep =
	| "upload"
	| "theme-selection"
	| "generating"
	| "results"
	| "error";

// Local state for flow management
let currentStep: SimulationStep = $state("upload");
let simulationProgress = $state(0);
let retryCount = $state(0);
const maxRetries = 3;

// Step validation
const canProceedFromUpload = $derived(
	$beautySimulationState.uploadedImage &&
		$beautySimulationState.imagePreview &&
		!$beautySimulationState.error,
);

const canProceedFromTheme = $derived(
	canProceedFromUpload &&
		$beautySimulationState.selectedTheme &&
		BeautySimulationValidation.canStartSimulation($beautySimulationState),
);

const isGenerating = $derived($beautySimulationState.isGenerating);
const hasResults = $derived($beautySimulationState.simulationResult !== null);
const hasError = $derived($beautySimulationState.error !== null);

// Step management functions
function goToStep(step: SimulationStep) {
	currentStep = step;
	onStepChange?.(step);
}

function nextStep() {
	switch (currentStep) {
		case "upload":
			if (canProceedFromUpload) {
				goToStep("theme-selection");
			} else {
				toast.error("Please upload a valid image first");
			}
			break;
		case "theme-selection":
			if (canProceedFromTheme) {
				startSimulation();
			} else {
				toast.error("Please select a beauty treatment theme");
			}
			break;
		case "generating":
			// Cannot manually proceed from generating step
			break;
		case "results":
			// Results step is terminal - use action buttons
			break;
		case "error":
			// Error step requires retry or reset
			break;
	}
}

function previousStep() {
	switch (currentStep) {
		case "theme-selection":
			goToStep("upload");
			break;
		case "generating":
			goToStep("theme-selection");
			break;
		case "results":
			goToStep("theme-selection");
			break;
		case "error":
			goToStep("theme-selection");
			break;
		default:
			// Cannot go back from upload step
			break;
	}
}

// Simulation API call
async function startSimulation() {
	if (!canProceedFromTheme) {
		toast.error("Please complete all required fields");
		return;
	}

	try {
		goToStep("generating");
		BeautySimulationUtils.setGenerating(true);
		simulationProgress = 0;

		// Simulate progress updates
		const progressInterval = setInterval(() => {
			simulationProgress = Math.min(
				simulationProgress + Math.random() * 15,
				90,
			);
		}, 500);

		// Prepare request data
		const requestData = {
			image: $beautySimulationState.imagePreview!, // base64 image
			theme: $beautySimulationState.selectedTheme!,
			imageFormat: $beautySimulationState.uploadedImage!.type.split("/")[1] as
				| "jpeg"
				| "png"
				| "webp",
		};

		// Make API call
		const response = await fetch("/api/simulate-beauty", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(requestData),
		});

		clearInterval(progressInterval);
		simulationProgress = 100;

		if (!response.ok) {
			const errorData = await response
				.json()
				.catch(() => ({ error: "Unknown error occurred" }));
			throw new Error(
				errorData.error || `HTTP ${response.status}: ${response.statusText}`,
			);
		}

		const result = await response.json();

		if (!result.success) {
			throw new Error(result.error || "Simulation failed");
		}

		// Update state with results
		BeautySimulationUtils.setSimulationResult(result.simulatedImage);

		// Move to results step
		goToStep("results");

		// Call completion callback
		onComplete?.({
			theme: $beautySimulationState.selectedTheme!,
			originalImage: $beautySimulationState.imagePreview!,
			simulatedImage: result.simulatedImage,
		});

		toast.success("Beauty simulation completed successfully!");
		retryCount = 0; // Reset retry count on success
	} catch (error) {
		console.error("Simulation error:", error);

		const errorMessage =
			error instanceof Error ? error.message : "An unexpected error occurred";
		BeautySimulationUtils.setError(errorMessage);

		goToStep("error");
		toast.error(`Simulation failed: ${errorMessage}`);
	}
}

// Retry simulation with exponential backoff
async function retrySimulation() {
	if (retryCount >= maxRetries) {
		toast.error(
			`Maximum retry attempts (${maxRetries}) reached. Please try again later.`,
		);
		return;
	}

	retryCount++;

	// Exponential backoff delay
	const delay = 2 ** (retryCount - 1) * 1000; // 1s, 2s, 4s

	toast.info(`Retrying simulation (attempt ${retryCount}/${maxRetries})...`);

	// Clear error state
	BeautySimulationUtils.clearError();

	// Wait for backoff delay
	await new Promise((resolve) => setTimeout(resolve, delay));

	// Retry the simulation
	await startSimulation();
}

// Reset simulation to start over
function resetSimulation() {
	BeautySimulationUtils.resetSimulation();
	goToStep("upload");
	retryCount = 0;
	simulationProgress = 0;
	toast.info("Simulation reset. You can start over with a new image.");
}

// Skip simulation and go directly to journey planning
function skipSimulation() {
	toast.info("Skipping beauty simulation. Proceeding to journey planning.");
	// This would typically navigate to the main stepper
	// For now, we'll just emit an event
	onComplete?.({
		theme: "",
		originalImage: "",
		simulatedImage: "",
	});
}

// Handle image upload
function handleImageUpload(file: File, preview: string) {
	BeautySimulationUtils.setImage(file, preview);
	// Note: Removed auto-advance - users now control navigation with Next button
}

// Handle theme selection
function handleThemeSelect(theme: string | null) {
	BeautySimulationUtils.setTheme(theme);
}

// Handle error recovery
function handleErrorRecovery() {
	BeautySimulationUtils.clearError();
	goToStep("theme-selection");
}

// Handle results actions
function handlePlanJourney() {
	if (hasResults) {
		onComplete?.({
			theme: $beautySimulationState.selectedTheme!,
			originalImage: $beautySimulationState.imagePreview!,
			simulatedImage: $beautySimulationState.simulationResult!,
		});
	}
}

function handleTryAgain() {
	// Reset simulation result but keep image and theme
	beautySimulationState.update((s) => ({
		...s,
		simulationResult: null,
		error: null,
		isGenerating: false,
	}));

	goToStep("theme-selection");
	toast.info("Ready for a new simulation!");
}

// Keyboard navigation support
function handleKeydown(event: KeyboardEvent) {
	// Only handle keyboard navigation if not in an input field
	if (
		event.target instanceof HTMLInputElement ||
		event.target instanceof HTMLTextAreaElement
	) {
		return;
	}

	switch (event.key) {
		case "ArrowRight":
		case "ArrowDown":
			event.preventDefault();
			if (currentStep === "upload" && canProceedFromUpload) {
				goToStep("theme-selection");
				announceStepChange("Moved to theme selection step");
			} else if (currentStep === "theme-selection" && canProceedFromTheme) {
				nextStep();
			}
			break;
		case "ArrowLeft":
		case "ArrowUp":
			event.preventDefault();
			if (currentStep === "theme-selection") {
				goToStep("upload");
				announceStepChange("Moved to upload photo step");
			} else if (currentStep === "results" || currentStep === "error") {
				previousStep();
			}
			break;
		case "Enter":
		case " ":
			// Let buttons handle their own enter/space events
			break;
		case "Escape":
			if (currentStep === "generating") {
				// Could add cancel functionality here
			}
			break;
	}
}

// Screen reader announcements
function announceStepChange(message: string) {
	// Create a temporary element for screen reader announcements
	const announcement = document.createElement("div");
	announcement.setAttribute("aria-live", "polite");
	announcement.setAttribute("aria-atomic", "true");
	announcement.className = "sr-only";
	announcement.textContent = message;
	document.body.appendChild(announcement);

	// Remove after announcement
	setTimeout(() => {
		document.body.removeChild(announcement);
	}, 1000);
}

// Initialize component
onMount(() => {
	// Determine initial step based on current state
	if (hasResults) {
		goToStep("results");
	} else if (hasError) {
		goToStep("error");
	} else if (isGenerating) {
		goToStep("generating");
	} else if ($beautySimulationState.selectedTheme && canProceedFromUpload) {
		goToStep("theme-selection");
	} else if (canProceedFromUpload) {
		goToStep("theme-selection");
	} else {
		goToStep("upload");
	}

	// Add keyboard event listener
	document.addEventListener("keydown", handleKeydown);

	return () => {
		document.removeEventListener("keydown", handleKeydown);
	};
});

// Progress calculation for generating step
const progressPercentage = $derived(Math.round(simulationProgress));
const progressMessage = $derived.by(() => {
	if (simulationProgress < 30) return "Analyzing your photo...";
	if (simulationProgress < 60) return "Applying beauty treatment simulation...";
	if (simulationProgress < 90) return "Generating final result...";
	return "Almost done...";
});
</script>

<div
    class="beauty-simulation-container {className}"
    id="beauty-simulation"
    role="region"
    aria-label="Beauty Simulation Workflow"
    aria-live="polite"
    aria-describedby="simulation-description"
>
    <!-- Skip link for keyboard navigation -->
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <!-- Progress Indicator -->
    <div
        class="simulation-progress"
        role="progressbar"
        aria-label="Simulation progress"
    >
        <div class="progress-steps" role="list" aria-label="Simulation steps">
            <div
                class="step {currentStep === 'upload'
                    ? 'active'
                    : canProceedFromUpload
                      ? 'completed'
                      : ''}"
                role="listitem"
                aria-current={currentStep === "upload" ? "step" : undefined}
            >
                <div
                    class="step-icon"
                    aria-label={canProceedFromUpload
                        ? "Step 1 completed: Upload Photo"
                        : "Step 1: Upload Photo"}
                >
                    {#if canProceedFromUpload}
                        <svg
                            class="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    {:else}
                        <span aria-hidden="true">1</span>
                    {/if}
                </div>
                <span class="step-label">Upload Photo</span>
            </div>

            <div
                class="step-connector {canProceedFromUpload ? 'completed' : ''}"
                aria-hidden="true"
            ></div>

            <div
                class="step {currentStep === 'theme-selection'
                    ? 'active'
                    : canProceedFromTheme
                      ? 'completed'
                      : ''}"
                role="listitem"
                aria-current={currentStep === "theme-selection"
                    ? "step"
                    : undefined}
            >
                <div
                    class="step-icon"
                    aria-label={canProceedFromTheme
                        ? "Step 2 completed: Select Theme"
                        : "Step 2: Select Theme"}
                >
                    {#if canProceedFromTheme}
                        <svg
                            class="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    {:else}
                        <span aria-hidden="true">2</span>
                    {/if}
                </div>
                <span class="step-label">Select Theme</span>
            </div>

            <div
                class="step-connector {hasResults ? 'completed' : ''}"
                aria-hidden="true"
            ></div>

            <div
                class="step {currentStep === 'generating'
                    ? 'active'
                    : hasResults
                      ? 'completed'
                      : ''}"
                role="listitem"
                aria-current={currentStep === "generating" ? "step" : undefined}
            >
                <div
                    class="step-icon"
                    aria-label={hasResults
                        ? "Step 3 completed: Generate"
                        : currentStep === "generating"
                          ? "Step 3 in progress: Generate"
                          : "Step 3: Generate"}
                >
                    {#if hasResults}
                        <svg
                            class="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                            />
                        </svg>
                    {:else if currentStep === "generating"}
                        <Spinner size="sm" aria-label="Generating simulation" />
                    {:else}
                        <span aria-hidden="true">3</span>
                    {/if}
                </div>
                <span class="step-label">Generate</span>
            </div>
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="simulation-content" id="main-content">
        {#if currentStep === "upload"}
            <!-- Step 1: Image Upload -->
            <div
                class="step-content"
                role="main"
                aria-labelledby="upload-title"
            >
                <div class="step-header">
                    <h2 id="upload-title" class="step-title">
                        Upload Your Photo
                    </h2>
                    <p id="simulation-description" class="step-description">
                        Start by uploading a clear photo of yourself to see how
                        different beauty treatments might look.
                    </p>
                </div>

                <ImageUpload
                    bind:uploadedImage={$beautySimulationState.uploadedImage}
                    bind:imagePreview={$beautySimulationState.imagePreview}
                    errors={$beautySimulationState.error
                        ? { image: $beautySimulationState.error }
                        : {}}
                    maxSize={10}
                    acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                    enableCamera={true}
                />

                <div
                    class="step-actions"
                    role="group"
                    aria-label="Navigation actions"
                >
                    <Button
                        onclick={nextStep}
                        disabled={!canProceedFromUpload}
                        class="next-button"
                        aria-label={canProceedFromUpload
                            ? "Proceed to theme selection"
                            : "Please upload a valid image first"}
                    >
                        <span>Next: Choose Treatment</span>
                        <svg
                            class="w-4 h-4 ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 5l7 7-7 7"
                            />
                        </svg>
                    </Button>
                </div>

                {#if showSkipOption}
                    <div class="skip-option">
                        <Button variant="ghost" onclick={skipSimulation}>
                            Skip simulation and plan journey directly
                        </Button>
                    </div>
                {/if}

                <div class="keyboard-hint">
                    <p>Tip: Use arrow keys to navigate between steps</p>
                </div>
            </div>
        {:else if currentStep === "theme-selection"}
            <!-- Step 2: Theme Selection -->
            <div class="step-content" role="main" aria-labelledby="theme-title">
                <div class="step-header">
                    <h2 id="theme-title" class="step-title">
                        Choose Your Treatment
                    </h2>
                    <p class="step-description">
                        Select the beauty treatment you'd like to simulate on
                        your photo.
                    </p>
                </div>

                <ThemeSelector
                    bind:selectedTheme={$beautySimulationState.selectedTheme}
                    onThemeSelect={handleThemeSelect}
                    disabled={isGenerating}
                    showValidation={true}
                />

                <div
                    class="step-actions"
                    role="group"
                    aria-label="Navigation actions"
                >
                    <Button
                        variant="outline"
                        onclick={previousStep}
                        aria-label="Go back to upload photo step"
                    >
                        <svg
                            class="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back to Upload
                    </Button>

                    <Button
                        onclick={nextStep}
                        disabled={!canProceedFromTheme || isGenerating}
                        class="generate-button"
                        aria-label={isGenerating
                            ? "Generating beauty simulation, please wait"
                            : "Generate beauty simulation with selected theme"}
                        aria-describedby={!canProceedFromTheme
                            ? "theme-error"
                            : undefined}
                    >
                        {#if isGenerating}
                            <Spinner
                                size="sm"
                                class="mr-2"
                                aria-hidden="true"
                            />
                            Generating...
                        {:else}
                            <svg
                                class="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                            </svg>
                            Generate Simulation
                        {/if}
                    </Button>
                </div>
            </div>
        {:else if currentStep === "generating"}
            <!-- Step 3: Generating Simulation -->
            <div class="step-content generating">
                <SimulationProgress
                    progress={simulationProgress}
                    message={progressMessage}
                    showTips={true}
                />
            </div>
        {:else if currentStep === "results"}
            <!-- Step 4: Results Display -->
            <div class="step-content">
                <SimulationResults
                    originalImage={$beautySimulationState.imagePreview!}
                    simulatedImage={$beautySimulationState.simulationResult!}
                    selectedTheme={$beautySimulationState.selectedTheme!}
                    onPlanJourney={handlePlanJourney}
                    onTryAgain={handleTryAgain}
                />
            </div>
        {:else if currentStep === "error"}
            <!-- Error State -->
            <div class="step-content error">
                <SimulationErrorRecovery
                    error={$beautySimulationState.error ||
                        "An unknown error occurred"}
                    {retryCount}
                    {maxRetries}
                    onRetry={retrySimulation}
                    onReset={resetSimulation}
                    onSkip={skipSimulation}
                    {showSkipOption}
                />
            </div>
        {/if}
    </div>
</div>

<style>
    .beauty-simulation-container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    /* Progress Indicator */
    .simulation-progress {
        width: 100%;
        margin-bottom: 2rem;
    }

    .progress-steps {
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 600px;
        margin: 0 auto;
    }

    .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        position: relative;
    }

    .step-icon {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        transition: all 0.3s ease;
        background: #e5e7eb;
        color: #6b7280;
        border: 2px solid #e5e7eb;
    }

    .step.active .step-icon {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }

    .step.completed .step-icon {
        background: #10b981;
        color: white;
        border-color: #10b981;
    }

    .step-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        text-align: center;
        transition: color 0.3s ease;
    }

    .step.active .step-label {
        color: #3b82f6;
        font-weight: 600;
    }

    .step.completed .step-label {
        color: #10b981;
    }

    .step-connector {
        flex: 1;
        height: 2px;
        background: #e5e7eb;
        margin: 0 1rem;
        transition: background 0.3s ease;
    }

    .step-connector.completed {
        background: #10b981;
    }

    /* Main Content */
    .simulation-content {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .step-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        animation: fadeIn 0.3s ease-out;
    }

    .step-header {
        text-align: center;
        max-width: 600px;
        margin: 0 auto;
    }

    .step-title {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }

    .step-description {
        font-size: 1.125rem;
        color: #6b7280;
        line-height: 1.6;
    }

    .step-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin-top: 2rem;
    }

    .generate-button {
        min-width: 200px;
    }

    .next-button {
        min-width: 200px;
    }

    .skip-option {
        text-align: center;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e5e7eb;
    }

    /* Generating State */
    .step-content.generating {
        justify-content: center;
        align-items: center;
        text-align: center;
        min-height: 400px;
    }

    .generating-content {
        max-width: 500px;
        width: 100%;
    }

    .generating-icon {
        margin-bottom: 2rem;
        display: flex;
        justify-content: center;
    }

    .generating-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }

    .generating-description {
        font-size: 1rem;
        color: #6b7280;
        margin-bottom: 2rem;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 1rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        border-radius: 4px;
        transition: width 0.3s ease;
        animation: shimmer 2s infinite;
    }

    .progress-text {
        font-size: 0.875rem;
        font-weight: 600;
        color: #3b82f6;
        margin-bottom: 2rem;
    }

    /* Error State */
    .step-content.error {
        justify-content: center;
        align-items: center;
        text-align: center;
        min-height: 400px;
    }

    .error-content {
        max-width: 500px;
        width: 100%;
    }

    .error-icon {
        margin-bottom: 1.5rem;
        display: flex;
        justify-content: center;
    }

    .error-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #dc2626;
        margin-bottom: 0.5rem;
    }

    .error-description {
        font-size: 1rem;
        color: #6b7280;
        margin-bottom: 2rem;
    }

    .error-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .retry-button {
        background: #dc2626;
        border-color: #dc2626;
    }

    .retry-button:hover {
        background: #b91c1c;
        border-color: #b91c1c;
    }

    /* Animations */
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes shimmer {
        0% {
            background-position: -200px 0;
        }
        100% {
            background-position: calc(200px + 100%) 0;
        }
    }

    /* Mobile Responsive Design */
    @media (max-width: 768px) {
        .beauty-simulation-container {
            padding: 1rem;
            gap: 1.5rem;
            min-height: 100vh;
        }

        .step-title {
            font-size: 1.5rem;
            line-height: 1.3;
        }

        .step-description {
            font-size: 1rem;
            line-height: 1.5;
        }

        .progress-steps {
            max-width: 100%;
            padding: 0 0.5rem;
        }

        .step-icon {
            width: 2.5rem;
            height: 2.5rem;
            font-size: 0.875rem;
            /* Larger touch targets for mobile */
        }

        .step-label {
            font-size: 0.75rem;
            font-weight: 600;
            /* Better readability on mobile */
        }

        .step-connector {
            margin: 0 0.75rem;
            height: 3px;
            /* Thicker connectors for mobile visibility */
        }

        .step-actions {
            flex-direction: column;
            gap: 1rem;
            padding: 0 0.5rem;
        }

        .generate-button,
        .next-button {
            min-width: unset;
            width: 100%;
            min-height: 48px;
            /* Minimum touch target size */
            font-size: 1rem;
            font-weight: 600;
        }

        .generating-title {
            font-size: 1.25rem;
            line-height: 1.4;
        }

        .error-title {
            font-size: 1.25rem;
            line-height: 1.4;
        }

        .error-actions {
            gap: 1rem;
        }

        .step-content {
            gap: 1.5rem;
        }

        .step-header {
            padding: 0 0.5rem;
        }

        /* Optimize progress indicator for mobile */
        .simulation-progress {
            margin-bottom: 1.5rem;
        }

        /* Better spacing for mobile content */
        .skip-option {
            margin-top: 1.5rem;
            padding-top: 1.5rem;
        }
    }

    /* Small mobile devices (max-width: 480px) */
    @media (max-width: 480px) {
        .beauty-simulation-container {
            padding: 0.75rem;
            gap: 1rem;
        }

        .step-title {
            font-size: 1.25rem;
        }

        .step-description {
            font-size: 0.875rem;
        }

        .step-icon {
            width: 2rem;
            height: 2rem;
            font-size: 0.75rem;
        }

        .step-label {
            font-size: 0.625rem;
            max-width: 60px;
            text-align: center;
            line-height: 1.2;
        }

        .step-connector {
            margin: 0 0.5rem;
        }

        .progress-steps {
            padding: 0 0.25rem;
        }

        .step-header {
            padding: 0 0.25rem;
        }

        .step-actions {
            padding: 0 0.25rem;
        }
    }

    /* Tablet Responsive Design */
    @media (max-width: 1024px) and (min-width: 769px) {
        .beauty-simulation-container {
            padding: 1.5rem;
            max-width: 800px;
        }

        .step-actions {
            gap: 1rem;
            flex-direction: row;
            justify-content: center;
        }

        .generate-button,
        .next-button {
            min-width: 220px;
        }

        .step-icon {
            width: 2.75rem;
            height: 2.75rem;
        }

        .step-label {
            font-size: 0.875rem;
        }

        .step-connector {
            margin: 0 1rem;
        }
    }

    /* Large tablet and small desktop */
    @media (min-width: 1025px) and (max-width: 1280px) {
        .beauty-simulation-container {
            max-width: 1000px;
            padding: 2rem;
        }

        .progress-steps {
            max-width: 700px;
        }

        .step-header {
            max-width: 700px;
        }
    }

    /* Dark Mode Support */
    :global([data-theme="dark"]) .step-title {
        color: #f9fafb;
    }

    :global([data-theme="dark"]) .step-description {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .generating-title {
        color: #f9fafb;
    }

    :global([data-theme="dark"]) .generating-description {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .skip-option {
        border-top-color: #374151;
    }

    :global([data-theme="dark"]) .step-icon {
        background: #374151;
        color: #d1d5db;
        border-color: #374151;
    }

    :global([data-theme="dark"]) .step-label {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .step-connector {
        background: #374151;
    }

    :global([data-theme="dark"]) .progress-bar {
        background: #374151;
    }

    /* Accessibility Improvements */
    @media (prefers-reduced-motion: reduce) {
        .step-content,
        .step-icon,
        .step-label,
        .step-connector,
        .progress-fill {
            animation: none;
            transition: none;
        }
    }

    /* High Contrast Mode */
    @media (prefers-contrast: high) {
        .step-icon {
            border-width: 3px;
        }

        .step.active .step-icon {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2);
        }

        .progress-bar {
            border: 1px solid #000;
        }
    }

    /* Touch-friendly interactions */
    @media (hover: none) and (pointer: coarse) {
        /* Mobile touch devices */
        .step-icon {
            transition: transform 0.1s ease;
        }

        .step-icon:active {
            transform: scale(0.95);
        }

        .generate-button:active,
        .next-button:active {
            transform: scale(0.98);
        }

        /* Increase touch targets */
        .step {
            padding: 0.5rem;
            margin: -0.5rem;
            border-radius: 0.5rem;
        }

        /* Remove hover effects on touch devices */
        .step.active .step-icon {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }
    }

    /* Landscape mobile optimizations */
    @media (max-height: 600px) and (orientation: landscape) {
        .beauty-simulation-container {
            padding: 1rem;
            gap: 1rem;
            min-height: auto;
        }

        .simulation-progress {
            margin-bottom: 1rem;
        }

        .step-content {
            gap: 1rem;
        }

        .step-title {
            font-size: 1.25rem;
        }

        .step-description {
            font-size: 0.875rem;
        }

        .step-actions {
            gap: 0.75rem;
        }

        .skip-option {
            margin-top: 1rem;
            padding-top: 1rem;
        }

        /* Compact progress steps for landscape */
        .progress-steps {
            gap: 0.5rem;
        }

        .step-icon {
            width: 2rem;
            height: 2rem;
            font-size: 0.75rem;
        }

        .step-label {
            font-size: 0.625rem;
        }

        .step-connector {
            margin: 0 0.5rem;
        }
    }

    /* Focus Styles for Accessibility */
    .generate-button:focus-visible,
    .next-button:focus-visible,
    .retry-button:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
    }

    /* Improve button accessibility on mobile */
    @media (max-width: 768px) {
        .generate-button:focus-visible,
        .next-button:focus-visible,
        .retry-button:focus-visible {
            outline-width: 3px;
            outline-offset: 3px;
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

    /* Skip link for keyboard navigation */
    .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 1000;
        transition: top 0.3s;
    }

    .skip-link:focus {
        top: 6px;
    }

    /* Keyboard navigation hints */
    .keyboard-hint {
        font-size: 0.75rem;
        color: hsl(var(--muted-foreground));
        margin-top: 0.5rem;
        text-align: center;
    }

    @media (max-width: 768px) {
        .keyboard-hint {
            display: none;
        }
    }
</style>
