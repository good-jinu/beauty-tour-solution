import { type IPlanRepository, PlanService } from "@bts/core";
import { DynamoDBPlanService } from "@bts/infra";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import {
	createErrorResponse,
	createSuccessResponse,
	ERROR_CODES,
	HTTP_STATUS,
	type SavePlanApiRequest,
	type SavePlanApiResponse,
	validateSavePlanRequest,
} from "$lib/types/api";

// Create DynamoDB service instance
const dynamoDBService = new DynamoDBPlanService();

// Adapter to make DynamoDBPlanService compatible with IPlanRepository interface
class DynamoDBPlanRepository implements IPlanRepository {
	constructor(private dynamoService: DynamoDBPlanService) {}

	async savePlan(plan: import("@bts/core").SavedPlan) {
		// Convert SavedPlan to SavePlanRequest format for DynamoDBPlanService
		const request = {
			guestId: plan.guestId,
			planData: plan.planData,
			title: plan.title,
		};
		return await this.dynamoService.savePlan(request);
	}

	async getPlansByGuestId(guestId: string) {
		const request = { guestId };
		return await this.dynamoService.getPlansByGuestId(request);
	}
}

// Create plan service with DynamoDB repository
const planRepository = new DynamoDBPlanRepository(dynamoDBService);
const planService = new PlanService(planRepository);

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse request body
		let requestBody: unknown;
		try {
			requestBody = await request.json();
		} catch (error) {
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Invalid JSON in request body",
					{
						error:
							error instanceof Error ? error.message : "Unknown parsing error",
					},
				),
				{ status: 400 },
			);
		}

		// Validate request data
		const validation = validateSavePlanRequest(requestBody);
		if (!validation.isValid) {
			return json(
				createErrorResponse(
					ERROR_CODES.VALIDATION_ERROR,
					"Request validation failed",
					{ errors: validation.errors },
				),
				{ status: 400 },
			);
		}

		const validatedRequest = validation.data as SavePlanApiRequest;

		// Validate guest ID
		if (!validatedRequest.guestId || validatedRequest.guestId.trim() === "") {
			return json(
				createErrorResponse(
					ERROR_CODES.GUEST_ID_REQUIRED,
					"Guest ID is required",
				),
				{ status: 400 },
			);
		}

		// Validate plan data
		if (!validatedRequest.planData) {
			return json(
				createErrorResponse(
					ERROR_CODES.PLAN_DATA_REQUIRED,
					"Plan data is required",
				),
				{ status: 400 },
			);
		}

		// Call plan service to save the plan
		const result = await planService.savePlan({
			guestId: validatedRequest.guestId,
			planData: validatedRequest.planData,
			title: validatedRequest.title,
		});

		// Handle service response
		if (result.success) {
			return json(createSuccessResponse(result.data), { status: 201 });
		} else {
			// Map service error codes to HTTP status codes
			let httpStatus = 500;

			switch (result.error.code) {
				case "VALIDATION_ERROR":
					httpStatus = 400;
					break;
				case "SAVE_ERROR":
					httpStatus = 500;
					break;
				default:
					httpStatus = 500;
			}

			return json(
				createErrorResponse(
					result.error.code,
					result.error.message,
					result.error.details,
				),
				{ status: httpStatus },
			);
		}
	} catch (error) {
		console.error("Plan save API error:", error);

		// Handle specific error types
		if (error instanceof Error) {
			if (error.message.includes("DynamoDB table name is required")) {
				return json(
					createErrorResponse(
						ERROR_CODES.SERVICE_UNAVAILABLE,
						"Database service is not properly configured",
						{ error: error.message },
					),
					{ status: 503 },
				);
			}

			if (error.message.includes("Plan with this ID already exists")) {
				return json(
					createErrorResponse(
						ERROR_CODES.SAVE_FAILED,
						"Plan could not be saved due to a conflict",
						{ error: error.message },
					),
					{ status: 400 },
				);
			}
		}

		// Generic error response
		return json(
			createErrorResponse(
				ERROR_CODES.INTERNAL_ERROR,
				"An unexpected error occurred while saving the plan",
				{ error: error instanceof Error ? error.message : "Unknown error" },
			),
			{ status: 500 },
		);
	}
};
