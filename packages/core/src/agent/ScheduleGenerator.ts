import { BedrockAgentCoreService } from "@bts/infra";
import type {
	GenerateScheduleRequest,
	GenerateScheduleResponse,
} from "../types";

export class ScheduleGenerator {
	private agentService: BedrockAgentCoreService;

	constructor() {
		this.agentService = new BedrockAgentCoreService();
	}

	async generateSchedule(
		request: GenerateScheduleRequest,
	): Promise<GenerateScheduleResponse> {
		const prompt = this.createStructuredPrompt(request);

		try {
			const result = await this.agentService.queryAgent(prompt);

			// Parse the structured JSON response
			const parsedResult = this.parseAgentResponse(result);

			return {
				success: true,
				...parsedResult,
			};
		} catch (error) {
			return {
				success: false,
				error:
					error instanceof Error
						? error.message
						: "Failed to generate beauty schedule",
				details: error instanceof Error ? error.stack : undefined,
			};
		}
	}

	private createStructuredPrompt(request: GenerateScheduleRequest): string {
		const duration = this.calculateDuration(request.startDate, request.endDate);
		const solutionType = request.solutionType || "topranking";

		return `You are a professional beauty and medical tourism consultant. Generate a detailed, structured beauty journey schedule based on the following information:

**Request Details:**
- Destination: ${request.region}
- Travel Dates: ${request.startDate} to ${request.endDate} (${duration} days)
- Treatment Themes: ${request.selectedThemes.join(", ")}
- Budget: $${request.budget} USD
- Solution Type: ${solutionType}
- Number of Travelers: ${request.travelers || 1}
${request.moreRequests ? `- Special Requests: ${request.moreRequests}` : ""}

**IMPORTANT: You must respond with ONLY a valid JSON object in the following structure:**

{
  "schedule": [
    {
      "date": "2024-01-15",
      "dayNumber": 1,
      "activities": [
        {
          "time": "09:00",
          "activity": "Initial Consultation",
          "location": "Seoul Beauty Clinic",
          "duration": "2h",
          "cost": 200,
          "description": "Comprehensive skin analysis and treatment planning",
          "category": "consultation"
        }
      ],
      "totalCost": 200,
      "notes": "Arrival day - light schedule for jet lag recovery"
    }
  ],
  "recommendations": {
    "clinics": [
      {
        "name": "Seoul Premium Beauty Center",
        "rating": 4.8,
        "specialties": ["skincare", "plastic-surgery"],
        "location": "Gangnam District, Seoul",
        "estimatedCost": 2500,
        "description": "Award-winning clinic specializing in advanced skincare treatments"
      }
    ],
    "accommodation": [
      {
        "name": "Medical Recovery Hotel Seoul",
        "type": "medical-hotel",
        "rating": 4.5,
        "amenities": ["24/7 medical support", "recovery rooms", "healthy dining"],
        "location": "Near medical district",
        "pricePerNight": 180,
        "description": "Specialized accommodation for medical tourism recovery"
      }
    ],
    "transportation": [
      {
        "type": "airport-transfer",
        "provider": "Medical Tourism Transport",
        "estimatedCost": 80,
        "description": "Comfortable transfer service for medical tourists"
      }
    ]
  },
  "costBreakdown": {
    "treatments": 3500,
    "accommodation": 900,
    "transportation": 200,
    "activities": 300,
    "total": 4900,
    "budgetUtilization": 0.82
  },
  "summary": {
    "totalDays": 5,
    "totalActivities": 12,
    "totalThemes": 2,
    "estimatedCost": 4900
  }
}

**Guidelines for generating the schedule:**

1. **Solution Type Considerations:**
   - topranking: Focus on highest-rated clinics, standard pricing
   - premium: Luxury clinics and services, 1.5x cost multiplier
   - budget: Cost-effective options, 0.6x cost multiplier

2. **Activity Categories:**
   - consultation: Initial assessments, planning sessions
   - treatment: Main procedures and treatments
   - recovery: Rest periods, wound care, follow-ups
   - wellness: Spa treatments, relaxation activities
   - transport: Travel between locations

3. **Scheduling Logic:**
   - Day 1: Arrival, consultation, light activities
   - Middle days: Main treatments with recovery time
   - Final day: Follow-up, departure preparation
   - Balance treatment intensity with recovery needs

4. **Cost Calculation:**
   - Ensure total stays within budget (±10%)
   - Include realistic pricing for the region
   - Factor in solution type multipliers

5. **Theme-Specific Activities:**
   - skincare: Facials, peels, LED therapy, consultations
   - plastic-surgery: Consultations, procedures, recovery care
   - wellness-spa: Massages, aromatherapy, meditation
   - dental: Cleanings, whitening, consultations
   - hair-transplant: Analysis, procedures, aftercare

Respond with ONLY the JSON object, no additional text or formatting.`;
	}

	private parseAgentResponse(
		response: string,
	): Partial<GenerateScheduleResponse> {
		try {
			// Clean the response to extract JSON
			let cleanResponse = response.trim();

			// Remove any markdown code blocks if present
			cleanResponse = cleanResponse
				.replace(/```json\n?/g, "")
				.replace(/```\n?/g, "");

			// Find the JSON object in the response
			const jsonStart = cleanResponse.indexOf("{");
			const jsonEnd = cleanResponse.lastIndexOf("}") + 1;

			if (jsonStart === -1 || jsonEnd === 0) {
				throw new Error("No JSON object found in response");
			}

			const jsonString = cleanResponse.substring(jsonStart, jsonEnd);
			const parsed = JSON.parse(jsonString);

			// Validate the structure
			if (!parsed.schedule || !Array.isArray(parsed.schedule)) {
				throw new Error("Invalid schedule structure in response");
			}

			return parsed;
		} catch (error) {
			console.error("Failed to parse agent response:", error);
			console.error("Raw response:", response);

			// Return a fallback structure
			return this.createFallbackSchedule();
		}
	}

	private createFallbackSchedule(): Partial<GenerateScheduleResponse> {
		return {
			schedule: [
				{
					date: new Date().toISOString().split("T")[0],
					dayNumber: 1,
					activities: [
						{
							time: "09:00",
							activity: "Initial Consultation",
							location: "Beauty Clinic",
							duration: "2h",
							cost: 200,
							description: "Comprehensive consultation and planning",
							category: "consultation" as const,
						},
					],
					totalCost: 200,
					notes: "Schedule generation failed - showing fallback data",
				},
			],
			recommendations: {
				clinics: [],
				accommodation: [],
				transportation: [],
			},
			costBreakdown: {
				treatments: 200,
				accommodation: 0,
				transportation: 0,
				activities: 0,
				total: 200,
				budgetUtilization: 0.1,
			},
			summary: {
				totalDays: 1,
				totalActivities: 1,
				totalThemes: 1,
				estimatedCost: 200,
			},
		};
	}

	private calculateDuration(startDate: string, endDate: string): number {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}
}
