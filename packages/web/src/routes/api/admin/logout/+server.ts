import { json } from "@sveltejs/kit";
import { destroyAdminSession } from "$lib/server/middleware";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies }) => {
	try {
		destroyAdminSession(cookies);

		return json({
			success: true,
			message: "Logout successful",
		});
	} catch (error) {
		console.error("Admin logout error:", error);
		return json(
			{
				success: false,
				error: "Internal server error",
			},
			{ status: 500 },
		);
	}
};
