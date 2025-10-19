<script lang="ts">
import {
	Activity,
	ClipboardCheck,
	Heart,
	MapPin,
	Sparkles,
	Stethoscope,
} from "@lucide/svelte";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";
import type { StepperFormData } from "$lib/types";

interface Props {
	formData: StepperFormData;
	solutionType?: "topranking" | "premium" | "budget";
}

interface ScheduleActivity {
	time: string;
	activity: string;
	location: string;
	duration: string;
}

interface ScheduleDay {
	date: Date;
	dayNumber: number;
	activities: ScheduleActivity[];
}

let { formData, solutionType = "topranking" }: Props = $props();

// Mock schedule data generator
function generateMockSchedule(
	startDate: string,
	endDate: string,
	themes: string[],
	solutionType: "topranking" | "premium" | "budget" = "topranking",
) {
	const start = new Date(startDate);
	const end = new Date(endDate);
	const days = [];

	// Theme-based activities mapping with more variety
	const themeActivities = {
		skincare: [
			"Hydrafacial Treatment",
			"LED Light Therapy",
			"Chemical Peel Session",
			"Collagen Facial",
			"Vitamin C Infusion",
			"Microneedling Session",
			"Oxygen Facial",
			"Anti-aging Treatment",
			"Acne Treatment",
			"Skin Analysis & Consultation",
		],
		"plastic-surgery": [
			"Initial Consultation",
			"Pre-surgery Health Check",
			"Surgery Preparation",
			"Main Surgery Procedure",
			"Post-surgery Recovery",
			"Wound Care Session",
			"Follow-up Appointment",
			"Progress Evaluation",
			"Final Check-up",
			"Aftercare Instructions",
		],
		"wellness-spa": [
			"Full Body Massage",
			"Aromatherapy Session",
			"Hot Stone Therapy",
			"Meditation Class",
			"Yoga Session",
			"Sauna & Steam",
			"Detox Treatment",
			"Reflexology",
			"Thai Massage",
			"Relaxation Therapy",
		],
		dental: [
			"Dental Consultation",
			"Teeth Whitening",
			"Dental Cleaning",
			"Orthodontic Check",
			"Cosmetic Dental Work",
			"Implant Consultation",
			"Veneer Fitting",
			"Root Canal Treatment",
			"Gum Treatment",
			"Final Dental Check",
		],
		"hair-transplant": [
			"Hair Analysis",
			"Transplant Consultation",
			"Pre-procedure Preparation",
			"Hair Transplant Procedure",
			"Scalp Treatment",
			"Recovery Care",
			"Progress Check",
			"Aftercare Session",
			"Growth Monitoring",
			"Final Assessment",
		],
	};

	// Time slots
	const timeSlots = ["09:00", "11:00", "14:00", "16:00", "18:00"];

	// Solution type configurations
	const solutionConfigs = {
		topranking: {
			activitiesPerDay: { min: 2, max: 3 },
			preferredActivities: ["treatment", "facial", "therapy", "consultation"],
			costMultiplier: 1.0,
			description: "Highest rated clinics and treatments",
		},
		budget: {
			activitiesPerDay: { min: 1, max: 2 },
			preferredActivities: ["consultation", "analysis", "check", "cleaning"],
			costMultiplier: 0.6,
			description: "Cost-effective treatments with essential care",
		},
		premium: {
			activitiesPerDay: { min: 3, max: 4 },
			preferredActivities: ["surgery", "procedure", "premium", "luxury"],
			costMultiplier: 1.5,
			description: "Luxury treatments with premium care",
		},
	};

	const config = solutionConfigs[solutionType];

	let currentDate = new Date(start);
	let dayCount = 1;

	while (currentDate <= end) {
		const dayActivities = [];
		const selectedThemeActivities = themes.flatMap(
			(theme) => themeActivities[theme as keyof typeof themeActivities] || [],
		);

		// Generate activities based on solution type
		const numActivities = Math.min(
			Math.floor(
				Math.random() *
					(config.activitiesPerDay.max - config.activitiesPerDay.min + 1),
			) + config.activitiesPerDay.min,
			selectedThemeActivities.length,
		);
		const usedTimeSlots = new Set();
		const usedActivities = new Set();

		for (let i = 0; i < numActivities; i++) {
			let timeSlot: string | null = null;
			do {
				timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
			} while (usedTimeSlots.has(timeSlot));

			usedTimeSlots.add(timeSlot);

			// Pick a unique activity
			let activity: string | null = null;
			let attempts = 0;
			do {
				activity =
					selectedThemeActivities[
						Math.floor(Math.random() * selectedThemeActivities.length)
					];
				attempts++;
			} while (usedActivities.has(activity) && attempts < 10);

			usedActivities.add(activity);

			// Vary locations and durations based on solution type
			const locationsByType = {
				topranking: [
					"Top-Rated Seoul Clinic",
					"Award-Winning Medical Center",
					"5-Star Beauty Institute",
					"Certified Excellence Center",
					"Premier Healthcare Facility",
				],
				budget: [
					"Seoul Beauty Clinic",
					"Affordable Care Center",
					"Community Wellness",
					"Basic Treatment Center",
					"Essential Beauty Clinic",
				],
				premium: [
					"Luxury Beauty Palace",
					"VIP Medical Suite",
					"Exclusive Wellness Resort",
					"Premium Elite Center",
					"Royal Luxury Clinic",
				],
			};

			const locations = locationsByType[solutionType];

			const baseDuration =
				activity.includes("Surgery") || activity.includes("Transplant")
					? Math.floor(Math.random() * 4) + 3
					: Math.floor(Math.random() * 2) + 1;

			const durationMultiplier =
				solutionType === "premium"
					? 1.3
					: solutionType === "budget"
						? 0.8
						: 1.0;
			const duration = `${Math.round(baseDuration * durationMultiplier)}h`;

			dayActivities.push({
				time: timeSlot,
				activity,
				location: locations[Math.floor(Math.random() * locations.length)],
				duration,
			});
		}

		// Sort activities by time
		dayActivities.sort((a, b) => a.time.localeCompare(b.time));

		days.push({
			date: new Date(currentDate),
			dayNumber: dayCount,
			activities: dayActivities,
		});

		currentDate.setDate(currentDate.getDate() + 1);
		dayCount++;
	}

	return days;
}

// Calculate estimated costs based on activities
function calculateEstimatedCost(
	schedule: ScheduleDay[],
	budget: number,
): { total: number; perDay: number; breakdown: Record<string, number> } {
	const activityCosts = {
		consultation: 150,
		treatment: 300,
		surgery: 2500,
		procedure: 1800,
		massage: 120,
		facial: 200,
		therapy: 180,
		analysis: 100,
		check: 80,
	};

	let totalCost = 0;
	const breakdown: Record<string, number> = {};

	schedule.forEach((day) => {
		day.activities.forEach((activity: ScheduleActivity) => {
			let cost = 250; // default cost

			// Find matching cost based on activity keywords
			for (const [keyword, price] of Object.entries(activityCosts)) {
				if (activity.activity.toLowerCase().includes(keyword)) {
					cost = price;
					break;
				}
			}

			totalCost += cost;
			const theme =
				formData.selectedThemes.find((theme) =>
					activity.activity.toLowerCase().includes(theme.replace("-", " ")),
				) || "general";

			breakdown[theme] = (breakdown[theme] || 0) + cost;
		});
	});

	// Apply solution type cost multiplier
	const solutionMultiplier =
		solutionType === "premium" ? 1.5 : solutionType === "budget" ? 0.6 : 1.0;
	totalCost *= solutionMultiplier;

	Object.keys(breakdown).forEach((key) => {
		breakdown[key] *= solutionMultiplier;
	});

	// Adjust to fit within budget (roughly)
	const adjustmentFactor = Math.min(1, (budget / totalCost) * 0.9);
	totalCost *= adjustmentFactor;

	Object.keys(breakdown).forEach((key) => {
		breakdown[key] *= adjustmentFactor;
	});

	return {
		total: Math.round(totalCost),
		perDay: Math.round(totalCost / schedule.length),
		breakdown,
	};
}

const schedule = $derived(
	generateMockSchedule(
		formData.startDate,
		formData.endDate,
		formData.selectedThemes,
		solutionType,
	),
);
const costEstimate = $derived(
	calculateEstimatedCost(schedule, formData.budget),
);

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function getThemeColor(themes: string[]): string {
	const colorMap = {
		skincare:
			"bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/20 dark:border-pink-700 dark:text-pink-300",
		"plastic-surgery":
			"bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300",
		"wellness-spa":
			"bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300",
		dental:
			"bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-300",
		"hair-transplant":
			"bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300",
	};

	const primaryTheme = themes[0] as keyof typeof colorMap;
	return (
		colorMap[primaryTheme] ||
		"bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300"
	);
}

function getActivityIconComponent(activity: string) {
	if (
		activity.toLowerCase().includes("surgery") ||
		activity.toLowerCase().includes("procedure")
	) {
		return Stethoscope;
	} else if (
		activity.toLowerCase().includes("massage") ||
		activity.toLowerCase().includes("spa")
	) {
		return Heart;
	} else if (
		activity.toLowerCase().includes("consultation") ||
		activity.toLowerCase().includes("check")
	) {
		return ClipboardCheck;
	} else if (
		activity.toLowerCase().includes("treatment") ||
		activity.toLowerCase().includes("therapy")
	) {
		return Sparkles;
	}
	return Activity;
}
</script>

<div class="space-y-6">
	<!-- Schedule Header -->
	<div class="text-center mb-8">
		<h2 class="text-3xl font-bold mb-2">Your Beauty Journey Schedule</h2>
		<p class="text-muted-foreground">
			{schedule.length} day{schedule.length > 1 ? "s" : ""} of personalized
			treatments
		</p>
		<div class="flex flex-wrap gap-2 justify-center mt-4">
			{#each formData.selectedThemes as theme}
				<span
					class="px-3 py-1 rounded-full text-sm font-medium {getThemeColor(
						[theme],
					)}"
				>
					{theme
						.replace("-", " ")
						.replace(/\b\w/g, (l) => l.toUpperCase())}
				</span>
			{/each}
		</div>
	</div>

	<!-- Schedule Days -->
	<div class="grid gap-6">
		{#each schedule as day}
			<Card class="overflow-hidden">
				<CardHeader class="bg-muted/30">
					<CardTitle class="flex items-center justify-between">
						<span>Day {day.dayNumber}</span>
						<span class="text-sm font-normal text-muted-foreground">
							{formatDate(day.date)}
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent class="p-6">
					<div class="space-y-4">
						{#each day.activities as activity}
							{@const IconComponent = getActivityIconComponent(
								activity.activity,
							)}
							<div
								class="flex items-start gap-4 p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors"
							>
								<div class="flex-shrink-0 text-center">
									<div
										class="text-lg font-semibold text-primary"
									>
										{activity.time}
									</div>
									<div class="text-xs text-muted-foreground">
										{activity.duration}
									</div>
								</div>
								<div class="flex-shrink-0 mt-1">
									<div
										class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
									>
										<IconComponent
											class="w-4 h-4 text-primary"
										/>
									</div>
								</div>
								<div class="flex-1">
									<h4 class="font-semibold mb-1">
										{activity.activity}
									</h4>
									<p
										class="text-sm text-muted-foreground flex items-center gap-1"
									>
										<MapPin class="w-4 h-4" />
										{activity.location}
									</p>
								</div>
								<div class="flex-shrink-0">
									<div
										class="w-3 h-3 rounded-full bg-primary animate-pulse"
									></div>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/each}
	</div>

	<!-- Schedule Summary -->
	<Card class="bg-primary/5 border-primary/20">
		<CardContent class="p-6">
			<div class="text-center">
				<h3 class="text-lg font-semibold mb-4">Schedule Summary</h3>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
					<div>
						<div class="font-medium text-muted-foreground">
							Total Days
						</div>
						<div class="text-2xl font-bold text-primary">
							{schedule.length}
						</div>
					</div>
					<div>
						<div class="font-medium text-muted-foreground">
							Activities
						</div>
						<div class="text-2xl font-bold text-primary">
							{schedule.reduce(
								(sum, day) => sum + day.activities.length,
								0,
							)}
						</div>
					</div>
					<div>
						<div class="font-medium text-muted-foreground">
							Themes
						</div>
						<div class="text-2xl font-bold text-primary">
							{formData.selectedThemes.length}
						</div>
					</div>
					<div>
						<div class="font-medium text-muted-foreground">
							Est. Cost
						</div>
						<div class="text-2xl font-bold text-primary">
							${costEstimate.total.toLocaleString()}
						</div>
					</div>
				</div>

				<!-- Budget vs Estimate -->
				<div class="bg-muted/30 rounded-lg p-4">
					<div class="flex justify-between items-center mb-2">
						<span class="text-sm font-medium"
							>Budget Utilization</span
						>
						<span class="text-sm text-muted-foreground">
							${costEstimate.total.toLocaleString()} / ${formData.budget.toLocaleString()}
						</span>
					</div>
					<div class="w-full bg-muted rounded-full h-2">
						<div
							class="bg-primary h-2 rounded-full transition-all duration-500"
							style="width: {Math.min(
								100,
								(costEstimate.total / formData.budget) * 100,
							)}%"
						></div>
					</div>
					<div class="text-xs text-muted-foreground mt-1">
						{Math.round(
							(costEstimate.total / formData.budget) * 100,
						)}% of budget
					</div>
				</div>
			</div>
		</CardContent>
	</Card>
</div>
