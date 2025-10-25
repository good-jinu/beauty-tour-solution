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

		// DynamoDB table for storing user events
		const eventsTable = new sst.aws.Dynamo("BeautyTourEvents", {
			fields: {
				guest_id: "string",
				event_timestamp: "string",
				event_type: "string",
			},
			primaryIndex: {
				hashKey: "guest_id",
				rangeKey: "event_timestamp",
			},
			globalIndexes: {
				EventTypeIndex: {
					hashKey: "event_type",
					rangeKey: "event_timestamp",
				},
			},
			ttl: "ttl",
		});

		// SvelteKit
		const web = new sst.aws.SvelteKit("BeautyTourSolution", {
			domain: {
				name: process.env.WEB_DOMAIN ?? "",
				redirects: [`www.${process.env.WEB_DOMAIN ?? ""}`],
			},
			environment: {
				APP_AWS_REGION: process.env.APP_AWS_REGION ?? "us-east-1",
				AWS_REGION: process.env.APP_AWS_REGION ?? "us-east-1",
				EVENTS_TABLE_NAME: eventsTable.name,
				PLANS_TABLE_NAME: plansTable.name,

				// Event Tracking Configuration
				EVENT_TRACKING_ENABLED: process.env.EVENT_TRACKING_ENABLED ?? "true",
				EVENT_BATCHING_ENABLED: process.env.EVENT_BATCHING_ENABLED ?? "true",
				EVENT_BATCH_SIZE: process.env.EVENT_BATCH_SIZE ?? "10",
				EVENT_BATCH_TIMEOUT: process.env.EVENT_BATCH_TIMEOUT ?? "5000",
				RATE_LIMIT_PER_MINUTE: process.env.RATE_LIMIT_PER_MINUTE ?? "100",

				// Cookie Configuration
				GUEST_COOKIE_MAX_AGE: process.env.GUEST_COOKIE_MAX_AGE ?? "2592000",
				GUEST_COOKIE_SECURE: process.env.GUEST_COOKIE_SECURE ?? "true",
				GUEST_COOKIE_SAME_SITE: process.env.GUEST_COOKIE_SAME_SITE ?? "lax",

				// Privacy and Security
				EVENT_TRACKING_ENABLE_OPT_OUT:
					process.env.EVENT_TRACKING_ENABLE_OPT_OUT ?? "true",
				EVENT_TRACKING_SANITIZE_DATA:
					process.env.EVENT_TRACKING_SANITIZE_DATA ?? "true",
				EVENT_TRACKING_LOG_LEVEL:
					process.env.EVENT_TRACKING_LOG_LEVEL ?? "info",
			},
			link: [plansTable, eventsTable],
			permissions: [
				{
					actions: [
						"bedrock:InvokeModel",
						"bedrock:InvokeModelWithResponseStream",
						"bedrock-agentcore:*",
					],
					resources: ["*"],
				},
				{
					actions: ["s3:PutObject", "s3:GetObject"],
					resources: ["*"],
				},
				{
					actions: [
						"dynamodb:PutItem",
						"dynamodb:GetItem",
						"dynamodb:Query",
						"dynamodb:UpdateItem",
						"dynamodb:DeleteItem",
						"dynamodb:BatchWriteItem",
					],
					resources: [
						plansTable.arn,
						eventsTable.arn,
						`${eventsTable.arn}/index/*`,
					],
				},
			],
			server: {
				timeout: "120 seconds",
			},
		});

		return {
			url: web.url,
			plansTable: plansTable.name,
			eventsTable: eventsTable.name,
		};
	},
});
