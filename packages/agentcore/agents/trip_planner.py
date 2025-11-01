from datetime import datetime
from pydantic import BaseModel
from typing import List

# Simplified models - LLM only generates activities, no calculations
class Activity(BaseModel):
    time: str
    activity: str
    location: str
    duration: str
    cost: int
    description: str
    category: str

class DaySchedule(BaseModel):
    date: str
    dayNumber: int
    activities: List[Activity]
    notes: str

class TripSchedule(BaseModel):
    schedule: List[DaySchedule]

TRIP_PLANNER_SYSTEM_PROMPT = """
You are a beauty tourism consultant. Generate activities for each day.

RULES:
- Day 1: consultations
- Day 2+: treatments  
- Final day: follow-ups
- Categories: consultation, treatment, recovery, wellness, transport
- Use realistic individual activity costs
- Don't calculate totals - just list activities
"""

def process_trip_planner_query(agent, query):
    """Process trip planner query with structured output - no calculations."""
    try:
        # Use structured output - LLM only generates activities
        result = agent.structured_output(
            TripSchedule,
            TRIP_PLANNER_SYSTEM_PROMPT + "\n\nRequest: " + query,
        )
        
        # Convert to dict and add calculations in business logic
        schedule_data = result.model_dump()
        
        # Calculate totals in business logic, not LLM
        total_cost = 0
        total_activities = 0
        
        for day in schedule_data["schedule"]:
            day_cost = sum(activity["cost"] for activity in day["activities"])
            day["totalCost"] = day_cost
            total_cost += day_cost
            total_activities += len(day["activities"])
        
        schedule_data["summary"] = {
            "totalDays": len(schedule_data["schedule"]),
            "totalActivities": total_activities,
            "totalThemes": len(set(activity["category"] for day in schedule_data["schedule"] for activity in day["activities"])),
            "estimatedCost": total_cost
        }
        
        return schedule_data
        
    except Exception as e:
        print(f"Trip planner generation error: {e}")
        return generate_fallback_schedule()

def process_structured_trip_planner_query(agent, structured_data):
    """Process structured trip planner data - no calculations."""
    try:
        # Extract trip details from structured data
        trip_details = structured_data.get("tripDetails", {})
        requirements = structured_data.get("requirements", {})
        
        # Create a detailed prompt from structured data
        prompt = f"""
Generate a beauty tourism schedule for {trip_details.get('region', 'Seoul')}.

TRIP DETAILS:
- Dates: {trip_details.get('startDate')} to {trip_details.get('endDate')} ({trip_details.get('duration')} days)
- Themes: {', '.join(trip_details.get('themes', []))}
- Budget: ${trip_details.get('budget', 0)} USD
- Solution Type: {trip_details.get('solutionType', 'topranking')}
{f"- Special Requests: {trip_details.get('specialRequests')}" if trip_details.get('specialRequests') else ""}

REQUIREMENTS:
- Day structure: {requirements.get('dayStructure', {})}
- Categories: {', '.join(requirements.get('categories', []))}
- Include specific locations and detailed descriptions
- Use realistic individual activity costs for {trip_details.get('region', 'Seoul')}
- Generate activities with individual costs only
- Don't calculate totals or summaries
"""
        
        # Use structured output - LLM only generates activities
        result = agent.structured_output(
            TripSchedule,
            TRIP_PLANNER_SYSTEM_PROMPT + "\n\n" + prompt,
        )
        
        # Convert to dict - calculations will be done in TypeScript business logic
        schedule_data = result.model_dump()
        
        # Don't add calculations here - let TypeScript handle it
        return schedule_data
        
    except Exception as e:
        print(f"Structured trip planner generation error: {e}")
        return generate_fallback_schedule()

def generate_fallback_schedule():
    """Generate fallback schedule with business logic calculations"""
    today = datetime.now()
    
    # Create fallback using Pydantic model
    fallback = TripSchedule(
        schedule=[
            DaySchedule(
                date=today.strftime("%Y-%m-%d"),
                dayNumber=1,
                activities=[
                    Activity(
                        time="09:00",
                        activity="Beauty Consultation",
                        location="Seoul Beauty Center",
                        duration="1h",
                        cost=200,
                        description="Initial consultation and treatment planning",
                        category="consultation"
                    )
                ],
                notes="Initial consultation day"
            )
        ]
    )
    
    # Convert and add calculations
    schedule_data = fallback.model_dump()
    
    # Business logic calculations
    total_cost = 200
    schedule_data["schedule"][0]["totalCost"] = total_cost
    
    schedule_data["summary"] = {
        "totalDays": 1,
        "totalActivities": 1,
        "totalThemes": 1,
        "estimatedCost": total_cost
    }
    
    return schedule_data
