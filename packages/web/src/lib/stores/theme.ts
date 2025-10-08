import { writable } from "svelte/store";
import type { ResolvedTheme, Theme } from "$lib/types/theme";

export const theme = writable<Theme>("system");
export const resolvedTheme = writable<ResolvedTheme>("light");
