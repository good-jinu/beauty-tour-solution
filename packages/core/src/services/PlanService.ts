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

export interface IPlanRepository {
	savePlan(plan: SavedPlan): Promise<SavedPlan>;
	getPlansByGuestId(guestId: string): Promise<SavedPlan[]>;
}

export class PlanService {
	constructor(private planRepository: IPlanRepository) {}

	async savePlan(request: SavePlanRequest): Promise<SavePlanResponse> {
		try {
			// Validate plan data
			const validation = this.validatePlanData(request.planData);
			if (!validation.isValid) {
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Plan data validation failed",
						details: validation.errors,
					},
				};
			}

			// Create saved plan object
			const savedPlan: SavedPlan = {
				guestId: request.guestId,
				planId: this.generatePlanId(),
				title: request.title,
				planData: request.planData,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Save to repository
			const result = await this.planRepository.savePlan(savedPlan);

			return {
				success: true,
				data: result,
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: "SAVE_ERROR",
					message: "Failed to save plan",
					details: error instanceof Error ? error.message : "Unknown error",
				},
			};
		}
	}

	async getPlans(request: GetPlansRequest): Promise<GetPlansResponse> {
		try {
			const plans = await this.planRepository.getPlansByGuestId(
				request.guestId,
			);

			return {
				success: true,
				data: plans,
			};
		} catch (error) {
			return {
				success: false,
				error: {
					code: "FETCH_ERROR",
					message: "Failed to fetch plans",
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
