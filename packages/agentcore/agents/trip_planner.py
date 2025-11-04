from datetime import datetime
from pydantic import BaseModel
from typing import List

# Models matching TypeScript interface expectations
class ScheduleItem(BaseModel):
    activityId: str
    scheduledTime: str
    duration: str
    status: str = "planned"
    notes: str = ""
    customPrice: int = None

class ScheduleDay(BaseModel):
    date: str
    dayNumber: int
    items: List[ScheduleItem]
    notes: str = ""

class TripSchedule(BaseModel):
    schedule: List[ScheduleDay]

TRIP_PLANNER_SYSTEM_PROMPT = """
You are a beauty tourism consultant. Generate a schedule using ONLY the provided real activities.

CRITICAL RULES:
- Use ONLY activityId values from the provided available activities list
- Day 1: Focus on consultations and planning
- Day 2+: Main treatments and procedures
- Final day: Follow-ups and recovery activities
- Schedule items during business hours when possible
- Use realistic time slots and durations
- Each activityId must match exactly from the available activities

OUTPUT FORMAT:
- activityId: Must be exact match from available activities
- scheduledTime: Format as "HH:MM" (e.g., "09:00", "14:30")  
- duration: Format as "1h", "2h", "30min", etc.
- status: Always "planned"
- notes: Brief description or special instructions
"""

def process_trip_planner_query(agent, query):
    """Process simple trip planner query - fallback for non-structured requests."""
    try:
        # For simple queries without structured data, generate basic schedule
        result = agent.structured_output(
            TripSchedule,
            TRIP_PLANNER_SYSTEM_PROMPT + "\n\nRequest: " + query + 
            "\n\nNote: Generate generic activities since no real activity data provided.",
        )
        
        # Convert to dict - calculations will be done in TypeScript
        schedule_data = result.model_dump()
        
        return schedule_data
        
    except Exception as e:
        print(f"Trip planner generation error: {e}")
        return generate_fallback_schedule()

def process_structured_trip_planner_query(agent, structured_data):
    """Process structured trip planner data using real activities."""
    try:
        # Extract trip details and available activities
        trip_details = structured_data.get("tripDetails", {})
        requirements = structured_data.get("requirements", {})
        available_activities = structured_data.get("availableActivities", {})
        
        # Flatten activities from theme groups
        all_activities = []
        for theme, activities in available_activities.items():
            all_activities.extend(activities)
        
        if not all_activities:
            print("No available activities provided, using fallback")
            return generate_fallback_schedule()
        
        # Create activity lookup for easy reference
        activity_list = "\n".join([
            f"- {act['activityId']}: {act['name']} at {act['location']['name']} "
            f"(${act['price']['amount']}, {act['theme']}, "
            f"Hours: {format_working_hours(act.get('workingHours', {}))})"
            for act in all_activities
        ])
        
        # Create detailed prompt with real activity data
        prompt = f"""
Generate a beauty tourism schedule using ONLY the provided real activities.

TRIP DETAILS:
- Region: {trip_details.get('region', 'Seoul')}
- Dates: {trip_details.get('startDate')} to {trip_details.get('endDate')} ({trip_details.get('duration')} days)
- Themes: {', '.join(trip_details.get('themes', []))}
- Budget: ${trip_details.get('budget', 0)} USD
- Solution Type: {trip_details.get('solutionType', 'topranking')}
{f"- Special Requests: {trip_details.get('specialRequests')}" if trip_details.get('specialRequests') else ""}

AVAILABLE ACTIVITIES (use activityId exactly as shown):
{activity_list}

REQUIREMENTS:
- Use ONLY activityId values from the list above
- Day 1: Focus on consultations
- Day 2+: Focus on treatments
- Final day: Follow-ups and recovery
- Schedule within working hours when possible
- Use realistic durations (30min-3h)
- Respect the day structure: {requirements.get('dayStructure', {})}

IMPORTANT: 
- activityId must match exactly from the available activities list
- scheduledTime should be in HH:MM format (e.g., "09:00", "14:30")
- duration should be like "1h", "2h", "30min"
- Only use activities that are provided in the list above
"""
        
        # Use structured output with real activity constraints
        result = agent.structured_output(
            TripSchedule,
            TRIP_PLANNER_SYSTEM_PROMPT + "\n\n" + prompt,
        )
        
        # Convert to dict and validate activity IDs
        schedule_data = result.model_dump()
        
        # Validate that all activityIds exist in available activities
        valid_activity_ids = {act['activityId'] for act in all_activities}
        
        for day in schedule_data["schedule"]:
            for item in day["items"]:
                if item["activityId"] not in valid_activity_ids:
                    print(f"Warning: Invalid activityId {item['activityId']}, replacing with fallback")
                    # Replace with first available activity as fallback
                    if all_activities:
                        item["activityId"] = all_activities[0]["activityId"]
                        item["notes"] = f"{item.get('notes', '')} (Activity ID corrected)".strip()
        
        return schedule_data
        
    except Exception as e:
        print(f"Structured trip planner generation error: {e}")
        return generate_fallback_schedule()

def format_working_hours(working_hours):
    """Format working hours for display in prompt"""
    if not working_hours:
        return "Not specified"
    
    # Find a typical day that's open
    for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']:
        if day in working_hours and working_hours[day].get('isOpen'):
            hours = working_hours[day]
            if hours.get('openTime') and hours.get('closeTime'):
                return f"{hours['openTime']}-{hours['closeTime']}"
    
    return "Varies by day"

def generate_fallback_schedule():
    """Generate fallback schedule matching expected format"""
    today = datetime.now()
    
    # Create fallback using updated Pydantic model
    fallback = TripSchedule(
        schedule=[
            ScheduleDay(
                date=today.strftime("%Y-%m-%d"),
                dayNumber=1,
                items=[
                    ScheduleItem(
                        activityId="fallback_activity_001",
                        scheduledTime="09:00",
                        duration="2h",
                        status="planned",
                        notes="Comprehensive consultation and planning",
                        customPrice=200
                    )
                ],
                notes="Schedule generation failed - showing fallback data"
            )
        ]
    )
    
    # Convert to dict - calculations will be done in TypeScript
    schedule_data = fallback.model_dump()
    
    return schedule_data
