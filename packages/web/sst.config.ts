/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
	app(input) {
		return {
			name: "BeautyTourSolution",
			removal: input?.stage === "production" ? "retain" : "remove",
			protect: input?.stage === "production",
			home: "aws",
		};
	},
	async run() {
		// SvelteKit 앱 배포 (Bedrock 권한 포함)
		const web = new sst.aws.SvelteKit("BeautyTourSolution", {
			domain: {
				name: process.env.WEB_DOMAIN ?? "",
				redirects: [`www.${process.env.WEB_DOMAIN ?? ""}`],
			},
			permissions: [
				{
					actions: [
						"bedrock:InvokeModel",
						"bedrock:InvokeModelWithResponseStream",
					],
					resources: ["*"],
				},
			],
			server: {
				timeout: "60 seconds",
			},
		});

		return {
			url: web.url,
		};
	},
});
