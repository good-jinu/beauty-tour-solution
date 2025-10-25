import type {
	GetPlansRequest,
	GetPlansResponse,
	PlanData,
	SavedPlan,
	SavePlanRequest,
	SavePlanResponse,
	ValidationError,
	ValidationResult,
} from "../types/plan";
import { logger } from "../utils/logger";

export interface IPlanRepository {
	savePlan(plan: SavedPlan): Promise<SavedPlan>;
	getPlansByGuestId(guestId: string): Promise<SavedPlan[]>;
}

export class PlanService {
	constructor(private planRepository: IPlanRepository) {}

	async savePlan(request: SavePlanRequest): Promise<SavePlanResponse> {
		const startTime = Date.now();

		try {
			logger.info("Starting plan save operation", {
				guestId: request.guestId,
				hasTitle: !!request.title,
				hasPlanData: !!request.planData,
			});

			// Validate guest ID
			if (!request.guestId || request.guestId.trim() === "") {
				logger.warn("Plan save failed: Invalid guest ID", {
					guestId: request.guestId,
				});
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Guest ID is required and must be non-empty",
						details: { field: "guestId" },
					},
				};
			}

			// Validate plan data
			logger.debug("Validating plan data structure");
			const validation = this.validatePlanData(request.planData);
			if (!validation.isValid) {
				logger.warn("Plan data validation failed", {
					errorCount: validation.errors.length,
					errors: validation.errors.map((e) => ({
						field: e.field,
						code: e.code,
					})),
				});
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Plan data validation failed",
						details: validation.errors,
					},
				};
			}

			logger.debug("Plan data validation passed");

			// Create saved plan object
			const planId = this.generatePlanId();
			const now = new Date().toISOString();

			const savedPlan: SavedPlan = {
				guestId: request.guestId,
				planId,
				title: request.title,
				planData: request.planData,
				createdAt: now,
				updatedAt: now,
			};

			logger.debug("Created saved plan object", {
				planId,
				guestId: request.guestId,
			});

			// Save to repository
			logger.debug("Delegating to repository layer");
			const result = await this.planRepository.savePlan(savedPlan);

			const processingTime = Date.now() - startTime;
			logger.info("Plan saved successfully", {
				planId: result.planId,
				guestId: result.guestId,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: true,
				data: result,
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error("Plan save operation failed", error as Error, {
				guestId: request.guestId,
				processingTime: `${processingTime}ms`,
			});

			// Provide more specific error handling
			let errorCode = "SAVE_ERROR";
			let errorMessage = "Failed to save plan";
			const errorDetails =
				error instanceof Error ? error.message : "Unknown error";

			if (error instanceof Error) {
				// Handle specific error types
				if (error.message.includes("validation")) {
					errorCode = "VALIDATION_ERROR";
					errorMessage = "Plan data validation failed";
				} else if (
					error.message.includes("DynamoDB") ||
					error.message.includes("database")
				) {
					errorCode = "DATABASE_ERROR";
					errorMessage = "Database operation failed";
				} else if (error.message.includes("timeout")) {
					errorCode = "TIMEOUT_ERROR";
					errorMessage = "Operation timed out";
				} else if (
					error.message.includes("permission") ||
					error.message.includes("access")
				) {
					errorCode = "PERMISSION_ERROR";
					errorMessage = "Access denied";
				} else if (error.message.includes("already exists")) {
					errorCode = "CONFLICT_ERROR";
					errorMessage = "Plan already exists";
				} else if (error.message.includes("not found")) {
					errorCode = "NOT_FOUND_ERROR";
					errorMessage = "Resource not found";
				}
			}

			return {
				success: false,
				error: {
					code: errorCode,
					message: errorMessage,
					details: errorDetails,
				},
			};
		}
	}

	async getPlans(request: GetPlansRequest): Promise<GetPlansResponse> {
		const startTime = Date.now();

		try {
			logger.info("Starting get plans operation", { guestId: request.guestId });

			if (!request.guestId || request.guestId.trim() === "") {
				logger.warn("Get plans failed: Invalid guest ID", {
					guestId: request.guestId,
				});
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Guest ID is required and must be non-empty",
						details: { field: "guestId" },
					},
				};
			}

			const plans = await this.planRepository.getPlansByGuestId(
				request.guestId,
			);

			const processingTime = Date.now() - startTime;
			logger.info("Plans retrieved successfully", {
				guestId: request.guestId,
				planCount: plans.length,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: true,
				data: plans,
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error("Get plans operation failed", error as Error, {
				guestId: request.guestId,
				processingTime: `${processingTime}ms`,
			});

			let errorCode = "FETCH_ERROR";
			let errorMessage = "Failed to fetch plans";

			if (error instanceof Error) {
				if (error.message.includes("not found")) {
					errorCode = "NOT_FOUND_ERROR";
					errorMessage = "Plans not found";
				} else if (
					error.message.includes("permission") ||
					error.message.includes("access")
				) {
					errorCode = "PERMISSION_ERROR";
					errorMessage = "Access denied";
				} else if (error.message.includes("timeout")) {
					errorCode = "TIMEOUT_ERROR";
					errorMessage = "Operation timed out";
				}
			}

			return {
				success: false,
				error: {
					code: errorCode,
					message: errorMessage,
					details: error instanceof Error ? error.message : "Unknown error",
				},
			};
		}
	}

	validatePlanData(planData: PlanData): ValidationResult {
		const errors: ValidationError[] = [];

		// Validate form data
		if (!planData.formData) {
			errors.push({
				field: "formData",
				message: "Form data is required",
				code: "REQUIRED_FIELD",
			});
		} else {
			// Validate required form fields
			if (!planData.formData.region) {
				errors.push({
					field: "formData.region",
					message: "Region is required",
					code: "REQUIRED_FIELD",
				});
			}

			if (!planData.formData.startDate) {
				errors.push({
					field: "formData.startDate",
					message: "Start date is required",
					code: "REQUIRED_FIELD",
				});
			}

			if (!planData.formData.endDate) {
				errors.push({
					field: "formData.endDate",
					message: "End date is required",
					code: "REQUIRED_FIELD",
				});
			}

			if (!planData.formData.theme) {
				errors.push({
					field: "formData.theme",
					message: "Theme is required",
					code: "REQUIRED_FIELD",
				});
			}

			if (planData.formData.budget <= 0) {
				errors.push({
					field: "formData.budget",
					message: "Budget must be greater than 0",
					code: "INVALID_VALUE",
				});
			}

			if (planData.formData.travelers <= 0) {
				errors.push({
					field: "formData.travelers",
					message: "Number of travelers must be greater than 0",
					code: "INVALID_VALUE",
				});
			}

			// Validate date range
			if (planData.formData.startDate && planData.formData.endDate) {
				const startDate = new Date(planData.formData.startDate);
				const endDate = new Date(planData.formData.endDate);

				if (startDate >= endDate) {
					errors.push({
						field: "formData.dates",
						message: "End date must be after start date",
						code: "INVALID_DATE_RANGE",
					});
				}
			}
		}

		// Validate preferences
		if (!planData.preferences) {
			errors.push({
				field: "preferences",
				message: "Preferences are required",
				code: "REQUIRED_FIELD",
			});
		} else {
			if (!planData.preferences.region) {
				errors.push({
					field: "preferences.region",
					message: "Preferences region is required",
					code: "REQUIRED_FIELD",
				});
			}

			if (!planData.preferences.dates) {
				errors.push({
					field: "preferences.dates",
					message: "Preferences dates are required",
					code: "REQUIRED_FIELD",
				});
			}

			if (!Array.isArray(planData.preferences.inclusions)) {
				errors.push({
					field: "preferences.inclusions",
					message: "Inclusions must be an array",
					code: "INVALID_TYPE",
				});
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	private generatePlanId(): string {
		// Generate a UUID-like string for plan ID
		return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}
}
