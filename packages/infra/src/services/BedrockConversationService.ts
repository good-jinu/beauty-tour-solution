import {
	BedrockRuntimeClient,
	ConversationRole,
	ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { BedrockConfig } from "../types/index.js";

export interface ConversationRequest {
	prompt: string;
	maxTokens?: number;
	temperature?: number;
	topP?: number;
}

export interface ConversationResponse {
	success: boolean;
	response?: string;
	error?: string;
	details?: string;
}

export class BedrockConversationService {
	private client: BedrockRuntimeClient;
	private modelId: string;

	constructor(config: BedrockConfig = {}) {
		const region = config.region ?? process.env.APP_AWS_REGION ?? "us-east-1";
		this.client = new BedrockRuntimeClient({ region });
		this.modelId = config.modelId ?? "openai.gpt-oss-120b-1:0";
	}

	async generateResponse(
		request: ConversationRequest,
	): Promise<ConversationResponse> {
		try {
			// Build conversation messages in the format expected by the Converse API
			const conversation = [
				{
					role: ConversationRole.USER,
					content: [{ text: request.prompt }],
				},
			];

			const command = new ConverseCommand({
				modelId: this.modelId,
				messages: conversation,
				inferenceConfig: {
					maxTokens: request.maxTokens ?? 4096,
					temperature: request.temperature ?? 0.7,
					topP: request.topP ?? 0.9,
				},
			});

			const response = await this.client.send(command);

			// Response structure: response.output.message.content[0].text
			const aiResponse =
				response?.output?.message?.content?.[0]?.text ??
				response?.output?.message?.content?.[1]?.text;

			if (!aiResponse) {
				return {
					success: false,
					error: "No response from AI model",
					details: "The AI model did not return any content",
				};
			}

			return {
				success: true,
				response: aiResponse,
			};
		} catch (error) {
			console.error("Bedrock Conversation API Error:", error);

			// Handle specific AWS errors
			if (error instanceof Error) {
				if (error.name === "ThrottlingException") {
					return {
						success: false,
						error: "Service temporarily unavailable",
						details: "Too many requests. Please try again in a moment.",
					};
				}

				if (error.name === "ValidationException") {
					return {
						success: false,
						error: "Invalid request data",
						details: error.message,
					};
				}

				if (error.name === "AccessDeniedException") {
					return {
						success: false,
						error: "Access denied",
						details: "Insufficient permissions to access the AI model",
					};
				}
			}

			return {
				success: false,
				error: "Failed to generate AI response",
				details: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}
}
