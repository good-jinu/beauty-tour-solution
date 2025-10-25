<script lang="ts">
import "../app.css";
import { onMount } from "svelte";
import favicon from "$lib/assets/favicon.ico";
import Header from "$lib/components/Header.svelte";
import ThemeProvider from "$lib/components/ThemeProvider.svelte";
import { Toaster } from "$lib/components/ui/sonner";
import { guestStore } from "$lib/stores/guest";

let { children } = $props();

// Initialize guest ID when the app mounts
onMount(() => {
	guestStore.initialize();
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
