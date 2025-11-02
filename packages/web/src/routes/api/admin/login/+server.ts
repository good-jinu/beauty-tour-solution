import { json } from "@sveltejs/kit";
import {
	createAdminSession,
	validateAdminCredentials,
} from "$lib/server/middleware";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { password } = await request.json();

		if (!password) {
			return json(
				{
					success: false,
					error: "Password is required",
				},
				{ status: 400 },
			);
		}

		if (!validateAdminCredentials(password)) {
			return json(
				{
					success: false,
					error: "Invalid password",
				},
				{ status: 401 },
			);
		}

		// Create admin session
		const sessionId = createAdminSession(cookies);

		return json({
			success: true,
			message: "Login successful",
			sessionId,
		});
	} catch (error) {
		console.error("Admin login error:", error);
		return json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 },
		);
	}
};
