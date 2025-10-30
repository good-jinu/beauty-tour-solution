from bedrock_agentcore import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel
from strands_tools import use_llm, memory
import os
from agents.query_classifier import determine_query_type, QueryType
from agents.trip_planner import process_trip_planner_query
from agents.default_query_handler import process_default_query

# Get knowledge base ID from environment variable
KB_ID = os.environ.get("STRANDS_KNOWLEDGE_BASE_ID")
if not KB_ID:
    raise ValueError("STRANDS_KNOWLEDGE_BASE_ID environment variable is required")
print(f"Using Knowledge Base ID: {KB_ID}")

model_id = "us.amazon.nova-pro-v1:0"
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
    request_type = payload.get("type", "auto")  # auto, default, or trip-planner
    
    # Determine the query type
    if request_type == "auto":
        query_type = determine_query_type(agent, user_message)
    elif request_type == "trip-planner":
        query_type = QueryType.TRIP_PLANNER
    else:  # request_type == "default"
        query_type = QueryType.DEFAULT
    
    print(f"Request type: {request_type}, Detected query type: {query_type.value}")
    
    # Route to appropriate handler based on query type
    if query_type == QueryType.TRIP_PLANNER:
        result = process_trip_planner_query(agent, user_message)
        # For trip planner, return structured response
        return {
            "result": result
        }
    else:  # QueryType.DEFAULT
        result = process_default_query(agent, user_message)
        # For default queries, return simple text response
        return {
            "result": result
        }

if __name__ == "__main__":
    app.run()
