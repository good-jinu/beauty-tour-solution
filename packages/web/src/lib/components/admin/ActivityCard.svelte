<script lang="ts">
import { type Activity, ActivityTheme } from "@bts/core";
import Button from "$lib/components/ui/button/button.svelte";

interface Props {
	activity: Activity;
	onEdit: () => void;
	onDelete: () => void;
	isDeleting?: boolean;
}

let { activity, onEdit, onDelete, isDeleting = false }: Props = $props();

// Theme display mapping
const themeLabels: Record<ActivityTheme, string> = {
	[ActivityTheme.PLASTIC_SURGERY_EYE]: "Eye Surgery",
	[ActivityTheme.PLASTIC_SURGERY_NOSE]: "Nose Surgery",
	[ActivityTheme.PLASTIC_SURGERY_FACE]: "Face Surgery",
	[ActivityTheme.HAIR_SALON]: "Hair Salon",
	[ActivityTheme.NAIL_SALON]: "Nail Salon",
	[ActivityTheme.SPA_WELLNESS]: "Spa & Wellness",
	[ActivityTheme.DENTAL]: "Dental",
	[ActivityTheme.DERMATOLOGY]: "Dermatology",
};

// Theme colors for badges
const themeColors: Record<ActivityTheme, string> = {
	[ActivityTheme.PLASTIC_SURGERY_EYE]:
		"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
	[ActivityTheme.PLASTIC_SURGERY_NOSE]:
		"bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
	[ActivityTheme.PLASTIC_SURGERY_FACE]:
		"bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
	[ActivityTheme.HAIR_SALON]:
		"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
	[ActivityTheme.NAIL_SALON]:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
	[ActivityTheme.SPA_WELLNESS]:
		"bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
	[ActivityTheme.DENTAL]:
		"bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
	[ActivityTheme.DERMATOLOGY]:
		"bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

// Format price display
function formatPrice(activity: Activity): string {
	const { price } = activity;
	const amount = new Intl.NumberFormat("en-US").format(price.amount);

	switch (price.type) {
		case "fixed":
			return `${amount} ${price.currency}`;
		case "starting_from":
			return `From ${amount} ${price.currency}`;
		case "range": {
			const maxAmount = new Intl.NumberFormat("en-US").format(
				price.maxAmount || 0,
			);
			return `${amount} - ${maxAmount} ${price.currency}`;
		}
		default:
			return `${amount} ${price.currency}`;
	}
}

// Format working hours display
function formatWorkingHours(activity: Activity): string {
	const { workingHours } = activity;
	const openDays = Object.entries(workingHours)
		.filter(([_, schedule]) => (schedule as any).isOpen)
		.map(([day, schedule]) => {
			const dayName = day.charAt(0).toUpperCase() + day.slice(1, 3);
			const s = schedule as any;
			return `${dayName}: ${s.openTime}-${s.closeTime}`;
		});

	if (openDays.length === 0) {
		return "Closed all days";
	}

	if (openDays.length <= 2) {
		return openDays.join(", ");
	}

	return `${openDays.length} days open`;
}

// Format date
function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
</script>

<div class="bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
	<!-- Card Header -->
	<div class="p-6 pb-4">
		<div class="flex items-start justify-between gap-4">
			<div class="flex-1 min-w-0">
				<h3 class="font-semibold text-lg leading-tight truncate" title={activity.name}>
					{activity.name}
				</h3>
				<p class="text-sm text-muted-foreground mt-1 truncate" title={activity.location.name}>
					{activity.location.name}
				</p>
			</div>
			
			<!-- Status Badge -->
			<div class="flex items-center gap-2 flex-shrink-0">
				<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {activity.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'}">
					{activity.isActive ? 'Active' : 'Inactive'}
				</span>
			</div>
		</div>
		
		<!-- Theme Badge -->
		<div class="mt-3">
			<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {themeColors[activity.theme]}">
				{themeLabels[activity.theme]}
			</span>
		</div>
	</div>

	<!-- Card Content -->
	<div class="px-6 pb-4 space-y-3">
		<!-- Location -->
		<div class="flex items-start gap-2">
			<svg class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
			</svg>
			<div class="min-w-0 flex-1">
				<p class="text-sm text-muted-foreground truncate">
					{activity.location.district}, {activity.location.city}
				</p>
				<p class="text-xs text-muted-foreground truncate" title={activity.location.address}>
					{activity.location.address}
				</p>
			</div>
		</div>

		<!-- Price -->
		<div class="flex items-center gap-2">
			<svg class="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
			</svg>
			<p class="text-sm font-medium">
				{formatPrice(activity)}
			</p>
		</div>

		<!-- Working Hours -->
		<div class="flex items-start gap-2">
			<svg class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
			</svg>
			<p class="text-sm text-muted-foreground">
				{formatWorkingHours(activity)}
			</p>
		</div>

		<!-- Description (if available) -->
		{#if activity.description}
			<div class="flex items-start gap-2">
				<svg class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
				</svg>
				<p class="text-sm text-muted-foreground line-clamp-2" title={activity.description}>
					{activity.description}
				</p>
			</div>
		{/if}

		<!-- Amenities (if available) -->
		{#if activity.amenities && activity.amenities.length > 0}
			<div class="flex items-start gap-2">
				<svg class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
				</svg>
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap gap-1">
						{#each activity.amenities.slice(0, 3) as amenity}
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
								{amenity}
							</span>
						{/each}
						{#if activity.amenities.length > 3}
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
								+{activity.amenities.length - 3} more
							</span>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Card Footer -->
	<div class="px-6 py-4 border-t bg-muted/30">
		<div class="flex items-center justify-between">
			<p class="text-xs text-muted-foreground">
				Created {formatDate(activity.createdAt)}
			</p>
			
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm" onclick={onEdit}>
					<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
					</svg>
					Edit
				</Button>
				
				<Button 
					variant="outline" 
					size="sm" 
					onclick={onDelete}
					disabled={isDeleting}
					class="text-destructive hover:text-destructive hover:bg-destructive/10"
				>
					{#if isDeleting}
						<svg class="animate-spin w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Deleting...
					{:else}
						<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
						</svg>
						Delete
					{/if}
				</Button>
			</div>
		</div>
	</div>
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>