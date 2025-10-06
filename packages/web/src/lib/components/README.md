# Theme System

This directory contains the theme system components for the Beauty Tour Solution application.

## Components

### ThemeProvider
The main theme provider component that manages theme state and provides context to child components.

**Usage:**
```svelte
<ThemeProvider>
  <!-- Your app content -->
</ThemeProvider>
```

**Features:**
- System preference detection
- localStorage persistence
- Context-based theme sharing
- Automatic theme application

### ThemeToggle
A toggle button component for switching between light and dark themes.

**Usage:**
```svelte
<ThemeToggle />
```

**Features:**
- Simple light/dark toggle
- System preference indicator
- Accessible button with proper ARIA labels
- Visual theme state indicators

## Theme Utilities

The theme utilities are located in `$lib/utils/theme.ts` and provide:

- `loadThemePreference()` - Load theme from localStorage
- `saveThemePreference()` - Save theme to localStorage
- `getSystemTheme()` - Detect system color scheme preference
- `applyTheme()` - Apply theme to document
- `resolveTheme()` - Resolve theme preference to actual theme
- `watchSystemTheme()` - Listen for system theme changes

## CSS Variables

The theme system uses CSS custom properties defined in `app.css`:

### Standard Theme Variables
- `--background`, `--foreground` - Main background and text colors
- `--primary`, `--secondary` - Brand colors
- `--muted`, `--accent` - Supporting colors
- `--border`, `--input` - UI element colors
- `--destructive` - Error/warning colors

### Stepper-Specific Variables
- `--stepper-step-pending` - Pending step indicator color
- `--stepper-step-current` - Current step indicator color
- `--stepper-step-completed` - Completed step indicator color
- `--stepper-step-error` - Error step indicator color
- `--stepper-connector` - Step connector line color
- `--stepper-connector-active` - Active connector line color

## Theme Types

```typescript
type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
```

## Context API

The ThemeProvider exposes the following context:

```typescript
interface ThemeContext {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
```

Access the context in child components:

```svelte
<script>
  import { getContext } from 'svelte';
  
  const themeContext = getContext('theme');
  const { theme, resolvedTheme, setTheme, toggleTheme } = themeContext;
</script>
```