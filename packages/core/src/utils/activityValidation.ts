import type {
	CreateActivityData,
	Location,
	Price,
	UpdateActivityData,
	ValidationError,
	ValidationResult,
	WorkingHours,
} from "../types";

/**
 * Comprehensive activity data validation utility
 * Provides detailed validation for all activity-related data structures
 */
export class ActivityValidator {
	/**
	 * Validate complete activity data for creation or updates
	 */
	static validateActivityData(
		data: CreateActivityData | UpdateActivityData,
	): ValidationResult {
		const errors: ValidationError[] = [];

		// Validate name (required for create, optional for update)
		if ("name" in data && data.name !== undefined) {
			const nameErrors = ActivityValidator.validateName(data.name);
			errors.push(...nameErrors);
		}

		// Validate theme (required for create, optional for update)
		if ("theme" in data && data.theme !== undefined) {
			const themeErrors = ActivityValidator.validateTheme(data.theme);
			errors.push(...themeErrors);
		}

		// Validate working hours
		if ("workingHours" in data && data.workingHours !== undefined) {
			const workingHoursErrors = ActivityValidator.validateWorkingHours(
				data.workingHours,
			);
			errors.push(...workingHoursErrors);
		}

		// Validate location
		if ("location" in data && data.location !== undefined) {
			const locationErrors = ActivityValidator.validateLocation(data.location);
			errors.push(...locationErrors);
		}

		// Validate price
		if ("price" in data && data.price !== undefined) {
			const priceErrors = ActivityValidator.validatePrice(data.price);
			errors.push(...priceErrors);
		}

		// Validate optional fields
		if ("description" in data && data.description !== undefined) {
			const descriptionErrors = ActivityValidator.validateDescription(
				data.description,
			);
			errors.push(...descriptionErrors);
		}

		if ("images" in data && data.images !== undefined) {
			const imageErrors = ActivityValidator.validateImages(data.images);
			errors.push(...imageErrors);
		}

		if ("amenities" in data && data.amenities !== undefined) {
			const amenityErrors = ActivityValidator.validateAmenities(data.amenities);
			errors.push(...amenityErrors);
		}

		if ("contactInfo" in data && data.contactInfo !== undefined) {
			const contactErrors = ActivityValidator.validateContactInfo(
				data.contactInfo,
			);
			errors.push(...contactErrors);
		}

		if ("isActive" in data && data.isActive !== undefined) {
			const activeErrors = ActivityValidator.validateIsActive(data.isActive);
			errors.push(...activeErrors);
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Validate activity name
	 */
	static validateName(name: unknown): ValidationError[] {
		const errors: ValidationError[] = [];

		if (!name || typeof name !== "string") {
			errors.push({
				field: "name",
				message: "Name is required and must be a string",
				code: "REQUIRED_FIELD",
			});
			return errors;
		}

		const trimmedName = name.trim();
		if (trimmedName.length < 2) {
			errors.push({
				field: "name",
				message: "Name must be at least 2 characters long",
				code: "MIN_LENGTH",
			});
		}

		if (trimmedName.length > 200) {
			errors.push({
				field: "name",
				message: "Name must be less than 200 characters",
				code: "MAX_LENGTH",
			});
		}

		// Check for invalid characters (basic validation)
		if (!/^[a-zA-Z0-9\s\-'&.,()]+$/.test(trimmedName)) {
			errors.push({
				field: "name",
				message: "Name contains invalid characters",
				code: "INVALID_CHARACTERS",
			});
		}

		return errors;
	}

	/**
	 * Validate activity theme
	 */
	static validateTheme(theme: unknown): ValidationError[] {
		const errors: ValidationError[] = [];

		if (!theme || typeof theme !== "string") {
			errors.push({
				field: "theme",
				message: "Theme is required and must be a string",
				code: "REQUIRED_FIELD",
			});
			return errors;
		}

		const validThemes = [
			"plastic_surgery_eye",
			"plastic_surgery_nose",
			"plastic_surgery_face",
			"hair_salon",
			"nail_salon",
			"spa_wellness",
			"dental",
			"dermatology",
		];

		if (!validThemes.includes(theme)) {
			errors.push({
				field: "theme",
				message: `Theme must be one of: ${validThemes.join(", ")}`,
				code: "INVALID_ENUM",
			});
		}

		return errors;
	}

	/**
	 * Validate working hours with comprehensive business rules
	 */
	static validateWorkingHours(workingHours: unknown): ValidationError[] {
		const errors: ValidationError[] = [];

		if (!workingHours || typeof workingHours !== "object") {
			errors.push({
				field: "workingHours",
				message: "Working hours is required and must be an object",
				code: "REQUIRED_FIELD",
			});
			return errors;
		}

		const hours = workingHours as WorkingHours;
		const days = [
			"monday",
			"tuesday",
			"wednesday",
			"thursday",
			"friday",
			"saturday",
			"sunday",
		] as const;

		for (const day of days) {
			const daySchedule = hours[day];

			if (!daySchedule || typeof daySchedule !== "object") {
				errors.push({
					field: `workingHours.${day}`,
					message: `${day} schedule is required`,
					code: "REQUIRED_FIELD",
				});
				continue;
			}

			if (typeof daySchedule.isOpen !== "boolean") {
				errors.push({
					field: `workingHours.${day}.isOpen`,
					message: `${day} isOpen must be a boolean`,
					code: "INVALID_TYPE",
				});
			}

			if (daySchedule.isOpen) {
				// Validate open time
				if (!daySchedule.openTime || typeof daySchedule.openTime !== "string") {
					errors.push({
						field: `workingHours.${day}.openTime`,
						message: `${day} openTime is required when open`,
						code: "REQUIRED_FIELD",
					});
				} else {
					const openTimeErrors = ActivityValidator.validateTimeFormat(
						daySchedule.openTime,
						`workingHours.${day}.openTime`,
					);
					errors.push(...openTimeErrors);
				}

				// Validate close time
				if (
					!daySchedule.closeTime ||
					typeof daySchedule.closeTime !== "string"
				) {
					errors.push({
						field: `workingHours.${day}.closeTime`,
						message: `${day} closeTime is required when open`,
						code: "REQUIRED_FIELD",
					});
				} else {
					const closeTimeErrors = ActivityValidator.validateTimeFormat(
						daySchedule.closeTime,
						`workingHours.${day}.closeTime`,
					);
					errors.push(...closeTimeErrors);
				}

				// Validate time range
				if (daySchedule.openTime && daySchedule.closeTime) {
					const timeRangeErrors = ActivityValidator.validateTimeRange(
						daySchedule.openTime,
						daySchedule.closeTime,
						`workingHours.${day}`,
					);
					errors.push(...timeRangeErrors);
				}
			} else {
				// When closed, openTime and closeTime should not be provided
				if (daySchedule.openTime !== undefined) {
					errors.push({
						field: `workingHours.${day}.openTime`,
						message: `${day} openTime should not be provided when closed`,
						code: "INVALID_FIELD",
					});
				}

				if (daySchedule.closeTime !== undefined) {
					errors.push({
						field: `workingHours.${day}.closeTime`,
						message: `${day} closeTime should not be provided when closed`,
						code: "INVALID_FIELD",
					});
				}
			}
		}

		// Business rule: At least one day should be open
		const hasOpenDay = days.some((day) => hours[day]?.isOpen);
		if (!hasOpenDay) {
			errors.push({
				field: "workingHours",
				message: "At least one day must be open",
				code: "BUSINESS_RULE_VIOLATION",
			});
		}

		return errors;
	}

	/**
	 * Validate location data with comprehensive checks
	 */
	static validateLocation(location: unknown): ValidationError[] {
		const errors: ValidationError[] = [];

		if (!location || typeof location !== "object") {
			errors.push({
				field: "location",
				message: "Location is required and must be an object",
				code: "REQUIRED_FIELD",
			});
			return errors;
		}

		const loc = location as Location;

		// Validate required string fields
		const requiredFields = [
			{ field: "name", value: loc.name },
			{ field: "address", value: loc.address },
			{ field: "district", value: loc.district },
			{ field: "city", value: loc.city },
			{ field: "region", value: loc.region },
		];

		for (const { field, value } of requiredFields) {
			if (!value || typeof value !== "string") {
				errors.push({
					field: `location.${field}`,
					message: `Location ${field} is required and must be a string`,
					code: "REQUIRED_FIELD",
				});
			} else if (value.trim().length === 0) {
				errors.push({
					field: `location.${field}`,
					message: `Location ${field} cannot be empty`,
					code: "EMPTY_FIELD",
				});
			} else if (value.length > 200) {
				errors.push({
					field: `location.${field}`,
					message: `Location ${field} must be less than 200 characters`,
					code: "MAX_LENGTH",
				});
			}
		}

		// Validate coordinates if provided
		if (loc.coordinates) {
			if (typeof loc.coordinates !== "object") {
				errors.push({
					field: "location.coordinates",
					message: "Coordinates must be an object",
					code: "INVALID_TYPE",
				});
			} else {
				// Validate latitude
				if (typeof loc.coordinates.latitude !== "number") {
					errors.push({
						field: "location.coordinates.latitude",
						message: "Latitude must be a number",
						code: "INVALID_TYPE",
					});
				} else if (
					loc.coordinates.latitude < -90 ||
					loc.coordinates.latitude > 90
				) {
					errors.push({
						field: "location.coordinates.latitude",
						message: "Latitude must be between -90 and 90",
						code: "INVALID_RANGE",
					});
				}

				// Validate longitude
				if (typeof loc.coordinates.longitude !== "number") {
					errors.push({
						field: "location.coordinates.longitude",
						message: "Longitude must be a number",
						code: "INVALID_TYPE",
					});
				} else if (
					loc.coordinates.longitude < -180 ||
					loc.coordinates.longitude > 180
				) {
					errors.push({
						field: "location.coordinates.longitude",
						message: "Longitude must be between -180 and 180",
						code: "INVALID_RANGE",
					});
				}
			}
		}

		return errors;
	}

	/**
	 * Validate price data with business rules
	 */
	static validatePrice(price: unknown): ValidationError[] {
		const errors: ValidationError[] = [];

		if (!price || typeof price !== "object") {
			errors.push({
				field: "price",
				message: "Price is required and must be an object",
				code: "REQUIRED_FIELD",
			});
			return errors;
		}

		const priceObj = price as Price;

		// Validate currency
		if (!priceObj.currency || typeof priceObj.currency !== "string") {
			errors.push({
				field: "price.currency",
				message: "Price currency is required and must be a string",
				code: "REQUIRED_FIELD",
			});
		} else {
			// Validate currency format (ISO 4217)
			if (!/^[A-Z]{3}$/.test(priceObj.currency)) {
				errors.push({
					field: "price.currency",
					message:
						"Currency must be a valid 3-letter ISO code (e.g., KRW, USD)",
					code: "INVALID_FORMAT",
				});
			}
		}

		// Validate amount
		if (typeof priceObj.amount !== "number") {
			errors.push({
				field: "price.amount",
				message: "Price amount must be a number",
				code: "INVALID_TYPE",
			});
		} else {
			if (priceObj.amount < 0) {
				errors.push({
					field: "price.amount",
					message: "Price amount must be positive",
					code: "INVALID_RANGE",
				});
			}

			if (!Number.isFinite(priceObj.amount)) {
				errors.push({
					field: "price.amount",
					message: "Price amount must be a finite number",
					code: "INVALID_VALUE",
				});
			}

			// Business rule: reasonable price limits
			if (priceObj.amount > 100000000) {
				// 100 million
				errors.push({
					field: "price.amount",
					message: "Price amount exceeds reasonable limit",
					code: "BUSINESS_RULE_VIOLATION",
				});
			}
		}

		// Validate type
		const validTypes = ["fixed", "starting_from", "range"];
		if (!priceObj.type || !validTypes.includes(priceObj.type)) {
			errors.push({
				field: "price.type",
				message: `Price type must be one of: ${validTypes.join(", ")}`,
				code: "INVALID_ENUM",
			});
		}

		// Validate maxAmount for range pricing
		if (priceObj.type === "range") {
			if (typeof priceObj.maxAmount !== "number") {
				errors.push({
					field: "price.maxAmount",
					message: "Max amount is required for range pricing",
					code: "REQUIRED_FIELD",
				});
			} else {
				if (priceObj.maxAmount <= priceObj.amount) {
					errors.push({
						field: "price.maxAmount",
						message: "Max amount must be greater than amount",
						code: "INVALID_RANGE",
					});
				}

				if (!Number.isFinite(priceObj.maxAmount)) {
					errors.push({
						field: "price.maxAmount",
						message: "Max amount must be a finite number",
						code: "INVALID_VALUE",
					});
				}
			}
		} else if (priceObj.maxAmount !== undefined) {
			errors.push({
				field: "price.maxAmount",
				message: "Max amount should only be provided for range pricing",
				code: "INVALID_FIELD",
			});
		}

		return errors;
	}

	/**
	 * Validate description field
	 */
	static validateDescription(description: unknown): ValidationError[] {
		const errors: ValidationError[] = [];

		if (description !== undefined) {
			if (typeof description !== "string") {
				errors.push({
					field: "description",
					message: "Description must be a string",
					code: "INVALID_TYPE",
				});
			} else if (description.length > 2000) {
				errors.push({
					field: "description",
					message: "Description must be less than 2000 characters",
					code: "MAX_LENGTH",
				});
			}
		}

		return errors;
	}

	/**
	 * Validate images array
	 */
	static validateImages(images: unknown): ValidationError[] {
		const errors: ValidationError[] = [];

		if (images !== undefined) {
			if (!Array.isArray(images)) {
				errors.push({
					field: "images",
					message: "Images must be an array",
					code: "INVALID_TYPE",
				});
			} else {
				if (images.length > 10) {
					errors.push({
						field: "images",
						message: "Maximum 10 images allowed",
						code: "MAX_ITEMS",
					});
				}

				images.forEach((image, index) => {
					if (typeof image !== "string") {
						errors.push({
							field: `images[${index}]`,
							message: "Image URL must be a string",
							code: "INVALID_TYPE",
						});
					} else {
						// Basic URL validation
						try {
							new URL(image);
						} catch {
							errors.push({
								field: `images[${index}]`,
								message: "Image must be a valid URL",
								code: "INVALID_URL",
							});
						}
					}
				});
			}
		}

		return errors;
	}

	/**
	 * Validate amenities array
	 */
	static validateAmenities(amenities: unknown): ValidationError[] {
		const errors: ValidationError[] = [];

		if (amenities !== undefined) {
			if (!Array.isArray(amenities)) {
				errors.push({
					field: "amenities",
					message: "Amenities must be an array",
					code: "INVALID_TYPE",
				});
			} else {
				if (amenities.length > 20) {
					errors.push({
						field: "amenities",
						message: "Maximum 20 amenities allowed",
						code: "MAX_ITEMS",
					});
				}

				amenities.forEach((amenity, index) => {
					if (typeof amenity !== "string") {
						errors.push({
							field: `amenities[${index}]`,
							message: "Amenity must be a string",
							code: "INVALID_TYPE",
						});
					} else if (amenity.trim().length === 0) {
						errors.push({
							field: `amenities[${index}]`,
							message: "Amenity cannot be empty",
							code: "EMPTY_FIELD",
						});
					} else if (amenity.length > 100) {
						errors.push({
							field: `amenities[${index}]`,
							message: "Amenity must be less than 100 characters",
							code: "MAX_LENGTH",
						});
					}
				});
			}
		}

		return errors;
	}

	/**
	 * Validate contact info
	 */
	static validateContactInfo(contactInfo: unknown): ValidationError[] {
		const errors: ValidationError[] = [];

		if (contactInfo !== undefined) {
			if (typeof contactInfo !== "object" || contactInfo === null) {
				errors.push({
					field: "contactInfo",
					message: "Contact info must be an object",
					code: "INVALID_TYPE",
				});
				return errors;
			}

			const contact = contactInfo as any;

			// Validate phone
			if (contact.phone !== undefined) {
				if (typeof contact.phone !== "string") {
					errors.push({
						field: "contactInfo.phone",
						message: "Phone must be a string",
						code: "INVALID_TYPE",
					});
				} else if (!/^[\d\s\-+()]+$/.test(contact.phone)) {
					errors.push({
						field: "contactInfo.phone",
						message: "Phone contains invalid characters",
						code: "INVALID_FORMAT",
					});
				}
			}

			// Validate email
			if (contact.email !== undefined) {
				if (typeof contact.email !== "string") {
					errors.push({
						field: "contactInfo.email",
						message: "Email must be a string",
						code: "INVALID_TYPE",
					});
				} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
					errors.push({
						field: "contactInfo.email",
						message: "Email must be a valid email address",
						code: "INVALID_FORMAT",
					});
				}
			}

			// Validate website
			if (contact.website !== undefined) {
				if (typeof contact.website !== "string") {
					errors.push({
						field: "contactInfo.website",
						message: "Website must be a string",
						code: "INVALID_TYPE",
					});
				} else {
					try {
						new URL(contact.website);
					} catch {
						errors.push({
							field: "contactInfo.website",
							message: "Website must be a valid URL",
							code: "INVALID_URL",
						});
					}
				}
			}
		}

		return errors;
	}

	/**
	 * Validate isActive field
	 */
	static validateIsActive(isActive: unknown): ValidationError[] {
		const errors: ValidationError[] = [];

		if (isActive !== undefined && typeof isActive !== "boolean") {
			errors.push({
				field: "isActive",
				message: "isActive must be a boolean",
				code: "INVALID_TYPE",
			});
		}

		return errors;
	}

	/**
	 * Validate time format (HH:MM)
	 */
	private static validateTimeFormat(
		time: string,
		fieldName: string,
	): ValidationError[] {
		const errors: ValidationError[] = [];

		if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
			errors.push({
				field: fieldName,
				message: "Time must be in HH:MM format (24-hour)",
				code: "INVALID_FORMAT",
			});
		}

		return errors;
	}

	/**
	 * Validate time range (openTime < closeTime)
	 */
	private static validateTimeRange(
		openTime: string,
		closeTime: string,
		fieldName: string,
	): ValidationError[] {
		const errors: ValidationError[] = [];

		const openMinutes = ActivityValidator.timeToMinutes(openTime);
		const closeMinutes = ActivityValidator.timeToMinutes(closeTime);

		if (closeMinutes <= openMinutes) {
			errors.push({
				field: fieldName,
				message: "Close time must be after open time",
				code: "INVALID_TIME_RANGE",
			});
		}

		// Business rule: minimum 1 hour operation
		if (closeMinutes - openMinutes < 60) {
			errors.push({
				field: fieldName,
				message: "Minimum 1 hour operation time required",
				code: "BUSINESS_RULE_VIOLATION",
			});
		}

		// Business rule: maximum 24 hours operation (for overnight businesses)
		if (closeMinutes - openMinutes > 1440) {
			errors.push({
				field: fieldName,
				message: "Maximum 24 hours operation time allowed",
				code: "BUSINESS_RULE_VIOLATION",
			});
		}

		return errors;
	}

	/**
	 * Convert time string to minutes for comparison
	 */
	private static timeToMinutes(time: string): number {
		const [hours, minutes] = time.split(":").map(Number);
		return hours * 60 + minutes;
	}
}

/**
 * Convenience function for validating activity data
 */
export function validateActivityData(
	data: CreateActivityData | UpdateActivityData,
): ValidationResult {
	return ActivityValidator.validateActivityData(data);
}
