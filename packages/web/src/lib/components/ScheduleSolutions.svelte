<script lang="ts">
import type {
	GenerateScheduleRequest,
	GenerateScheduleResponse,
} from "@bts/core";
import { Crown, DollarSign, Trophy } from "@lucide/svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "$lib/components/ui/tabs";
import type {
	ScheduleSolutionsProps,
	SolutionConfig,
	SolutionType,
} from "$lib/types";
import { getSolutionMetadata, SolutionCostUtils } from "$lib/types";
import ScheduleContents from "./ScheduleContents.svelte";

let { formData }: ScheduleSolutionsProps = $props();

// State management for schedule generation
let scheduleStates = $state<
	Record<
		SolutionType,
		{
			isLoading: boolean;
			error: string | null;
			scheduleData: GenerateScheduleResponse | null;
		}
	>
>({
	topranking: { isLoading: true, error: null, scheduleData: null },
	budget: { isLoading: true, error: null, scheduleData: null },
	premium: { isLoading: true, error: null, scheduleData: null },
});

// Track which schedules have been saved
let savedSchedules = $state<Set<SolutionType>>(new Set());

// Calculate estimated costs for each solution type
function calculateSolutionCost(solutionType: SolutionType): number {
	return SolutionCostUtils.calculateSolutionCost(solutionType, formData.budget);
}

// API call to generate schedule for a specific solution type
async function generateSchedule(solutionType: SolutionType) {
	scheduleStates[solutionType].isLoading = true;
	scheduleStates[solutionType].error = null;

	try {
		const request: GenerateScheduleRequest = {
			region: formData.selectedCountry || "south-korea",
			startDate: formData.startDate,
			endDate: formData.endDate,
			selectedThemes: formData.selectedThemes,
			budget: formData.budget,
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
			scheduleStates[solutionType].scheduleData = result;
			// Mark as saved since the API handles saving automatically
			savedSchedules.add(solutionType);
			console.log(
				`Schedule for ${solutionType} generated and saved automatically`,
			);
		} else {
			scheduleStates[solutionType].error =
				result.error || "Failed to generate schedule";
		}
	} catch (err) {
		scheduleStates[solutionType].error =
			err instanceof Error ? err.message : "Network error occurred";
	} finally {
		scheduleStates[solutionType].isLoading = false;
	}
}

// Generate all schedules on component mount
onMount(() => {
	generateSchedule("topranking");
	generateSchedule("budget");
	generateSchedule("premium");
});

const solutions: SolutionConfig[] = [
	{
		id: "topranking",
		name: "Top Ranking",
		icon: Trophy,
		description: "Highest rated clinics and treatments",
		features: [
			"Top-rated clinics",
			"Expert specialists",
			"Proven results",
			"Best reviews",
		],
		highlight: "Recommended",
		color: "text-amber-600 dark:text-amber-400",
		estimatedCost: calculateSolutionCost("topranking"),
		costLabel: "Standard Rate",
	},
	{
		id: "budget",
		name: "Budget",
		icon: DollarSign,
		description: "Cost-effective treatments with essential care",
		features: [
			"Essential treatments",
			"Basic facilities",
			"Flexible scheduling",
			"Best value",
		],
		highlight: "Most Affordable",
		color: "text-green-600 dark:text-green-400",
		estimatedCost: calculateSolutionCost("budget"),
		costLabel: "40% Savings",
	},
	{
		id: "premium",
		name: "Premium",
		icon: Crown,
		description: "Luxury treatments with premium care",
		features: [
			"Luxury treatments",
			"VIP facilities",
			"Personalized care",
			"Exclusive access",
		],
		highlight: "Best Experience",
		color: "text-purple-600 dark:text-purple-400",
		estimatedCost: calculateSolutionCost("premium"),
		costLabel: "Premium Service",
	},
];
</script>

<div class="space-y-6">
	<!-- Solutions Header -->
	<div class="text-center mb-8">
		<h2 class="text-3xl font-bold mb-2">Choose Your Perfect Solution</h2>
		<p class="text-muted-foreground">
			We've created 3 tailored schedule options based on your preferences
		</p>
	</div>

	<Tabs value="topranking" class="w-full">
		<TabsList class="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
			{#each solutions as solution, index}
				{@const IconComponent = solution.icon}
				<TabsTrigger
					value={solution.id}
					class="flex flex-col items-center gap-1 py-2 sm:py-3 h-auto text-xs sm:text-sm min-h-[60px] sm:min-h-[80px]"
				>
					<div class="text-xs opacity-75">Solution {index + 1}</div>
					<div class="flex items-center gap-1 sm:gap-2">
						<IconComponent class="w-3 h-3 sm:w-4 sm:h-4" />
						<span class="hidden sm:inline">{solution.name}</span>
						<span class="sm:hidden text-xs font-medium"
							>{solution.name.split(" ")[0]}</span
						>
					</div>
					<div class="text-xs font-semibold {solution.color}">
						${solution.estimatedCost.toLocaleString()}
					</div>
				</TabsTrigger>
			{/each}
		</TabsList>

		{#each solutions as solution}
			{@const IconComponent = solution.icon}
			<TabsContent value={solution.id} class="space-y-6">
				<!-- Solution Overview Card -->
				{@const metadata = getSolutionMetadata(solution.id)}
				<Card class="border-2 {metadata.borderClass}">
					<CardHeader class="p-4 sm:p-6">
						<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
							<div class="flex items-start gap-3">
								<div
									class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
								>
									<IconComponent
										class="w-5 h-5 sm:w-6 sm:h-6 {solution.color}"
									/>
								</div>
								<div class="flex-1 min-w-0">
									<CardTitle class="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
										<span>{solution.name}</span>
										<Badge
											variant={metadata.badgeVariant}
											class="text-xs w-fit"
										>
											{solution.highlight}
										</Badge>
									</CardTitle>
									<p class="text-sm sm:text-base text-muted-foreground mt-1">
										{solution.description}
									</p>
								</div>
							</div>
							<!-- Cost Information -->
							<div class="text-center sm:text-right flex-shrink-0">
								<div
									class="text-xl sm:text-2xl font-bold {solution.color}"
								>
									${solution.estimatedCost.toLocaleString()}
								</div>
								<div class="text-xs text-muted-foreground">
									{solution.costLabel}
								</div>
								<div class="text-xs text-muted-foreground mt-1">
									{SolutionCostUtils.calculateBudgetPercentage(
										solution.estimatedCost,
										formData.budget,
									)}% of budget
								</div>
							</div>
						</div>
					</CardHeader>
					<CardContent class="p-4 sm:p-6">
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
							{#each solution.features as feature}
								<div class="flex items-center gap-2 text-xs sm:text-sm">
									<div
										class="w-2 h-2 rounded-full bg-primary flex-shrink-0"
									></div>
									<span class="truncate">{feature}</span>
								</div>
							{/each}
						</div>

						<!-- Cost Breakdown Bar -->
						<div class="bg-muted/30 rounded-lg p-3 sm:p-4">
							<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 mb-2">
								<span class="text-xs sm:text-sm font-medium"
									>Estimated Total Cost</span
								>
								<span class="text-xs sm:text-sm text-muted-foreground">
									${solution.estimatedCost.toLocaleString()} /
									${formData.budget.toLocaleString()}
								</span>
							</div>
							<div class="w-full bg-muted rounded-full h-2">
								<div
									class="h-2 rounded-full transition-all duration-500 {metadata.progressBarClass}"
									style="width: {Math.min(
										100,
										SolutionCostUtils.calculateBudgetPercentage(
											solution.estimatedCost,
											formData.budget,
										),
									)}%"
								></div>
							</div>
							<div
								class="text-xs mt-1 font-medium {solution.id ===
								'budget'
									? 'text-green-600 dark:text-green-400'
									: solution.id === 'premium'
										? 'text-purple-600 dark:text-purple-400'
										: 'text-muted-foreground'}"
							>
								{SolutionCostUtils.getCostComparisonText(
									solution.id,
									solution.estimatedCost,
									calculateSolutionCost("topranking"),
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<!-- Schedule Content -->
				<ScheduleContents
					{formData}
					solutionType={solution.id}
					isLoading={scheduleStates[solution.id].isLoading}
					error={scheduleStates[solution.id].error}
					scheduleData={scheduleStates[solution.id].scheduleData}
					onRetry={() => generateSchedule(solution.id)}
				/>
			</TabsContent>
		{/each}
	</Tabs>
</div>
