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
		// DynamoDB table for storing user plans
		const plansTable = new sst.aws.Dynamo("BeautyTourPlans", {
			fields: {
				guestId: "string",
				planId: "string",
			},
			primaryIndex: {
				hashKey: "guestId",
				rangeKey: "planId",
			},
		});

		// SvelteKit
		const web = new sst.aws.SvelteKit("BeautyTourSolution", {
			domain: {
				name: process.env.WEB_DOMAIN ?? "",
				redirects: [`www.${process.env.WEB_DOMAIN ?? ""}`],
			},
			environment: {
				APP_AWS_REGION: process.env.APP_AWS_REGION ?? "us-east-1",
			},
			link: [plansTable],
			permissions: [
				{
					actions: [
						"bedrock:InvokeModel",
						"bedrock:InvokeModelWithResponseStream",
						"bedrock-agentcore:*",
						"s3:PutObject",
						"s3:GetObject",
						"dynamodb:PutItem",
						"dynamodb:GetItem",
						"dynamodb:Query",
						"dynamodb:UpdateItem",
						"dynamodb:DeleteItem",
					],
					resources: ["*"],
				},
			],
			server: {
				timeout: "120 seconds",
			},
		});

		return {
			url: web.url,
			plansTable: plansTable.name,
		};
	},
});
