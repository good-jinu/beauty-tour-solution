<script lang="ts">
import type { GenerateScheduleResponse } from "@bts/core";
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
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";
import type { ScheduleContentsProps } from "$lib/types";

let {
	formData,
	solutionType = "topranking",
	isLoading = false,
	error = null,
	scheduleData = null,
	onRetry,
}: ScheduleContentsProps = $props();

// Derived values for display
const schedule = $derived(scheduleData?.schedule || []);
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
					onclick={onRetry}
					class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
				>
					Try Again
				</button>
			</div>
		</div>
	{:else if schedule.length > 0}
		<!-- Schedule Content -->
		<!-- Schedule Header -->
		<div class="text-center mb-6 sm:mb-8">
			<h2 class="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
				Your Beauty Tour Schedule
			</h2>
			<p class="text-sm sm:text-base text-muted-foreground">
				{summary.totalDays} day{summary.totalDays > 1 ? "s" : ""} of personalized
				treatments
			</p>
			<div class="flex flex-wrap gap-1 sm:gap-2 justify-center mt-3 sm:mt-4">
				{#each formData.selectedThemes as theme}
					<span
						class="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium {getThemeColor(
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
		<div class="grid gap-4 sm:gap-6">
			{#each schedule as day}
				<Card class="overflow-hidden">
					<CardHeader class="bg-muted/30 p-4 sm:p-6">
						<CardTitle class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
							<div class="text-center sm:text-left">
								<span class="text-lg sm:text-xl">Day {day.dayNumber}</span>
								<div
									class="text-xs sm:text-sm font-normal text-muted-foreground mt-1"
								>
									{formatDate(day.date)}
								</div>
							</div>
							<div class="text-center sm:text-right">
								<div class="text-lg sm:text-xl font-bold text-primary">
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
					<CardContent class="p-4 sm:p-6">
						<div class="space-y-3 sm:space-y-4">
							{#each day.activities as activity}
								{@const IconComponent =
									getActivityIconComponent(activity.category)}
								<div
									class="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors"
								>
									<!-- Time and Icon Row for Mobile -->
									<div class="flex items-center gap-3 sm:flex-col sm:items-center sm:gap-1">
										<div class="flex-shrink-0 text-center">
											<div
												class="text-sm sm:text-lg font-semibold text-primary"
											>
												{activity.time}
											</div>
											<div
												class="text-xs text-muted-foreground"
											>
												{activity.duration}
											</div>
										</div>
										<div class="flex-shrink-0">
											<div
												class="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center"
											>
												<IconComponent
													class="w-3 h-3 sm:w-4 sm:h-4 text-primary"
												/>
											</div>
										</div>
									</div>
									
									<!-- Content -->
									<div class="flex-1 min-w-0">
										<div
											class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2"
										>
											<h4 class="font-semibold text-sm sm:text-base leading-tight">
												{activity.activity}
											</h4>
											<div class="text-left sm:text-right flex-shrink-0">
												<div
													class="text-base sm:text-lg font-bold text-primary"
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
											class="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mb-1"
										>
											<MapPin class="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
											<span class="truncate">{activity.location}</span>
										</p>
										<p
											class="text-xs sm:text-sm text-muted-foreground leading-relaxed"
										>
											{activity.description}
										</p>
									</div>
								</div>
							{/each}
						</div>
						<div class="mt-3 sm:mt-4 p-3 bg-muted/50 rounded-lg">
							<p class="text-xs sm:text-sm text-muted-foreground">
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
			<CardContent class="p-4 sm:p-6">
				<div class="text-center">
					<h3 class="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Schedule Summary</h3>
					<div
						class="grid grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm mb-4 sm:mb-6"
					>
						<div>
							<div class="font-medium text-muted-foreground">
								Total Days
							</div>
							<div class="text-xl sm:text-2xl font-bold text-primary">
								{summary.totalDays}
							</div>
						</div>
						<div>
							<div class="font-medium text-muted-foreground">
								Activities
							</div>
							<div class="text-xl sm:text-2xl font-bold text-primary">
								{summary.totalActivities}
							</div>
						</div>
						<div>
							<div class="font-medium text-muted-foreground">
								Themes
							</div>
							<div class="text-xl sm:text-2xl font-bold text-primary">
								{summary.totalThemes}
							</div>
						</div>
					</div>
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
