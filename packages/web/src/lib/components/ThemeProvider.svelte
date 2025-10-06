<script lang="ts">
import type { Snippet } from "svelte";
import { onMount, setContext } from "svelte";
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
let theme = $state<Theme>("system");
let resolvedTheme = $state<ResolvedTheme>("light");

// Update resolved theme based on current theme setting
function updateResolvedTheme() {
	resolvedTheme = resolveTheme(theme);
}

// Set theme function
function setTheme(newTheme: Theme) {
	theme = newTheme;
	saveThemePreference(newTheme);
	updateResolvedTheme();
	applyTheme(resolvedTheme);
}

// Toggle between light and dark (skipping system for simple toggle)
function toggleTheme() {
	const newTheme = resolvedTheme === "light" ? "dark" : "light";
	setTheme(newTheme);
}

// Initialize theme on mount
onMount(() => {
	// Load saved theme preference
	theme = loadThemePreference();
	updateResolvedTheme();
	applyTheme(resolvedTheme);

	// Watch for system theme changes
	const unwatch = watchSystemTheme(() => {
		if (theme === "system") {
			updateResolvedTheme();
			applyTheme(resolvedTheme);
		}
	});

	return unwatch;
});

// Make theme functions available through context
setContext("theme", {
	get theme() {
		return theme;
	},
	get resolvedTheme() {
		return resolvedTheme;
	},
	setTheme,
	toggleTheme,
});
</script>

{@render children()}
