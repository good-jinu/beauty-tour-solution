<script lang="ts">
import type { ScheduleDay, StoredSchedule } from "@bts/core";
import {
	Clock,
	DollarSign,
	Edit,
	MapPin,
	Plus,
	Save,
	Trash2,
	X,
} from "@lucide/svelte";
import { onMount } from "svelte";
import { writable } from "svelte/store";
import { toast } from "svelte-sonner";
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";
import Input from "$lib/components/ui/input/input.svelte";
import { Label } from "$lib/components/ui/label";
import { Separator } from "$lib/components/ui/separator";
import { Textarea } from "$lib/components/ui/textarea";

// Types for the admin interface
interface ActivityFormData {
	time: string;
	activity: string;
	location: string;
	duration: string;
	cost: number;
	description: string;
	category:
		| "treatment"
		| "consultation"
		| "recovery"
		| "wellness"
		| "transport";
}

interface ScheduleFormData {
	title: string;
	region: string;
	startDate: string;
	endDate: string;
	selectedThemes: string[];
	budget: number;
	days: ScheduleDay[];
}

// Stores
const schedules = writable<StoredSchedule[]>([]);
const selectedSchedule = writable<StoredSchedule | null>(null);
const editingActivity = writable<{
	dayIndex: number;
	activityIndex: number;
} | null>(null);
const showActivityForm = writable(false);
const showScheduleForm = writable(false);

// Form data
let activityForm: ActivityFormData = {
	time: "",
	activity: "",
	location: "",
	duration: "",
	cost: 0,
	description: "",
	category: "treatment",
};

let scheduleForm: ScheduleFormData = {
	title: "",
	region: "",
	startDate: "",
	endDate: "",
	selectedThemes: [],
	budget: 0,
	days: [],
};

let currentDayIndex = 0;
let loading = false;

// Category options
const categoryOptions = [
	{ value: "treatment", label: "Treatment" },
	{ value: "consultation", label: "Consultation" },
	{ value: "recovery", label: "Recovery" },
	{ value: "wellness", label: "Wellness" },
	{ value: "transport", label: "Transport" },
];

// Theme options
const themeOptions = [
	"skincare",
	"wellness",
	"anti-aging",
	"relaxation",
	"beauty",
	"medical",
	"spa",
	"traditional",
];

// Load schedules on mount
onMount(async () => {
	await loadSchedules();
});

async function loadSchedules() {
	loading = true;
	try {
		const response = await fetch("/api/schedules");
		const data = await response.json();

		if (data.success) {
			schedules.set(data.data || []);
		} else {
			toast.error("Failed to load schedules");
		}
	} catch (error) {
		console.error("Error loading schedules:", error);
		toast.error("Error loading schedules");
	} finally {
		loading = false;
	}
}

function selectSchedule(schedule: StoredSchedule) {
	selectedSchedule.set(schedule);
	scheduleForm = {
		title: schedule.title || "",
		region: schedule.request.region,
		startDate: schedule.request.startDate,
		endDate: schedule.request.endDate,
		selectedThemes: schedule.request.selectedThemes,
		budget: schedule.request.budget,
		days: [...schedule.schedule],
	};
}

function createNewSchedule() {
	selectedSchedule.set(null);
	scheduleForm = {
		title: "",
		region: "",
		startDate: "",
		endDate: "",
		selectedThemes: [],
		budget: 0,
		days: [],
	};
	showScheduleForm.set(true);
}

function addNewDay() {
	const dayNumber = scheduleForm.days.length + 1;
	const date = new Date(scheduleForm.startDate);
	date.setDate(date.getDate() + dayNumber - 1);

	const newDay: ScheduleDay = {
		date: date.toISOString().split("T")[0],
		dayNumber,
		activities: [],
		totalCost: 0,
		notes: "",
	};

	scheduleForm.days = [...scheduleForm.days, newDay];
}

function removeDay(dayIndex: number) {
	scheduleForm.days = scheduleForm.days.filter(
		(_, index) => index !== dayIndex,
	);
	// Renumber days
	scheduleForm.days = scheduleForm.days.map((day, index) => ({
		...day,
		dayNumber: index + 1,
	}));
}

function openActivityForm(dayIndex: number, activityIndex?: number) {
	currentDayIndex = dayIndex;

	if (activityIndex !== undefined) {
		// Editing existing activity
		const activity = scheduleForm.days[dayIndex].activities[activityIndex];
		activityForm = { ...activity };
		editingActivity.set({ dayIndex, activityIndex });
	} else {
		// Adding new activity
		activityForm = {
			time: "",
			activity: "",
			location: "",
			duration: "",
			cost: 0,
			description: "",
			category: "treatment",
		};
		editingActivity.set(null);
	}

	showActivityForm.set(true);
}

function closeActivityForm() {
	showActivityForm.set(false);
	editingActivity.set(null);
	activityForm = {
		time: "",
		activity: "",
		location: "",
		duration: "",
		cost: 0,
		description: "",
		category: "treatment",
	};
}

function saveActivity() {
	const editing = $editingActivity;

	if (editing) {
		// Update existing activity
		scheduleForm.days[editing.dayIndex].activities[editing.activityIndex] = {
			...activityForm,
		};
	} else {
		// Add new activity
		scheduleForm.days[currentDayIndex].activities = [
			...scheduleForm.days[currentDayIndex].activities,
			{ ...activityForm },
		];
	}

	// Recalculate day total cost
	scheduleForm.days[currentDayIndex].totalCost = scheduleForm.days[
		currentDayIndex
	].activities.reduce((sum, activity) => sum + activity.cost, 0);

	closeActivityForm();
	toast.success(editing ? "Activity updated" : "Activity added");
}

function deleteActivity(dayIndex: number, activityIndex: number) {
	scheduleForm.days[dayIndex].activities = scheduleForm.days[
		dayIndex
	].activities.filter((_, index) => index !== activityIndex);

	// Recalculate day total cost
	scheduleForm.days[dayIndex].totalCost = scheduleForm.days[
		dayIndex
	].activities.reduce((sum, activity) => sum + activity.cost, 0);

	toast.success("Activity deleted");
}

async function saveSchedule() {
	loading = true;
	try {
		const selected = $selectedSchedule;
		const requestData = {
			title: scheduleForm.title,
			request: {
				region: scheduleForm.region,
				startDate: scheduleForm.startDate,
				endDate: scheduleForm.endDate,
				selectedThemes: scheduleForm.selectedThemes,
				budget: scheduleForm.budget,
			},
			schedule: scheduleForm.days,
		};

		let response: Response | null = null;
		if (selected) {
			// Update existing schedule
			response = await fetch(`/api/schedules/${selected.scheduleId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestData),
			});
		} else {
			// Create new schedule
			response = await fetch("/api/schedules", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestData),
			});
		}

		const data = await response.json();

		if (data.success) {
			toast.success(selected ? "Schedule updated" : "Schedule created");
			await loadSchedules();
			showScheduleForm.set(false);
		} else {
			toast.error(data.error || "Failed to save schedule");
		}
	} catch (error) {
		console.error("Error saving schedule:", error);
		toast.error("Error saving schedule");
	} finally {
		loading = false;
	}
}

async function deleteSchedule(scheduleId: string) {
	if (!confirm("Are you sure you want to delete this schedule?")) return;

	loading = true;
	try {
		const response = await fetch(`/api/schedules/${scheduleId}`, {
			method: "DELETE",
		});

		const data = await response.json();

		if (data.success) {
			toast.success("Schedule deleted");
			await loadSchedules();
			selectedSchedule.set(null);
		} else {
			toast.error(data.error || "Failed to delete schedule");
		}
	} catch (error) {
		console.error("Error deleting schedule:", error);
		toast.error("Error deleting schedule");
	} finally {
		loading = false;
	}
}

async function createDemoData() {
	if (!confirm("This will create demo schedule data. Continue?")) return;

	loading = true;
	try {
		const response = await fetch("/api/admin/demo-data", {
			method: "POST",
		});

		const data = await response.json();

		if (data.success) {
			toast.success(data.message);
			await loadSchedules();
		} else {
			toast.error(data.error || "Failed to create demo data");
		}
	} catch (error) {
		console.error("Error creating demo data:", error);
		toast.error("Error creating demo data");
	} finally {
		loading = false;
	}
}

function getCategoryColor(category: string) {
	const colors = {
		treatment: "bg-blue-100 text-blue-800",
		consultation: "bg-green-100 text-green-800",
		recovery: "bg-purple-100 text-purple-800",
		wellness: "bg-pink-100 text-pink-800",
		transport: "bg-gray-100 text-gray-800",
	};
	return colors[category as keyof typeof colors] || colors.treatment;
}
</script>

<svelte:head>
	<title>Admin - Schedule Management</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-3xl font-bold">Schedule Management</h1>
			<p class="text-muted-foreground mt-2">Manage schedule activities and itineraries</p>
		</div>
		<div class="flex gap-2">
			<Button onclick={createDemoData} variant="outline" class="flex items-center gap-2">
				<Plus size={16} />
				Demo Data
			</Button>
			<Button onclick={createNewSchedule} class="flex items-center gap-2">
				<Plus size={16} />
				New Schedule
			</Button>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Schedules List -->
		<div class="lg:col-span-1">
			<Card>
				<CardHeader>
					<CardTitle>Schedules</CardTitle>
					<CardDescription>Select a schedule to edit</CardDescription>
				</CardHeader>
				<CardContent class="p-0">
					{#if loading}
						<div class="p-4 text-center text-muted-foreground">Loading...</div>
					{:else if $schedules.length === 0}
						<div class="p-4 text-center text-muted-foreground">No schedules found</div>
					{:else}
						<div class="space-y-2 p-4">
							{#each $schedules as schedule}
								<div 
									class="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors {$selectedSchedule?.scheduleId === schedule.scheduleId ? 'bg-muted border-primary' : ''}"
									onclick={() => selectSchedule(schedule)}
									role="button"
									tabindex="0"
									onkeydown={(e) => e.key === 'Enter' && selectSchedule(schedule)}
								>
									<div class="font-medium">{schedule.title || 'Untitled Schedule'}</div>
									<div class="text-sm text-muted-foreground">{schedule.request.region}</div>
									<div class="text-xs text-muted-foreground mt-1">
										{schedule.schedule.length} days • ${schedule.schedule.reduce((sum, day) => sum + day.totalCost, 0)}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Schedule Editor -->
		<div class="lg:col-span-2">
			{#if $selectedSchedule || $showScheduleForm}
				<Card>
					<CardHeader>
						<div class="flex items-center justify-between">
							<div>
								<CardTitle>
									{$selectedSchedule ? 'Edit Schedule' : 'New Schedule'}
								</CardTitle>
								<CardDescription>
									{$selectedSchedule ? 'Modify schedule details and activities' : 'Create a new schedule'}
								</CardDescription>
							</div>
							<div class="flex gap-2">
								<Button onclick={saveSchedule} disabled={loading} class="flex items-center gap-2">
									<Save size={16} />
									Save
								</Button>
								{#if $selectedSchedule}
									<Button 
										variant="destructive" 
										onclick={() => deleteSchedule($selectedSchedule.scheduleId)}
										disabled={loading}
										class="flex items-center gap-2"
									>
										<Trash2 size={16} />
										Delete
									</Button>
								{/if}
							</div>
						</div>
					</CardHeader>
					<CardContent class="space-y-6">
						<!-- Schedule Basic Info -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label for="title">Title</Label>
								<Input id="title" bind:value={scheduleForm.title} placeholder="Schedule title" />
							</div>
							<div class="space-y-2">
								<Label for="region">Region</Label>
								<Input id="region" bind:value={scheduleForm.region} placeholder="Seoul, Busan, etc." />
							</div>
							<div class="space-y-2">
								<Label for="startDate">Start Date</Label>
								<Input id="startDate" type="date" bind:value={scheduleForm.startDate} />
							</div>
							<div class="space-y-2">
								<Label for="endDate">End Date</Label>
								<Input id="endDate" type="date" bind:value={scheduleForm.endDate} />
							</div>
							<div class="space-y-2">
								<Label for="budget">Budget ($)</Label>
								<Input id="budget" type="number" bind:value={scheduleForm.budget} placeholder="2000" />
							</div>
							<div class="space-y-2">
								<Label>Themes</Label>
								<div class="flex flex-wrap gap-2">
									{#each themeOptions as theme}
										<Badge 
											variant={scheduleForm.selectedThemes.includes(theme) ? 'default' : 'outline'}
											class="cursor-pointer"
											onclick={() => {
												if (scheduleForm.selectedThemes.includes(theme)) {
													scheduleForm.selectedThemes = scheduleForm.selectedThemes.filter(t => t !== theme);
												} else {
													scheduleForm.selectedThemes = [...scheduleForm.selectedThemes, theme];
												}
											}}
										>
											{theme}
										</Badge>
									{/each}
								</div>
							</div>
						</div>

						<Separator />

						<!-- Days Management -->
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<h3 class="text-lg font-semibold">Schedule Days</h3>
								<Button onclick={addNewDay} variant="outline" size="sm" class="flex items-center gap-2">
									<Plus size={14} />
									Add Day
								</Button>
							</div>

							{#if scheduleForm.days.length === 0}
								<div class="text-center py-8 text-muted-foreground">
									No days added yet. Click "Add Day" to start building your schedule.
								</div>
							{:else}
								<div class="space-y-4">
									{#each scheduleForm.days as day, dayIndex}
										<Card>
											<CardHeader class="pb-3">
												<div class="flex items-center justify-between">
													<div>
														<CardTitle class="text-base">Day {day.dayNumber}</CardTitle>
														<CardDescription>{day.date} • ${day.totalCost}</CardDescription>
													</div>
													<div class="flex gap-2">
														<Button 
															onclick={() => openActivityForm(dayIndex)} 
															variant="outline" 
															size="sm"
															class="flex items-center gap-1"
														>
															<Plus size={14} />
															Activity
														</Button>
														<Button 
															onclick={() => removeDay(dayIndex)} 
															variant="destructive" 
															size="sm"
														>
															<Trash2 size={14} />
														</Button>
													</div>
												</div>
											</CardHeader>
											<CardContent>
												{#if day.activities.length === 0}
													<div class="text-center py-4 text-muted-foreground text-sm">
														No activities added yet
													</div>
												{:else}
													<div class="space-y-3">
														{#each day.activities as activity, activityIndex}
															<div class="flex items-start justify-between p-3 border rounded-lg">
																<div class="flex-1">
																	<div class="flex items-center gap-2 mb-2">
																		<Badge class={getCategoryColor(activity.category)}>
																			{activity.category}
																		</Badge>
																		<div class="flex items-center gap-1 text-sm text-muted-foreground">
																			<Clock size={12} />
																			{activity.time}
																		</div>
																		<div class="flex items-center gap-1 text-sm text-muted-foreground">
																			<DollarSign size={12} />
																			{activity.cost}
																		</div>
																	</div>
																	<div class="font-medium">{activity.activity}</div>
																	<div class="flex items-center gap-1 text-sm text-muted-foreground">
																		<MapPin size={12} />
																		{activity.location} • {activity.duration}
																	</div>
																	{#if activity.description}
																		<div class="text-sm text-muted-foreground mt-1">
																			{activity.description}
																		</div>
																	{/if}
																</div>
																<div class="flex gap-1 ml-4">
																	<Button 
																		onclick={() => openActivityForm(dayIndex, activityIndex)}
																		variant="ghost" 
																		size="sm"
																	>
																		<Edit size={14} />
																	</Button>
																	<Button 
																		onclick={() => deleteActivity(dayIndex, activityIndex)}
																		variant="ghost" 
																		size="sm"
																	>
																		<Trash2 size={14} />
																	</Button>
																</div>
															</div>
														{/each}
													</div>
												{/if}
												
												<!-- Day Notes -->
												<div class="mt-4">
													<Label for="notes-{dayIndex}">Notes</Label>
													<Textarea 
														id="notes-{dayIndex}"
														bind:value={day.notes} 
														placeholder="Add notes for this day..."
														class="mt-1"
													/>
												</div>
											</CardContent>
										</Card>
									{/each}
								</div>
							{/if}
						</div>
					</CardContent>
				</Card>
			{:else}
				<Card>
					<CardContent class="flex items-center justify-center py-16">
						<div class="text-center">
							<h3 class="text-lg font-semibold mb-2">No Schedule Selected</h3>
							<p class="text-muted-foreground mb-4">Select a schedule from the list or create a new one</p>
							<Button onclick={createNewSchedule} class="flex items-center gap-2">
								<Plus size={16} />
								Create New Schedule
							</Button>
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	</div>
</div>

<!-- Activity Form Modal -->
{#if $showActivityForm}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
		<Card class="w-full max-w-md max-h-[90vh] overflow-y-auto">
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>
						{$editingActivity ? 'Edit Activity' : 'Add Activity'}
					</CardTitle>
					<Button onclick={closeActivityForm} variant="ghost" size="sm">
						<X size={16} />
					</Button>
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="activity-time">Time</Label>
						<Input id="activity-time" bind:value={activityForm.time} placeholder="09:00" />
					</div>
					<div class="space-y-2">
						<Label for="activity-duration">Duration</Label>
						<Input id="activity-duration" bind:value={activityForm.duration} placeholder="2 hours" />
					</div>
				</div>
				
				<div class="space-y-2">
					<Label for="activity-name">Activity</Label>
					<Input id="activity-name" bind:value={activityForm.activity} placeholder="Facial Treatment" />
				</div>
				
				<div class="space-y-2">
					<Label for="activity-location">Location</Label>
					<Input id="activity-location" bind:value={activityForm.location} placeholder="Gangnam Beauty Clinic" />
				</div>
				
				<div class="grid grid-cols-2 gap-4">
					<div class="space-y-2">
						<Label for="activity-cost">Cost ($)</Label>
						<Input id="activity-cost" type="number" bind:value={activityForm.cost} placeholder="200" />
					</div>
					<div class="space-y-2">
						<Label for="activity-category">Category</Label>
						<select 
							id="activity-category" 
							bind:value={activityForm.category}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#each categoryOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
				</div>
				
				<div class="space-y-2">
					<Label for="activity-description">Description</Label>
					<Textarea 
						id="activity-description" 
						bind:value={activityForm.description} 
						placeholder="Detailed description of the activity..."
					/>
				</div>
				
				<div class="flex gap-2 pt-4">
					<Button onclick={saveActivity} class="flex-1">
						<Save size={16} class="mr-2" />
						Save Activity
					</Button>
					<Button onclick={closeActivityForm} variant="outline">
						Cancel
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
{/if}