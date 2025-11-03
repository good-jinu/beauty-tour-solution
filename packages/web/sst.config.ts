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

		// DynamoDB table for storing user schedules
		const schedulesTable = new sst.aws.Dynamo("BeautyTourSchedules", {
			fields: {
				guestId: "string",
				scheduleId: "string",
			},
			primaryIndex: {
				hashKey: "guestId",
				rangeKey: "scheduleId",
			},
			ttl: "ttl",
		});

		// DynamoDB table for storing beauty tour activities
		const activitiesTable = new sst.aws.Dynamo("BeautyTourActivities", {
			fields: {
				activityId: "string",
				theme: "string",
				region: "string",
				price: "number",
				createdAt: "string",
			},
			primaryIndex: {
				hashKey: "activityId",
			},
			globalIndexes: {
				ThemeIndex: {
					hashKey: "theme",
					rangeKey: "createdAt",
				},
				LocationIndex: {
					hashKey: "region",
					rangeKey: "price",
				},
				PriceIndex: {
					hashKey: "price",
					rangeKey: "createdAt",
				},
			},
		});

		// Router
		const router = new sst.aws.Router(
			process.env.WEB_DOMAIN?.replace(/\./g, "_") ?? "custom_com",
			{
				// Only configure custom domain if environment variables are set
				...(process.env.ROOT_DOMAIN && process.env.WEB_DOMAIN
					? {
							domain: {
								name: process.env.ROOT_DOMAIN,
								aliases: [process.env.WEB_DOMAIN],
							},
						}
					: {}),
			},
		);

		// SvelteKit
		const web = new sst.aws.SvelteKit("BeautyTourSolution", {
			router: {
				instance: router,
				domain: process.env.WEB_DOMAIN ?? "",
			},
			environment: {
				APP_AWS_REGION: process.env.APP_AWS_REGION ?? "us-east-1",
				EVENTS_TABLE_NAME: eventsTable.name,
				PLANS_TABLE_NAME: plansTable.name,
				SCHEDULES_TABLE_NAME: schedulesTable.name,
				ACTIVITIES_TABLE_NAME: activitiesTable.name,

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
			link: [plansTable, eventsTable, schedulesTable, activitiesTable],
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
						"dynamodb:Scan",
					],
					resources: [
						plansTable.arn,
						eventsTable.arn,
						eventsTable.arn.apply((t) => `${t}/index/*`),
						schedulesTable.arn,
						activitiesTable.arn,
						activitiesTable.arn.apply((t) => `${t}/index/*`),
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
			schedulesTable: schedulesTable.name,
			activitiesTable: activitiesTable.name,
		};
	},
});
