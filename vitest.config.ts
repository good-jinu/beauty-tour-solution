import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			// you can use a list of glob patterns to define your projects
			// Vitest expects a list of config files
			// or directories where there is a config file
			"packages/*",
		],
	},
});
