<script lang="ts">
import "../app.css";
import favicon from "$lib/assets/favicon.svg";
import Footer from "$lib/components/layout/Footer.svelte";
import Navbar from "$lib/components/layout/Navbar.svelte";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen flex flex-col">
	<Navbar />
	<main class="flex-1">
		{@render children?.()}
	</main>
	<Footer />
</div>
