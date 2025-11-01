from bedrock_agentcore import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel
from strands_tools import use_llm, memory
import os
from agents.query_classifier import determine_query_type, QueryType
from agents.trip_planner import process_trip_planner_query
from agents.default_query_handler import process_default_query
from agents.trip_planner import process_structured_trip_planner_query

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
    # Check if this is a structured data request
    is_structured = payload.get("structured", False)
    
    if is_structured:
        # Handle structured data request
        structured_data = payload.get("data", {})
        request_type = payload.get("type", "auto")
        
        print(f"Processing structured request - type: {request_type}")
        print(f"Structured data: {structured_data}")
        
        # For structured requests, route based on type
        if request_type == "trip-planner":
            result = process_structured_trip_planner_query(agent, structured_data)
        else:
            # For other structured requests, convert to prompt and use default handler
            user_message = f"Process this structured request: {structured_data}"
            result = process_default_query(agent, user_message)
        
        return {
            "result": result
        }
    else:
        # Handle traditional prompt-based request
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
