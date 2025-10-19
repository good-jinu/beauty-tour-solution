<script lang="ts">
import { Crown, DollarSign, Trophy } from "@lucide/svelte";
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
import type { StepperFormData } from "$lib/types";
import MockSchedule from "./MockSchedule.svelte";

interface Props {
	formData: StepperFormData;
}

let { formData }: Props = $props();

// Calculate estimated costs for each solution type
function calculateSolutionCost(
	solutionType: "topranking" | "premium" | "budget",
): number {
	const baseCost = formData.budget * 0.8; // Use 80% of budget as base
	const multipliers = {
		budget: 0.6,
		topranking: 1.0,
		premium: 1.5,
	};
	return Math.round(baseCost * multipliers[solutionType]);
}

const solutions = [
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
] as const;
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
				<TabsTrigger value={solution.id} class="flex flex-col items-center gap-1 py-3 h-auto">
					<div>Solution {index + 1}</div>
					<div class="flex items-center gap-2">
						<IconComponent class="w-4 h-4" />
						<span class="hidden sm:inline">{solution.name}</span>
						<span class="sm:hidden">{solution.name.split(' ')[0]}</span>
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
				<Card class="border-2 {solution.id === 'topranking' ? 'border-primary' : 'border-border'}">
					<CardHeader>
						<div class="flex items-start justify-between">
							<div class="flex items-center gap-3">
								<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
									<IconComponent class="w-6 h-6 {solution.color}" />
								</div>
								<div class="flex-1">
									<CardTitle class="flex items-center gap-2">
										{solution.name}
										{#if solution.id === "topranking"}
											<Badge variant="default" class="text-xs">
												{solution.highlight}
											</Badge>
										{:else}
											<Badge variant="secondary" class="text-xs">
												{solution.highlight}
											</Badge>
										{/if}
									</CardTitle>
									<p class="text-muted-foreground mt-1">
										{solution.description}
									</p>
								</div>
							</div>
							<!-- Cost Information -->
							<div class="text-right">
								<div class="text-2xl font-bold {solution.color}">
									${solution.estimatedCost.toLocaleString()}
								</div>
								<div class="text-xs text-muted-foreground">
									{solution.costLabel}
								</div>
								<div class="text-xs text-muted-foreground mt-1">
									{Math.round((solution.estimatedCost / formData.budget) * 100)}% of budget
								</div>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
							{#each solution.features as feature}
								<div class="flex items-center gap-2 text-sm">
									<div class="w-2 h-2 rounded-full bg-primary"></div>
									<span>{feature}</span>
								</div>
							{/each}
						</div>
						
						<!-- Cost Breakdown Bar -->
						<div class="bg-muted/30 rounded-lg p-3">
							<div class="flex justify-between items-center mb-2">
								<span class="text-sm font-medium">Estimated Total Cost</span>
								<span class="text-sm text-muted-foreground">
									${solution.estimatedCost.toLocaleString()} / ${formData.budget.toLocaleString()}
								</span>
							</div>
							<div class="w-full bg-muted rounded-full h-2">
								<div
									class="h-2 rounded-full transition-all duration-500 {
										solution.id === 'budget' ? 'bg-green-500' :
										solution.id === 'premium' ? 'bg-purple-500' :
										'bg-primary'
									}"
									style="width: {Math.min(100, (solution.estimatedCost / formData.budget) * 100)}%"
								></div>
							</div>
							{#if solution.id === 'budget'}
								<div class="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
									Save ${(calculateSolutionCost("topranking") - solution.estimatedCost).toLocaleString()}
								</div>
							{:else if solution.id === 'premium'}
								<div class="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
									+${(solution.estimatedCost - calculateSolutionCost("topranking")).toLocaleString()} for premium experience
								</div>
							{:else}
								<div class="text-xs text-muted-foreground mt-1">
									Balanced cost and quality
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>

				<!-- Schedule Content -->
				<MockSchedule {formData} solutionType={solution.id} />
			</TabsContent>
		{/each}
	</Tabs>
</div>