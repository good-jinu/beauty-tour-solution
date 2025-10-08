export interface Region {
	value: string;
	label: string;
	description: string;
	flag: string;
	city: string;
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
