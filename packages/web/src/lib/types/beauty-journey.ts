export interface Region {
	value: string;
	label: string;
	description: string;
	priceRange: string;
	specialty: string;
}

export interface Theme {
	value: string;
	label: string;
	description: string;
	recoveryTime: string;
	icon: string;
}

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

export interface FormErrors {
	[key: string]: string;
}

export const REGIONS: Region[] = [
	{
		value: "south-korea",
		label: "South Korea - K-Beauty & Plastic Surgery",
		description: "World leader in advanced skincare and cosmetic procedures",
		priceRange: "$2,000 - $8,000",
		specialty:
			"K-Beauty treatments, plastic surgery, advanced skincare technology",
	},
	{
		value: "thailand",
		label: "Thailand - Spa & Wellness Retreats",
		description:
			"Traditional healing combined with luxury wellness experiences",
		priceRange: "$1,500 - $5,000",
		specialty: "Thai massage, herbal treatments, luxury spa resorts",
	},
	{
		value: "turkey",
		label: "Turkey - Hair Transplant & Medical Tourism",
		description:
			"Leading destination for hair restoration and cosmetic procedures",
		priceRange: "$2,500 - $7,000",
		specialty: "Hair transplants, dental work, cosmetic surgery",
	},
	{
		value: "uae",
		label: "UAE - Luxury Cosmetic Treatments",
		description: "Premium medical facilities with world-class luxury amenities",
		priceRange: "$3,000 - $12,000",
		specialty:
			"Luxury cosmetic procedures, advanced dermatology, premium recovery",
	},
	{
		value: "brazil",
		label: "Brazil - Cosmetic Surgery & Beach Recovery",
		description: "Renowned for body contouring and cosmetic surgery excellence",
		priceRange: "$2,000 - $9,000",
		specialty:
			"Brazilian butt lift, liposuction, breast procedures, beach recovery",
	},
	{
		value: "india",
		label: "India - Ayurvedic Treatments & Wellness",
		description: "Ancient healing traditions with modern medical expertise",
		priceRange: "$800 - $3,500",
		specialty:
			"Ayurvedic treatments, yoga retreats, holistic wellness, affordable procedures",
	},
	{
		value: "mexico",
		label: "Mexico - Dental Tourism & Spa Treatments",
		description:
			"High-quality dental care combined with relaxing spa experiences",
		priceRange: "$1,200 - $4,500",
		specialty:
			"Dental implants, cosmetic dentistry, spa treatments, medical tourism",
	},
	{
		value: "costa-rica",
		label: "Costa Rica - Medical Tourism & Eco-Wellness",
		description: "Medical excellence in a natural paradise setting",
		priceRange: "$1,800 - $6,000",
		specialty:
			"Eco-wellness, cosmetic surgery, dental work, nature-based recovery",
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
