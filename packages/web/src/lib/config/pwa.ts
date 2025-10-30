/**
 * PWA Configuration
 * Configuration that works with @vite-pwa/sveltekit plugin
 */

// PWA runtime configuration (not handled by vite-pwa plugin)
export const pwaConfig = {
	// Installation Prompt
	installPromptDelay: 3000, // 3 seconds
	showInstallPrompt: true,

	// Service Worker Update Check
	swUpdateInterval: 60000, // 1 minute

	// Offline Resources
	offlinePage: "/offline",
	offlineImage: "/icon/192.png", // Use the same icon from manifest

	// Push Notifications
	notificationIcon: "/icon/192.png",
	vapidPublicKey: undefined as string | undefined,
};

// PWA Feature Detection
export const pwaFeatures = {
	// Check if service workers are supported
	isServiceWorkerSupported: (): boolean => {
		return "serviceWorker" in navigator;
	},

	// Check if web app manifest is supported
	isManifestSupported: (): boolean => {
		return "manifest" in window || "msManifest" in window;
	},

	// Check if push notifications are supported
	isPushSupported: (): boolean => {
		return "PushManager" in window && "Notification" in window;
	},

	// Check if background sync is supported
	isBackgroundSyncSupported: (): boolean => {
		return (
			"serviceWorker" in navigator &&
			"sync" in window.ServiceWorkerRegistration.prototype
		);
	},

	// Check if Web Share API is supported
	isWebShareSupported: (): boolean => {
		return "share" in navigator;
	},

	// Check if the app is running in standalone mode (installed)
	isStandalone: (): boolean => {
		return (
			window.matchMedia("(display-mode: standalone)").matches ||
			(window.navigator as { standalone?: boolean }).standalone === true
		);
	},

	// Check if install prompt is available
	isInstallPromptAvailable: (): boolean => {
		return "BeforeInstallPromptEvent" in window;
	},
};
