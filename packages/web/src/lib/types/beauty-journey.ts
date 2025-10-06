export interface Region {
	value: string;
	label: string;
	description: string;
}

export interface Theme {
	value: string;
	label: string;
	description: string;
	recoveryTime: string;
	icon: string;
}

// Legacy FormData interface - maintained for backward compatibility
export interface FormData {
	selectedRegion: string;
	startDate: string;
	endDate: string;
	selectedTheme: string;
	budget: number;
	includeFlights: boolean;
	includeHotels: boolean;
	includeActivities: boolean;
	includeTransport: boolean;
	travelers: number;
	specialRequests: string;
}

// Enhanced FormData interface compatible with stepper flow
export interface EnhancedFormData extends FormData {
	selectedThemes: string[]; // Support multiple theme selection
	currency?: "USD" | "EUR" | "GBP";
}

// Conversion utility type for stepper to legacy form data
export interface StepperToFormDataMapping {
	selectedRegion: string; // maps from selectedCountry
	selectedTheme: string; // maps from selectedThemes[0] or combined
	selectedThemes: string[]; // new field for multiple selection
}

export interface FormErrors {
	[key: string]: string;
}

export const REGIONS: Region[] = [
	{
		value: "south-korea",
		label: "South Korea",
		description: "World leader in advanced skincare and cosmetic procedures",
	},
	{
		value: "thailand",
		label: "Thailand",
		description:
			"Traditional healing combined with luxury wellness experiences",
	},
	{
		value: "turkey",
		label: "Turkey",
		description:
			"Leading destination for hair restoration and cosmetic procedures",
	},
	{
		value: "uae",
		label: "UAE",
		description: "Premium medical facilities with world-class luxury amenities",
	},
	{
		value: "brazil",
		label: "Brazil",
		description: "Renowned for body contouring and cosmetic surgery excellence",
	},
	{
		value: "india",
		label: "India",
		description: "Ancient healing traditions with modern medical expertise",
	},
	{
		value: "mexico",
		label: "Mexico",
		description:
			"High-quality dental care combined with relaxing spa experiences",
	},
	{
		value: "costa-rica",
		label: "Costa Rica",
		description: "Medical excellence in a natural paradise setting",
	},
];

export const THEMES: Theme[] = [
	{
		value: "skincare",
		label: "Skincare & Anti-Aging Treatments",
		description:
			"Advanced facial treatments, chemical peels, laser therapy, and anti-aging procedures to rejuvenate your skin",
		recoveryTime: "1-7 days",
		icon: "✨",
	},
	{
		value: "plastic-surgery",
		label: "Plastic Surgery & Cosmetic Procedures",
		description:
			"Surgical enhancements including facelifts, rhinoplasty, breast augmentation, and body contouring procedures",
		recoveryTime: "2-8 weeks",
		icon: "🏥",
	},
	{
		value: "wellness-spa",
		label: "Wellness & Spa Retreats",
		description:
			"Relaxing spa treatments, massages, detox programs, and holistic wellness experiences",
		recoveryTime: "No downtime",
		icon: "🧘‍♀️",
	},
	{
		value: "hair-treatments",
		label: "Hair Transplant & Hair Treatments",
		description:
			"Hair restoration procedures, transplants, PRP therapy, and advanced hair loss treatments",
		recoveryTime: "1-2 weeks",
		icon: "💇‍♀️",
	},
	{
		value: "dental-tourism",
		label: "Dental Tourism & Smile Makeovers",
		description:
			"Dental implants, veneers, teeth whitening, orthodontics, and comprehensive oral care",
		recoveryTime: "3-14 days",
		icon: "😁",
	},
	{
		value: "weight-loss",
		label: "Weight Loss & Body Contouring",
		description:
			"Liposuction, tummy tucks, gastric procedures, and non-invasive body sculpting treatments",
		recoveryTime: "2-6 weeks",
		icon: "🏃‍♀️",
	},
	{
		value: "holistic-wellness",
		label: "Holistic Wellness & Alternative Medicine",
		description:
			"Ayurvedic treatments, acupuncture, herbal medicine, and traditional healing practices",
		recoveryTime: "No downtime",
		icon: "🌿",
	},
	{
		value: "luxury-beauty",
		label: "Luxury Beauty & Premium Treatments",
		description:
			"High-end cosmetic procedures, premium skincare, and exclusive beauty treatments",
		recoveryTime: "1-14 days",
		icon: "💎",
	},
	{
		value: "recovery-vacation",
		label: "Recovery & Healing Vacation",
		description:
			"Post-procedure recovery programs with medical supervision and luxury amenities",
		recoveryTime: "Varies",
		icon: "🏖️",
	},
	{
		value: "preventive-care",
		label: "Preventive Care & Health Checkups",
		description:
			"Comprehensive health screenings, preventive treatments, and wellness assessments",
		recoveryTime: "No downtime",
		icon: "🔍",
	},
];
