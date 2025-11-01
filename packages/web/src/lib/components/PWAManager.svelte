<script lang="ts">
import { onMount } from "svelte";
import { browser } from "$app/environment";
import { PWALifecycle, PWAStatus, pwaInstaller } from "$lib/utils/pwa";

// PWA state
let isInstallAvailable = false;
let isPWA = false;
let showInstallBanner = false;

// PWA capabilities
let capabilities = {
	serviceWorker: false,
	manifest: false,
	pushNotifications: false,
	backgroundSync: false,
	webShare: false,
	installPrompt: false,
	standalone: false,
};

onMount(() => {
	if (!browser) return;

	// Check PWA capabilities
	capabilities = PWAStatus.getCapabilities();
	isPWA = PWAStatus.isRunningAsPWA();

	// Check if install is available
	checkInstallAvailability();

	// Set up visibility change monitoring
	PWALifecycle.onVisibilityChange((visible) => {
		console.log(`App visibility changed: ${visible ? "visible" : "hidden"}`);
	});

	// Set up focus change monitoring
	PWALifecycle.onFocusChange((focused) => {
		console.log(`App focus changed: ${focused ? "focused" : "blurred"}`);
	});

	// Log PWA status
	console.log("PWA Manager initialized:", {
		isPWA,
		capabilities,
		displayMode: PWAStatus.getDisplayMode(),
	});
});

function checkInstallAvailability() {
	// Check periodically if install becomes available
	const checkInterval = setInterval(() => {
		const available = pwaInstaller.isInstallAvailable();
		if (available !== isInstallAvailable) {
			isInstallAvailable = available;
			if (available && !showInstallBanner) {
				showInstallBanner = true;
			}
		}
	}, 1000);

	// Clean up interval after 30 seconds
	setTimeout(() => {
		clearInterval(checkInterval);
	}, 30000);
}

async function handleInstall() {
	const installed = await pwaInstaller.showInstallPrompt();
	if (installed) {
		showInstallBanner = false;
		isInstallAvailable = false;
	}
}

function dismissInstallBanner() {
	showInstallBanner = false;
}
</script>

<!-- Install Banner -->
{#if showInstallBanner && isInstallAvailable && !isPWA}
    <div
        class="top-0 left-0 right-0 z-[60] bg-blue-600 text-white shadow-lg install-banner"
        style="height: 4rem;"
    >
        <div
            class="flex items-center justify-between max-w-4xl mx-auto h-full px-4"
        >
            <div class="flex items-center space-x-3">
                <svg
                    class="w-6 h-6 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
                <div class="min-w-0">
                    <p class="font-medium text-sm sm:text-base">
                        Install Beauty Tours
                    </p>
                    <p class="text-xs sm:text-sm opacity-90 truncate">
                        Get the app experience on your device
                    </p>
                </div>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0">
                <button
                    on:click={handleInstall}
                    class="bg-white text-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                    Install
                </button>
                <button
                    on:click={dismissInstallBanner}
                    class="text-white hover:text-gray-200 p-1"
                    aria-label="Dismiss install banner"
                >
                    <svg
                        class="w-4 h-4 sm:w-5 sm:h-5"
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
            </div>
        </div>
    </div>
{/if}

<!-- PWA Debug Info (only in development) -->
{#if browser && import.meta.env.DEV}
    <div
        class="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs"
    >
        <div class="font-bold mb-1">PWA Status</div>
        <div>Mode: {PWAStatus.getDisplayMode()}</div>
        <div>Install Available: {isInstallAvailable ? "Yes" : "No"}</div>
        <div class="mt-1 text-xs opacity-75">
            SW: {capabilities.serviceWorker ? "✓" : "✗"}
            Manifest: {capabilities.manifest ? "✓" : "✗"}
            Push: {capabilities.pushNotifications ? "✓" : "✗"}
        </div>
    </div>
{/if}

<style>
    /* Install banner specific styles */
    .install-banner {
        /* Ensure banner is always on top */
        z-index: 9999 !important;
    }
</style>
