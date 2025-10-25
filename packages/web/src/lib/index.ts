// place files you want to import through the `$lib` alias in this folder.

// Theme system exports
export { default as ThemeProvider } from "./components/ThemeProvider.svelte";
export { default as ThemeToggle } from "./components/ThemeToggle.svelte";
export { guestStore } from "./stores/guest";

// Guest ID management exports
export * from "./utils/guest";
export * from "./utils/theme";
