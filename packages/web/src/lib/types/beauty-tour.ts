export interface Region {
	value: string;
	label: string;
	description: string;
	flag: string;
	city: string;
}

export interface TourTheme {
	value: string;
	label: string;
	description: string;
	icon: string;
}

// Tour planning form data
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
	moreRequests?: string; // Additional user requests from the stepper
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
		description: "Seoul",
		flag: "🇰🇷",
		city: "Seoul",
	},
	{
		value: "thailand",
		label: "Thailand",
		description: "Bangkok",
		flag: "🇹🇭",
		city: "Bangkok",
	},
	{
		value: "brazil",
		label: "Brazil",
		description: "Rio de Janeiro",
		flag: "🇧🇷",
		city: "Rio de Janeiro",
	},
	{
		value: "japan",
		label: "Japan",
		description: "Tokyo",
		flag: "🇯🇵",
		city: "Tokyo",
	},
	{
		value: "france",
		label: "France",
		description: "Paris",
		flag: "🇫🇷",
		city: "Paris",
	},
	{
		value: "turkey",
		label: "Turkey",
		description: "Istanbul",
		flag: "🇹🇷",
		city: "Istanbul",
	},
	{
		value: "germany",
		label: "Germany",
		description: "Berlin",
		flag: "🇩🇪",
		city: "Berlin",
	},
	{
		value: "mexico",
		label: "Mexico",
		description: "Mexico City",
		flag: "🇲🇽",
		city: "Mexico City",
	},
	{
		value: "usa-new-york",
		label: "USA",
		description: "New York",
		flag: "🇺🇸",
		city: "New York",
	},
	{
		value: "usa-los-angeles",
		label: "USA",
		description: "Los Angeles",
		flag: "🇺🇸",
		city: "Los Angeles",
	},
];

export const JOURNEY_THEMES: TourTheme[] = [
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
