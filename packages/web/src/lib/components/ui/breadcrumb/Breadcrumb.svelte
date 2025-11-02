<script lang="ts">
import { ChevronRight, Home } from "@lucide/svelte";

export let items: Array<{ label: string; href?: string }> = [];
</script>

<nav class="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
	<a href="/admin" class="flex items-center hover:text-foreground transition-colors">
		<Home size={16} class="mr-1" />
		Admin
	</a>
	
	{#each items as item, index}
		<ChevronRight size={16} class="mx-1" />
		{#if item.href && index < items.length - 1}
			<a href={item.href} class="hover:text-foreground transition-colors">
				{item.label}
			</a>
		{:else}
			<span class="text-foreground font-medium">
				{item.label}
			</span>
		{/if}
	{/each}
</nav>