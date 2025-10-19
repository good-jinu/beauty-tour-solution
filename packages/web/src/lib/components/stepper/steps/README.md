# Stepper Steps

This directory contains all the individual step components for the beauty tour stepper.

## Available Steps

### 1. CountrySelection.svelte
- **Step ID**: `country`
- **Optional**: Yes
- **Purpose**: Allows users to select their preferred destination country
- **Validation**: Requires a valid country selection

### 2. DateSelection.svelte
- **Step ID**: `dates`
- **Optional**: No
- **Purpose**: Date range selection for the beauty tour
- **Validation**: Start and end dates, minimum 2 days, maximum 30 days

### 3. ThemeSelection.svelte
- **Step ID**: `themes`
- **Optional**: No
- **Purpose**: Multiple selection of beauty treatment themes
- **Validation**: At least one theme must be selected

### 4. BudgetSelection.svelte
- **Step ID**: `budget`
- **Optional**: No
- **Purpose**: Budget range selection
- **Validation**: Minimum $500, maximum $50,000, theme compatibility checks

### 5. AdditionalRequestStep.svelte
- **Step ID**: `more-requests`
- **Optional**: Yes
- **Purpose**: Additional user requests and preferences
- **Validation**: Optional, but if provided must be 10-1000 characters with meaningful content

## Usage

### Default Configuration
```typescript
// Default steps (includes the new more-requests step)
const defaultSteps = ["dates", "themes", "budget", "more-requests"];

// With country step
const stepsWithCountry = ["country", "dates", "themes", "budget", "more-requests"];
```

### Custom Step Configuration
```svelte
<StepperContainer 
  enabledSteps={["dates", "themes", "budget", "more-requests"]}
  oncomplete={handleComplete}
>
  <!-- stepper content -->
</StepperContainer>
```

### Accessing More Requests Data
```typescript
function handleStepperComplete(data: StepperFormData) {
  console.log('Additional requests:', data.moreRequests);
  // data.moreRequests contains the user's additional requests
}
```

## Form Data Structure

The `moreRequests` field is added to the `StepperFormData` interface:

```typescript
interface StepperFormData {
  selectedCountry?: string;
  startDate: string;
  endDate: string;
  selectedThemes: string[];
  budget: number;
  currency?: "USD" | "EUR" | "GBP";
  moreRequests?: string; // New field
}
```

## API Integration

The `moreRequests` field is automatically included in the legacy `FormData` conversion:

```typescript
const legacyData = StepperUtils.stepperToLegacyFormData(stepperData);
// legacyData.moreRequests will contain the user's additional requests
```

## Validation

The AdditionalRequestStep includes built-in validation:
- Optional field (empty is valid)
- If provided, minimum 10 characters
- Maximum 1000 characters
- Must contain meaningful text (not just special characters)

## Styling

The component includes:
- Responsive design
- Dark mode support
- Character counter with visual feedback
- Clear button for easy text removal
- Helpful suggestions for users
- Custom scrollbar styling