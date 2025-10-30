<script lang="ts">
import { onMount } from "svelte";
import { browser } from "$app/environment";
import { goto } from "$app/navigation";

let isOnline = true;

onMount(() => {
	if (browser) {
		isOnline = navigator.onLine;

		const handleOnline = () => {
			isOnline = true;
			// Redirect to home when back online
			setTimeout(() => {
				goto("/");
			}, 1000);
		};

		const handleOffline = () => {
			isOnline = false;
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}
});

function tryAgain() {
	if (browser) {
		window.location.reload();
	}
}
</script>

<svelte:head>
	<title>Offline - Beauty Tour Solution</title>
	<meta name="description" content="You are currently offline" />
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<div class="max-w-md w-full text-center space-y-6">
		<!-- Offline Icon -->
		<div class="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center">
			<svg
				class="w-12 h-12 text-orange-600"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v6m0 8v6m-8-4h6m8 0h6"
				/>
			</svg>
		</div>

		<!-- Status Message -->
		{#if isOnline}
			<div class="space-y-2">
				<h1 class="text-2xl font-bold text-green-600">Back Online!</h1>
				<p class="text-muted-foreground">Redirecting you back to the app...</p>
			</div>
		{:else}
			<div class="space-y-2">
				<h1 class="text-2xl font-bold text-foreground">You're Offline</h1>
				<p class="text-muted-foreground">
					Please check your internet connection and try again.
				</p>
			</div>
		{/if}

		<!-- Action Buttons -->
		<div class="space-y-3">
			<button
				on:click={tryAgain}
				class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
			>
				Try Again
			</button>

			<a
				href="/"
				class="block w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors"
			>
				Go to Home
			</a>
		</div>

		<!-- App Info -->
		<div class="pt-6 border-t border-border">
			<div class="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
					/>
				</svg>
				<span>Beauty Tour Solution</span>
			</div>
			<p class="text-xs text-muted-foreground mt-1">
				This app works offline with cached content
			</p>
		</div>
	</div>
</div>

<style>
	/* Ensure the page takes full height */
	:global(html, body) {
		height: 100%;
	}
</style>