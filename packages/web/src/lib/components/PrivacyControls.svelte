<script lang="ts">
import { onMount } from "svelte";
import { Button } from "$lib/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";
import { Switch } from "$lib/components/ui/switch";
import {
	hasUserOptedOut,
	optInToTracking,
	optOutOfTracking,
} from "$lib/config/eventTracking";

let isOptedOut = false;
let isLoading = true;

onMount(async () => {
	// Check current opt-out status
	isOptedOut = await hasUserOptedOut();
	isLoading = false;
});

function handleToggleTracking() {
	if (isOptedOut) {
		optInToTracking();
		isOptedOut = false;
	} else {
		optOutOfTracking();
		isOptedOut = true;
	}
}
</script>

<Card class="w-full max-w-md">
	<CardHeader>
		<CardTitle>Privacy Controls</CardTitle>
		<CardDescription>
			Manage your data privacy preferences for this website.
		</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="flex items-center justify-between">
			<div class="space-y-1">
				<label for="tracking-toggle" class="text-sm font-medium">
					Event Tracking
				</label>
				<p class="text-xs text-muted-foreground">
					Allow us to collect anonymous usage data to improve the website experience.
				</p>
			</div>
			{#if isLoading}
				<div class="h-6 w-11 bg-muted animate-pulse rounded-full"></div>
			{:else}
				<Switch
					id="tracking-toggle"
					checked={!isOptedOut}
					onCheckedChange={handleToggleTracking}
				/>
			{/if}
		</div>
		
		<div class="text-xs text-muted-foreground space-y-2">
			<p>
				<strong>What we collect:</strong> Page visits, clicks, and scroll behavior. 
				We do not collect personal information, form data, or sensitive content.
			</p>
			<p>
				<strong>How we use it:</strong> To understand how users interact with our website 
				and improve the user experience.
			</p>
			<p>
				<strong>Your choice:</strong> You can opt out at any time. Your preference will be 
				remembered for future visits.
			</p>
		</div>
		
		{#if isOptedOut}
			<div class="p-3 bg-orange-50 border border-orange-200 rounded-md">
				<p class="text-sm text-orange-800">
					Event tracking is currently disabled. We will not collect any usage data.
				</p>
			</div>
		{:else}
			<div class="p-3 bg-green-50 border border-green-200 rounded-md">
				<p class="text-sm text-green-800">
					Event tracking is enabled. Thank you for helping us improve the website!
				</p>
			</div>
		{/if}
	</CardContent>
</Card>