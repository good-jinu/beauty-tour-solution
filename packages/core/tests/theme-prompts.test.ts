import { describe, expect, it } from "vitest";
import { BEAUTY_THEMES } from "../src/types/beauty-theme";
import { THEME_PROMPTS, type ThemePromptKey } from "../src/types/theme-prompts";

describe("THEME_PROMPTS", () => {
	it("should have prompts for all beauty themes", () => {
		// Get all theme values from BEAUTY_THEMES
		const themeValues = BEAUTY_THEMES.map((theme) => theme.value);

		// Check that each theme has a corresponding prompt
		for (const themeValue of themeValues) {
			expect(THEME_PROMPTS).toHaveProperty(themeValue);

			const prompt = THEME_PROMPTS[themeValue as ThemePromptKey];
			expect(prompt).toBeDefined();
			expect(prompt.text).toBeTruthy();
			expect(prompt.negativeText).toBeTruthy();
			expect(typeof prompt.text).toBe("string");
			expect(typeof prompt.negativeText).toBe("string");
		}
	});

	it("should have valid prompt structure for each theme", () => {
		const themeKeys = Object.keys(THEME_PROMPTS) as ThemePromptKey[];

		for (const themeKey of themeKeys) {
			const prompt = THEME_PROMPTS[themeKey];

			// Check that text is not empty and contains meaningful content
			expect(prompt.text.length).toBeGreaterThan(10);
			expect(prompt.negativeText.length).toBeGreaterThan(5);

			// Check that text doesn't contain obvious placeholder text
			expect(prompt.text.toLowerCase()).not.toContain("placeholder");
			expect(prompt.text.toLowerCase()).not.toContain("todo");
			expect(prompt.negativeText.toLowerCase()).not.toContain("placeholder");
			expect(prompt.negativeText.toLowerCase()).not.toContain("todo");
		}
	});

	it("should have specific prompts for each theme type", () => {
		// Test specific themes to ensure they have appropriate content
		expect(THEME_PROMPTS["plastic-surgery"].text).toContain("facial features");
		expect(THEME_PROMPTS["hair-treatments"].text).toContain("hair");
		expect(THEME_PROMPTS["skin-clinic"].text).toContain("skin");
		expect(THEME_PROMPTS["diet-activities"].text).toContain("physique");
		expect(THEME_PROMPTS.nail.text).toContain("nail");
		expect(THEME_PROMPTS.makeup.text).toContain("makeup");
	});

	it("should have appropriate negative prompts", () => {
		const themeKeys = Object.keys(THEME_PROMPTS) as ThemePromptKey[];

		for (const themeKey of themeKeys) {
			const prompt = THEME_PROMPTS[themeKey];

			// All negative prompts should contain quality-related terms
			expect(prompt.negativeText.toLowerCase()).toMatch(
				/bad quality|poor quality|low quality/,
			);
		}
	});

	it("should export correct TypeScript types", () => {
		// This test ensures the types are properly exported
		const themeKeys: ThemePromptKey[] = Object.keys(
			THEME_PROMPTS,
		) as ThemePromptKey[];
		expect(themeKeys.length).toBeGreaterThan(0);

		// Verify the structure matches the expected interface
		for (const key of themeKeys) {
			const prompt = THEME_PROMPTS[key];
			expect(prompt).toHaveProperty("text");
			expect(prompt).toHaveProperty("negativeText");
		}
	});
});
