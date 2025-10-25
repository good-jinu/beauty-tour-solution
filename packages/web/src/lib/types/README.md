# Schedule Solutions Types

This document describes the types and interfaces used for the Schedule Solutions feature.

## Types Overview

### Core Types

- `SolutionType`: Union type for solution identifiers (`"topranking" | "premium" | "budget"`)
- `IconComponent`: Type for Lucide Svelte icon components
- `SolutionConfig`: Configuration interface for solution options

### Interfaces

#### `SolutionConfig`
Defines the structure for each solution option:
```typescript
interface SolutionConfig {
  id: SolutionType;
  name: string;
  icon: IconComponent;
  description: string;
  features: string[];
  highlight: string;
  color: string;
  estimatedCost: number;
  costLabel: string;
}
```

#### `ScheduleSolutionsProps`
Props for the main ScheduleSolutions component:
```typescript
interface ScheduleSolutionsProps {
  formData: StepperFormData;
}
```

#### `ScheduleContentsProps`
Props for the ScheduleContents component:
```typescript
interface ScheduleContentsProps {
  formData: StepperFormData;
  solutionType?: SolutionType;
}
```

### Utility Functions

#### `SolutionCostUtils`
Provides cost calculation utilities:
- `calculateSolutionCost(solutionType, budget, config?)`: Calculate estimated cost
- `calculateSavings(currentCost, topRankingCost)`: Calculate savings amount
- `calculatePremiumDifference(premiumCost, topRankingCost)`: Calculate premium difference
- `calculateBudgetPercentage(estimatedCost, totalBudget)`: Calculate budget percentage
- `getCostComparisonText(solutionType, currentCost, topRankingCost)`: Get comparison text

#### `getSolutionMetadata(solutionType)`
Returns UI metadata for styling:
```typescript
interface SolutionMetadata {
  borderClass: string;
  badgeVariant: "default" | "secondary";
  progressBarClass: string;
}
```

## Usage Examples

### Basic Component Usage
```svelte
<script lang="ts">
import ScheduleSolutions from "$lib/components/ScheduleSolutions.svelte";
import type { StepperFormData } from "$lib/types";

const formData: StepperFormData = {
  startDate: "2024-01-01",
  endDate: "2024-01-07",
  selectedThemes: ["skincare", "wellness-spa"],
  budget: 5000,
  currency: "USD"
};
</script>

<ScheduleSolutions {formData} />
```

### Using Cost Utilities
```typescript
import { SolutionCostUtils } from "$lib/types";

const budget = 5000;
const topRankingCost = SolutionCostUtils.calculateSolutionCost("topranking", budget);
const budgetCost = SolutionCostUtils.calculateSolutionCost("budget", budget);
const savings = SolutionCostUtils.calculateSavings(budgetCost, topRankingCost);
```

### Custom Solution Configuration
```typescript
import type { SolutionConfig } from "$lib/types";
import { Trophy } from "@lucide/svelte";

const customSolution: SolutionConfig = {
  id: "topranking",
  name: "Top Ranking",
  icon: Trophy,
  description: "Highest rated clinics and treatments",
  features: ["Top-rated clinics", "Expert specialists"],
  highlight: "Recommended",
  color: "text-amber-600 dark:text-amber-400",
  estimatedCost: 4000,
  costLabel: "Standard Rate"
};
```