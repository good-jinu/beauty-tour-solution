from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from typing import List

# Pydantic models for structured output
class Activity(BaseModel):
    """Individual activity within a day's schedule."""
    time: str = Field(description="Time of the activity in HH:MM format")
    activity: str = Field(description="Name of the activity or treatment")
    location: str = Field(description="Location where the activity takes place")
    duration: str = Field(description="Duration of the activity (e.g., '2h', '30min')")
    cost: int = Field(description="Cost of the activity in USD")
    description: str = Field(description="Detailed description of the activity")
    category: str = Field(description="Category of activity (consultation, treatment, leisure, etc.)")

class DaySchedule(BaseModel):
    """Complete schedule for a single day."""
    date: str = Field(description="Date in ISO format (YYYY-MM-DD)")
    dayNumber: int = Field(description="Day number in the trip sequence")
    activities: List[Activity] = Field(default_factory=list, description="List of activities scheduled for this day")
    totalCost: int = Field(description="Total cost for all activities on this day")
    notes: str = Field(description="Additional notes or recommendations for the day")



class CostBreakdown(BaseModel):
    """Detailed cost breakdown for the entire trip."""
    treatments: int = Field(description="Total cost for all treatments and procedures")
    accommodation: int = Field(description="Total cost for accommodation")
    transportation: int = Field(description="Total cost for transportation")
    activities: int = Field(description="Total cost for leisure activities")
    total: int = Field(description="Total estimated cost for the entire trip")
    budgetUtilization: float = Field(description="Percentage of budget utilized (0.0 to 1.0)")

class Summary(BaseModel):
    """Trip summary statistics."""
    totalDays: int = Field(description="Total number of days in the trip")
    totalActivities: int = Field(description="Total number of activities scheduled")
    totalThemes: int = Field(description="Number of different treatment themes/categories")
    estimatedCost: int = Field(description="Total estimated cost for the trip")

class TripSchedule(BaseModel):
    """Complete trip schedule with all details."""
    schedule: List[DaySchedule] = Field(default_factory=list, description="Day-by-day schedule for the entire trip")
    costBreakdown: CostBreakdown = Field(description="Detailed breakdown of all costs")
    summary: Summary = Field(description="Summary statistics for the trip")

TRIP_PLANNER_SYSTEM_PROMPT = """
You are a professional beauty and medical tourism consultant specializing in creating detailed, structured schedules.

Your task is to generate a comprehensive beauty journey schedule.

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

All dates must be in ISO format (YYYY-MM-DD).
All costs must be realistic numbers for the specified region.
Activities must be logically scheduled with appropriate timing and recovery periods.
"""

def process_trip_planner_query(agent, query):
    """Process a trip-planner query to generate structured schedule output."""
    try:
        # Use structured output with the TripSchedule model
        result = agent.structured_output(
            TripSchedule,
            TRIP_PLANNER_SYSTEM_PROMPT + query,
        )
        
        # Convert the Pydantic model to dict for JSON serialization
        return result.model_dump()
    except Exception as e:
        print(f"Trip planner generation error: {e}")
        return generate_fallback_schedule()

def generate_fallback_schedule():
    """Generate a fallback schedule when the main generation fails"""
    today = datetime.now()

    # Create fallback using Pydantic models for consistency
    fallback_schedule = TripSchedule(
        schedule=[
            DaySchedule(
                date=today.strftime("%Y-%m-%d"),
                dayNumber=1,
                activities=[
                    Activity(
                        time="09:00",
                        activity="Rhinoplasty Consultation",
                        location="Seoul Plastic Surgery Center, Gangnam District",
                        duration="90min",
                        cost=300,
                        description="Comprehensive nose surgery consultation with 3D imaging and surgical planning with board-certified plastic surgeon",
                        category="surgery"
                    ),
                    Activity(
                        time="11:30",
                        activity="Anti-Aging Facial Treatment",
                        location="Premium Skin Clinic",
                        duration="75min",
                        cost=280,
                        description="Advanced facial treatment with peptides and hyaluronic acid to reduce fine lines and improve skin texture",
                        category="skin"
                    ),
                    Activity(
                        time="14:00",
                        activity="Nutritional Consultation & Meal Planning",
                        location="K-Beauty Wellness Center",
                        duration="60min",
                        cost=150,
                        description="Personalized diet plan consultation focusing on foods that enhance skin health and post-surgery recovery",
                        category="diet"
                    ),
                    Activity(
                        time="16:00",
                        activity="Hair Scalp Analysis & Treatment",
                        location="Seoul Hair Restoration Clinic",
                        duration="45min",
                        cost=200,
                        description="Professional scalp examination and PRP hair treatment to stimulate hair growth and improve hair density",
                        category="hair"
                    )
                ],
                totalCost=930,
                notes="Initial consultation day covering multiple beauty categories to assess treatment options and create comprehensive plan."
            ),
            DaySchedule(
                date=(today + timedelta(days=1)).strftime("%Y-%m-%d"),
                dayNumber=2,
                activities=[
                    Activity(
                        time="09:00",
                        activity="Double Eyelid Surgery",
                        location="Seoul Plastic Surgery Center, Gangnam District",
                        duration="3h",
                        cost=2500,
                        description="Blepharoplasty procedure to create natural-looking double eyelids using advanced suture technique",
                        category="surgery"
                    ),
                    Activity(
                        time="14:00",
                        activity="Post-Surgery Recovery Meal",
                        location="Medical Recovery Cafe",
                        duration="45min",
                        cost=35,
                        description="Anti-inflammatory meal with collagen-rich ingredients designed to support surgical healing",
                        category="diet"
                    ),
                    Activity(
                        time="16:00",
                        activity="Gel Nail Art & Manicure",
                        location="Luxury Nail Salon Gangnam",
                        duration="90min",
                        cost=120,
                        description="Professional gel manicure with Korean nail art designs and cuticle care treatment",
                        category="nail"
                    ),
                    Activity(
                        time="18:30",
                        activity="Professional Makeup Lesson",
                        location="K-Beauty Makeup Studio",
                        duration="2h",
                        cost=250,
                        description="Personal makeup tutorial focusing on Korean beauty techniques and post-surgery makeup application",
                        category="makeup"
                    )
                ],
                totalCost=2905,
                notes="Major surgery day with complementary beauty treatments scheduled around recovery time."
            ),
            DaySchedule(
                date=(today + timedelta(days=2)).strftime("%Y-%m-%d"),
                dayNumber=3,
                activities=[
                    Activity(
                        time="10:00",
                        activity="Post-Surgery Follow-up",
                        location="Seoul Plastic Surgery Center, Gangnam District",
                        duration="45min",
                        cost=100,
                        description="Post-operative examination, wound care, and recovery progress assessment",
                        category="surgery"
                    ),
                    Activity(
                        time="12:00",
                        activity="Hydrating Skin Mask Treatment",
                        location="Premium Skin Clinic",
                        duration="60min",
                        cost=180,
                        description="Intensive hydration mask treatment to soothe skin and promote healing after procedures",
                        category="skin"
                    ),
                    Activity(
                        time="14:30",
                        activity="Hair Styling & Keratin Treatment",
                        location="Premium Hair Salon",
                        duration="2h",
                        cost=300,
                        description="Professional hair styling with keratin treatment to smooth and strengthen hair texture",
                        category="hair"
                    ),
                    Activity(
                        time="17:00",
                        activity="Healthy Smoothie & Supplement Consultation",
                        location="Wellness Nutrition Center",
                        duration="30min",
                        cost=80,
                        description="Customized vitamin and supplement plan with antioxidant smoothie for optimal recovery",
                        category="diet"
                    ),
                    Activity(
                        time="18:00",
                        activity="Pedicure & Foot Spa Treatment",
                        location="Luxury Nail Salon Gangnam",
                        duration="75min",
                        cost=100,
                        description="Relaxing pedicure with foot massage and nail art to complete beauty transformation",
                        category="nail"
                    )
                ],
                totalCost=760,
                notes="Final day focusing on recovery care and completing beauty treatments across all categories."
            )
        ],

        costBreakdown=CostBreakdown(
            treatments=3200,
            accommodation=450,
            transportation=120,
            activities=825,
            total=4595,
            budgetUtilization=0.85
        ),
        summary=Summary(
            totalDays=3,
            totalActivities=12,
            totalThemes=6,
            estimatedCost=4595
        )
    )

    return fallback_schedule.model_dump()
