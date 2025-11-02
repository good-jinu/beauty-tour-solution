<script lang="ts">
import type {
	Activity,
	CreateActivityData,
	UpdateActivityData,
} from "@bts/core";
import { ArrowLeft } from "@lucide/svelte";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { ActivityForm } from "$lib/components/admin";
import { Breadcrumb } from "$lib/components/ui/breadcrumb";
import { Button } from "$lib/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";

let loading = false;

const breadcrumbItems = [
	{ label: "Activities", href: "/admin/activities" },
	{ label: "New Activity" },
];

async function handleSubmit(data: CreateActivityData | UpdateActivityData) {
	loading = true;
	try {
		const response = await fetch("/api/admin/activities", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		const result = await response.json();

		if (result.success) {
			toast.success("Activity created successfully");
			goto("/admin/activities");
		} else {
			toast.error(result.error || "Failed to create activity");
		}
	} catch (error) {
		console.error("Error creating activity:", error);
		toast.error("Failed to create activity");
	} finally {
		loading = false;
	}
}

function handleCancel() {
	goto("/admin/activities");
}
</script>

<svelte:head>
	<title>Admin - New Activity</title>
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
		<h1 class="text-3xl font-bold">Create New Activity</h1>
		<p class="text-muted-foreground mt-2">
			Add a new beauty tour activity to the system
		</p>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Activity Details</CardTitle>
		</CardHeader>
		<CardContent>
			<ActivityForm
				onSubmit={handleSubmit}
				onCancel={handleCancel}
				isLoading={loading}
			/>
		</CardContent>
	</Card>
</div>
