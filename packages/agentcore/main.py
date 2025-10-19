from bedrock_agentcore import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel
from strands_tools import use_llm, memory
import os
import json
from datetime import datetime
from enum import Enum

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

class QueryType(Enum):
    """Enum for different query types"""
    DEFAULT = "default"
    TRIP_PLANNER = "trip-planner"

# System prompts for different query types
QUERY_TYPE_CLASSIFIER_PROMPT = """
You are a query type classifier. Analyze the user's query and respond with ONLY one word:
- "trip-planner" if the query is asking for structured beauty journey schedule generation, travel planning, or itinerary creation
- "default" for all other queries (knowledge base questions, general information, storage requests)

Trip-planner indicators:
- Mentions "generate a detailed, structured beauty journey schedule"
- Contains "respond with ONLY a valid JSON object"
- Asks for "schedule generation" or "beauty journey schedule"
- Requests travel itinerary, treatment planning, or structured trip data
- Contains destination, dates, themes, budget information for planning

Default query indicators:
- General questions about beauty treatments, procedures, or information
- Requests to store or retrieve information from knowledge base
- Conversational queries not related to structured planning

Respond with only "trip-planner" or "default".
"""

ACTION_SYSTEM_PROMPT = """
You are a classifier that determines user intent. Analyze the user's query and respond with ONLY one word:
- "store" if the user wants to save, remember, or store information
- "retrieve" if the user is asking a question or wants to get information

Examples:
- "Remember that my birthday is July 25" -> store
- "What is my birthday?" -> retrieve
- "Save this information: I like pizza" -> store
- "Tell me about pizza" -> retrieve

Respond with only "store" or "retrieve".
"""

ANSWER_SYSTEM_PROMPT = """
You are a helpful assistant that answers questions based on information from a knowledge base.
Use the provided information to give accurate, helpful responses.
If the information is not sufficient, say so clearly.
"""

TRIP_PLANNER_SYSTEM_PROMPT = """
You are a professional beauty and medical tourism consultant specializing in creating detailed, structured schedules.

Your task is to generate a comprehensive beauty journey schedule in valid JSON format.

CRITICAL REQUIREMENTS:
1. You MUST respond with ONLY a valid JSON object - no additional text, explanations, or formatting
2. The JSON must follow the exact structure specified in the user's request
3. All dates must be in ISO format (YYYY-MM-DD)
4. All costs must be realistic numbers for the specified region
5. Activities must be logically scheduled with appropriate timing and recovery periods
6. Include variety in treatments while respecting the selected themes

SCHEDULING PRINCIPLES:
- Day 1: Arrival, consultation, light activities
- Middle days: Main treatments with adequate recovery time
- Final day: Follow-up appointments, departure preparation
- Balance treatment intensity with recovery needs
- Consider jet lag and travel fatigue

COST GUIDELINES:
- Consultation: $100-300
- Basic treatments: $200-500
- Advanced treatments: $500-1500
- Major procedures: $1500-5000
- Accommodation: $100-400 per night
- Transportation: $50-200 per trip

Remember: Respond with ONLY the JSON object, nothing else.
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

def determine_action(agent, query):
    """Determine if the query is a store or retrieve action for default queries."""
    result = agent.tool.use_llm(
        prompt=f"Query: {query}",
        system_prompt=ACTION_SYSTEM_PROMPT
    )
    
    # Clean and extract the action
    action_text = str(result).lower().strip()
    
    # Default to retrieve if response isn't clear
    if "store" in action_text:
        return "store"
    else:
        return "retrieve"

def process_default_query(agent, query):
    """Process a default query using the knowledge base workflow."""
    # Determine the action (store or retrieve)
    action = determine_action(agent, query)
    
    if action == "store":
        # Store the information
        agent.tool.memory(action="store", content=query)
        return "I've stored this information in the knowledge base."
    else:
        # Retrieve information
        try:
            result = agent.tool.memory(
                action="retrieve", 
                query=query, 
                min_score=0.4, 
                max_results=9
            )
            
            # Generate response from retrieved information
            if result:
                answer = agent.tool.use_llm(
                    prompt=f"User question: \"{query}\"\n\nInformation from knowledge base:\n{result}",
                    system_prompt=ANSWER_SYSTEM_PROMPT
                )
                return answer
            else:
                return "I couldn't find any relevant information in the knowledge base for your query."
        except Exception as e:
            return f"I encountered an issue retrieving information: {str(e)}"

def process_trip_planner_query(agent, query):
    """Process a trip-planner query to generate structured schedule output."""
    try:
        # Use the LLM tool with the trip planner system prompt
        result = agent.tool.use_llm(
            prompt=query,
            system_prompt=TRIP_PLANNER_SYSTEM_PROMPT
        )
        
        # Clean and validate the JSON response
        result_str = str(result).strip()
        
        # Remove any potential markdown formatting
        if result_str.startswith('```json'):
            result_str = result_str.replace('```json', '').replace('```', '').strip()
        elif result_str.startswith('```'):
            result_str = result_str.replace('```', '').strip()
        
        # Try to parse as JSON to validate
        try:
            json.loads(result_str)
            # If parsing succeeds, return the original string for the client to parse
            return result_str
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw result: {result_str}")
            
            # Return a fallback JSON structure
            return generate_fallback_schedule()
            
    except Exception as e:
        print(f"Trip planner generation error: {e}")
        return generate_fallback_schedule()

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

def generate_fallback_schedule():
    """Generate a fallback schedule when the main generation fails"""
    today = datetime.now()
    
    fallback = {
        "schedule": [
            {
                "date": today.strftime("%Y-%m-%d"),
                "dayNumber": 1,
                "activities": [
                    {
                        "time": "09:00",
                        "activity": "Initial Consultation",
                        "location": "Beauty Clinic",
                        "duration": "2h",
                        "cost": 200,
                        "description": "Comprehensive consultation and treatment planning",
                        "category": "consultation"
                    },
                    {
                        "time": "14:00",
                        "activity": "Skin Analysis",
                        "location": "Beauty Clinic",
                        "duration": "1h",
                        "cost": 150,
                        "description": "Advanced skin analysis and assessment",
                        "category": "consultation"
                    }
                ],
                "totalCost": 350,
                "notes": "Arrival day with initial assessments - fallback data"
            }
        ],
        "recommendations": {
            "clinics": [
                {
                    "name": "Premium Beauty Center",
                    "rating": 4.5,
                    "specialties": ["skincare", "wellness"],
                    "location": "City Center",
                    "estimatedCost": 1500,
                    "description": "Well-established clinic with experienced professionals"
                }
            ],
            "accommodation": [
                {
                    "name": "Recovery Hotel",
                    "type": "medical-hotel",
                    "rating": 4.2,
                    "amenities": ["medical support", "recovery rooms"],
                    "location": "Near medical district",
                    "pricePerNight": 150,
                    "description": "Comfortable accommodation for medical tourists"
                }
            ],
            "transportation": [
                {
                    "type": "airport-transfer",
                    "provider": "Medical Transport Service",
                    "estimatedCost": 60,
                    "description": "Reliable transfer service"
                }
            ]
        },
        "costBreakdown": {
            "treatments": 350,
            "accommodation": 150,
            "transportation": 60,
            "activities": 0,
            "total": 560,
            "budgetUtilization": 0.3
        },
        "summary": {
            "totalDays": 1,
            "totalActivities": 2,
            "totalThemes": 1,
            "estimatedCost": 560
        }
    }
    
    return json.dumps(fallback)

if __name__ == "__main__":
    app.run()