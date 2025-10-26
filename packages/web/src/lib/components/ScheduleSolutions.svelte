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
			travelers: 1,
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
		<TabsList class="grid w-full grid-cols-3 mb-6">
			{#each solutions as solution, index}
				{@const IconComponent = solution.icon}
				<TabsTrigger
					value={solution.id}
					class="flex flex-col items-center gap-1 py-3 h-auto"
				>
					<div>Solution {index + 1}</div>
					<div class="flex items-center gap-2">
						<IconComponent class="w-4 h-4" />
						<span class="hidden sm:inline">{solution.name}</span>
						<span class="sm:hidden"
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
					<CardHeader>
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-3">
								<div
									class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
								>
									<IconComponent
										class="w-6 h-6 {solution.color}"
									/>
								</div>
								<div class="flex-1">
									<CardTitle class="flex items-center gap-2">
										{solution.name}
										<Badge
											variant={metadata.badgeVariant}
											class="text-xs"
										>
											{solution.highlight}
										</Badge>
									</CardTitle>
									<p class="text-muted-foreground mt-1">
										{solution.description}
									</p>
								</div>
							</div>
							<!-- Cost Information -->
							<div class="text-right">
								<div
									class="text-2xl font-bold {solution.color}"
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
					<CardContent>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
							{#each solution.features as feature}
								<div class="flex items-center gap-2 text-sm">
									<div
										class="w-2 h-2 rounded-full bg-primary"
									></div>
									<span>{feature}</span>
								</div>
							{/each}
						</div>

						<!-- Cost Breakdown Bar -->
						<div class="bg-muted/30 rounded-lg p-3">
							<div class="flex justify-between items-center mb-2">
								<span class="text-sm font-medium"
									>Estimated Total Cost</span
								>
								<span class="text-sm text-muted-foreground">
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
