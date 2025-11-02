<script lang="ts">
import type { Activity } from "@bts/core";
import { Plus } from "@lucide/svelte";
import { onMount } from "svelte";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { ActivityManagementDashboard } from "$lib/components/admin";
import { Breadcrumb } from "$lib/components/ui/breadcrumb";
import { Button } from "$lib/components/ui/button";

let loading = false;

const breadcrumbItems = [{ label: "Activities" }];

function handleCreateActivity() {
	goto("/admin/activities/new");
}

function handleEditActivity(activity: Activity) {
	goto(`/admin/activities/edit?id=${activity.activityId}`);
}

async function handleDeleteActivity(activityId: string) {
	try {
		const response = await fetch(`/api/admin/activities/${activityId}`, {
			method: "DELETE",
		});

		const result = await response.json();

		if (result.success) {
			toast.success("Activity deleted successfully");
		} else {
			toast.error(result.error || "Failed to delete activity");
		}
	} catch (error) {
		console.error("Error deleting activity:", error);
		toast.error("Failed to delete activity");
		throw error; // Re-throw so the dashboard can handle it
	}
}

onMount(() => {
	// Any initialization logic can go here
});
</script>

<svelte:head>
	<title>Admin - Activity Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<Breadcrumb items={breadcrumbItems} />
	
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold">Activity Management</h1>
			<p class="text-muted-foreground mt-2">Manage beauty tour activities and services</p>
		</div>
		<Button href="/admin/activities/new" class="flex items-center gap-2">
			<Plus size={16} />
			Add Activity
		</Button>
	</div>

	<ActivityManagementDashboard 
		onCreateActivity={handleCreateActivity}
		onEditActivity={handleEditActivity}
		onDeleteActivity={handleDeleteActivity}
	/>
</div>