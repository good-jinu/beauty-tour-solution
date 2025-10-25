from enum import Enum

class QueryType(Enum):
    """Enum for different query types"""
    DEFAULT = "default"
    TRIP_PLANNER = "trip-planner"

# System prompts for different query types
QUERY_TYPE_CLASSIFIER_PROMPT = """
You are a query type classifier. Analyze the user's query and respond with ONLY one word:
- "trip-planner" if the query is asking for structured beauty tour schedule generation, travel planning, or itinerary creation
- "default" for all other queries (knowledge base questions, general information, storage requests)

Trip-planner indicators:
- Mentions "generate a detailed, structured beauty tour schedule"
- Contains "respond with ONLY a valid JSON object"
- Asks for "schedule generation" or "beauty tour schedule"
- Requests travel itinerary, treatment planning, or structured trip data
- Contains destination, dates, themes, budget information for planning

Default query indicators:
- General questions about beauty treatments, procedures, or information
- Requests to store or retrieve information from knowledge base
- Conversational queries not related to structured planning

Respond with only "trip-planner" or "default".
"""

def determine_query_type(agent, query):
    """Determine the type of query: default or trip-planner"""
    try:
        result = agent.tool.use_llm(
            prompt=f"Query: {query}",
            system_prompt=QUERY_TYPE_CLASSIFIER_PROMPT
        )

        # Clean and extract the query type
        query_type_text = str(result).lower().strip()

        if "trip-planner" in query_type_text:
            return QueryType.TRIP_PLANNER
        else:
            return QueryType.DEFAULT

    except Exception as e:
        print(f"Error determining query type: {e}")
        # Default to DEFAULT type on error
        return QueryType.DEFAULT
