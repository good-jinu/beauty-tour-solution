import type {
	ActivityFilters,
	ActivityTheme,
	ContactInfo,
	CreateActivityData,
	Location,
	Price,
	UpdateActivityData,
	WorkingHours,
} from "@bts/core";

/**
 * Validation result interface
 */
interface ValidationResult<T> {
	isValid: boolean;
	data?: T;
	errors?: string[];
}

/**
 * Validate CreateActivityData from API request
 */
export function validateCreateActivityRequest(
	data: unknown,
): ValidationResult<CreateActivityData> {
	const errors: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("Request body must be an object");
		return { isValid: false, errors };
	}

	const request = data as Record<string, unknown>;

	// Validate required fields
	if (!request.name || typeof request.name !== "string") {
		errors.push("name is required and must be a string");
	} else if (request.name.trim().length === 0) {
		errors.push("name cannot be empty");
	} else if (request.name.length > 200) {
		errors.push("name must not exceed 200 characters");
	}

	if (!request.theme || typeof request.theme !== "string") {
		errors.push("theme is required and must be a string");
	} else {
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
		if (!validThemes.includes(request.theme)) {
			errors.push(`theme must be one of: ${validThemes.join(", ")}`);
		}
	}

	// Validate working hours
	const workingHoursValidation = validateWorkingHours(request.workingHours);
	if (!workingHoursValidation.isValid) {
		errors.push(...(workingHoursValidation.errors || []));
	}

	// Validate location
	const locationValidation = validateLocation(request.location);
	if (!locationValidation.isValid) {
		errors.push(...(locationValidation.errors || []));
	}

	// Validate price
	const priceValidation = validatePrice(request.price);
	if (!priceValidation.isValid) {
		errors.push(...(priceValidation.errors || []));
	}

	// Validate optional fields
	if (
		request.description !== undefined &&
		(typeof request.description !== "string" ||
			request.description.length > 1000)
	) {
		errors.push("description must be a string not exceeding 1000 characters");
	}

	if (request.images !== undefined) {
		if (!Array.isArray(request.images)) {
			errors.push("images must be an array");
		} else {
			for (let i = 0; i < request.images.length; i++) {
				if (typeof request.images[i] !== "string") {
					errors.push(`images[${i}] must be a string URL`);
				}
			}
		}
	}

	let contactValidation: ValidationResult<ContactInfo> | undefined;
	if (request.contactInfo !== undefined) {
		contactValidation = validateContactInfo(request.contactInfo);
		if (!contactValidation.isValid) {
			errors.push(...(contactValidation.errors || []));
		}
	}

	if (request.amenities !== undefined) {
		if (!Array.isArray(request.amenities)) {
			errors.push("amenities must be an array");
		} else {
			for (let i = 0; i < request.amenities.length; i++) {
				if (typeof request.amenities[i] !== "string") {
					errors.push(`amenities[${i}] must be a string`);
				}
			}
		}
	}

	if (request.isActive !== undefined && typeof request.isActive !== "boolean") {
		errors.push("isActive must be a boolean");
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	return {
		isValid: true,
		data: {
			name: request.name as string,
			theme: request.theme as ActivityTheme,
			workingHours: workingHoursValidation.data || {
				monday: { isOpen: false },
				tuesday: { isOpen: false },
				wednesday: { isOpen: false },
				thursday: { isOpen: false },
				friday: { isOpen: false },
				saturday: { isOpen: false },
				sunday: { isOpen: false },
			},
			location: locationValidation.data || {
				name: "",
				address: "",
				district: "",
				city: "",
				region: "",
			},
			price: priceValidation.data || {
				amount: 0,
				currency: "USD",
				type: "fixed",
			},
			description: request.description as string | undefined,
			images: request.images as string[] | undefined,
			contactInfo: contactValidation?.data,
			amenities: request.amenities as string[] | undefined,
			isActive: request.isActive as boolean | undefined,
		},
	};
}

/**
 * Validate UpdateActivityData from API request
 */
export function validateUpdateActivityRequest(
	data: unknown,
): ValidationResult<UpdateActivityData> {
	const errors: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("Request body must be an object");
		return { isValid: false, errors };
	}

	const request = data as Record<string, unknown>;

	// Check if at least one field is provided for update
	const updateFields = [
		"name",
		"theme",
		"workingHours",
		"location",
		"price",
		"description",
		"images",
		"contactInfo",
		"amenities",
		"isActive",
	];
	const providedFields = updateFields.filter(
		(field) => request[field] !== undefined,
	);

	if (providedFields.length === 0) {
		errors.push("At least one field must be provided for update");
		return { isValid: false, errors };
	}

	// Validate provided fields (same validation as create, but optional)
	if (request.name !== undefined) {
		if (typeof request.name !== "string") {
			errors.push("name must be a string");
		} else if (request.name.trim().length === 0) {
			errors.push("name cannot be empty");
		} else if (request.name.length > 200) {
			errors.push("name must not exceed 200 characters");
		}
	}

	if (request.theme !== undefined) {
		if (typeof request.theme !== "string") {
			errors.push("theme must be a string");
		} else {
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
			if (!validThemes.includes(request.theme)) {
				errors.push(`theme must be one of: ${validThemes.join(", ")}`);
			}
		}
	}

	let workingHours: WorkingHours | undefined;
	if (request.workingHours !== undefined) {
		const workingHoursValidation = validateWorkingHours(request.workingHours);
		if (!workingHoursValidation.isValid) {
			errors.push(...(workingHoursValidation.errors || []));
		} else {
			workingHours = workingHoursValidation.data;
		}
	}

	let location: Location | undefined;
	if (request.location !== undefined) {
		const locationValidation = validateLocation(request.location);
		if (!locationValidation.isValid) {
			errors.push(...(locationValidation.errors || []));
		} else {
			location = locationValidation.data;
		}
	}

	let price: Price | undefined;
	if (request.price !== undefined) {
		const priceValidation = validatePrice(request.price);
		if (!priceValidation.isValid) {
			errors.push(...(priceValidation.errors || []));
		} else {
			price = priceValidation.data;
		}
	}

	let contactInfo: ContactInfo | undefined;
	if (request.contactInfo !== undefined) {
		const contactValidation = validateContactInfo(request.contactInfo);
		if (!contactValidation.isValid) {
			errors.push(...(contactValidation.errors || []));
		} else {
			contactInfo = contactValidation.data;
		}
	}

	// Validate other optional fields
	if (
		request.description !== undefined &&
		(typeof request.description !== "string" ||
			request.description.length > 1000)
	) {
		errors.push("description must be a string not exceeding 1000 characters");
	}

	if (request.images !== undefined) {
		if (!Array.isArray(request.images)) {
			errors.push("images must be an array");
		} else {
			for (let i = 0; i < request.images.length; i++) {
				if (typeof request.images[i] !== "string") {
					errors.push(`images[${i}] must be a string URL`);
				}
			}
		}
	}

	if (request.amenities !== undefined) {
		if (!Array.isArray(request.amenities)) {
			errors.push("amenities must be an array");
		} else {
			for (let i = 0; i < request.amenities.length; i++) {
				if (typeof request.amenities[i] !== "string") {
					errors.push(`amenities[${i}] must be a string`);
				}
			}
		}
	}

	if (request.isActive !== undefined && typeof request.isActive !== "boolean") {
		errors.push("isActive must be a boolean");
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	const updateData: UpdateActivityData = {};
	if (request.name !== undefined) updateData.name = request.name as string;
	if (request.theme !== undefined)
		updateData.theme = request.theme as ActivityTheme;
	if (workingHours !== undefined) updateData.workingHours = workingHours;
	if (location !== undefined) updateData.location = location;
	if (price !== undefined) updateData.price = price;
	if (request.description !== undefined)
		updateData.description = request.description as string;
	if (request.images !== undefined)
		updateData.images = request.images as string[];
	if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
	if (request.amenities !== undefined)
		updateData.amenities = request.amenities as string[];
	if (request.isActive !== undefined)
		updateData.isActive = request.isActive as boolean;

	return { isValid: true, data: updateData };
}

/**
 * Validate ActivityFilters from query parameters
 */
export function validateActivityFilters(
	filters: ActivityFilters,
): ValidationResult<ActivityFilters> {
	const errors: string[] = [];

	// Validate pagination
	if (filters.page !== undefined) {
		if (!Number.isInteger(filters.page) || filters.page < 1) {
			errors.push("page must be a positive integer");
		}
	}

	if (filters.limit !== undefined) {
		if (
			!Number.isInteger(filters.limit) ||
			filters.limit < 1 ||
			filters.limit > 100
		) {
			errors.push("limit must be an integer between 1 and 100");
		}
	}

	// Validate search
	if (filters.search !== undefined && typeof filters.search !== "string") {
		errors.push("search must be a string");
	}

	// Validate theme
	if (filters.theme !== undefined) {
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
		if (!validThemes.includes(filters.theme)) {
			errors.push(`theme must be one of: ${validThemes.join(", ")}`);
		}
	}

	// Validate region
	if (filters.region !== undefined && typeof filters.region !== "string") {
		errors.push("region must be a string");
	}

	// Validate price filters
	if (filters.minPrice !== undefined) {
		if (typeof filters.minPrice !== "number" || filters.minPrice < 0) {
			errors.push("minPrice must be a non-negative number");
		}
	}

	if (filters.maxPrice !== undefined) {
		if (typeof filters.maxPrice !== "number" || filters.maxPrice < 0) {
			errors.push("maxPrice must be a non-negative number");
		}
	}

	if (
		filters.minPrice !== undefined &&
		filters.maxPrice !== undefined &&
		filters.maxPrice < filters.minPrice
	) {
		errors.push("maxPrice must be greater than or equal to minPrice");
	}

	// Validate isActive
	if (filters.isActive !== undefined && typeof filters.isActive !== "boolean") {
		errors.push("isActive must be a boolean");
	}

	// Validate sortBy
	if (filters.sortBy !== undefined) {
		const validSortFields = ["name", "theme", "price", "createdAt"];
		if (!validSortFields.includes(filters.sortBy)) {
			errors.push(`sortBy must be one of: ${validSortFields.join(", ")}`);
		}
	}

	// Validate sortOrder
	if (filters.sortOrder !== undefined) {
		if (!["asc", "desc"].includes(filters.sortOrder)) {
			errors.push("sortOrder must be 'asc' or 'desc'");
		}
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	return { isValid: true, data: filters };
}

/**
 * Validate WorkingHours object
 */
function validateWorkingHours(data: unknown): ValidationResult<WorkingHours> {
	const errors: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("workingHours is required and must be an object");
		return { isValid: false, errors };
	}

	const workingHours = data as Record<string, unknown>;
	const days = [
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
		"sunday",
	];

	const result: Partial<WorkingHours> = {};

	for (const day of days) {
		if (!workingHours[day] || typeof workingHours[day] !== "object") {
			errors.push(`workingHours.${day} is required and must be an object`);
			continue;
		}

		const timeSlot = workingHours[day] as Record<string, unknown>;

		if (typeof timeSlot.isOpen !== "boolean") {
			errors.push(`workingHours.${day}.isOpen must be a boolean`);
			continue;
		}

		if (timeSlot.isOpen) {
			if (!timeSlot.openTime || typeof timeSlot.openTime !== "string") {
				errors.push(
					`workingHours.${day}.openTime is required when isOpen is true`,
				);
			} else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeSlot.openTime)) {
				errors.push(`workingHours.${day}.openTime must be in HH:MM format`);
			}

			if (!timeSlot.closeTime || typeof timeSlot.closeTime !== "string") {
				errors.push(
					`workingHours.${day}.closeTime is required when isOpen is true`,
				);
			} else if (
				!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeSlot.closeTime)
			) {
				errors.push(`workingHours.${day}.closeTime must be in HH:MM format`);
			}
		}

		result[day as keyof WorkingHours] = {
			isOpen: timeSlot.isOpen as boolean,
			openTime: timeSlot.openTime as string | undefined,
			closeTime: timeSlot.closeTime as string | undefined,
		};
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	return { isValid: true, data: result as WorkingHours };
}

/**
 * Validate Location object
 */
function validateLocation(data: unknown): ValidationResult<Location> {
	const errors: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("location is required and must be an object");
		return { isValid: false, errors };
	}

	const location = data as Record<string, unknown>;

	if (!location.name || typeof location.name !== "string") {
		errors.push("location.name is required and must be a string");
	}

	if (!location.address || typeof location.address !== "string") {
		errors.push("location.address is required and must be a string");
	}

	if (!location.district || typeof location.district !== "string") {
		errors.push("location.district is required and must be a string");
	}

	if (!location.city || typeof location.city !== "string") {
		errors.push("location.city is required and must be a string");
	}

	if (!location.region || typeof location.region !== "string") {
		errors.push("location.region is required and must be a string");
	}

	// Validate optional coordinates
	if (location.coordinates !== undefined) {
		if (typeof location.coordinates !== "object" || !location.coordinates) {
			errors.push("location.coordinates must be an object");
		} else {
			const coords = location.coordinates as Record<string, unknown>;
			if (
				typeof coords.latitude !== "number" ||
				coords.latitude < -90 ||
				coords.latitude > 90
			) {
				errors.push(
					"location.coordinates.latitude must be a number between -90 and 90",
				);
			}
			if (
				typeof coords.longitude !== "number" ||
				coords.longitude < -180 ||
				coords.longitude > 180
			) {
				errors.push(
					"location.coordinates.longitude must be a number between -180 and 180",
				);
			}
		}
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	return {
		isValid: true,
		data: {
			name: location.name as string,
			address: location.address as string,
			district: location.district as string,
			city: location.city as string,
			region: location.region as string,
			coordinates: location.coordinates
				? {
						latitude: (location.coordinates as { latitude: number }).latitude,
						longitude: (location.coordinates as { longitude: number })
							.longitude,
					}
				: undefined,
		},
	};
}

/**
 * Validate Price object
 */
function validatePrice(data: unknown): ValidationResult<Price> {
	const errors: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("price is required and must be an object");
		return { isValid: false, errors };
	}

	const price = data as Record<string, unknown>;

	if (!price.currency || typeof price.currency !== "string") {
		errors.push("price.currency is required and must be a string");
	}

	if (typeof price.amount !== "number" || price.amount <= 0) {
		errors.push("price.amount is required and must be a positive number");
	}

	if (!price.type || typeof price.type !== "string") {
		errors.push("price.type is required and must be a string");
	} else {
		const validTypes = ["fixed", "starting_from", "range"];
		if (!validTypes.includes(price.type)) {
			errors.push(`price.type must be one of: ${validTypes.join(", ")}`);
		}
	}

	// Validate maxAmount for range pricing
	if (price.type === "range") {
		if (typeof price.maxAmount !== "number" || price.maxAmount <= 0) {
			errors.push(
				"price.maxAmount is required for range pricing and must be a positive number",
			);
		} else if (price.maxAmount <= (price.amount as number)) {
			errors.push("price.maxAmount must be greater than price.amount");
		}
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	return {
		isValid: true,
		data: {
			currency: price.currency as string,
			amount: price.amount as number,
			type: price.type as "fixed" | "starting_from" | "range",
			maxAmount: price.maxAmount as number | undefined,
		},
	};
}

/**
 * Validate ContactInfo object
 */
function validateContactInfo(data: unknown): ValidationResult<ContactInfo> {
	const errors: string[] = [];

	if (!data || typeof data !== "object") {
		errors.push("contactInfo must be an object");
		return { isValid: false, errors };
	}

	const contact = data as Record<string, unknown>;

	// All fields are optional, but if provided must be valid
	if (contact.phone !== undefined && typeof contact.phone !== "string") {
		errors.push("contactInfo.phone must be a string");
	}

	if (contact.email !== undefined) {
		if (typeof contact.email !== "string") {
			errors.push("contactInfo.email must be a string");
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
			errors.push("contactInfo.email must be a valid email address");
		}
	}

	if (contact.website !== undefined && typeof contact.website !== "string") {
		errors.push("contactInfo.website must be a string");
	}

	if (errors.length > 0) {
		return { isValid: false, errors };
	}

	return {
		isValid: true,
		data: {
			phone: contact.phone as string | undefined,
			email: contact.email as string | undefined,
			website: contact.website as string | undefined,
		},
	};
}
