import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";
import envCompatiblePlugin from "vite-plugin-env-compatible";

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		envCompatiblePlugin(),
		SvelteKitPWA({
			strategies: "generateSW",
			registerType: "autoUpdate",
			manifest: {
				name: "Beauty Tour Solution",
				short_name: "BTS",
				description:
					"Find your Beauty Tour - Discover and plan your perfect beauty and wellness travel experiences",
				theme_color: "#b0e3f0",
				background_color: "#b0e3f0",
				display: "standalone",
				start_url: "/",
				scope: "/",
				orientation: "portrait-primary",
				lang: "en",
				categories: ["travel", "lifestyle", "health"],
				icons: [
					{
						src: "/icon/192.png",
						sizes: "192x192",
						type: "image/png",
						purpose: "any maskable",
					},
					{
						src: "/icon/512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,svg,png,ico,txt,woff2}"],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\./,
						handler: "NetworkFirst",
						options: {
							cacheName: "api-cache",
							expiration: {
								maxEntries: 100,
								maxAgeSeconds: 60 * 60 * 24, // 24 hours
							},
						},
					},
					{
						urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
						handler: "CacheFirst",
						options: {
							cacheName: "images-cache",
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
							},
						},
					},
				],
			},
			devOptions: {
				enabled: true,
				type: "module",
			},
		}),
	],
	define: {
		"process.env": process.env,
	},
});
