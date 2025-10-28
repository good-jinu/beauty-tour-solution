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
