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

<div class="flex items-center gap-3">
    <!-- Theme icons -->
    <Sun
        class="h-4 w-4 text-muted-foreground transition-colors {isDark
            ? 'opacity-50'
            : 'opacity-100'}"
    />

    <!-- Switch component -->
    <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label="Toggle theme"
    />

    <!-- Moon icon for dark mode -->
    <Moon
        class="h-4 w-4 text-muted-foreground transition-colors {isDark
            ? 'opacity-100'
            : 'opacity-50'}"
    />
</div>
