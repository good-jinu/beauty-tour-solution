<script lang="ts">
import {
	type Activity,
	type ActivityFilters,
	ActivityTheme,
	type PaginatedActivities,
} from "@bts/core";
import { onMount } from "svelte";
import Button from "$lib/components/ui/button/button.svelte";
import Input from "$lib/components/ui/input/input.svelte";
import ActivityCard from "./ActivityCard.svelte";

interface Props {
	onCreateActivity: () => void;
	onEditActivity: (activity: Activity) => void;
	onDeleteActivity: (activityId: string) => Promise<void>;
}

let { onCreateActivity, onEditActivity, onDeleteActivity }: Props = $props();

// State
let activities = $state<Activity[]>([]);
let isLoading = $state(true);
let isDeleting = $state<string | null>(null);
let error = $state<string | null>(null);

// Pagination and filtering
let pagination = $state({
	page: 1,
	limit: 20,
	total: 0,
	totalPages: 0,
	hasNext: false,
	hasPrev: false,
});

let filters = $state<ActivityFilters>({
	search: "",
	theme: undefined,
	region: "",
	isActive: undefined,
	sortBy: "createdAt",
	sortOrder: "desc",
});

// Theme options for filtering
const themeOptions = [
	{ value: "", label: "All Themes" },
	{ value: ActivityTheme.PLASTIC_SURGERY, label: "Plastic Surgery" },
	{ value: ActivityTheme.HAIR_SALON, label: "Hair Salon" },
	{ value: ActivityTheme.SKIN_CLINIC, label: "Skin Clinic" },
	{ value: ActivityTheme.DIET_ACTIVITIES, label: "Diet Activities" },
	{ value: ActivityTheme.NAIL, label: "Nail" },
	{ value: ActivityTheme.MAKEUP, label: "Makeup" },
];

const statusOptions = [
	{ value: "", label: "All Status" },
	{ value: "true", label: "Active" },
	{ value: "false", label: "Inactive" },
];

const sortOptions = [
	{ value: "name", label: "Name" },
	{ value: "theme", label: "Theme" },
	{ value: "price", label: "Price" },
	{ value: "createdAt", label: "Created Date" },
];

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout>;
function handleSearchInput() {
	clearTimeout(searchTimeout);
	searchTimeout = setTimeout(() => {
		pagination.page = 1;
		loadActivities();
	}, 300);
}

// Load activities from API
async function loadActivities() {
	isLoading = true;
	error = null;

	try {
		const queryParams = new URLSearchParams({
			page: pagination.page.toString(),
			limit: pagination.limit.toString(),
			sortBy: filters.sortBy || "createdAt",
			sortOrder: filters.sortOrder || "desc",
		});

		if (filters.search) queryParams.set("search", filters.search);
		if (filters.theme) queryParams.set("theme", filters.theme);
		if (filters.region) queryParams.set("region", filters.region);
		if (filters.isActive !== undefined)
			queryParams.set("isActive", filters.isActive.toString());

		const response = await fetch(`/api/admin/activities?${queryParams}`);

		if (!response.ok) {
			throw new Error(`Failed to load activities: ${response.statusText}`);
		}

		const result = await response.json();

		if (result.success) {
			const data: PaginatedActivities = result.data;
			activities = data.activities;
			pagination = data.pagination;
		} else {
			throw new Error(result.error?.message || "Failed to load activities");
		}
	} catch (err) {
		console.error("Error loading activities:", err);
		error = err instanceof Error ? err.message : "Failed to load activities";
		activities = [];
	} finally {
		isLoading = false;
	}
}

// Handle filter changes
function handleFilterChange() {
	pagination.page = 1;
	loadActivities();
}

// Handle pagination
function goToPage(page: number) {
	pagination.page = page;
	loadActivities();
}

// Handle delete activity
async function handleDeleteActivity(activityId: string) {
	if (
		!confirm(
			"Are you sure you want to delete this activity? This action cannot be undone.",
		)
	) {
		return;
	}

	isDeleting = activityId;

	try {
		await onDeleteActivity(activityId);
		await loadActivities(); // Reload the list
	} catch (err) {
		console.error("Error deleting activity:", err);
		error = err instanceof Error ? err.message : "Failed to delete activity";
	} finally {
		isDeleting = null;
	}
}

// Load activities on mount
onMount(() => {
	loadActivities();
});
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold">Activity Management</h1>
			<p class="text-muted-foreground">Manage beauty tour activities and services</p>
		</div>
		<Button onclick={onCreateActivity} class="w-full sm:w-auto">
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
			</svg>
			Create Activity
		</Button>
	</div>

	<!-- Filters and Search -->
	<div class="bg-card border rounded-lg p-6">
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
			<!-- Search -->
			<div class="lg:col-span-2">
				<Input
					bind:value={filters.search}
					placeholder="Search activities..."
					oninput={handleSearchInput}
					class="w-full"
				/>
			</div>
			
			<!-- Theme Filter -->
			<div>
				<select
					bind:value={filters.theme}
					onchange={handleFilterChange}
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#each themeOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
			
			<!-- Region Filter -->
			<div>
				<Input
					bind:value={filters.region}
					placeholder="Region..."
					onchange={handleFilterChange}
				/>
			</div>
			
			<!-- Status Filter -->
			<div>
				<select
					bind:value={filters.isActive}
					onchange={handleFilterChange}
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#each statusOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			</div>
			
			<!-- Sort -->
			<div class="flex gap-2">
				<select
					bind:value={filters.sortBy}
					onchange={handleFilterChange}
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#each sortOptions as option}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
				<Button
					variant="outline"
					size="icon"
					onclick={() => {
						filters.sortOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc';
						handleFilterChange();
					}}
					class="flex-shrink-0"
				>
					{#if filters.sortOrder === 'asc'}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path>
						</svg>
					{:else}
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path>
						</svg>
					{/if}
				</Button>
			</div>
		</div>
	</div>

	<!-- Error Display -->
	{#if error}
		<div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
			<div class="flex items-center gap-2">
				<svg class="w-5 h-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
				</svg>
				<p class="text-destructive font-medium">Error</p>
			</div>
			<p class="text-destructive mt-1">{error}</p>
			<Button variant="outline" size="sm" onclick={loadActivities} class="mt-3">
				Try Again
			</Button>
		</div>
	{/if}

	<!-- Loading State -->
	{#if isLoading}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each Array(6) as _}
				<div class="bg-card border rounded-lg p-6 animate-pulse">
					<div class="h-4 bg-muted rounded w-3/4 mb-3"></div>
					<div class="h-3 bg-muted rounded w-1/2 mb-2"></div>
					<div class="h-3 bg-muted rounded w-2/3 mb-4"></div>
					<div class="flex gap-2">
						<div class="h-8 bg-muted rounded w-16"></div>
						<div class="h-8 bg-muted rounded w-16"></div>
					</div>
				</div>
			{/each}
		</div>
	{:else if activities.length === 0}
		<!-- Empty State -->
		<div class="text-center py-12">
			<svg class="w-16 h-16 mx-auto text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
			</svg>
			<h3 class="text-lg font-semibold mb-2">No activities found</h3>
			<p class="text-muted-foreground mb-4">
				{filters.search || filters.theme || filters.region 
					? 'No activities match your current filters. Try adjusting your search criteria.'
					: 'Get started by creating your first activity.'}
			</p>
			{#if filters.search || filters.theme || filters.region}
				<Button variant="outline" onclick={() => {
					filters.search = '';
					filters.theme = undefined;
					filters.region = '';
					filters.isActive = undefined;
					handleFilterChange();
				}}>
					Clear Filters
				</Button>
			{:else}
				<Button onclick={onCreateActivity}>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
					</svg>
					Create Your First Activity
				</Button>
			{/if}
		</div>
	{:else}
		<!-- Activities Grid -->
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each activities as activity (activity.activityId)}
				<ActivityCard
					{activity}
					onEdit={() => onEditActivity(activity)}
					onDelete={() => handleDeleteActivity(activity.activityId)}
					isDeleting={isDeleting === activity.activityId}
				/>
			{/each}
		</div>

		<!-- Pagination -->
		{#if pagination.totalPages > 1}
			<div class="flex items-center justify-between">
				<p class="text-sm text-muted-foreground">
					Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
				</p>
				
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onclick={() => goToPage(pagination.page - 1)}
						disabled={!pagination.hasPrev}
					>
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
						</svg>
						Previous
					</Button>
					
					<!-- Page Numbers -->
					{#each Array(Math.min(5, pagination.totalPages)) as _, i}
						{@const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i}
						{#if pageNum <= pagination.totalPages}
							<Button
								variant={pageNum === pagination.page ? "default" : "outline"}
								size="sm"
								onclick={() => goToPage(pageNum)}
							>
								{pageNum}
							</Button>
						{/if}
					{/each}
					
					<Button
						variant="outline"
						size="sm"
						onclick={() => goToPage(pagination.page + 1)}
						disabled={!pagination.hasNext}
					>
						Next
						<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
						</svg>
					</Button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: .5;
		}
	}
	
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>