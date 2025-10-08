export interface BeautyTheme {
	value: string;
	label: string;
	description: string;
	icon: string;
}

export const BEAUTY_THEMES: BeautyTheme[] = [
	{
		value: "plastic-surgery",
		label: "Plastic Surgery",
		description: "Cosmetic and reconstructive surgical procedures",
		icon: "🏥",
	},
	{
		value: "hair-treatments",
		label: "Hair Treatments",
		description: "Hair restoration and treatment procedures",
		icon: "💇‍♀️",
	},
	{
		value: "skin-clinic",
		label: "Skin Clinic",
		description: "Advanced skincare and dermatological treatments",
		icon: "✨",
	},
	{
		value: "diet-activities",
		label: "Diet clinic & Weight loss program",
		description: "Weight management and body contouring treatments",
		icon: "🏃‍♀️",
	},
	{
		value: "nail",
		label: "Nail care",
		description: "Manicure, pedicure, and overall nail health treatments.",
		icon: "💅",
	},
	{
		value: "makeup",
		label: "Makeup",
		description: "Professional makeup services, and beauty consultations.",
		icon: "💄",
	},
];
