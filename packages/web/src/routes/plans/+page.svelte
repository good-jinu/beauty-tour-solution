<script lang="ts">
import type { SavedPlan } from "@bts/core";
import {
	Activity,
	ArrowLeft,
	Calendar,
	CalendarDays,
	Camera,
	Clock,
	DollarSign,
	Heart,
	Hotel,
	MapPin,
	Plane,
	Star,
	Users,
	Utensils,
} from "@lucide/svelte";
import { onMount } from "svelte";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";
import { Separator } from "$lib/components/ui/separator";
import { Skeleton } from "$lib/components/ui/skeleton";
import { guestStore } from "$lib/stores/guest";

let plans: SavedPlan[] = [];
let plan: SavedPlan | null = null;
let loading = true;
let error: string | null = null;

$: planId = $page.url.searchParams.get("planId");
$: showDetails = !!planId;

async function loadPlans() {
	try {
		loading = true;
		error = null;

		const response = await fetch("/api/plans");
		const result = await response.json();

		if (result.success) {
			plans = result.data || [];
		} else {
			error = result.error?.message || "Failed to load plans";
			toast.error("Failed to load plans", {
				description: error || "Unknown error occurred",
			});
		}
	} catch (err) {
		error = "Network error occurred while loading plans";
		toast.error("Network Error", {
			description: "Failed to connect to the server",
		});
	} finally {
		loading = false;
	}
}

async function loadPlan() {
	if (!planId) {
		error = "Plan ID not found.";
		loading = false;
		return;
	}

	try {
		loading = true;
		error = null;

		const response = await fetch(`/api/plans/${encodeURIComponent(planId)}`);
		const result = await response.json();

		if (result.success) {
			plan = result.data;
		} else {
			error = result.error?.message || "Failed to load plan";
			toast.error("Failed to load plan", {
				description: error || "Unknown error occurred",
			});
		}
	} catch (err) {
		error = "Network error occurred while loading plan";
		toast.error("Network Error", {
			description: "Failed to connect to the server",
		});
	} finally {
		loading = false;
	}
}

function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(amount);
}

function goBack() {
	goto("/plans");
}

function viewPlan(planId: string) {
	goto(`/plans?planId=${encodeURIComponent(planId)}`);
}

function getThemeIcon(theme: string | null | undefined) {
	if (!theme) return Hotel;
	switch (theme.toLowerCase()) {
		case "adventure":
			return Plane;
		case "relaxation":
			return Heart;
		case "cultural":
			return Camera;
		case "culinary":
			return Utensils;
		case "luxury":
			return Star;
		default:
			return Hotel;
	}
}

function getCategoryIcon(category: string) {
	switch (category) {
		case "treatment":
			return Heart;
		case "consultation":
			return Users;
		case "recovery":
			return Hotel;
		case "wellness":
			return Star;
		case "transport":
			return Plane;
		default:
			return Activity;
	}
}

let previousPlanId: string | null = null;

onMount(() => {
	if (showDetails) {
		loadPlan();
	} else {
		loadPlans();
	}
	previousPlanId = planId;
});

// Reactive statement to handle URL changes
$: if (planId !== previousPlanId) {
	if (planId) {
		loadPlan();
	} else {
		loadPlans();
	}
	previousPlanId = planId;
}
</script>

<svelte:head>
	<title
		>{showDetails ? plan?.title || "Plan Details" : "My Plans"} - Beauty Tour
		Solution</title
	>
	<meta
		name="description"
		content={showDetails
			? "View detailed information about your travel plan"
			: "View and manage your saved travel plans"}
	/>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	{#if showDetails}
		<!-- Back Button -->
		<Button variant="ghost" onclick={goBack} class="mb-6">
			<ArrowLeft class="w-4 h-4 mr-2" />
			Back to Plans
		</Button>
	{:else}
		<!-- Header for Plans List -->
		<div class="space-y-2 mb-6">
			<h1 class="text-3xl font-bold tracking-tight">My Plans</h1>
			<p class="text-muted-foreground">
				View and manage your saved travel plans
			</p>
		</div>
	{/if}

	{#if loading}
		<!-- Loading State -->
		{#if showDetails}
			<div class="space-y-6">
				<div class="space-y-2">
					<Skeleton class="h-8 w-3/4" />
					<Skeleton class="h-4 w-1/2" />
				</div>

				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-1/3" />
					</CardHeader>
					<CardContent class="space-y-4">
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-3/4" />
						<Skeleton class="h-4 w-1/2" />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<Skeleton class="h-6 w-1/4" />
					</CardHeader>
					<CardContent class="space-y-4">
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-2/3" />
					</CardContent>
				</Card>
			</div>
		{:else}
			<div class="space-y-4">
				{#each Array(3) as _}
					<Card>
						<CardHeader>
							<Skeleton class="h-6 w-1/2" />
							<Skeleton class="h-4 w-1/3" />
						</CardHeader>
						<CardContent>
							<div class="space-y-2">
								<Skeleton class="h-4 w-full" />
								<Skeleton class="h-4 w-3/4" />
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	{:else if error}
		<!-- Error State -->
		<Card class="max-w-md mx-auto">
			<CardHeader>
				<CardTitle class="text-destructive">
					{showDetails ? "Error Loading Plan" : "Error Loading Plans"}
				</CardTitle>
				<CardDescription>{error}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					onclick={showDetails ? loadPlan : loadPlans}
					variant="outline"
					class="w-full"
				>
					Try Again
				</Button>
			</CardContent>
		</Card>
	{:else if showDetails && plan}
		<!-- Plan Details -->
		<div class="space-y-6">
			<!-- Header -->
			<div class="space-y-2">
				<div class="flex items-start justify-between">
					<h1 class="text-3xl font-bold tracking-tight">
						{plan.title || "Untitled Plan"}
					</h1>
					{#if plan.planData.formData?.theme}
						{@const ThemeIcon = getThemeIcon(
							plan.planData.formData.theme,
						)}
						<Badge
							variant="secondary"
							class="flex items-center gap-1"
						>
							<ThemeIcon class="w-3 h-3" />
							{plan.planData.formData.theme}
						</Badge>
					{/if}
				</div>
				<p class="text-muted-foreground">
					Created on {formatDate(plan.createdAt)}
					{#if plan.updatedAt !== plan.createdAt}
						• Updated on {formatDate(plan.updatedAt)}
					{/if}
				</p>
			</div>

			<!-- Basic Information -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<MapPin class="w-5 h-5" />
						Trip Overview
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						{#if plan.planData.formData?.region}
							<div class="flex items-center gap-3">
								<MapPin class="w-4 h-4 text-muted-foreground" />
								<div>
									<p class="font-medium">Destination</p>
									<p class="text-sm text-muted-foreground">
										{plan.planData.formData.region}
									</p>
								</div>
							</div>
						{/if}

						{#if plan.planData.formData?.startDate && plan.planData.formData?.endDate}
							<div class="flex items-center gap-3">
								<CalendarDays
									class="w-4 h-4 text-muted-foreground"
								/>
								<div>
									<p class="font-medium">Travel Dates</p>
									<p class="text-sm text-muted-foreground">
										{formatDate(
											plan.planData.formData.startDate,
										)} -
										{formatDate(
											plan.planData.formData.endDate,
										)}
									</p>
								</div>
							</div>
						{/if}

						{#if plan.planData.formData?.travelers}
							<div class="flex items-center gap-3">
								<Users class="w-4 h-4 text-muted-foreground" />
								<div>
									<p class="font-medium">Travelers</p>
									<p class="text-sm text-muted-foreground">
										{plan.planData.formData.travelers}
										{plan.planData.formData.travelers === 1
											? "person"
											: "people"}
									</p>
								</div>
							</div>
						{/if}

						{#if plan.planData.formData?.budget}
							<div class="flex items-center gap-3">
								<DollarSign
									class="w-4 h-4 text-muted-foreground"
								/>
								<div>
									<p class="font-medium">Budget</p>
									<p class="text-sm text-muted-foreground">
										{formatCurrency(
											plan.planData.formData.budget,
										)}
									</p>
								</div>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>

			<!-- Preferences -->
			{#if plan.planData.formData}
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Heart class="w-5 h-5" />
							Preferences
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						{#if plan.planData.formData.theme}
							<div>
								<p class="font-medium mb-2">Theme</p>
								<Badge variant="outline"
									>{plan.planData.formData.theme}</Badge
								>
							</div>
						{/if}

						{#if plan.planData.formData.addOns}
							<div>
								<p class="font-medium mb-2">Add-ons</p>
								<div class="flex flex-wrap gap-2">
									{#if plan.planData.formData.addOns.flights}
										<Badge variant="outline">Flights</Badge>
									{/if}
									{#if plan.planData.formData.addOns.hotels}
										<Badge variant="outline">Hotels</Badge>
									{/if}
									{#if plan.planData.formData.addOns.activities}
										<Badge variant="outline"
											>Activities</Badge
										>
									{/if}
									{#if plan.planData.formData.addOns.transport}
										<Badge variant="outline"
											>Transport</Badge
										>
									{/if}
								</div>
							</div>
						{/if}

						{#if plan.planData.formData.specialRequests}
							<div>
								<p class="font-medium">Special Requests</p>
								<p class="text-sm text-muted-foreground">
									{plan.planData.formData.specialRequests}
								</p>
							</div>
						{/if}
					</CardContent>
				</Card>
			{/if}

			<!-- Schedule -->
			{#if plan.planData.schedule?.schedule && plan.planData.schedule.schedule.length > 0}
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Calendar class="w-5 h-5" />
							Generated Schedule
						</CardTitle>
						{#if plan.planData.schedule.summary}
							<CardDescription>
								{plan.planData.schedule.summary.totalDays} days •
								{plan.planData.schedule.summary.totalActivities}
								activities •
								{formatCurrency(
									plan.planData.schedule.summary
										.estimatedCost,
								)} estimated cost
							</CardDescription>
						{/if}
					</CardHeader>
					<CardContent class="space-y-6">
						{#each plan.planData.schedule.schedule as day}
							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<h4 class="font-semibold text-lg">
										Day {day.dayNumber} - {formatDate(
											day.date,
										)}
									</h4>
									<Badge variant="outline">
										{formatCurrency(day.totalCost)}
									</Badge>
								</div>

								{#if day.notes}
									<p
										class="text-sm text-muted-foreground italic"
									>
										{day.notes}
									</p>
								{/if}

								<div class="space-y-3">
									{#each day.activities as activity}
										{@const CategoryIcon = getCategoryIcon(
											activity.category,
										)}
										<div
											class="flex gap-3 p-3 rounded-lg border bg-card"
										>
											<div class="flex-shrink-0">
												<CategoryIcon
													class="w-4 h-4 mt-1 text-muted-foreground"
												/>
											</div>
											<div class="flex-1 space-y-1">
												<div
													class="flex items-start justify-between"
												>
													<h5 class="font-medium">
														{activity.activity}
													</h5>
													<Badge
														variant="secondary"
														class="ml-2 capitalize"
													>
														{activity.category}
													</Badge>
												</div>
												<p
													class="text-sm text-muted-foreground"
												>
													{activity.description}
												</p>
												<div
													class="flex items-center gap-4 text-xs text-muted-foreground"
												>
													<span
														class="flex items-center gap-1"
													>
														<Clock
															class="w-3 h-3"
														/>
														{activity.time}
													</span>
													<span
														class="flex items-center gap-1"
													>
														<MapPin
															class="w-3 h-3"
														/>
														{activity.location}
													</span>
													<span
														>Duration: {activity.duration}</span
													>
													<span class="font-medium">
														{formatCurrency(
															activity.cost,
														)}
													</span>
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
							{#if day !== plan.planData.schedule.schedule[plan.planData.schedule.schedule.length - 1]}
								<Separator />
							{/if}
						{/each}
					</CardContent>
				</Card>
			{/if}

			<!-- Plan Metadata -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Clock class="w-5 h-5" />
						Plan Information
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3">
					<div class="flex justify-between items-center">
						<span class="text-sm text-muted-foreground"
							>Plan ID</span
						>
						<code class="text-xs bg-muted px-2 py-1 rounded"
							>{plan.planId}</code
						>
					</div>
					<Separator />
					<div class="flex justify-between items-center">
						<span class="text-sm text-muted-foreground"
							>Guest ID</span
						>
						<code class="text-xs bg-muted px-2 py-1 rounded"
							>{plan.guestId}</code
						>
					</div>
					<Separator />
					<div class="flex justify-between items-center">
						<span class="text-sm text-muted-foreground"
							>Created</span
						>
						<span class="text-sm">{formatDate(plan.createdAt)}</span
						>
					</div>
					{#if plan.updatedAt !== plan.createdAt}
						<Separator />
						<div class="flex justify-between items-center">
							<span class="text-sm text-muted-foreground"
								>Last Updated</span
							>
							<span class="text-sm"
								>{formatDate(plan.updatedAt)}</span
							>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	{:else if !showDetails}
		<!-- Plans List -->
		{#if plans.length === 0}
			<!-- Empty State -->
			<Card class="max-w-md mx-auto text-center">
				<CardHeader>
					<CardTitle>No Plans Found</CardTitle>
					<CardDescription>
						You haven't created any travel plans yet.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button onclick={() => goto("/")} class="w-full">
						Create Your First Plan
					</Button>
				</CardContent>
			</Card>
		{:else}
			<div class="space-y-4">
				{#each plans as planItem}
					<Card
						class="hover:shadow-md transition-shadow cursor-pointer"
						onclick={() => viewPlan(planItem.planId)}
					>
						<CardHeader>
							<div class="flex items-start justify-between">
								<div class="space-y-1">
									<CardTitle class="text-xl">
										{planItem.title || "Untitled Plan"}
									</CardTitle>
									<CardDescription>
										Created {formatDate(planItem.createdAt)}
									</CardDescription>
								</div>
								{#if planItem.planData.formData?.theme}
									{@const ThemeIcon = getThemeIcon(
										planItem.planData.formData.theme,
									)}
									<Badge
										variant="secondary"
										class="flex items-center gap-1"
									>
										<ThemeIcon class="w-3 h-3" />
										{planItem.planData.formData.theme}
									</Badge>
								{/if}
							</div>
						</CardHeader>
						<CardContent>
							<div
								class="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
							>
								{#if planItem.planData.formData?.region}
									<div
										class="flex items-center gap-2 text-sm text-muted-foreground"
									>
										<MapPin class="w-4 h-4" />
										{planItem.planData.formData.region}
									</div>
								{/if}

								{#if planItem.planData.formData?.startDate && planItem.planData.formData?.endDate}
									<div
										class="flex items-center gap-2 text-sm text-muted-foreground"
									>
										<CalendarDays class="w-4 h-4" />
										{formatDate(
											planItem.planData.formData
												.startDate,
										)} - {formatDate(
											planItem.planData.formData.endDate,
										)}
									</div>
								{/if}

								{#if planItem.planData.formData?.travelers}
									<div
										class="flex items-center gap-2 text-sm text-muted-foreground"
									>
										<Users class="w-4 h-4" />
										{planItem.planData.formData.travelers}
										{planItem.planData.formData
											.travelers === 1
											? "person"
											: "people"}
									</div>
								{/if}

								<div
									class="flex items-center gap-2 text-sm text-muted-foreground"
								>
									<Clock class="w-4 h-4" />
									{formatDate(planItem.updatedAt)}
								</div>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		{/if}
	{/if}
</div>
