import {
	BedrockAgentCoreClient,
	InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";

interface AgentCoreConfig {
	arn: string;
	agentName: string;
	region: string;
}

export class BedrockAgentCoreService {
	private client: BedrockAgentCoreClient;
	private config: AgentCoreConfig;

	constructor() {
		this.config = this.getConfigFromEnv();
		this.client = new BedrockAgentCoreClient({
			region: this.config.region,
		});
	}

	private getConfigFromEnv(): AgentCoreConfig {
		const arn = process.env.BEDROCK_AGENT_ARN;
		const agentName = process.env.BEDROCK_AGENT_NAME;
		const region =
			process.env.BEDROCK_AGENT_REGION || process.env.AWS_REGION || "us-east-1";

		if (!arn || !agentName) {
			throw new Error(
				"Missing required environment variables for AgentCore:\n" +
					"- BEDROCK_AGENT_ARN\n" +
					"- BEDROCK_AGENT_NAME\n" +
					"Make sure to run agentcore deployment first and source the environment variables.",
			);
		}

		return { arn, agentName, region };
	}

	async queryAgent(
		prompt: string,
		type: "auto" | "default" | "trip-planner" = "auto",
	): Promise<string> {
		try {
			// Prepare the payload — the text you want to send to the agent
			const payload = new TextEncoder().encode(
				JSON.stringify({
					prompt,
					type,
				}),
			);

			// Prepare the command input
			const input = {
				contentType: "application/json",
				accept: "application/json",
				agentRuntimeArn: this.config.arn,
				payload,
			};

			// Send the command
			const command = new InvokeAgentRuntimeCommand(input);
			const response = await this.client.send(command);

			// Parse the response stream
			const bytes = await response.response?.transformToByteArray();
			const responseData = JSON.parse(new TextDecoder("utf-8").decode(bytes));

			console.log("🧠 Agent response:", responseData);

			// Extract the text from the standard Bedrock Agent response format
			if (responseData.result.content?.[0]?.text) {
				return responseData.result.content[0].text;
			} else {
				return responseData.result;
			}
		} catch (error) {
			console.error("❌ Error querying agent:", error);
			throw new Error(
				`Failed to query agent: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async queryAgentForSchedule(prompt: string): Promise<string> {
		return this.queryAgent(prompt, "trip-planner");
	}

	async queryAgentForDefault(prompt: string): Promise<string> {
		return this.queryAgent(prompt, "default");
	}

	getConfig(): AgentCoreConfig {
		return this.config;
	}
}

// Convenience function for backward compatibility
export async function queryMainAgent(prompt: string): Promise<string> {
	const service = new BedrockAgentCoreService();
	return service.queryAgent(prompt);
}
