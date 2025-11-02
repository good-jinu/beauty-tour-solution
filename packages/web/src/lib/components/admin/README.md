# Admin Components

This directory contains the admin interface components for the Activity Management System.

## Components

### ActivityForm.svelte
A comprehensive form component for creating and editing activities. Features:
- Real-time validation with detailed error messages
- Support for all activity properties (name, theme, location, price, working hours, etc.)
- Responsive design with sectioned layout
- Working hours management with day-by-day configuration

### ActivityManagementDashboard.svelte
The main dashboard for managing activities. Features:
- Paginated activity list with search and filtering
- Real-time search with debouncing
- Sorting by name, theme, price, or creation date
- Filter by theme, region, and status
- Loading states and error handling
- Empty state with helpful messaging

### ActivityCard.svelte
A display component for individual activities. Features:
- Compact activity information display
- Theme-based color coding
- Status indicators (active/inactive)
- Quick action buttons (edit/delete)
- Responsive design
- Formatted price and working hours display

## Usage

```svelte
<script>
import { ActivityForm, ActivityManagementDashboard, ActivityCard } from '$lib/components/admin';

// Use in your admin pages
</script>
```

## Requirements Covered

These components fulfill the following requirements from the Activity Management System specification:

- **1.1-1.5**: Activity creation with proper form validation
- **2.1-2.5**: Activity listing, search, and filtering
- **3.1-3.5**: Activity editing capabilities  
- **4.1-4.5**: Activity deletion with confirmation
- **8.1-8.5**: Comprehensive data validation and error display