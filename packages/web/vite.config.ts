import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import envCompatiblePlugin from "vite-plugin-env-compatible";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), envCompatiblePlugin()],
	define: {
		"process.env": process.env,
	},
});
