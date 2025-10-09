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
		const bucket = new sst.aws.Bucket(
			process.env.STORAGE_BUCKET_NAME ?? "BeautyTourSolutionStorage",
			{
				access: "public",
			},
		);
		// SvelteKit 앱 배포 (Bedrock 권한 포함)
		const web = new sst.aws.SvelteKit("BeautyTourSolution", {
			domain: {
				name: process.env.WEB_DOMAIN ?? "",
				redirects: [`www.${process.env.WEB_DOMAIN ?? ""}`],
			},
			environment: {
				STORAGE_BUCKET_NAME: bucket.name,
				APP_AWS_REGION: process.env.APP_AWS_REGION ?? "us-east-1",
			},
			permissions: [
				{
					actions: [
						"bedrock:InvokeModel",
						"bedrock:InvokeModelWithResponseStream",
						"s3:PutObject",
						"s3:GetObject",
					],
					resources: ["*"],
				},
			],
			server: {
				timeout: "120 seconds",
			},
			link: [bucket],
		});

		return {
			url: web.url,
			bucket: bucket.name,
		};
	},
});
