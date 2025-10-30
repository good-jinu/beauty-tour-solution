#!/usr/bin/env node

/**
 * Script to extract deployment information from bedrock agentcore
 * This script should be run after successful deployment to get ARN and agent name
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

function getDeploymentInfo() {
	try {
		console.log("🔍 Getting deployment info from agentcore status...");

		// Get deployment info from agentcore CLI with verbose JSON output
		const result = execSync("uv run agentcore status -v", {
			cwd: __dirname,
			encoding: "utf8",
			stdio: "pipe",
		});

		// Extract JSON from the output (skip the initial log lines)
		const lines = result.split("\n");
		let jsonStartIndex = -1;

		// Find where the JSON starts (look for the opening brace)
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].trim().startsWith("{")) {
				jsonStartIndex = i;
				break;
			}
		}

		if (jsonStartIndex === -1) {
			throw new Error("Could not find JSON output in agentcore status");
		}

		// Join the JSON lines and fix line breaks in the middle of strings
		let jsonOutput = lines.slice(jsonStartIndex).join("\n");

		// Fix broken ARN strings that span multiple lines
		// This regex finds patterns like: "arn:aws:...\n"something" and joins them
		jsonOutput = jsonOutput.replace(/("arn:aws:[^"]*)\n([^"]*")/g, "$1$2");

		const statusData = JSON.parse(jsonOutput);

		// Extract the required information from the parsed JSON
		const deploymentInfo = {
			arn: statusData.agent.agentRuntimeArn,
			agentName: statusData.agent.agentRuntimeName,
			agentId: statusData.agent.agentRuntimeId,
			region: statusData.config.region,
			account: statusData.config.account,
			status: statusData.agent.status,
			endpointArn: statusData.endpoint.agentRuntimeEndpointArn,
			timestamp: new Date().toISOString(),
		};

		// Also write environment variables to a .env file for easy sourcing
		const envPath = path.join(__dirname, ".env.agentcore");
		const envContent = [
			`# AgentCore deployment environment variables`,
			`# Generated on ${deploymentInfo.timestamp}`,
			`BEDROCK_AGENT_ARN="${deploymentInfo.arn}"`,
			`BEDROCK_AGENT_NAME="${deploymentInfo.agentName}"`,
			`BEDROCK_AGENT_ID="${deploymentInfo.agentId}"`,
			`BEDROCK_AGENT_REGION="${deploymentInfo.region}"`,
			`BEDROCK_AGENT_ACCOUNT="${deploymentInfo.account}"`,
			`BEDROCK_AGENT_STATUS="${deploymentInfo.status}"`,
			`BEDROCK_AGENT_ENDPOINT_ARN="${deploymentInfo.endpointArn}"`,
			``,
		].join("\n");

		fs.writeFileSync(envPath, envContent);

		console.log("✅ Environment variables saved to:", envPath);
		console.log("📋 Deployment info:");
		console.log(`   ARN: ${deploymentInfo.arn}`);
		console.log(`   Agent Name: ${deploymentInfo.agentName}`);
		console.log(`   Agent ID: ${deploymentInfo.agentId}`);
		console.log(`   Region: ${deploymentInfo.region}`);
		console.log(`   Status: ${deploymentInfo.status}`);

		console.log("\n💡 To use in other packages, source the environment file:");
		console.log("   source packages/agentcore/.env.agentcore");

		return deploymentInfo;
	} catch (error) {
		console.error("❌ Error getting deployment info:", error.message);

		// Create a template file with placeholders
		const templateInfo = {
			arn: "REPLACE_WITH_ACTUAL_ARN",
			agentName: "main",
			agentId: "REPLACE_WITH_ACTUAL_AGENT_ID",
			region: process.env.APP_AWS_REGION || "us-east-1",
			account: "REPLACE_WITH_ACCOUNT_ID",
			status: "UNKNOWN",
			endpointArn: "REPLACE_WITH_ENDPOINT_ARN",
			timestamp: new Date().toISOString(),
			error: "Could not auto-detect deployment info",
		};

		const envPath = path.join(__dirname, ".env.agentcore");
		const envContent = [
			`# AgentCore deployment environment variables`,
			`# Generated on ${templateInfo.timestamp}`,
			`BEDROCK_AGENT_ARN="${templateInfo.arn}"`,
			`BEDROCK_AGENT_NAME="${templateInfo.agentName}"`,
			`BEDROCK_AGENT_ID="${templateInfo.agentId}"`,
			`BEDROCK_AGENT_REGION="${templateInfo.region}"`,
			`BEDROCK_AGENT_ACCOUNT="${templateInfo.account}"`,
			`BEDROCK_AGENT_STATUS="${templateInfo.status}"`,
			`BEDROCK_AGENT_ENDPOINT_ARN="${templateInfo.endpointArn}"`,
			``,
		].join("\n");

		console.log("📝 Template created at:", envPath);
		console.log(
			"Please manually update the deployment info after successful deployment",
		);

		return envContent;
	}
}

if (require.main === module) {
	getDeploymentInfo();
}

module.exports = { getDeploymentInfo };
