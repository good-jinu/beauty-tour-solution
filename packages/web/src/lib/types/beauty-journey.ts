export interface Region {
	value: string;
	label: string;
	description: string;
}

export interface Theme {
	value: string;
	label: string;
	description: string;
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
		value: "spa",
		label: "SPA",
		description: "Relaxing spa treatments and wellness experiences",
		icon: "🧘‍♀️",
	},
];
