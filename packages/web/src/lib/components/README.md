# Beauty Journey Components

This directory contains the refactored components for the Beauty Journey application. The original monolithic `+page.svelte` file has been broken down into smaller, more manageable components.

## Component Structure

### Core Components

- **HeroSection.svelte** - Landing section with title, description, and trust indicators
- **FormSection.svelte** - Main form wrapper that orchestrates all form components
- **ResultsSection.svelte** - AI-generated results display with actions

### Form Components

- **RegionSelector.svelte** - Destination selection with region cards
- **ThemeSelector.svelte** - Treatment type selection with themed cards
- **DateSelector.svelte** - Start and end date inputs
- **BudgetSlider.svelte** - Interactive budget range slider
- **PackageInclusions.svelte** - Checkbox selections for add-ons
- **SpecialRequests.svelte** - Textarea for special requirements
- **TravelersInput.svelte** - Number of travelers input

## Types and Constants

All shared types and constants are located in `src/lib/types/`:

- **beauty-journey.ts** - Contains all interfaces, types, and constant data
- **index.ts** - Re-exports for cleaner imports

## Benefits of Refactoring

1. **Maintainability** - Each component has a single responsibility
2. **Reusability** - Components can be reused across different pages
3. **Testing** - Easier to unit test individual components
4. **Performance** - Better code splitting and lazy loading potential
5. **Developer Experience** - Smaller files are easier to navigate and understand
6. **Type Safety** - Centralized types ensure consistency

## Usage

```svelte
<script>
  import { HeroSection, FormSection, ResultsSection } from "$lib/components";
  import type { FormData, FormErrors } from "$lib/types";
</script>

<HeroSection />
<FormSection bind:formData {errors} {isLoading} onSubmit={handleSubmit} />
{#if showResults}
  <ResultsSection {aiRecommendation} onReset={resetForm} />
{/if}
```

## Component Props

Each component uses Svelte 5's new `$bindable()` runes for two-way data binding where appropriate, and follows consistent prop patterns for maintainability.