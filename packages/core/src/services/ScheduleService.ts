import type {
	IScheduleRepository,
	StoredSchedule,
} from "../repositories/ScheduleRepository";
import type { GenerateScheduleRequest, ScheduleDay } from "../types/schedule";
import { logger } from "../utils/logger";

/**
 * Request/Response types for schedule service operations
 */
export interface SaveScheduleRequest {
	guestId: string;
	title?: string;
	request: GenerateScheduleRequest;
	schedule: ScheduleDay[];
}

export interface SaveScheduleResponse {
	success: boolean;
	data?: StoredSchedule;
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
}

export interface GetSchedulesRequest {
	guestId: string;
}

export interface GetSchedulesResponse {
	success: boolean;
	data?: StoredSchedule[];
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
}

export interface GetScheduleRequest {
	guestId: string;
	scheduleId: string;
}

export interface GetScheduleResponse {
	success: boolean;
	data?: StoredSchedule;
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
}

export interface UpdateScheduleRequest {
	guestId: string;
	scheduleId: string;
	title?: string;
	request?: GenerateScheduleRequest;
	schedule?: ScheduleDay[];
}

export interface UpdateScheduleResponse {
	success: boolean;
	data?: StoredSchedule;
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
}

export interface DeleteScheduleRequest {
	guestId: string;
	scheduleId: string;
}

export interface DeleteScheduleResponse {
	success: boolean;
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
}

/**
 * Validation types
 */
export interface ScheduleValidationResult {
	isValid: boolean;
	errors: ScheduleValidationError[];
}

export interface ScheduleValidationError {
	field: string;
	message: string;
	code: string;
}

/**
 * Schedule service for handling schedule business logic
 */
export class ScheduleService {
	constructor(private scheduleRepository: IScheduleRepository) {}

	async saveSchedule(
		request: SaveScheduleRequest,
	): Promise<SaveScheduleResponse> {
		const startTime = Date.now();

		try {
			logger.info("Starting schedule save operation", {
				guestId: request.guestId,
				hasTitle: !!request.title,
				scheduleLength: request.schedule?.length || 0,
			});

			// Validate guest ID
			if (!request.guestId || request.guestId.trim() === "") {
				logger.warn("Schedule save failed: Invalid guest ID", {
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

			// Validate schedule data
			logger.debug("Validating schedule data structure");
			const validation = this.validateScheduleData(request);
			if (!validation.isValid) {
				logger.warn("Schedule data validation failed", {
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
						message: "Schedule data validation failed",
						details: validation.errors,
					},
				};
			}

			logger.debug("Schedule data validation passed");

			// Create stored schedule object
			const scheduleId = this.generateScheduleId();
			const now = new Date().toISOString();

			const storedSchedule: StoredSchedule = {
				guestId: request.guestId,
				scheduleId,
				title: request.title,
				request: request.request,
				schedule: request.schedule,
				createdAt: now,
				updatedAt: now,
			};

			logger.debug("Created stored schedule object", {
				scheduleId,
				guestId: request.guestId,
			});

			// Save to repository
			logger.debug("Delegating to repository layer");
			const result = await this.scheduleRepository.saveSchedule(storedSchedule);

			const processingTime = Date.now() - startTime;
			logger.info("Schedule saved successfully", {
				scheduleId: result.scheduleId,
				guestId: result.guestId,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: true,
				data: result,
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error("Schedule save operation failed", error as Error, {
				guestId: request.guestId,
				processingTime: `${processingTime}ms`,
			});

			return this.handleServiceError(
				error,
				"SAVE_ERROR",
				"Failed to save schedule",
			);
		}
	}

	async getSchedules(
		request: GetSchedulesRequest,
	): Promise<GetSchedulesResponse> {
		const startTime = Date.now();

		try {
			logger.info("Starting get schedules operation", {
				guestId: request.guestId,
			});

			if (!request.guestId || request.guestId.trim() === "") {
				logger.warn("Get schedules failed: Invalid guest ID", {
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

			const schedules = await this.scheduleRepository.getSchedulesByGuestId(
				request.guestId,
			);

			const processingTime = Date.now() - startTime;
			logger.info("Schedules retrieved successfully", {
				guestId: request.guestId,
				scheduleCount: schedules.length,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: true,
				data: schedules,
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error("Get schedules operation failed", error as Error, {
				guestId: request.guestId,
				processingTime: `${processingTime}ms`,
			});

			return this.handleServiceError(
				error,
				"FETCH_ERROR",
				"Failed to fetch schedules",
			);
		}
	}

	async getSchedule(request: GetScheduleRequest): Promise<GetScheduleResponse> {
		const startTime = Date.now();

		try {
			logger.info("Starting get schedule operation", {
				guestId: request.guestId,
				scheduleId: request.scheduleId,
			});

			if (!request.guestId || request.guestId.trim() === "") {
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Guest ID is required and must be non-empty",
						details: { field: "guestId" },
					},
				};
			}

			if (!request.scheduleId || request.scheduleId.trim() === "") {
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Schedule ID is required and must be non-empty",
						details: { field: "scheduleId" },
					},
				};
			}

			const schedule = await this.scheduleRepository.getSchedule(
				request.guestId,
				request.scheduleId,
			);

			if (!schedule) {
				return {
					success: false,
					error: {
						code: "NOT_FOUND_ERROR",
						message: "Schedule not found",
						details: {
							guestId: request.guestId,
							scheduleId: request.scheduleId,
						},
					},
				};
			}

			const processingTime = Date.now() - startTime;
			logger.info("Schedule retrieved successfully", {
				guestId: request.guestId,
				scheduleId: request.scheduleId,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: true,
				data: schedule,
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error("Get schedule operation failed", error as Error, {
				guestId: request.guestId,
				scheduleId: request.scheduleId,
				processingTime: `${processingTime}ms`,
			});

			return this.handleServiceError(
				error,
				"FETCH_ERROR",
				"Failed to fetch schedule",
			);
		}
	}

	async updateSchedule(
		request: UpdateScheduleRequest,
	): Promise<UpdateScheduleResponse> {
		const startTime = Date.now();

		try {
			logger.info("Starting update schedule operation", {
				guestId: request.guestId,
				scheduleId: request.scheduleId,
			});

			// Get existing schedule
			const existing = await this.scheduleRepository.getSchedule(
				request.guestId,
				request.scheduleId,
			);

			if (!existing) {
				return {
					success: false,
					error: {
						code: "NOT_FOUND_ERROR",
						message: "Schedule not found",
						details: {
							guestId: request.guestId,
							scheduleId: request.scheduleId,
						},
					},
				};
			}

			// Create updated schedule
			const updatedSchedule: StoredSchedule = {
				...existing,
				title: request.title !== undefined ? request.title : existing.title,
				request: request.request || existing.request,
				schedule: request.schedule || existing.schedule,
				updatedAt: new Date().toISOString(),
			};

			// Validate updated data
			const validation = this.validateStoredSchedule(updatedSchedule);
			if (!validation.isValid) {
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Updated schedule data validation failed",
						details: validation.errors,
					},
				};
			}

			const result =
				await this.scheduleRepository.updateSchedule(updatedSchedule);

			const processingTime = Date.now() - startTime;
			logger.info("Schedule updated successfully", {
				scheduleId: result.scheduleId,
				guestId: result.guestId,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: true,
				data: result,
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error("Update schedule operation failed", error as Error, {
				guestId: request.guestId,
				scheduleId: request.scheduleId,
				processingTime: `${processingTime}ms`,
			});

			return this.handleServiceError(
				error,
				"UPDATE_ERROR",
				"Failed to update schedule",
			);
		}
	}

	async deleteSchedule(
		request: DeleteScheduleRequest,
	): Promise<DeleteScheduleResponse> {
		const startTime = Date.now();

		try {
			logger.info("Starting delete schedule operation", {
				guestId: request.guestId,
				scheduleId: request.scheduleId,
			});

			if (!request.guestId || request.guestId.trim() === "") {
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Guest ID is required and must be non-empty",
						details: { field: "guestId" },
					},
				};
			}

			if (!request.scheduleId || request.scheduleId.trim() === "") {
				return {
					success: false,
					error: {
						code: "VALIDATION_ERROR",
						message: "Schedule ID is required and must be non-empty",
						details: { field: "scheduleId" },
					},
				};
			}

			await this.scheduleRepository.deleteSchedule(
				request.guestId,
				request.scheduleId,
			);

			const processingTime = Date.now() - startTime;
			logger.info("Schedule deleted successfully", {
				guestId: request.guestId,
				scheduleId: request.scheduleId,
				processingTime: `${processingTime}ms`,
			});

			return {
				success: true,
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			logger.error("Delete schedule operation failed", error as Error, {
				guestId: request.guestId,
				scheduleId: request.scheduleId,
				processingTime: `${processingTime}ms`,
			});

			return this.handleServiceError(
				error,
				"DELETE_ERROR",
				"Failed to delete schedule",
			);
		}
	}

	/**
	 * Validate schedule data from save request
	 */
	private validateScheduleData(
		request: SaveScheduleRequest,
	): ScheduleValidationResult {
		const errors: ScheduleValidationError[] = [];

		// Validate request data
		if (!request.request) {
			errors.push({
				field: "request",
				message: "Schedule request data is required",
				code: "REQUIRED_FIELD",
			});
		} else {
			// Validate required request fields
			if (!request.request.region) {
				errors.push({
					field: "request.region",
					message: "Region is required",
					code: "REQUIRED_FIELD",
				});
			}

			if (!request.request.startDate) {
				errors.push({
					field: "request.startDate",
					message: "Start date is required",
					code: "REQUIRED_FIELD",
				});
			}

			if (!request.request.endDate) {
				errors.push({
					field: "request.endDate",
					message: "End date is required",
					code: "REQUIRED_FIELD",
				});
			}

			if (
				!request.request.selectedThemes ||
				request.request.selectedThemes.length === 0
			) {
				errors.push({
					field: "request.selectedThemes",
					message: "At least one theme must be selected",
					code: "REQUIRED_FIELD",
				});
			}

			if (request.request.budget <= 0) {
				errors.push({
					field: "request.budget",
					message: "Budget must be greater than 0",
					code: "INVALID_VALUE",
				});
			}

			// Validate date range
			if (request.request.startDate && request.request.endDate) {
				const startDate = new Date(request.request.startDate);
				const endDate = new Date(request.request.endDate);

				if (startDate >= endDate) {
					errors.push({
						field: "request.dates",
						message: "End date must be after start date",
						code: "INVALID_DATE_RANGE",
					});
				}
			}
		}

		// Validate schedule data
		if (!request.schedule || request.schedule.length === 0) {
			errors.push({
				field: "schedule",
				message: "Schedule must contain at least one day",
				code: "REQUIRED_FIELD",
			});
		} else {
			// Validate each schedule day
			request.schedule.forEach((day, index) => {
				if (!day.date) {
					errors.push({
						field: `schedule[${index}].date`,
						message: "Schedule day must have a date",
						code: "REQUIRED_FIELD",
					});
				}

				if (!day.activities || day.activities.length === 0) {
					errors.push({
						field: `schedule[${index}].activities`,
						message: "Schedule day must have at least one activity",
						code: "REQUIRED_FIELD",
					});
				}
			});
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Validate stored schedule data
	 */
	private validateStoredSchedule(
		schedule: StoredSchedule,
	): ScheduleValidationResult {
		return this.validateScheduleData({
			guestId: schedule.guestId,
			title: schedule.title,
			request: schedule.request,
			schedule: schedule.schedule,
		});
	}

	/**
	 * Handle service errors with appropriate error codes and messages
	 */
	private handleServiceError(
		error: unknown,
		defaultCode: string,
		defaultMessage: string,
	): {
		success: false;
		error: { code: string; message: string; details: unknown };
	} {
		let errorCode = defaultCode;
		let errorMessage = defaultMessage;
		const errorDetails =
			error instanceof Error ? error.message : "Unknown error";

		if (error instanceof Error) {
			// Handle specific error types
			if (error.message.includes("validation")) {
				errorCode = "VALIDATION_ERROR";
				errorMessage = "Data validation failed";
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
				errorMessage = "Schedule already exists";
			} else if (error.message.includes("not found")) {
				errorCode = "NOT_FOUND_ERROR";
				errorMessage = "Schedule not found";
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

	/**
	 * Generate a unique schedule ID
	 */
	private generateScheduleId(): string {
		return `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}
}
