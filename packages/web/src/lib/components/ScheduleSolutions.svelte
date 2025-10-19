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
			{#each solutions as solution}
				{@const IconComponent = solution.icon}
				<TabsTrigger value={solution.id} class="flex items-center gap-2 py-3">
					<IconComponent class="w-4 h-4" />
					<span class="hidden sm:inline">{solution.name}</span>
					<span class="sm:hidden">{solution.name.split(' ')[0]}</span>
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
								<div>
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
						</div>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
							{#each solution.features as feature}
								<div class="flex items-center gap-2 text-sm">
									<div class="w-2 h-2 rounded-full bg-primary"></div>
									<span>{feature}</span>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>

				<!-- Schedule Content -->
				<MockSchedule {formData} solutionType={solution.id} />
			</TabsContent>
		{/each}
	</Tabs>
</div>