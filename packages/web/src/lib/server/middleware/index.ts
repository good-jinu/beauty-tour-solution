/**
 * Middleware exports for server-side functionality
 */

export {
	AuthMiddleware,
	type AuthResult,
	authMiddleware,
	createGuestId,
	type GuestIdCookieConfig,
	setGuestIdCookie,
	validateGuestId,
} from "./auth.js";
