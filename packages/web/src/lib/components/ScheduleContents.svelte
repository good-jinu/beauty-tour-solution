<script lang="ts">
import type {
	GenerateScheduleRequest,
	GenerateScheduleResponse,
} from "@bts/core";
import {
	Activity,
	CircleAlert,
	ClipboardCheck,
	Heart,
	LoaderCircle,
	MapPin,
	Sparkles,
	Stethoscope,
} from "@lucide/svelte";
import { onMount } from "svelte";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";
import type { ScheduleContentsProps } from "$lib/types";

let { formData, solutionType = "topranking" }: ScheduleContentsProps = $props();

// State management
let isLoading = $state(true);
let error = $state<string | null>(null);
let scheduleData = $state<GenerateScheduleResponse | null>(null);

// API call to generate real schedule
async function generateSchedule() {
	isLoading = true;
	error = null;

	try {
		const request: GenerateScheduleRequest = {
			region: formData.selectedCountry || "south-korea", // Default to South Korea if no country selected
			startDate: formData.startDate,
			endDate: formData.endDate,
			selectedThemes: formData.selectedThemes,
			budget: formData.budget,
			travelers: 1, // Default to 1 traveler
			solutionType,
			moreRequests: formData.moreRequests,
		};

		const response = await fetch("/api/generate-schedule", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(request),
		});

		const result: GenerateScheduleResponse = await response.json();

		if (result.success) {
			scheduleData = result;
		} else {
			error = result.error || "Failed to generate schedule";
		}
	} catch (err) {
		error = err instanceof Error ? err.message : "Network error occurred";
	} finally {
		isLoading = false;
	}
}

// Load schedule on component mount
onMount(() => {
	generateSchedule();
});

// Derived values for display
const schedule = $derived(scheduleData?.schedule || []);
const costEstimate = $derived(
	scheduleData?.costBreakdown || {
		total: 0,
		treatments: 0,
		accommodation: 0,
		transportation: 0,
		activities: 0,
		budgetUtilization: 0,
	},
);
const summary = $derived(
	scheduleData?.summary || {
		totalDays: 0,
		totalActivities: 0,
		totalThemes: 0,
		estimatedCost: 0,
	},
);

function formatDate(dateString: string): string {
	const date = new Date(dateString);
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

function getActivityIconComponent(category: string) {
	const categoryLower = category.toLowerCase();

	if (categoryLower.includes("surgery")) {
		return Stethoscope;
	} else if (categoryLower.includes("hair")) {
		return Sparkles;
	} else if (categoryLower.includes("skin")) {
		return Heart;
	} else if (categoryLower.includes("diet")) {
		return ClipboardCheck;
	} else if (categoryLower.includes("nail")) {
		return Activity;
	} else if (categoryLower.includes("makeup")) {
		return CircleAlert;
	}
	return Activity;
}
</script>

<div class="space-y-6">
	{#if isLoading}
		<!-- Loading State -->
		<div class="flex flex-col items-center justify-center py-12 space-y-4">
			<LoaderCircle class="w-8 h-8 animate-spin text-primary" />
			<div class="text-center">
				<h3 class="text-lg font-semibold">
					Generating Your Beauty Tour
				</h3>
				<p class="text-muted-foreground">
					Our AI is creating a personalized schedule just for you...
				</p>
			</div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="flex flex-col items-center justify-center py-12 space-y-4">
			<CircleAlert class="w-8 h-8 text-destructive" />
			<div class="text-center">
				<h3 class="text-lg font-semibold text-destructive">
					Generation Failed
				</h3>
				<p class="text-muted-foreground mb-4">{error}</p>
				<button
					onclick={generateSchedule}
					class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
				>
					Try Again
				</button>
			</div>
		</div>
	{:else if schedule.length > 0}
		<!-- Schedule Content -->
		<!-- Schedule Header -->
		<div class="text-center mb-8">
			<h2 class="text-3xl font-bold mb-2">
				Your Beauty Tour Schedule
			</h2>
			<p class="text-muted-foreground">
				{summary.totalDays} day{summary.totalDays > 1 ? "s" : ""} of personalized
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
							<div>
								<span>Day {day.dayNumber}</span>
								<div
									class="text-sm font-normal text-muted-foreground mt-1"
								>
									{formatDate(day.date)}
								</div>
							</div>
							<div class="text-right">
								<div class="text-xl font-bold text-primary">
									${day.totalCost?.toLocaleString() ||
										day.activities
											.reduce(
												(sum, activity) =>
													sum + (activity.cost || 0),
												0,
											)
											.toLocaleString()}
								</div>
								<div class="text-xs text-muted-foreground">
									Daily Total
								</div>
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent class="p-6">
						<div class="space-y-4">
							{#each day.activities as activity}
								{@const IconComponent =
									getActivityIconComponent(activity.category)}
								<div
									class="flex items-start gap-4 p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors"
								>
									<div class="flex-shrink-0 text-center">
										<div
											class="text-lg font-semibold text-primary"
										>
											{activity.time}
										</div>
										<div
											class="text-xs text-muted-foreground"
										>
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
										<div
											class="flex items-start justify-between mb-1"
										>
											<h4 class="font-semibold">
												{activity.activity}
											</h4>
											<div class="text-right">
												<div
													class="text-lg font-bold text-primary"
												>
													${activity.cost?.toLocaleString()}
												</div>
												<div
													class="text-xs text-muted-foreground"
												>
													{solutionType === "budget"
														? "Budget Rate"
														: solutionType ===
															  "premium"
															? "Premium Rate"
															: "Standard Rate"}
												</div>
											</div>
										</div>
										<p
											class="text-sm text-muted-foreground flex items-center gap-1"
										>
											<MapPin class="w-4 h-4" />
											{activity.location}
										</p>
										<p
											class="text-sm text-muted-foreground mt-1"
										>
											{activity.description}
										</p>
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-4 p-3 bg-muted/50 rounded-lg">
							<p class="text-sm text-muted-foreground">
								<strong>Note:</strong>
								{day.notes}
							</p>
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
					<div
						class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6"
					>
						<div>
							<div class="font-medium text-muted-foreground">
								Total Days
							</div>
							<div class="text-2xl font-bold text-primary">
								{summary.totalDays}
							</div>
						</div>
						<div>
							<div class="font-medium text-muted-foreground">
								Activities
							</div>
							<div class="text-2xl font-bold text-primary">
								{summary.totalActivities}
							</div>
						</div>
						<div>
							<div class="font-medium text-muted-foreground">
								Themes
							</div>
							<div class="text-2xl font-bold text-primary">
								{summary.totalThemes}
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
									costEstimate.budgetUtilization * 100,
								)}%"
							></div>
						</div>
						<div class="text-xs text-muted-foreground mt-1">
							{Math.round(costEstimate.budgetUtilization * 100)}%
							of budget
						</div>
					</div>

					<!-- Cost Breakdown -->
					{#if costEstimate.treatments > 0}
						<div
							class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
						>
							<div class="bg-muted/20 rounded-lg p-3">
								<div class="font-medium text-muted-foreground">
									Treatments
								</div>
								<div class="text-lg font-bold text-primary">
									${costEstimate.treatments.toLocaleString()}
								</div>
							</div>
							<div class="bg-muted/20 rounded-lg p-3">
								<div class="font-medium text-muted-foreground">
									Accommodation
								</div>
								<div class="text-lg font-bold text-primary">
									${costEstimate.accommodation.toLocaleString()}
								</div>
							</div>
							<div class="bg-muted/20 rounded-lg p-3">
								<div class="font-medium text-muted-foreground">
									Transport
								</div>
								<div class="text-lg font-bold text-primary">
									${costEstimate.transportation.toLocaleString()}
								</div>
							</div>
							<div class="bg-muted/20 rounded-lg p-3">
								<div class="font-medium text-muted-foreground">
									Activities
								</div>
								<div class="text-lg font-bold text-primary">
									${costEstimate.activities.toLocaleString()}
								</div>
							</div>
						</div>
					{/if}
				</div>
			</CardContent>
		</Card>
	{:else}
		<!-- Empty State -->
		<div class="text-center py-12">
			<h3 class="text-lg font-semibold">No Schedule Generated</h3>
			<p class="text-muted-foreground">
				Unable to generate a schedule with the provided information.
			</p>
		</div>
	{/if}
</div>
