<script lang="ts">
import { Moon, Sun } from "@lucide/svelte";
import { getContext } from "svelte";
import type { Writable } from "svelte/store";
import { Switch } from "$lib/components/ui/switch";
import type { ResolvedTheme, Theme } from "$lib/types/theme";

interface ThemeContext {
	theme: Writable<Theme>;
	resolvedTheme: Writable<ResolvedTheme>;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

const { theme, resolvedTheme, toggleTheme } = getContext<ThemeContext>("theme");

if (!theme || !resolvedTheme || !toggleTheme) {
	throw new Error("ThemeToggle must be used within a ThemeProvider");
}

let isDark = $derived($resolvedTheme === "dark");
</script>

<button
    onclick={toggleTheme}
    class="flex items-center justify-center w-9 h-9 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
    aria-label="Toggle theme"
>
    {#if isDark}
        <Sun class="h-4 w-4" />
    {:else}
        <Moon class="h-4 w-4" />
    {/if}
</button>
