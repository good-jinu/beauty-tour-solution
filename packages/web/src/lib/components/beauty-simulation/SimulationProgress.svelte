<script lang="ts">
import Spinner from "$lib/components/ui/spinner/spinner.svelte";

interface Props {
	progress: number; // 0-100
	message: string;
	showTips?: boolean;
}

let { progress, message, showTips = true }: Props = $props();

// Progress animation
const progressPercentage = $derived(Math.min(Math.max(progress, 0), 100));

// Tips rotation
const tips = [
	"Our AI analyzes facial features and applies realistic beauty treatment effects based on real-world results.",
	"The simulation uses advanced machine learning to predict how treatments might enhance your natural features.",
	"Each simulation is unique and tailored to your specific facial structure and selected treatment.",
	"The AI considers lighting, angles, and skin tone to create the most accurate simulation possible.",
	"Beauty simulations help you visualize potential results before committing to actual treatments.",
];

let currentTipIndex = $state(0);

// Rotate tips every 3 seconds
if (showTips) {
	setInterval(() => {
		currentTipIndex = (currentTipIndex + 1) % tips.length;
	}, 3000);
}

// Progress stages for visual feedback
const progressStages = $derived.by(() => {
	if (progressPercentage < 25)
		return { stage: 1, label: "Analyzing", color: "#3b82f6" };
	if (progressPercentage < 50)
		return { stage: 2, label: "Processing", color: "#8b5cf6" };
	if (progressPercentage < 75)
		return { stage: 3, label: "Generating", color: "#06b6d4" };
	return { stage: 4, label: "Finalizing", color: "#10b981" };
});

// Animated dots for loading effect
let dotCount = $state(0);
setInterval(() => {
	dotCount = (dotCount + 1) % 4;
}, 500);

const loadingDots = $derived(".".repeat(dotCount));
</script>

<div
    class="simulation-progress-container"
    role="status"
    aria-live="polite"
    aria-label="Beauty simulation progress"
>
    <!-- Main Progress Display -->
    <div class="progress-main">
        <!-- Animated Icon -->
        <div
            class="progress-icon"
            style="border-color: {progressStages.color}"
            aria-hidden="true"
        >
            <Spinner size="lg" />
        </div>

        <!-- Progress Info -->
        <div class="progress-info">
            <h2 id="progress-title" class="progress-title">
                Creating Your Beauty Simulation
            </h2>
            <p class="progress-message" aria-describedby="progress-title">
                {message}{loadingDots}
            </p>

            <!-- Stage Indicator -->
            <div class="stage-indicator">
                <span
                    class="stage-label"
                    style="color: {progressStages.color}"
                    aria-label="Current stage: {progressStages.label}, stage {progressStages.stage} of 4"
                >
                    {progressStages.label} (Stage {progressStages.stage}/4)
                </span>
            </div>
        </div>
    </div>

    <!-- Progress Bar -->
    <div class="progress-bar-container">
        <div
            class="progress-bar"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Simulation progress: {progressPercentage}% complete"
        >
            <div
                class="progress-fill"
                style="width: {progressPercentage}%; background: linear-gradient(90deg, {progressStages.color}, {progressStages.color}aa)"
                aria-hidden="true"
            ></div>
        </div>
        <div class="progress-text" aria-live="polite">
            {progressPercentage}% Complete
        </div>
    </div>

    <!-- Stage Progress Indicators -->
    <div class="stage-progress" role="list" aria-label="Processing stages">
        {#each Array(4) as _, index}
            {@const stageNames = [
                "Analyzing",
                "Processing",
                "Generating",
                "Finalizing",
            ]}
            {@const stageStatus =
                index < progressStages.stage - 1
                    ? "completed"
                    : index === progressStages.stage - 1
                      ? "active"
                      : "pending"}
            <div
                class="stage-dot {stageStatus}"
                role="listitem"
                aria-label="Stage {index + 1}: {stageNames[
                    index
                ]} - {stageStatus}"
            >
                {#if index < progressStages.stage - 1}
                    <svg
                        class="w-3 h-3"
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
                {:else if index === progressStages.stage - 1}
                    <div class="stage-pulse" aria-hidden="true"></div>
                {:else}
                    <span class="stage-number" aria-hidden="true"
                        >{index + 1}</span
                    >
                {/if}
            </div>
            {#if index < 3}
                <div
                    class="stage-connector {index < progressStages.stage - 1
                        ? 'completed'
                        : ''}"
                    aria-hidden="true"
                ></div>
            {/if}
        {/each}
    </div>

    <!-- Tips Section -->
    {#if showTips}
        <div class="tips-section">
            <div class="tip-icon">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clip-rule="evenodd"
                    />
                </svg>
            </div>
            <div class="tip-content">
                <h4 class="tip-title">Did you know?</h4>
                <p class="tip-text">
                    {tips[currentTipIndex]}
                </p>
            </div>
        </div>
    {/if}

    <!-- Estimated Time -->
    <div class="time-estimate">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
        <span
            >Estimated time: {progressPercentage < 50
                ? "30-45"
                : progressPercentage < 80
                  ? "15-30"
                  : "5-15"} seconds</span
        >
    </div>
</div>

<style>
    .simulation-progress-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        max-width: 600px;
        width: 100%;
        padding: 2rem;
        text-align: center;
    }

    .progress-main {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    .progress-icon {
        width: 5rem;
        height: 5rem;
        border-radius: 50%;
        border: 3px solid;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
    }

    .progress-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .progress-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
    }

    .progress-message {
        font-size: 1rem;
        color: #6b7280;
        margin: 0;
        min-height: 1.5rem;
    }

    .stage-indicator {
        margin-top: 0.5rem;
    }

    .stage-label {
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .progress-bar-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        position: relative;
    }

    .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
        position: relative;
        overflow: hidden;
    }

    .progress-fill::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
        );
        animation: shimmer 2s infinite;
    }

    .progress-text {
        font-size: 0.875rem;
        font-weight: 600;
        color: #3b82f6;
    }

    .stage-progress {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 1rem 0;
    }

    .stage-dot {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
        transition: all 0.3s ease;
        background: #e5e7eb;
        color: #6b7280;
        border: 2px solid #e5e7eb;
    }

    .stage-dot.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
        position: relative;
    }

    .stage-dot.completed {
        background: #10b981;
        color: white;
        border-color: #10b981;
    }

    .stage-pulse {
        width: 0.75rem;
        height: 0.75rem;
        background: white;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
    }

    .stage-number {
        font-size: 0.75rem;
        font-weight: 600;
    }

    .stage-connector {
        flex: 1;
        height: 2px;
        background: #e5e7eb;
        transition: background 0.3s ease;
    }

    .stage-connector.completed {
        background: #10b981;
    }

    .tips-section {
        display: flex;
        gap: 1rem;
        padding: 1.5rem;
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 0.75rem;
        text-align: left;
        width: 100%;
        animation: fadeIn 0.5s ease-out;
    }

    .tip-icon {
        flex-shrink: 0;
        width: 2.5rem;
        height: 2.5rem;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .tip-content {
        flex: 1;
    }

    .tip-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #0369a1;
        margin: 0 0 0.5rem 0;
    }

    .tip-text {
        font-size: 0.875rem;
        color: #0369a1;
        margin: 0;
        line-height: 1.5;
        animation: slideIn 0.3s ease-out;
    }

    .time-estimate {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
        padding: 0.75rem 1rem;
        background: #f9fafb;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
    }

    /* Animations */
    @keyframes pulse {
        0%,
        100% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.05);
            opacity: 0.8;
        }
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }

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

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
        .simulation-progress-container {
            padding: 1.5rem;
            gap: 1.5rem;
        }

        .progress-icon {
            width: 4rem;
            height: 4rem;
        }

        .progress-title {
            font-size: 1.25rem;
        }

        .progress-message {
            font-size: 0.875rem;
        }

        .stage-progress {
            gap: 0.25rem;
        }

        .stage-dot {
            width: 1.5rem;
            height: 1.5rem;
            font-size: 0.625rem;
        }

        .tips-section {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
        }

        .tip-icon {
            align-self: center;
        }
    }

    /* Dark Mode Support */
    :global([data-theme="dark"]) .progress-title {
        color: #f9fafb;
    }

    :global([data-theme="dark"]) .progress-message {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .progress-bar {
        background: #374151;
    }

    :global([data-theme="dark"]) .stage-dot {
        background: #374151;
        color: #d1d5db;
        border-color: #374151;
    }

    :global([data-theme="dark"]) .stage-connector {
        background: #374151;
    }

    :global([data-theme="dark"]) .tips-section {
        background: #1e3a8a;
        border-color: #3b82f6;
    }

    :global([data-theme="dark"]) .tip-title {
        color: #93c5fd;
    }

    :global([data-theme="dark"]) .tip-text {
        color: #93c5fd;
    }

    :global([data-theme="dark"]) .time-estimate {
        background: #374151;
        border-color: #4b5563;
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .progress-icon {
        background: rgba(0, 0, 0, 0.2);
    }

    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
        .progress-icon,
        .stage-pulse,
        .progress-fill::after,
        .tip-text {
            animation: none;
        }

        .progress-fill,
        .stage-dot,
        .stage-connector {
            transition: none;
        }
    }

    /* High Contrast Mode */
    @media (prefers-contrast: high) {
        .progress-bar {
            border: 1px solid #000;
        }

        .stage-dot {
            border-width: 3px;
        }

        .tips-section {
            border-width: 2px;
        }
    }
</style>
