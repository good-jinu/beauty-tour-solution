<script lang="ts">
import { getContext } from "svelte";
import Button from "$lib/components/ui/button/button.svelte";

interface ThemeContext {
	theme: "light" | "dark" | "system";
	resolvedTheme: "light" | "dark";
	setTheme: (theme: "light" | "dark" | "system") => void;
	toggleTheme: () => void;
}

const themeContext = getContext<ThemeContext>("theme");

if (!themeContext) {
	throw new Error("ThemeToggle must be used within a ThemeProvider");
}

const { theme, resolvedTheme, setTheme, toggleTheme } = themeContext;

// Icons for different states
const icons = {
	light: "☀️",
	dark: "🌙",
	system: "💻",
};

function handleToggle() {
	toggleTheme();
}
</script>

<div class="flex items-center gap-2">
    <!-- Simple toggle button -->
    <Button
        variant="outline"
        size="sm"
        onclick={handleToggle}
        class="w-10 h-10 p-0"
        aria-label="Toggle theme"
    >
        <span class="text-lg">
            {resolvedTheme === "light" ? icons.light : icons.dark}
        </span>
    </Button>

    <!-- System preference indicator (optional) -->
    {#if theme === "system"}
        <span
            class="text-xs text-muted-foreground"
            title="Following system preference"
        >
            {icons.system}
        </span>
    {/if}
</div>
