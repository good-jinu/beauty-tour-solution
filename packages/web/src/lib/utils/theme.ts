import { browser } from "$app/environment";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/**
 * Get the system's preferred color scheme
 */
export function getSystemTheme(): ResolvedTheme {
	if (!browser) return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

/**
 * Apply theme to the document
 */
export function applyTheme(theme: ResolvedTheme): void {
	if (!browser) return;

	const root = document.documentElement;

	if (theme === "dark") {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}
}

/**
 * Load theme preference from localStorage
 */
export function loadThemePreference(): Theme {
	if (!browser) return "system";

	const stored = localStorage.getItem("theme") as Theme | null;
	if (stored && ["light", "dark", "system"].includes(stored)) {
		return stored;
	}
	return "system";
}

/**
 * Save theme preference to localStorage
 */
export function saveThemePreference(theme: Theme): void {
	if (!browser) return;
	localStorage.setItem("theme", theme);
}

/**
 * Resolve theme based on preference and system setting
 */
export function resolveTheme(theme: Theme): ResolvedTheme {
	if (theme === "system") {
		return getSystemTheme();
	}
	return theme;
}

/**
 * Listen for system theme changes
 */
export function watchSystemTheme(
	callback: (theme: ResolvedTheme) => void,
): () => void {
	if (!browser) return () => {};

	const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

	const handleChange = () => {
		callback(getSystemTheme());
	};

	mediaQuery.addEventListener("change", handleChange);

	return () => {
		mediaQuery.removeEventListener("change", handleChange);
	};
}
