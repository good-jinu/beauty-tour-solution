/**
 * Data sanitization utilities for event tracking privacy and security
 */

/**
 * Sensitive data patterns to exclude from event tracking
 */
const SENSITIVE_PATTERNS = [
	// Email patterns
	/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
	// Phone number patterns
	/(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
	// Credit card patterns (basic)
	/\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
	// Social security number patterns
	/\b\d{3}-?\d{2}-?\d{4}\b/g,
	// IP address patterns
	/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
];

/**
 * Sensitive attribute names to exclude
 */
const SENSITIVE_ATTRIBUTES = new Set([
	"password",
	"passwd",
	"pwd",
	"secret",
	"token",
	"key",
	"auth",
	"authorization",
	"credential",
	"ssn",
	"social",
	"credit",
	"card",
	"cvv",
	"cvc",
	"pin",
	"account",
	"routing",
	"bank",
]);

/**
 * HTML input types that should be excluded from tracking
 */
const SENSITIVE_INPUT_TYPES = new Set([
	"password",
	"email",
	"tel",
	"number",
	"search",
	"url",
]);

/**
 * Sanitize text content by removing sensitive information
 */
export function sanitizeText(text: string): string {
	if (!text || typeof text !== "string") {
		return "";
	}

	let sanitized = text;

	// Remove sensitive patterns
	for (const pattern of SENSITIVE_PATTERNS) {
		sanitized = sanitized.replace(pattern, "[REDACTED]");
	}

	// Truncate very long text to prevent data leakage
	if (sanitized.length > 200) {
		sanitized = `${sanitized.substring(0, 200)}...`;
	}

	return sanitized.trim();
}

/**
 * Check if an attribute name is sensitive
 */
export function isSensitiveAttribute(name: string): boolean {
	if (!name || typeof name !== "string") {
		return true;
	}

	const lowerName = name.toLowerCase();

	// Check exact matches
	if (SENSITIVE_ATTRIBUTES.has(lowerName)) {
		return true;
	}

	// Check partial matches
	for (const sensitive of SENSITIVE_ATTRIBUTES) {
		if (lowerName.includes(sensitive)) {
			return true;
		}
	}

	return false;
}

/**
 * Check if an HTML element should be excluded from tracking
 */
export function shouldExcludeElement(element: HTMLElement): boolean {
	if (!element) {
		return true;
	}

	// Exclude form inputs with sensitive types
	if (element instanceof HTMLInputElement) {
		if (SENSITIVE_INPUT_TYPES.has(element.type)) {
			return true;
		}

		// Check input name and id attributes
		if (element.name && isSensitiveAttribute(element.name)) {
			return true;
		}

		if (element.id && isSensitiveAttribute(element.id)) {
			return true;
		}
	}

	// Exclude elements with sensitive class names or data attributes
	if (element.className) {
		const classes = element.className.split(" ");
		for (const className of classes) {
			if (isSensitiveAttribute(className)) {
				return true;
			}
		}
	}

	// Check data attributes
	for (const attr of element.attributes) {
		if (
			attr.name.startsWith("data-") &&
			isSensitiveAttribute(attr.name.substring(5))
		) {
			return true;
		}
	}

	// Exclude elements marked with data-no-track attribute
	if (element.hasAttribute("data-no-track")) {
		return true;
	}

	return false;
}

/**
 * Sanitize element data for tracking
 */
export function sanitizeElementData(element: HTMLElement): {
	tag?: string;
	id?: string;
	class?: string;
	text?: string;
} {
	if (!element || shouldExcludeElement(element)) {
		return {};
	}

	const data: Record<string, unknown> = {};

	// Add tag name (always safe)
	data.tag = element.tagName.toLowerCase();

	// Add ID if not sensitive
	if (element.id && !isSensitiveAttribute(element.id)) {
		data.id = element.id;
	}

	// Add class names if not sensitive
	if (element.className) {
		const classes = element.className
			.split(" ")
			.filter((cls) => cls.trim() && !isSensitiveAttribute(cls.trim()));
		if (classes.length > 0) {
			data.class = classes.join(" ");
		}
	}

	// Add sanitized text content
	if (element.textContent) {
		const sanitizedText = sanitizeText(element.textContent);
		if (sanitizedText && sanitizedText !== "[REDACTED]") {
			data.text = sanitizedText;
		}
	}

	return data;
}

/**
 * Sanitize URL by removing sensitive query parameters
 */
export function sanitizeUrl(url: string): string {
	if (!url || typeof url !== "string") {
		return "";
	}

	try {
		const urlObj = new URL(url, window.location.origin);

		// Remove sensitive query parameters
		const sensitiveParams = [
			"token",
			"key",
			"auth",
			"password",
			"secret",
			"session",
		];
		for (const param of sensitiveParams) {
			urlObj.searchParams.delete(param);
		}

		// Return pathname + clean search params
		return urlObj.pathname + urlObj.search;
	} catch {
		// If URL parsing fails, return just the pathname part
		return url.split("?")[0];
	}
}

/**
 * Sanitize user agent string by removing detailed version information
 */
export function sanitizeUserAgent(userAgent: string): string {
	if (!userAgent || typeof userAgent !== "string") {
		return "";
	}

	// Keep only major browser and OS information, remove detailed versions
	return userAgent
		.replace(/\d+\.\d+\.\d+/g, "x.x.x") // Replace version numbers
		.replace(/\([^)]*\)/g, "(...)") // Replace detailed system info
		.substring(0, 100); // Limit length
}

/**
 * Sanitize event data object
 */
export function sanitizeEventData(
	data: Record<string, unknown>,
): Record<string, unknown> {
	if (!data || typeof data !== "object") {
		return {};
	}

	const sanitized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(data)) {
		// Skip sensitive keys
		if (isSensitiveAttribute(key)) {
			continue;
		}

		// Sanitize string values
		if (typeof value === "string") {
			const sanitizedValue = sanitizeText(value);
			if (sanitizedValue && sanitizedValue !== "[REDACTED]") {
				sanitized[key] = sanitizedValue;
			}
		} else if (typeof value === "number" || typeof value === "boolean") {
			// Numbers and booleans are generally safe
			sanitized[key] = value;
		} else if (value && typeof value === "object") {
			// Recursively sanitize nested objects (with depth limit)
			const nestedSanitized = sanitizeEventData(
				value as Record<string, unknown>,
			);
			if (Object.keys(nestedSanitized).length > 0) {
				sanitized[key] = nestedSanitized;
			}
		}
	}

	return sanitized;
}
