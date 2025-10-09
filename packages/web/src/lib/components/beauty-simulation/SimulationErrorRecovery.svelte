<script lang="ts">
import { toast } from "svelte-sonner";
import Button from "$lib/components/ui/button/button.svelte";

interface Props {
	error: string;
	retryCount: number;
	maxRetries: number;
	onRetry: () => Promise<void>;
	onReset: () => void;
	onSkip: () => void;
	showSkipOption?: boolean;
}

let {
	error,
	retryCount,
	maxRetries,
	onRetry,
	onReset,
	onSkip,
	showSkipOption = true,
}: Props = $props();

// Error categorization for better recovery suggestions
const errorCategory = $derived.by(() => {
	const errorLower = error.toLowerCase();

	if (
		errorLower.includes("network") ||
		errorLower.includes("connection") ||
		errorLower.includes("timeout")
	) {
		return "network";
	}
	if (
		errorLower.includes("image") ||
		errorLower.includes("format") ||
		errorLower.includes("size")
	) {
		return "image";
	}
	if (
		errorLower.includes("rate limit") ||
		errorLower.includes("quota") ||
		errorLower.includes("429")
	) {
		return "rate-limit";
	}
	if (
		errorLower.includes("server") ||
		errorLower.includes("500") ||
		errorLower.includes("503")
	) {
		return "server";
	}
	if (
		errorLower.includes("unauthorized") ||
		errorLower.includes("403") ||
		errorLower.includes("401")
	) {
		return "auth";
	}
	return "unknown";
});

// Recovery suggestions based on error type
const recoverySuggestions = $derived.by(() => {
	switch (errorCategory) {
		case "network":
			return {
				title: "Network Connection Issue",
				suggestions: [
					"Check your internet connection",
					"Try switching to a different network",
					"Disable VPN if you're using one",
					"Wait a moment and try again",
				],
				canRetry: true,
				priority: "high",
			};
		case "image":
			return {
				title: "Image Processing Issue",
				suggestions: [
					"Try uploading a different image",
					"Ensure the image is clear and well-lit",
					"Use JPEG or PNG format",
					"Make sure the image is under 10MB",
				],
				canRetry: false,
				priority: "high",
			};
		case "rate-limit":
			return {
				title: "Too Many Requests",
				suggestions: [
					"Wait a few minutes before trying again",
					"The service is temporarily busy",
					"Try again during off-peak hours",
				],
				canRetry: true,
				priority: "medium",
			};
		case "server":
			return {
				title: "Service Temporarily Unavailable",
				suggestions: [
					"The service is experiencing issues",
					"Try again in a few minutes",
					"Check our status page for updates",
				],
				canRetry: true,
				priority: "medium",
			};
		case "auth":
			return {
				title: "Authentication Issue",
				suggestions: [
					"Please refresh the page",
					"Clear your browser cache",
					"Try logging out and back in",
				],
				canRetry: false,
				priority: "high",
			};
		default:
			return {
				title: "Unexpected Error",
				suggestions: [
					"Try refreshing the page",
					"Check your internet connection",
					"Contact support if the issue persists",
				],
				canRetry: true,
				priority: "medium",
			};
	}
});

// Retry delay calculation (exponential backoff)
const nextRetryDelay = $derived.by(() => {
	if (retryCount >= maxRetries) return 0;
	return 2 ** retryCount * 1000; // 1s, 2s, 4s, 8s...
});

const canRetry = $derived(
	retryCount < maxRetries && recoverySuggestions.canRetry,
);

let isRetrying = $state(false);

async function handleRetry() {
	if (!canRetry || isRetrying) return;

	isRetrying = true;

	try {
		// Show retry delay if applicable
		if (nextRetryDelay > 1000) {
			toast.info(`Retrying in ${Math.ceil(nextRetryDelay / 1000)} seconds...`);
			await new Promise((resolve) => setTimeout(resolve, nextRetryDelay));
		}

		await onRetry();
	} catch (error) {
		console.error("Retry failed:", error);
	} finally {
		isRetrying = false;
	}
}

function handleReset() {
	onReset();
	toast.info("Simulation reset. You can start over with a new image.");
}

function handleSkip() {
	onSkip();
	toast.info("Skipping beauty simulation. Proceeding to journey planning.");
}

// Get icon for error category
function getErrorIcon(category: string) {
	switch (category) {
		case "network":
			return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>`;
		case "image":
			return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>`;
		case "rate-limit":
			return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>`;
		case "server":
			return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>`;
		case "auth":
			return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>`;
		default:
			return `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>`;
	}
}
</script>

<div
    class="error-recovery-container"
    role="alert"
    aria-labelledby="error-title"
    aria-describedby="error-message"
>
    <!-- Error Header -->
    <div class="error-header">
        <div class="error-icon-wrapper" aria-hidden="true">
            <svg
                class="error-icon {errorCategory}"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                {@html getErrorIcon(errorCategory)}
            </svg>
        </div>

        <div class="error-info">
            <h3 id="error-title" class="error-title">
                {recoverySuggestions.title}
            </h3>
            <p id="error-message" class="error-message">{error}</p>
        </div>
    </div>

    <!-- Recovery Suggestions -->
    <div
        class="recovery-suggestions"
        role="region"
        aria-labelledby="suggestions-title"
    >
        <h4 id="suggestions-title" class="suggestions-title">
            What you can try:
        </h4>
        <ul class="suggestions-list" role="list">
            {#each recoverySuggestions.suggestions as suggestion, index}
                <li
                    class="suggestion-item"
                    role="listitem"
                    aria-label="Suggestion {index + 1}: {suggestion}"
                >
                    {suggestion}
                </li>
            {/each}
        </ul>
    </div>

    <!-- Retry Information -->
    {#if canRetry}
        <div class="retry-info">
            <div class="retry-status">
                <span class="retry-count"
                    >Attempt {retryCount + 1} of {maxRetries}</span
                >
                {#if nextRetryDelay > 1000}
                    <span class="retry-delay"
                        >Next retry in {Math.ceil(nextRetryDelay / 1000)}s</span
                    >
                {/if}
            </div>

            {#if retryCount > 0}
                <div class="retry-progress">
                    <div class="retry-progress-bar">
                        <div
                            class="retry-progress-fill"
                            style="width: {(retryCount / maxRetries) * 100}%"
                        ></div>
                    </div>
                </div>
            {/if}
        </div>
    {:else if retryCount >= maxRetries}
        <div class="max-retries-reached">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fill-rule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                />
            </svg>
            <span>Maximum retry attempts reached</span>
        </div>
    {/if}

    <!-- Action Buttons -->
    <div class="recovery-actions" role="group" aria-label="Recovery actions">
        {#if canRetry}
            <Button
                onclick={handleRetry}
                disabled={isRetrying}
                class="retry-button"
                size="lg"
                aria-label={isRetrying
                    ? "Retrying simulation, please wait"
                    : `Try again - attempt ${retryCount + 1} of ${maxRetries}`}
            >
                {#if isRetrying}
                    <svg
                        class="w-4 h-4 mr-2 animate-spin"
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
                    Retrying...
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                    Try Again ({retryCount + 1}/{maxRetries})
                {/if}
            </Button>
        {/if}

        <Button
            variant="outline"
            onclick={handleReset}
            size="lg"
            aria-label="Start over with a new image and theme selection"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
            </svg>
            Start Over
        </Button>

        {#if showSkipOption}
            <Button
                variant="ghost"
                onclick={handleSkip}
                size="lg"
                aria-label="Skip beauty simulation and proceed to journey planning"
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
                        d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                Skip Simulation
            </Button>
        {/if}
    </div>

    <!-- Help Section -->
    <div class="help-section">
        <details class="help-details">
            <summary class="help-summary">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clip-rule="evenodd"
                    />
                </svg>
                Need more help?
            </summary>
            <div class="help-content">
                <p>If you continue to experience issues:</p>
                <ul>
                    <li>
                        Check our <a
                            href="/status"
                            target="_blank"
                            rel="noopener">service status page</a
                        >
                    </li>
                    <li>Try using a different browser or device</li>
                    <li>Contact our support team with error details</li>
                    <li>Report the issue on our community forum</li>
                </ul>

                <div class="error-details">
                    <h5>Technical Details:</h5>
                    <code class="error-code">{error}</code>
                    <p class="error-timestamp">
                        Error occurred at: {new Date().toLocaleString()}
                    </p>
                </div>
            </div>
        </details>
    </div>
</div>

<style>
    .error-recovery-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
    }

    .error-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        align-items: flex-start;
    }

    .error-icon-wrapper {
        flex-shrink: 0;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .error-icon {
        width: 1.5rem;
        height: 1.5rem;
    }

    .error-icon.network {
        color: #f59e0b;
        background: #fef3c7;
    }

    .error-icon.image {
        color: #8b5cf6;
        background: #ede9fe;
    }

    .error-icon.rate-limit {
        color: #06b6d4;
        background: #cffafe;
    }

    .error-icon.server {
        color: #dc2626;
        background: #fee2e2;
    }

    .error-icon.auth {
        color: #f59e0b;
        background: #fef3c7;
    }

    .error-icon.unknown {
        color: #6b7280;
        background: #f3f4f6;
    }

    .error-info {
        flex: 1;
    }

    .error-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 0.5rem;
    }

    .error-message {
        font-size: 0.875rem;
        color: #6b7280;
        line-height: 1.5;
        margin: 0;
    }

    .recovery-suggestions {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: #f9fafb;
        border-radius: 0.75rem;
        border: 1px solid #e5e7eb;
    }

    .suggestions-title {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 1rem;
    }

    .suggestions-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .suggestion-item {
        font-size: 0.875rem;
        color: #4b5563;
        margin-bottom: 0.5rem;
        padding-left: 1.5rem;
        position: relative;
        line-height: 1.5;
    }

    .suggestion-item::before {
        content: "→";
        position: absolute;
        left: 0;
        color: #3b82f6;
        font-weight: 600;
    }

    .retry-info {
        margin-bottom: 2rem;
        padding: 1rem;
        background: #eff6ff;
        border-radius: 0.5rem;
        border: 1px solid #bfdbfe;
    }

    .retry-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .retry-count {
        font-size: 0.875rem;
        font-weight: 500;
        color: #1e40af;
    }

    .retry-delay {
        font-size: 0.75rem;
        color: #3b82f6;
    }

    .retry-progress {
        margin-top: 0.75rem;
    }

    .retry-progress-bar {
        width: 100%;
        height: 4px;
        background: #dbeafe;
        border-radius: 2px;
        overflow: hidden;
    }

    .retry-progress-fill {
        height: 100%;
        background: #3b82f6;
        border-radius: 2px;
        transition: width 0.3s ease;
    }

    .max-retries-reached {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: #fef2f2;
        border-radius: 0.5rem;
        border: 1px solid #fecaca;
        color: #991b1b;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 2rem;
    }

    .recovery-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 2rem;
    }

    .retry-button {
        background: #3b82f6;
        border-color: #3b82f6;
    }

    .retry-button:hover:not(:disabled) {
        background: #2563eb;
        border-color: #2563eb;
    }

    .retry-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .help-section {
        border-top: 1px solid #e5e7eb;
        padding-top: 1.5rem;
    }

    .help-details {
        cursor: pointer;
    }

    .help-summary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        list-style: none;
        user-select: none;
    }

    .help-summary::-webkit-details-marker {
        display: none;
    }

    .help-content {
        margin-top: 1rem;
        padding-left: 1.5rem;
        font-size: 0.875rem;
        color: #6b7280;
        line-height: 1.5;
    }

    .help-content ul {
        margin: 0.75rem 0;
        padding-left: 1rem;
    }

    .help-content li {
        margin-bottom: 0.25rem;
    }

    .help-content a {
        color: #3b82f6;
        text-decoration: underline;
    }

    .help-content a:hover {
        color: #2563eb;
    }

    .error-details {
        margin-top: 1rem;
        padding: 1rem;
        background: #f3f4f6;
        border-radius: 0.5rem;
        border: 1px solid #d1d5db;
    }

    .error-details h5 {
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .error-code {
        display: block;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        font-size: 0.75rem;
        color: #dc2626;
        background: #fef2f2;
        padding: 0.5rem;
        border-radius: 0.25rem;
        border: 1px solid #fecaca;
        word-break: break-all;
        margin-bottom: 0.5rem;
    }

    .error-timestamp {
        font-size: 0.75rem;
        color: #9ca3af;
        margin: 0;
    }

    /* Mobile Responsive */
    @media (max-width: 640px) {
        .error-recovery-container {
            padding: 1.5rem;
            margin: 1rem;
        }

        .error-header {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
        }

        .error-icon-wrapper {
            align-self: center;
        }

        .retry-status {
            flex-direction: column;
            gap: 0.25rem;
            align-items: flex-start;
        }

        .recovery-actions {
            gap: 0.5rem;
        }
    }

    /* Dark Mode Support */
    :global([data-theme="dark"]) .error-recovery-container {
        background: #1f2937;
        border-color: #374151;
    }

    :global([data-theme="dark"]) .error-title {
        color: #f9fafb;
    }

    :global([data-theme="dark"]) .error-message {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .recovery-suggestions {
        background: #374151;
        border-color: #4b5563;
    }

    :global([data-theme="dark"]) .suggestions-title {
        color: #f3f4f6;
    }

    :global([data-theme="dark"]) .suggestion-item {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .retry-info {
        background: #1e3a8a;
        border-color: #3b82f6;
    }

    :global([data-theme="dark"]) .retry-count {
        color: #93c5fd;
    }

    :global([data-theme="dark"]) .retry-delay {
        color: #bfdbfe;
    }

    :global([data-theme="dark"]) .retry-progress-bar {
        background: #1e40af;
    }

    :global([data-theme="dark"]) .max-retries-reached {
        background: #7f1d1d;
        border-color: #dc2626;
        color: #fca5a5;
    }

    :global([data-theme="dark"]) .help-section {
        border-top-color: #4b5563;
    }

    :global([data-theme="dark"]) .help-summary {
        color: #f3f4f6;
    }

    :global([data-theme="dark"]) .help-content {
        color: #d1d5db;
    }

    :global([data-theme="dark"]) .error-details {
        background: #374151;
        border-color: #4b5563;
    }

    :global([data-theme="dark"]) .error-details h5 {
        color: #f3f4f6;
    }

    :global([data-theme="dark"]) .error-code {
        background: #7f1d1d;
        border-color: #dc2626;
        color: #fca5a5;
    }

    :global([data-theme="dark"]) .error-timestamp {
        color: #6b7280;
    }

    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
        .retry-progress-fill {
            transition: none;
        }
    }

    /* Focus styles */
    .help-summary:focus-visible {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        border-radius: 0.25rem;
    }
</style>
