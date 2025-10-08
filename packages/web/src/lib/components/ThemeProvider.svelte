<script lang="ts">
import type { Snippet } from "svelte";
import { onMount, setContext } from "svelte";
import { resolvedTheme, theme } from "$lib/stores/theme";
import {
	applyTheme,
	loadThemePreference,
	type ResolvedTheme,
	resolveTheme,
	saveThemePreference,
	type Theme,
	watchSystemTheme,
} from "$lib/utils/theme";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

// Theme state
let currentTheme: Theme = "system";
let currentResolvedTheme: ResolvedTheme = "light";

// Subscribe to theme stores
theme.subscribe((value) => {
	currentTheme = value;
	currentResolvedTheme = resolveTheme(value);
	resolvedTheme.set(currentResolvedTheme);
	applyTheme(currentResolvedTheme);
});

// Set theme function
function setTheme(newTheme: Theme) {
	theme.set(newTheme);
	saveThemePreference(newTheme);
}

// Toggle between light and dark (skipping system for simple toggle)
function toggleTheme() {
	const newTheme = currentResolvedTheme === "light" ? "dark" : "light";
	setTheme(newTheme);
}

// Initialize theme on mount
onMount(() => {
	// Load saved theme preference
	const savedTheme = loadThemePreference();
	theme.set(savedTheme);

	// Watch for system theme changes
	const unwatch = watchSystemTheme(() => {
		if (currentTheme === "system") {
			const newResolved = resolveTheme("system");
			resolvedTheme.set(newResolved);
			applyTheme(newResolved);
		}
	});

	return unwatch;
});

// Make theme functions available through context
setContext("theme", {
	theme,
	resolvedTheme,
	setTheme,
	toggleTheme,
});
</script>

{@render children()}
