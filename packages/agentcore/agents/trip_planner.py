import json
from datetime import datetime

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
