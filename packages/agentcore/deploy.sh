#!/bin/bash

# Load environment variables from .env file in the root directory
if [ -f "../../.env" ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' ../../.env | xargs)
else
    echo "Warning: .env file not found in root directory"
fi

# Verify required environment variables
if [ -z "$STRANDS_KNOWLEDGE_BASE_ID" ]; then
    echo "Error: STRANDS_KNOWLEDGE_BASE_ID is not set"
    exit 1
fi

if [ -z "$APP_AWS_REGION" ]; then
    echo "Error: APP_AWS_REGION is not set"
    exit 1
fi

echo "Deploying with:"
echo "  STRANDS_KNOWLEDGE_BASE_ID: $STRANDS_KNOWLEDGE_BASE_ID"
echo "  APP_AWS_REGION: $APP_AWS_REGION"

# Configure and launch the agent
uv run agentcore configure -e main.py -r "$APP_AWS_REGION" -n main
uv run agentcore launch \
  --env STRANDS_KNOWLEDGE_BASE_ID="$STRANDS_KNOWLEDGE_BASE_ID" \
  --env APP_AWS_REGION="$APP_AWS_REGION"
node get-deployment-info.js