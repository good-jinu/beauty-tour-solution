/**
 * Middleware exports for server-side functionality
 */

export {
	AdminAuthMiddleware,
	type AdminAuthResult,
	type AdminSessionCookieConfig,
	adminAuthMiddleware,
	createAdminSession,
	destroyAdminSession,
	validateAdminAuth,
	validateAdminCredentials,
} from "./adminAuth.js";
export {
	AuthMiddleware,
	type AuthResult,
	authMiddleware,
	createGuestId,
	type GuestIdCookieConfig,
	setGuestIdCookie,
	validateGuestId,
} from "./auth.js";
