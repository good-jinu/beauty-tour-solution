import { json } from "@sveltejs/kit";
import {
	createAdminSession,
	validateAdminCredentials,
} from "$lib/server/middleware/adminAuth";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { password } = await request.json();

		if (!password) {
			return json(
				{ success: false, error: "Password required" },
				{ status: 400 },
			);
		}

		if (validateAdminCredentials(password)) {
			createAdminSession(cookies);
			return json({ success: true });
		} else {
			return json(
				{ success: false, error: "Invalid password" },
				{ status: 401 },
			);
		}
	} catch (error) {
		console.error("Login error:", error);
		return json({ success: false, error: "Login failed" }, { status: 500 });
	}
};
