/**
 * PWA Utilities
 * Helper functions for Progressive Web App functionality
 */

import { pwaConfig, pwaFeatures } from "$lib/config/pwa";

// Install prompt event interface
interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

// PWA installation utilities
export class PWAInstaller {
	private deferredPrompt: BeforeInstallPromptEvent | null = null;
	private installPromptShown = false;

	constructor() {
		this.setupInstallPromptListener();
	}

	private setupInstallPromptListener(): void {
		if (!pwaFeatures.isInstallPromptAvailable()) {
			return;
		}

		window.addEventListener("beforeinstallprompt", (e: Event) => {
			// Prevent the mini-infobar from appearing on mobile
			e.preventDefault();

			// Store the event for later use
			this.deferredPrompt = e as BeforeInstallPromptEvent;

			// Show custom install prompt after delay
			if (pwaConfig.showInstallPrompt && !this.installPromptShown) {
				setTimeout(() => {
					this.showInstallPrompt();
				}, pwaConfig.installPromptDelay);
			}
		});

		// Listen for app installation
		window.addEventListener("appinstalled", () => {
			console.log("PWA was installed");
			this.deferredPrompt = null;
			this.installPromptShown = true;

			// Track installation event
			this.trackInstallation("success");
		});
	}

	// Check if installation is available
	public isInstallAvailable(): boolean {
		return this.deferredPrompt !== null && !pwaFeatures.isStandalone();
	}

	// Show install prompt
	public async showInstallPrompt(): Promise<boolean> {
		if (!this.deferredPrompt) {
			return false;
		}

		try {
			// Show the install prompt
			await this.deferredPrompt.prompt();

			// Wait for user response
			const { outcome } = await this.deferredPrompt.userChoice;

			// Track user choice
			this.trackInstallation(outcome);

			// Clean up
			this.deferredPrompt = null;
			this.installPromptShown = true;

			return outcome === "accepted";
		} catch (error) {
			console.error("Error showing install prompt:", error);
			return false;
		}
	}

	// Track installation events
	private trackInstallation(outcome: string): void {
		// This would integrate with your analytics system
		console.log(`PWA installation ${outcome}`);

		// Example: Send to analytics
		// analytics.track('pwa_install_prompt', { outcome });
	}
}

// PWA status utilities
export const PWAStatus = {
	// Check if app is running as PWA
	isRunningAsPWA(): boolean {
		return pwaFeatures.isStandalone();
	},

	// Get PWA display mode
	getDisplayMode(): string {
		if (pwaFeatures.isStandalone()) {
			return "standalone";
		}

		if (window.matchMedia("(display-mode: minimal-ui)").matches) {
			return "minimal-ui";
		}

		if (window.matchMedia("(display-mode: fullscreen)").matches) {
			return "fullscreen";
		}

		return "browser";
	},

	// Check PWA capabilities
	getCapabilities() {
		return {
			serviceWorker: pwaFeatures.isServiceWorkerSupported(),
			manifest: pwaFeatures.isManifestSupported(),
			pushNotifications: pwaFeatures.isPushSupported(),
			backgroundSync: pwaFeatures.isBackgroundSyncSupported(),
			webShare: pwaFeatures.isWebShareSupported(),
			installPrompt: pwaFeatures.isInstallPromptAvailable(),
			standalone: pwaFeatures.isStandalone(),
		};
	},
};

// PWA theme utilities
export const PWATheme = {
	// Update theme color dynamically
	updateThemeColor(color: string): void {
		const themeColorMeta = document.querySelector('meta[name="theme-color"]');
		if (themeColorMeta) {
			themeColorMeta.setAttribute("content", color);
		}
	},

	// Update status bar style for iOS
	updateStatusBarStyle(style: "default" | "black" | "black-translucent"): void {
		const statusBarMeta = document.querySelector(
			'meta[name="apple-mobile-web-app-status-bar-style"]',
		);
		if (statusBarMeta) {
			statusBarMeta.setAttribute("content", style);
		}
	},
};

// PWA sharing utilities
export const PWAShare = {
	// Check if Web Share API is available
	isShareSupported(): boolean {
		return pwaFeatures.isWebShareSupported();
	},

	// Share content using Web Share API
	async share(data: ShareData): Promise<boolean> {
		if (!PWAShare.isShareSupported()) {
			return false;
		}

		try {
			await navigator.share(data);
			return true;
		} catch (error) {
			// User cancelled or error occurred
			console.log("Share cancelled or failed:", error);
			return false;
		}
	},

	// Fallback sharing methods
	fallbackShare(data: ShareData): void {
		const { title, text, url } = data;
		const shareText = `${title}\n${text}\n${url}`;

		// Try to copy to clipboard
		if (navigator.clipboard) {
			navigator.clipboard
				.writeText(shareText)
				.then(() => {
					console.log("Content copied to clipboard");
				})
				.catch(() => {
					console.log("Failed to copy to clipboard");
				});
		}
	},
};

// PWA lifecycle utilities
export const PWALifecycle = {
	// Handle app visibility changes
	onVisibilityChange(callback: (visible: boolean) => void): void {
		document.addEventListener("visibilitychange", () => {
			callback(!document.hidden);
		});
	},

	// Handle app focus/blur
	onFocusChange(callback: (focused: boolean) => void): void {
		window.addEventListener("focus", () => callback(true));
		window.addEventListener("blur", () => callback(false));
	},

	// Handle network status changes
	onNetworkChange(callback: (online: boolean) => void): void {
		window.addEventListener("online", () => callback(true));
		window.addEventListener("offline", () => callback(false));
	},
};

// Export singleton instances
export const pwaInstaller = new PWAInstaller();
