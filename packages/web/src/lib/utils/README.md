# Event Tracking System

This directory contains the client-side event tracking system for the Beauty Tour Solution application.

## Overview

The event tracking system automatically captures user interactions and sends them to the backend API for analytics. It includes:

- **Automatic tracking**: Page visits, clicks, and scroll events
- **Performance optimization**: Event batching, throttling, and retry logic
- **Privacy-focused**: Uses cookie-based guest IDs, no personal data collection

## Files

- `eventLogger.ts` - Core event logger implementation
- `tracking.ts` - Convenient utilities and Svelte actions for components
- `../config/eventTracking.ts` - Configuration management

## Usage

### Automatic Tracking

The event logger is automatically initialized in the app layout (`+layout.svelte`) and will track:

- **Page visits**: Automatically tracked on navigation
- **Clicks**: All click events on interactive elements
- **Scroll events**: Tracked at 25% intervals (25%, 50%, 75%, 100%)

### Manual Tracking

You can manually track events using the utilities in `tracking.ts`:

```typescript
import { trackCustomEvent, trackButtonClick } from "$lib/utils/tracking";
import { EVENT_TYPES } from "@bts/core";

// Track a custom event
await trackCustomEvent(EVENT_TYPES.CLICK, {
  element_text: "custom_action",
});

// Track button clicks with context
await trackButtonClick(buttonElement, {
  action: "form_submit",
  category: "tour_planning",
});
```

### Svelte Actions

Use Svelte actions for automatic tracking:

```svelte
<script>
  import { trackClickAction, trackFormSubmit } from "$lib/utils/tracking";
</script>

<!-- Automatically track clicks -->
<button use:trackClickAction>Click me</button>

<!-- Automatically track form submissions -->
<form use:trackFormSubmit>
  <!-- form content -->
</form>
```

## Configuration

Event tracking can be configured via environment variables:

```bash
EVENT_TRACKING_ENABLED="true"
EVENT_BATCHING_ENABLED="true"
EVENT_BATCH_SIZE="10"
EVENT_BATCH_TIMEOUT="5000"
RATE_LIMIT_PER_MINUTE="100"
```

## Privacy & Performance

- **Guest IDs**: Uses UUID-based guest identification via secure cookies
- **No PII**: Does not collect personally identifiable information
- **Batching**: Groups events to reduce HTTP requests
- **Throttling**: Limits scroll and click event frequency
- **Retry logic**: Handles network failures with exponential backoff
- **Silent failures**: Never disrupts user experience

## Event Types

The system tracks three main event types:

1. **page_visit**: Navigation and page loads
2. **click**: User interactions with elements
3. **scroll**: Scroll progress through pages

Each event includes contextual data like:
- Page URL and timestamp
- Viewport dimensions
- User agent
- Element details (for clicks)
- Scroll percentage (for scroll events)

## API Integration

Events are sent to `/api/events` with the following endpoints:

- `POST /api/events` - Single event
- `PUT /api/events` - Batch events (up to 25 events)

The API handles authentication via guest ID cookies and stores events in DynamoDB.

## Development

To disable tracking during development:

```typescript
// In your component or config
import { destroyEventLogger } from "$lib/utils/eventLogger";

// Disable tracking
destroyEventLogger();
```

Or set `EVENT_TRACKING_ENABLED="false"` in your environment variables.