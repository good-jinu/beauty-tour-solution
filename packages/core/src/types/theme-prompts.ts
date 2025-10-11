// Theme-to-prompt mapping for different beauty treatments
export const THEME_PROMPTS = {
	"plastic-surgery": {
		text: "Enhanced facial features with natural-looking cosmetic improvements, subtle refinements, professional results, beautiful face",
		negativeText:
			"unnatural, overdone, artificial, bad quality, distorted, unrealistic, deformed",
	},
	"hair-treatments": {
		text: "Healthy, voluminous, styled hair with professional treatment results, lustrous shine, full coverage, beautiful hair",
		negativeText: "damaged hair, thin hair, bad quality, patchy, uneven, bald",
	},
	"skin-clinic": {
		text: "Clear, smooth, radiant skin with professional skincare treatment results, even tone, healthy glow, flawless skin",
		negativeText:
			"blemishes, wrinkles, dull skin, bad quality, uneven texture, acne",
	},
	"diet-activities": {
		text: "Toned, fit physique with healthy body contouring results, natural proportions, athletic appearance, fit body",
		negativeText:
			"unnatural proportions, bad quality, distorted body, unrealistic, overweight",
	},
	nail: {
		text: "Beautiful, well-manicured nails with professional nail care results, healthy cuticles, perfect shape, elegant nails",
		negativeText: "damaged nails, poor quality, uneven, chipped, dirty nails",
	},
	makeup: {
		text: "Professional makeup application with flawless finish, enhanced natural beauty, expert technique, glamorous makeup",
		negativeText:
			"overdone makeup, bad quality, uneven application, unnatural colors, smudged makeup",
	},
} as const;

export type ThemePromptKey = keyof typeof THEME_PROMPTS;

export interface ThemePrompt {
	text: string;
	negativeText: string;
}
