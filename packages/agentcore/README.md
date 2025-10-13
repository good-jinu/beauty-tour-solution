# AgentCore Package

This package contains the Bedrock AgentCore implementation for the Beauty Tour Solution.

## Setup

1. Make sure you have `uv` installed (Python package manager)
2. Set the required environment variable:
   ```bash
   export APP_AWS_REGION="us-east-1"  # or your preferred region
   ```

## Deployment

### Option 1: Using the deployment script (Recommended)
From the project root:
```bash
pnpm run deploy-agentcore
```

### Option 2: Manual deployment
```bash
cd packages/agentcore
pnpm run prod-deploy
```

## After Deployment

After successful deployment, the following files will be created:
- `deployment-info.json` - Contains comprehensive deployment information including:
  - ARN (Agent Runtime ARN)
  - Agent Name
  - Agent ID
  - Region
  - AWS Account ID
  - Status
  - Endpoint ARN

This information is automatically extracted from `uv run agentcore status -v` and used by the `BedrockAgentCoreService` in the infra package.

## Getting Deployment Info

To manually extract deployment information:
```bash
cd packages/agentcore
pnpm run get-info
```

## Environment Variables

- `APP_AWS_REGION` - AWS region for deployment (default: us-east-1)
- `BEDROCK_AGENT_ARN` - (Optional) Manual override for agent ARN
- `BEDROCK_AGENT_NAME` - (Optional) Manual override for agent name

## Usage in Other Packages

The infra package can use the deployed agent by sourcing the environment variables:

```bash
# Source the environment variables
source packages/agentcore/.env.agentcore

# Or set them manually in your deployment process
export BEDROCK_AGENT_ARN="your-agent-arn"
export BEDROCK_AGENT_NAME="your-agent-name"
export BEDROCK_AGENT_REGION="us-east-1"
```

Then use the service:

```typescript
import { BedrockAgentCoreService } from '../services/BedrockAgentCoreService.js';

const service = new BedrockAgentCoreService();
const response = await service.queryAgent("Hello, what can you do?");
```

The web package automatically sources the environment variables during deployment.

## Cleanup

To remove the deployed agent:
```bash
pnpm run prod-remove
```