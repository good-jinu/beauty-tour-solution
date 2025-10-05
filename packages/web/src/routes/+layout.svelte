<script lang="ts">
import "../app.css";
import favicon from "$lib/assets/favicon.svg";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen">
	<main class="w-full">
		{@render children?.()}
	</main>
</div>
