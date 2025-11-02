import { redirect } from "@sveltejs/kit";
import { validateAdminAuth } from "$lib/server/middleware";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	// Skip authentication check for login page
	if (url.pathname === "/admin/login") {
		return {};
	}

	const authResult = validateAdminAuth(cookies);

	if (!authResult.isAuthenticated) {
		throw redirect(302, "/admin/login");
	}

	return {
		isAuthenticated: true,
		sessionId: authResult.sessionId,
	};
};
