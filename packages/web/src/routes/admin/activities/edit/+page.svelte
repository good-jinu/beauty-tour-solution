<script lang="ts">
import type {
	Activity,
	CreateActivityData,
	UpdateActivityData,
} from "@bts/core";
import { ArrowLeft } from "@lucide/svelte";
import { onMount } from "svelte";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { ActivityForm } from "$lib/components/admin";
import { Breadcrumb } from "$lib/components/ui/breadcrumb";
import { Button } from "$lib/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";

let activity: Activity | null = $state(null);
let loading = $state(false);
let initialLoading = $state(true);

const activityId = $derived($page.url.searchParams.get("id"));
const breadcrumbItems = $derived([
	{ label: "Activities", href: "/admin/activities" },
	{ label: (activity as Activity | null)?.name || "Edit Activity" },
]);

onMount(async () => {
	if (!activityId) {
		toast.error("Activity ID is required");
		goto("/admin/activities");
		return;
	}
	await loadActivity();
});

async function loadActivity() {
	if (!activityId) return;

	initialLoading = true;
	try {
		const response = await fetch(`/api/admin/activities/${activityId}`);
		const result = await response.json();

		if (result.success) {
			activity = result.data;
		} else {
			toast.error("Activity not found");
			goto("/admin/activities");
		}
	} catch (error) {
		console.error("Error loading activity:", error);
		toast.error("Failed to load activity");
		goto("/admin/activities");
	} finally {
		initialLoading = false;
	}
}

async function handleSubmit(data: CreateActivityData | UpdateActivityData) {
	if (!activityId) return;

	loading = true;
	try {
		const response = await fetch(`/api/admin/activities/${activityId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		const result = await response.json();

		if (result.success) {
			toast.success("Activity updated successfully");
			goto("/admin/activities");
		} else {
			toast.error(result.error || "Failed to update activity");
		}
	} catch (error) {
		console.error("Error updating activity:", error);
		toast.error("Failed to update activity");
	} finally {
		loading = false;
	}
}

function handleCancel() {
	goto("/admin/activities");
}
</script>

<svelte:head>
	<title>Admin - Edit Activity</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<Breadcrumb items={breadcrumbItems} />

	<div class="mb-8">
		<Button
			href="/admin/activities"
			variant="ghost"
			class="flex items-center gap-2 mb-4"
		>
			<ArrowLeft size={16} />
			Back to Activities
		</Button>
		<h1 class="text-3xl font-bold">Edit Activity</h1>
		<p class="text-muted-foreground mt-2">Update activity information</p>
	</div>

	{#if initialLoading}
		<Card>
			<CardContent class="flex items-center justify-center py-16">
				<div class="text-center">
					<div
						class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
					></div>
					<p class="text-muted-foreground">Loading activity...</p>
				</div>
			</CardContent>
		</Card>
	{:else if activity}
		<Card>
			<CardHeader>
				<CardTitle>Activity Details</CardTitle>
			</CardHeader>
			<CardContent>
				<ActivityForm
					{activity}
					onSubmit={handleSubmit}
					onCancel={handleCancel}
					isLoading={loading}
				/>
			</CardContent>
		</Card>
	{:else}
		<Card>
			<CardContent class="flex items-center justify-center py-16">
				<div class="text-center">
					<h3 class="text-lg font-semibold mb-2">
						Activity Not Found
					</h3>
					<p class="text-muted-foreground mb-4">
						The requested activity could not be found.
					</p>
					<Button href="/admin/activities">Back to Activities</Button>
				</div>
			</CardContent>
		</Card>
	{/if}
</div>