<script lang="ts">
import "../app.css";
import { onDestroy, onMount } from "svelte";
import favicon from "$lib/assets/favicon.ico";
import Header from "$lib/components/Header.svelte";
import ThemeProvider from "$lib/components/ThemeProvider.svelte";
import { Toaster } from "$lib/components/ui/sonner";
import {
	getEventLoggerConfig,
	isEventTrackingEnabled,
} from "$lib/config/eventTracking";
import { guestStore } from "$lib/stores/guest";
import {
	destroyEventLogger,
	initializeEventLogger,
} from "$lib/utils/eventLogger";
import type { LayoutData } from "./$types";

let { children, data }: { children: any; data: LayoutData } = $props();

// Initialize guest ID and event tracking when the app mounts
onMount(() => {
	// Inject server configuration into global window object for client access
	if (typeof window !== "undefined" && data.eventTrackingConfig) {
		(window as any).__EVENT_TRACKING_CONFIG__ = data.eventTrackingConfig;
	}

	guestStore.initialize();

	// Initialize event tracking if enabled
	if (isEventTrackingEnabled()) {
		try {
			const config = getEventLoggerConfig();
			initializeEventLogger(config);
			console.info("Event tracking initialized successfully");
		} catch (error) {
			console.warn("Failed to initialize event tracking:", error);
		}
	}
});

// Cleanup event tracking when component is destroyed
onDestroy(() => {
	if (isEventTrackingEnabled()) {
		destroyEventLogger();
	}
});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ThemeProvider>
	<div class="min-h-screen bg-background text-foreground">
		<Header />

		<!-- Main Content -->
		<main class="w-full">
			{@render children?.()}
		</main>

		<!-- Toast Notifications -->
		<Toaster
			position="top-right"
			richColors={true}
			closeButton={true}
			duration={4000}
		/>
	</div>
</ThemeProvider>
