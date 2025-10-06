import type { StepperErrors, StepperFormData } from "$lib/types/stepper";

// Validation utility functions for real-time validation
export class ValidationUtils {
	// Debounce function for real-time validation
	static debounce<T extends (...args: any[]) => any>(
		func: T,
		wait: number,
	): (...args: Parameters<T>) => void {
		let timeout: number;
		return (...args: Parameters<T>) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => func(...args), wait);
		};
	}

	// Format validation error messages for better UX
	static formatErrorMessage(error: string, context?: string): string {
		if (context) {
			return `${context}: ${error}`;
		}
		return error;
	}

	// Check if a field has been touched/modified
	static isFieldTouched(currentValue: any, initialValue: any): boolean {
		return currentValue !== initialValue;
	}

	// Validate email format (for future use)
	static isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// Validate phone number format (for future use)
	static isValidPhoneNumber(phone: string): boolean {
		const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
		return phoneRegex.test(phone);
	}

	// Date validation utilities
	static isValidDate(dateString: string): boolean {
		const date = new Date(dateString);
		return !Number.isNaN(date.getTime());
	}

	static isFutureDate(dateString: string): boolean {
		const date = new Date(dateString);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return date > today;
	}

	static getDaysDifference(startDate: string, endDate: string): number {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = end.getTime() - start.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	}

	// Budget validation utilities
	static isValidBudget(budget: number): boolean {
		return typeof budget === "number" && budget > 0 && !Number.isNaN(budget);
	}

	static formatCurrency(amount: number, currency = "USD"): string {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	}

	// Theme compatibility checking
	static checkThemeCompatibility(themes: string[]): string[] {
		const warnings: string[] = [];

		const incompatibleCombinations = [
			{
				themes: ["plastic-surgery", "wellness-spa"],
				message:
					"Surgical procedures and spa treatments may require separate visits for optimal recovery",
			},
			{
				themes: ["weight-loss", "plastic-surgery"],
				message:
					"Weight loss and plastic surgery procedures should be carefully timed",
			},
			{
				themes: ["hair-treatments", "skincare"],
				message:
					"Hair and skin treatments can be combined but may extend recovery time",
			},
		];

		for (const combo of incompatibleCombinations) {
			if (combo.themes.every((theme) => themes.includes(theme))) {
				warnings.push(combo.message);
			}
		}

		return warnings;
	}

	// Cross-step validation
	static validateFormConsistency(formData: Partial<StepperFormData>): string[] {
		const warnings: string[] = [];

		// Check if travel dates align with selected themes
		if (formData.startDate && formData.endDate && formData.selectedThemes) {
			const daysDiff = ValidationUtils.getDaysDifference(
				formData.startDate,
				formData.endDate,
			);

			const hasSurgicalThemes = formData.selectedThemes.some((theme) =>
				["plastic-surgery", "weight-loss", "hair-treatments"].includes(theme),
			);

			if (hasSurgicalThemes && daysDiff < 5) {
				warnings.push(
					"Surgical procedures typically require 5+ days for proper recovery",
				);
			}

			if (formData.selectedThemes.includes("wellness-spa") && daysDiff < 3) {
				warnings.push(
					"Wellness spa treatments are most effective with 3+ day stays",
				);
			}
		}

		// Check budget vs theme compatibility
		if (formData.budget && formData.selectedThemes) {
			const hasSurgicalThemes = formData.selectedThemes.some((theme) =>
				["plastic-surgery", "weight-loss", "hair-treatments"].includes(theme),
			);

			if (hasSurgicalThemes && formData.budget < 2000) {
				warnings.push(
					"Surgical procedures typically require a minimum budget of $2,000",
				);
			}

			if (formData.selectedThemes.length > 2 && formData.budget < 3000) {
				warnings.push("Multiple treatment themes may require a higher budget");
			}
		}

		// Check budget vs destination (placeholder for future enhancement)
		if (formData.selectedCountry && formData.budget) {
			const expensiveDestinations = ["south-korea", "japan", "switzerland"];
			const budgetDestinations = ["turkey", "thailand", "mexico"];

			if (
				expensiveDestinations.includes(formData.selectedCountry) &&
				formData.budget < 3000
			) {
				warnings.push(
					"Selected destination typically requires higher budgets for quality treatments",
				);
			}

			if (
				budgetDestinations.includes(formData.selectedCountry) &&
				formData.budget > 10000
			) {
				warnings.push(
					"Your budget allows for premium treatments in this destination",
				);
			}
		}

		return warnings;
	}

	// Error severity classification
	static getErrorSeverity(error: string): "error" | "warning" | "info" {
		const errorKeywords = ["required", "must", "invalid", "cannot"];
		const warningKeywords = ["recommend", "typically", "consider", "may"];

		const lowerError = error.toLowerCase();

		if (errorKeywords.some((keyword) => lowerError.includes(keyword))) {
			return "error";
		}

		if (warningKeywords.some((keyword) => lowerError.includes(keyword))) {
			return "warning";
		}

		return "info";
	}

	// Generate user-friendly error summaries
	static generateErrorSummary(errors: StepperErrors): string {
		const errorMessages: string[] = [];

		if (errors.step1) {
			Object.values(errors.step1).forEach((error) => {
				if (error) errorMessages.push(`Country: ${error}`);
			});
		}

		if (errors.step2) {
			Object.values(errors.step2).forEach((error) => {
				if (error) errorMessages.push(`Dates: ${error}`);
			});
		}

		if (errors.step3) {
			Object.values(errors.step3).forEach((error) => {
				if (error) errorMessages.push(`Themes: ${error}`);
			});
		}

		if (errors.step4) {
			Object.values(errors.step4).forEach((error) => {
				if (error) errorMessages.push(`Budget: ${error}`);
			});
		}

		if (errorMessages.length === 0) return "";
		if (errorMessages.length === 1) return errorMessages[0];

		return `${errorMessages.length} issues found: ${errorMessages.slice(0, 2).join(", ")}${errorMessages.length > 2 ? "..." : ""}`;
	}

	// Validation state management
	static createValidationState() {
		return {
			touched: new Set<string>(),
			errors: {} as StepperErrors,
			isValidating: false,
			lastValidation: Date.now(),
		};
	}

	// Field-specific validation helpers
	static validateCountryField(value: string): string | null {
		if (!value || value.trim() === "") {
			return "Please select a destination country";
		}

		if (value.length < 2) {
			return "Invalid country selection";
		}

		return null;
	}

	static validateDateField(value: string, fieldName: string): string | null {
		if (!value) {
			return `Please select a ${fieldName.toLowerCase()}`;
		}

		if (!ValidationUtils.isValidDate(value)) {
			return `Invalid ${fieldName.toLowerCase()} format`;
		}

		if (fieldName === "start date" && !ValidationUtils.isFutureDate(value)) {
			return "Start date must be in the future";
		}

		return null;
	}

	static validateThemesField(themes: string[]): string | null {
		if (!themes || themes.length === 0) {
			return "Please select at least one treatment theme";
		}

		if (themes.length > 4) {
			return "Please limit selection to 4 themes for a focused treatment plan";
		}

		return null;
	}

	static validateBudgetField(budget: number): string | null {
		if (!budget || budget <= 0) {
			return "Please set a budget for your beauty tour";
		}

		if (budget < 500) {
			return "Minimum budget is $500 for quality treatments";
		}

		if (budget > 50000) {
			return "For budgets over $50,000, please contact us for premium packages";
		}

		return null;
	}
}

// Export commonly used validation functions
export const {
	debounce,
	formatErrorMessage,
	isFieldTouched,
	isValidDate,
	isFutureDate,
	getDaysDifference,
	isValidBudget,
	formatCurrency,
	checkThemeCompatibility,
	validateFormConsistency,
	getErrorSeverity,
	generateErrorSummary,
	validateCountryField,
	validateDateField,
	validateThemesField,
	validateBudgetField,
} = ValidationUtils;
