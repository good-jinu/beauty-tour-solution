# ScheduleSolutions Component

The `ScheduleSolutions` component provides users with multiple schedule options (solutions) for their beauty journey. It displays 3 different schedule candidates: Top Ranking, Budget, and Premium solutions.

## Features

- **3 Solution Types**: Top Ranking (recommended), Budget (cost-effective), Premium (luxury)
- **Tabbed Interface**: Easy switching between different solutions
- **Dynamic Scheduling**: Each solution generates different activities, locations, and costs
- **Responsive Design**: Works on all screen sizes
- **Cost Estimation**: Shows budget utilization for each solution

## Usage

```svelte
<script>
import ScheduleSolutions from "$lib/components/ScheduleSolutions.svelte";
import type { StepperFormData } from "$lib/types";

const formData: StepperFormData = {
  startDate: "2024-12-01",
  endDate: "2024-12-07",
  selectedThemes: ["skincare", "wellness-spa"],
  budget: 5000,
  currency: "USD"
};
</script>

<ScheduleSolutions {formData} />
```

## Solution Types

### Top Ranking (Recommended)
- **Focus**: Highest rated clinics and treatments
- **Activities**: 2-3 per day, top-rated treatments
- **Cost Multiplier**: 1.0x
- **Locations**: Award-winning clinics, certified centers

### Budget
- **Focus**: Cost-effective treatments with essential care
- **Activities**: 1-2 per day, basic treatments
- **Cost Multiplier**: 0.6x
- **Locations**: Community wellness centers, basic clinics

### Premium
- **Focus**: Luxury treatments with premium care
- **Activities**: 3-4 per day, luxury treatments
- **Cost Multiplier**: 1.5x
- **Locations**: VIP suites, luxury resorts

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `formData` | `StepperFormData` | Yes | User's form data including dates, themes, and budget |

## Dependencies

- `MockSchedule.svelte` - The underlying schedule generator
- UI components: `Tabs`, `Card`, `Badge`
- Lucide icons: `Crown`, `DollarSign`, `Scale`

## Integration

The component is already integrated into `ResultsSection.svelte` and replaces the single `MockSchedule` component to provide multiple options for users to choose from.