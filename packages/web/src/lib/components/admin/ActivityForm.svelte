<script lang="ts">
import {
	type Activity,
	ActivityTheme,
	ActivityValidator,
	type CreateActivityData,
	type UpdateActivityData,
	type ValidationError,
} from "@bts/core";
import Button from "$lib/components/ui/button/button.svelte";
import Input from "$lib/components/ui/input/input.svelte";
import Label from "$lib/components/ui/label/label.svelte";
import Textarea from "$lib/components/ui/textarea/textarea.svelte";

interface Props {
	activity?: Activity;
	isLoading?: boolean;
	onSubmit: (data: CreateActivityData | UpdateActivityData) => Promise<void>;
	onCancel?: () => void;
}

let { activity, isLoading = false, onSubmit, onCancel }: Props = $props();

// Form data
let formData = $state({
	name: activity?.name || "",
	theme: activity?.theme || ActivityTheme.PLASTIC_SURGERY,
	description: activity?.description || "",
	// Location fields
	locationName: activity?.location?.name || "",
	address: activity?.location?.address || "",
	district: activity?.location?.district || "",
	city: activity?.location?.city || "",
	region: activity?.location?.region || "",
	// Price fields
	currency: activity?.price?.currency || "KRW",
	amount: activity?.price?.amount || 0,
	priceType: activity?.price?.type || "fixed",
	maxAmount: activity?.price?.maxAmount || 0,
	// Working hours
	workingHours: activity?.workingHours || {
		monday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
		tuesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
		wednesday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
		thursday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
		friday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
		saturday: { isOpen: true, openTime: "09:00", closeTime: "18:00" },
		sunday: { isOpen: false, openTime: undefined, closeTime: undefined },
	},
	// Contact info
	phone: activity?.contactInfo?.phone || "",
	email: activity?.contactInfo?.email || "",
	website: activity?.contactInfo?.website || "",
	// Other fields
	amenities: activity?.amenities?.join(", ") || "",
	isActive: activity?.isActive ?? true,
});

// Validation errors
let errors = $state<Record<string, string>>({});
let isSubmitting = $state(false);

// Theme options
const themeOptions = [
	{ value: ActivityTheme.PLASTIC_SURGERY, label: "Plastic Surgery" },
	{ value: ActivityTheme.HAIR_SALON, label: "Hair Salon" },
	{ value: ActivityTheme.SKIN_CLINIC, label: "Skin Clinic" },
	{ value: ActivityTheme.DIET_ACTIVITIES, label: "Diet Activities" },
	{ value: ActivityTheme.NAIL, label: "Nail" },
	{ value: ActivityTheme.MAKEUP, label: "Makeup" },
];

const priceTypeOptions = [
	{ value: "fixed", label: "Fixed Price" },
	{ value: "starting_from", label: "Starting From" },
	{ value: "range", label: "Price Range" },
];

const days = [
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
] as const;

// Validation function
function validateForm(): boolean {
	const activityData: CreateActivityData = {
		name: formData.name,
		theme: formData.theme,
		description: formData.description || undefined,
		location: {
			name: formData.locationName,
			address: formData.address,
			district: formData.district,
			city: formData.city,
			region: formData.region,
		},
		price: {
			currency: formData.currency,
			amount: formData.amount,
			type: formData.priceType as "fixed" | "starting_from" | "range",
			maxAmount:
				formData.priceType === "range" ? formData.maxAmount : undefined,
		},
		workingHours: formData.workingHours,
		contactInfo: {
			phone: formData.phone || undefined,
			email: formData.email || undefined,
			website: formData.website || undefined,
		},
		amenities: formData.amenities
			? formData.amenities
					.split(",")
					.map((a: string) => a.trim())
					.filter((a: string) => a)
			: undefined,
		isActive: formData.isActive,
	};

	const validation = ActivityValidator.validateActivityData(activityData);

	// Clear previous errors
	errors = {};

	if (!validation.isValid) {
		validation.errors.forEach((error: ValidationError) => {
			errors[error.field] = error.message;
		});
		return false;
	}

	return true;
}

// Handle form submission
async function handleSubmit(event: Event) {
	event.preventDefault();

	if (!validateForm()) {
		return;
	}

	isSubmitting = true;

	try {
		const activityData: CreateActivityData | UpdateActivityData = {
			name: formData.name,
			theme: formData.theme,
			description: formData.description || undefined,
			location: {
				name: formData.locationName,
				address: formData.address,
				district: formData.district,
				city: formData.city,
				region: formData.region,
			},
			price: {
				currency: formData.currency,
				amount: formData.amount,
				type: formData.priceType as "fixed" | "starting_from" | "range",
				maxAmount:
					formData.priceType === "range" ? formData.maxAmount : undefined,
			},
			workingHours: formData.workingHours,
			contactInfo: {
				phone: formData.phone || undefined,
				email: formData.email || undefined,
				website: formData.website || undefined,
			},
			amenities: formData.amenities
				? formData.amenities
						.split(",")
						.map((a: string) => a.trim())
						.filter((a: string) => a)
				: undefined,
			isActive: formData.isActive,
		};

		await onSubmit(activityData);
	} catch (error) {
		console.error("Form submission error:", error);
	} finally {
		isSubmitting = false;
	}
}

// Handle working hours changes
function toggleDay(day: keyof typeof formData.workingHours) {
	formData.workingHours[day].isOpen = !formData.workingHours[day].isOpen;
	if (!formData.workingHours[day].isOpen) {
		formData.workingHours[day].openTime = undefined;
		formData.workingHours[day].closeTime = undefined;
	} else {
		formData.workingHours[day].openTime = "09:00";
		formData.workingHours[day].closeTime = "18:00";
	}
}
</script>

<div class="max-w-4xl mx-auto p-6">
	<div class="bg-card border rounded-lg shadow-sm">
		<div class="p-6 border-b">
			<h2 class="text-2xl font-bold">
				{activity ? 'Edit Activity' : 'Create New Activity'}
			</h2>
			<p class="text-muted-foreground mt-1">
				{activity ? 'Update the activity information below' : 'Fill in the details to create a new activity'}
			</p>
		</div>
		
		<form onsubmit={handleSubmit} class="p-6 space-y-8">
			<!-- Basic Information -->
			<section class="space-y-6">
				<div class="flex items-center gap-3 pb-3 border-b">
					<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
						1
					</div>
					<div>
						<h3 class="text-lg font-semibold">Basic Information</h3>
						<p class="text-sm text-muted-foreground">Activity name, theme, and description</p>
					</div>
				</div>
				
				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="name">Activity Name *</Label>
						<Input
							id="name"
							bind:value={formData.name}
							placeholder="Enter activity name"
							class={errors.name ? 'border-destructive' : ''}
						/>
						{#if errors.name}
							<p class="text-sm text-destructive">{errors.name}</p>
						{/if}
					</div>
					
					<div class="space-y-2">
						<Label for="theme">Theme *</Label>
						<select
							id="theme"
							bind:value={formData.theme}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 {errors.theme ? 'border-destructive' : ''}"
						>
							{#each themeOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						{#if errors.theme}
							<p class="text-sm text-destructive">{errors.theme}</p>
						{/if}
					</div>
				</div>
				
				<div class="space-y-2">
					<Label for="description">Description</Label>
					<Textarea
						id="description"
						bind:value={formData.description}
						placeholder="Enter activity description"
						rows={3}
						class={errors.description ? 'border-destructive' : ''}
					/>
					{#if errors.description}
						<p class="text-sm text-destructive">{errors.description}</p>
					{/if}
				</div>
			</section>

			<!-- Location Information -->
			<section class="space-y-6">
				<div class="flex items-center gap-3 pb-3 border-b">
					<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
						2
					</div>
					<div>
						<h3 class="text-lg font-semibold">Location Information</h3>
						<p class="text-sm text-muted-foreground">Address and location details</p>
					</div>
				</div>
				
				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="locationName">Location Name *</Label>
						<Input
							id="locationName"
							bind:value={formData.locationName}
							placeholder="e.g., Kim's Plastic Surgery Clinic"
							class={errors['location.name'] ? 'border-destructive' : ''}
						/>
						{#if errors['location.name']}
							<p class="text-sm text-destructive">{errors['location.name']}</p>
						{/if}
					</div>
					
					<div class="space-y-2">
						<Label for="address">Address *</Label>
						<Input
							id="address"
							bind:value={formData.address}
							placeholder="Enter full address"
							class={errors['location.address'] ? 'border-destructive' : ''}
						/>
						{#if errors['location.address']}
							<p class="text-sm text-destructive">{errors['location.address']}</p>
						{/if}
					</div>
				</div>
				
				<div class="grid gap-4 md:grid-cols-3">
					<div class="space-y-2">
						<Label for="district">District *</Label>
						<Input
							id="district"
							bind:value={formData.district}
							placeholder="e.g., Gangnam"
							class={errors['location.district'] ? 'border-destructive' : ''}
						/>
						{#if errors['location.district']}
							<p class="text-sm text-destructive">{errors['location.district']}</p>
						{/if}
					</div>
					
					<div class="space-y-2">
						<Label for="city">City *</Label>
						<Input
							id="city"
							bind:value={formData.city}
							placeholder="e.g., Seoul"
							class={errors['location.city'] ? 'border-destructive' : ''}
						/>
						{#if errors['location.city']}
							<p class="text-sm text-destructive">{errors['location.city']}</p>
						{/if}
					</div>
					
					<div class="space-y-2">
						<Label for="region">Region *</Label>
						<Input
							id="region"
							bind:value={formData.region}
							placeholder="e.g., Seoul"
							class={errors['location.region'] ? 'border-destructive' : ''}
						/>
						{#if errors['location.region']}
							<p class="text-sm text-destructive">{errors['location.region']}</p>
						{/if}
					</div>
				</div>
			</section>

			<!-- Price Information -->
			<section class="space-y-6">
				<div class="flex items-center gap-3 pb-3 border-b">
					<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
						3
					</div>
					<div>
						<h3 class="text-lg font-semibold">Price Information</h3>
						<p class="text-sm text-muted-foreground">Pricing details and currency</p>
					</div>
				</div>
				
				<div class="grid gap-4 md:grid-cols-3">
					<div class="space-y-2">
						<Label for="currency">Currency *</Label>
						<Input
							id="currency"
							bind:value={formData.currency}
							placeholder="KRW"
							class={errors['price.currency'] ? 'border-destructive' : ''}
						/>
						{#if errors['price.currency']}
							<p class="text-sm text-destructive">{errors['price.currency']}</p>
						{/if}
					</div>
					
					<div class="space-y-2">
						<Label for="priceType">Price Type *</Label>
						<select
							id="priceType"
							bind:value={formData.priceType}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 {errors['price.type'] ? 'border-destructive' : ''}"
						>
							{#each priceTypeOptions as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
						{#if errors['price.type']}
							<p class="text-sm text-destructive">{errors['price.type']}</p>
						{/if}
					</div>
					
					<div class="space-y-2">
						<Label for="amount">Amount *</Label>
						<Input
							id="amount"
							type="number"
							bind:value={formData.amount}
							placeholder="0"
							min="0"
							class={errors['price.amount'] ? 'border-destructive' : ''}
						/>
						{#if errors['price.amount']}
							<p class="text-sm text-destructive">{errors['price.amount']}</p>
						{/if}
					</div>
				</div>
				
				{#if formData.priceType === 'range'}
					<div class="space-y-2">
						<Label for="maxAmount">Maximum Amount *</Label>
						<Input
							id="maxAmount"
							type="number"
							bind:value={formData.maxAmount}
							placeholder="0"
							min="0"
							class={errors['price.maxAmount'] ? 'border-destructive' : ''}
						/>
						{#if errors['price.maxAmount']}
							<p class="text-sm text-destructive">{errors['price.maxAmount']}</p>
						{/if}
					</div>
				{/if}
			</section>

			<!-- Working Hours -->
			<section class="space-y-6">
				<div class="flex items-center gap-3 pb-3 border-b">
					<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
						4
					</div>
					<div>
						<h3 class="text-lg font-semibold">Working Hours</h3>
						<p class="text-sm text-muted-foreground">Set operating hours for each day</p>
					</div>
				</div>
				
				<div class="space-y-4">
					{#each days as day}
						<div class="flex items-center gap-4 p-4 border rounded-lg">
							<div class="w-24">
								<label class="flex items-center gap-2">
									<input
										type="checkbox"
										checked={formData.workingHours[day].isOpen}
										onchange={() => toggleDay(day)}
										class="rounded border-gray-300"
									/>
									<span class="text-sm font-medium capitalize">{day}</span>
								</label>
							</div>
							
							{#if formData.workingHours[day].isOpen}
								<div class="flex items-center gap-2">
									<Input
										type="time"
										bind:value={formData.workingHours[day].openTime}
										class="w-32 {errors[`workingHours.${day}.openTime`] ? 'border-destructive' : ''}"
									/>
									<span class="text-sm text-muted-foreground">to</span>
									<Input
										type="time"
										bind:value={formData.workingHours[day].closeTime}
										class="w-32 {errors[`workingHours.${day}.closeTime`] ? 'border-destructive' : ''}"
									/>
								</div>
							{:else}
								<span class="text-sm text-muted-foreground">Closed</span>
							{/if}
						</div>
						{#if errors[`workingHours.${day}.openTime`] || errors[`workingHours.${day}.closeTime`] || errors[`workingHours.${day}`]}
							<p class="text-sm text-destructive">
								{errors[`workingHours.${day}.openTime`] || errors[`workingHours.${day}.closeTime`] || errors[`workingHours.${day}`]}
							</p>
						{/if}
					{/each}
					{#if errors.workingHours}
						<p class="text-sm text-destructive">{errors.workingHours}</p>
					{/if}
				</div>
			</section>

			<!-- Contact Information -->
			<section class="space-y-6">
				<div class="flex items-center gap-3 pb-3 border-b">
					<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
						5
					</div>
					<div>
						<h3 class="text-lg font-semibold">Contact Information</h3>
						<p class="text-sm text-muted-foreground">Optional contact details</p>
					</div>
				</div>
				
				<div class="grid gap-4 md:grid-cols-3">
					<div class="space-y-2">
						<Label for="phone">Phone</Label>
						<Input
							id="phone"
							bind:value={formData.phone}
							placeholder="+82-2-1234-5678"
							class={errors['contactInfo.phone'] ? 'border-destructive' : ''}
						/>
						{#if errors['contactInfo.phone']}
							<p class="text-sm text-destructive">{errors['contactInfo.phone']}</p>
						{/if}
					</div>
					
					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							type="email"
							bind:value={formData.email}
							placeholder="contact@example.com"
							class={errors['contactInfo.email'] ? 'border-destructive' : ''}
						/>
						{#if errors['contactInfo.email']}
							<p class="text-sm text-destructive">{errors['contactInfo.email']}</p>
						{/if}
					</div>
					
					<div class="space-y-2">
						<Label for="website">Website</Label>
						<Input
							id="website"
							type="url"
							bind:value={formData.website}
							placeholder="https://example.com"
							class={errors['contactInfo.website'] ? 'border-destructive' : ''}
						/>
						{#if errors['contactInfo.website']}
							<p class="text-sm text-destructive">{errors['contactInfo.website']}</p>
						{/if}
					</div>
				</div>
			</section>

			<!-- Additional Information -->
			<section class="space-y-6">
				<div class="flex items-center gap-3 pb-3 border-b">
					<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
						6
					</div>
					<div>
						<h3 class="text-lg font-semibold">Additional Information</h3>
						<p class="text-sm text-muted-foreground">Amenities and status</p>
					</div>
				</div>
				
				<div class="space-y-4">
					<div class="space-y-2">
						<Label for="amenities">Amenities</Label>
						<Input
							id="amenities"
							bind:value={formData.amenities}
							placeholder="WiFi, Parking, Air Conditioning (comma separated)"
							class={errors.amenities ? 'border-destructive' : ''}
						/>
						<p class="text-xs text-muted-foreground">Separate multiple amenities with commas</p>
						{#if errors.amenities}
							<p class="text-sm text-destructive">{errors.amenities}</p>
						{/if}
					</div>
					
					<div class="flex items-center gap-2">
						<input
							id="isActive"
							type="checkbox"
							bind:checked={formData.isActive}
							class="rounded border-gray-300"
						/>
						<Label for="isActive">Active (visible to users)</Label>
					</div>
				</div>
			</section>

			<!-- Form Actions -->
			<div class="flex gap-4 pt-6 border-t">
				{#if onCancel}
					<Button type="button" variant="outline" onclick={onCancel} disabled={isSubmitting}>
						Cancel
					</Button>
				{/if}
				<Button type="submit" disabled={isSubmitting || isLoading}>
					{#if isSubmitting}
						<svg class="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						{activity ? 'Updating...' : 'Creating...'}
					{:else}
						{activity ? 'Update Activity' : 'Create Activity'}
					{/if}
				</Button>
			</div>
		</form>
	</div>
</div>