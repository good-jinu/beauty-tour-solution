# Authentication Middleware

This middleware provides cookie-based guest ID management for the Beauty Tour Solution application.

## Features

- **UUID v4 Generation**: Creates cryptographically secure guest IDs
- **Cookie Security**: Implements proper security flags (HttpOnly, Secure, SameSite)
- **Validation**: Validates existing guest IDs and regenerates invalid ones
- **Environment Awareness**: Adjusts security settings based on production/development environment

## Usage

### Basic Usage in SvelteKit Routes

```typescript
// src/routes/api/example/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { validateGuestId } from '$lib/server/middleware/auth';

export const GET: RequestHandler = async ({ cookies }) => {
	// Validate or create guest ID
	const { guestId, isNewGuest } = validateGuestId(cookies);
	
	return new Response(JSON.stringify({
		guestId,
		isNewGuest,
		message: 'Guest authenticated successfully'
	}), {
		headers: { 'Content-Type': 'application/json' }
	});
};
```

### Advanced Usage with AuthMiddleware Class

```typescript
import { AuthMiddleware } from '$lib/server/middleware/auth';

// Create custom middleware instance
const authMiddleware = new AuthMiddleware(true); // Production mode

// In your route handler
export const POST: RequestHandler = async ({ cookies, request }) => {
	try {
		// Validate guest ID
		const { guestId, isNewGuest } = authMiddleware.validateGuestId(cookies);
		
		// Your business logic here
		const data = await request.json();
		
		return new Response(JSON.stringify({ success: true, guestId }));
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Authentication failed' }), {
			status: 500
		});
	}
};
```

### Regenerating Guest IDs

```typescript
import { authMiddleware } from '$lib/server/middleware/auth';

// Regenerate guest ID (useful for security purposes)
const newGuestId = authMiddleware.regenerateGuestId(cookies);
```

### Clearing Guest IDs

```typescript
import { authMiddleware } from '$lib/server/middleware/auth';

// Clear guest ID (logout functionality)
authMiddleware.clearGuestId(cookies);
```

## Configuration

The middleware automatically configures cookies based on the environment:

### Development Mode
- `httpOnly: true`
- `secure: false`
- `sameSite: 'lax'`
- `maxAge: 30 days`
- `path: '/'`

### Production Mode
- `httpOnly: true`
- `secure: true` (HTTPS only)
- `sameSite: 'lax'`
- `maxAge: 30 days`
- `path: '/'`

## Security Features

1. **HttpOnly Cookies**: Prevents XSS attacks by making cookies inaccessible to JavaScript
2. **Secure Flag**: Ensures cookies are only sent over HTTPS in production
3. **SameSite Protection**: Prevents CSRF attacks
4. **UUID Validation**: Ensures guest IDs are properly formatted
5. **Automatic Regeneration**: Invalid guest IDs are automatically replaced

## Error Handling

The middleware includes comprehensive error handling:

- Invalid UUID formats are automatically regenerated
- Cookie setting failures are logged but don't break the flow
- Fallback mechanisms ensure a guest ID is always available

## Requirements Compliance

This middleware satisfies the following requirements:

- **2.1**: Generates unique Guest_ID and sets HTTP cookie on first visit
- **2.2**: Retrieves existing Guest_ID from cookie on return visits
- **2.3**: Validates Guest_ID format as valid UUID v4
- **2.4**: Sets cookie with appropriate security flags
- **2.5**: Generates new Guest_ID if cookie is invalid or missing