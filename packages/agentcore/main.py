from bedrock_agentcore import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel
from strands_tools import use_llm, memory
import os
from agents.query_classifier import determine_query_type, QueryType
from agents.trip_planner import process_trip_planner_query
from agents.default_query_handler import process_default_query

# Set knowledge base ID (can be overridden by environment variable)
os.environ["STRANDS_KNOWLEDGE_BASE_ID"] = 'yourID'
KB_ID = os.environ.get("STRANDS_KNOWLEDGE_BASE_ID")
print(f"Using Knowledge Base ID: {KB_ID}")

model_id = "amazon.nova-pro-v1:0"
model = BedrockModel(
    model_id=model_id,
)
app = BedrockAgentCoreApp()
agent = Agent(
    model=model,
    tools=[memory, use_llm]
)

@app.entrypoint
def invoke(payload):
    """Main entry point for AI agent with support for multiple query types"""
    user_message = payload.get("prompt", "Hello! How can I help you today?")
    
    # Determine the query type
    query_type = determine_query_type(agent, user_message)
    
    print(f"Detected query type: {query_type.value}")
    
    # Route to appropriate handler based on query type
    if query_type == QueryType.TRIP_PLANNER:
        result = process_trip_planner_query(agent, user_message)
    else:  # QueryType.DEFAULT
        result = process_default_query(agent, user_message)
    
    return {"result": result}

if __name__ == "__main__":
    app.run()
