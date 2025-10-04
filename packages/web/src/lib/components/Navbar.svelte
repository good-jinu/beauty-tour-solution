<script lang="ts">
import { page } from "$app/state";

let open = $state(false);
const nav = [
	{ name: "Home", href: "/" },
	{ name: "Plan Beauty Journey", href: "/builder" },
	{ name: "About", href: "/about" },
	{ name: "Contact", href: "/contact" },
];
const path = $derived(page.url.pathname);
</script>

<nav class="bg-background border-b sticky top-0 z-50">
  <div class="container mx-auto px-4">
    <div class="h-16 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 font-semibold text-primary">
        <span class="text-2xl">💆‍♀️</span>
        <span class="text-xl">BTS-Beauty Tour Solution</span>
      </a>
      <div class="hidden md:flex items-center gap-6">
        {#each nav as item}
          <a
            href={item.href}
            class="text-muted-foreground hover:text-primary transition relative px-2 py-1 rounded-md"
            class:font-semibold={path === item.href}
          >
            {item.name}
          </a>
        {/each}
      </div>
      <button
        class="md:hidden grid place-items-center size-8 rounded-md border"
        aria-label="Toggle menu"
        onclick={() => (open = !open)}
      >
        <div
          class="w-5 h-0.5 bg-foreground mb-1 transition"
          class:rotate-45={open}
          class:translate-y-[6px]={open}
        ></div>
        <div
          class="w-5 h-0.5 bg-foreground transition"
          class:opacity-0={open}
        ></div>
        <div
          class="w-5 h-0.5 bg-foreground mt-1 transition"
          class:-rotate-45={open}
          class:-translate-y-[6px]={open}
        ></div>
      </button>
    </div>
    {#if open}
      <div class="md:hidden border-t py-2">
        {#each nav as item}
          <a
            href={item.href}
            class="block py-2 text-muted-foreground hover:text-primary"
            onclick={() => (open = false)}>{item.name}</a
          >
        {/each}
      </div>
    {/if}
  </div>
</nav>
