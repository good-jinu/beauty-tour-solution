<script lang="ts">
import "../app.css";
import favicon from "$lib/assets/favicon.svg";
import ThemeProvider from "$lib/components/ThemeProvider.svelte";
import ThemeToggle from "$lib/components/ThemeToggle.svelte";
import { Toaster } from "$lib/components/ui/sonner";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ThemeProvider>
	<div class="min-h-screen bg-background text-foreground">
		<!-- Header with Theme Toggle -->
		<header
			class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
		>
			<div
				class="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8"
			>
				<!-- Logo/Brand -->
				<div class="flex items-center space-x-2">
					<a href="/" class="flex items-center space-x-2">
						<div
							class="h-8 w-8 rounded-full bg-primary flex items-center justify-center"
						>
							<span
								class="text-primary-foreground font-bold text-sm"
								>BTS</span
							>
						</div>
						<span class="font-bold text-lg hidden sm:inline-block"
							>Beauty Tour Solution</span
						>
					</a>
				</div>

				<!-- Navigation and Theme Toggle -->
				<div class="flex items-center space-x-4">
					<!-- Theme Toggle -->
					<ThemeToggle />
				</div>
			</div>
		</header>

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
