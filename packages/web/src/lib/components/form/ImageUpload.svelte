<script lang="ts">
import { Image } from "@lucide/svelte";
import { onMount } from "svelte";
import Button from "$lib/components/ui/button/button.svelte";
import type { FormErrors } from "$lib/types";

interface Props {
	uploadedImage: File | null;
	imagePreview: string | null;
	errors: FormErrors;
	maxSize?: number; // in MB
	acceptedFormats?: string[];
	enableCamera?: boolean;
}

let {
	uploadedImage = $bindable(),
	imagePreview = $bindable(),
	errors,
	maxSize = 10,
	acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
	enableCamera = true,
}: Props = $props();

let fileInput: HTMLInputElement;
let cameraInput: HTMLInputElement;
let isDragOver = $state(false);
let isProcessing = $state(false);
let isMobile = $state(false);

const maxSizeBytes = maxSize * 1024 * 1024; // Convert MB to bytes

onMount(() => {
	// Detect mobile device
	isMobile =
		/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);
});

function validateImage(file: File): string | null {
	// Check file type
	if (!acceptedFormats.includes(file.type)) {
		return `Please upload a valid image file (${acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")})`;
	}

	// Check file size
	if (file.size > maxSizeBytes) {
		return `Image size must be less than ${maxSize}MB. Current size: ${(file.size / 1024 / 1024).toFixed(1)}MB`;
	}

	// Check if it's actually an image by trying to create an image element
	return null;
}

async function processImageFile(file: File) {
	isProcessing = true;

	const validationError = validateImage(file);
	if (validationError) {
		errors.image = validationError;
		isProcessing = false;
		return;
	}

	// Clear any previous errors
	delete errors.image;

	try {
		// Create preview from optimized file
		const reader = new FileReader();
		reader.onload = (e) => {
			const result = e.target?.result as string;
			uploadedImage = file;
			imagePreview = result;
			isProcessing = false;
		};
		reader.onerror = () => {
			errors.image = "Failed to process the image file. Please try again.";
			isProcessing = false;
		};
		reader.readAsDataURL(file);
	} catch (error) {
		console.error("Image processing error:", error);
		errors.image = "Failed to process the image. Please try a different image.";
		isProcessing = false;
	}
}

function handleFileSelect(event: Event) {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (file) {
		processImageFile(file);
	}
}

function handleDrop(event: DragEvent) {
	event.preventDefault();
	isDragOver = false;

	const files = event.dataTransfer?.files;
	if (files && files.length > 0) {
		processImageFile(files[0]);
	}
}

function handleDragOver(event: DragEvent) {
	event.preventDefault();
	isDragOver = true;
}

function handleDragLeave(event: DragEvent) {
	event.preventDefault();
	isDragOver = false;
}

function openFileDialog() {
	fileInput?.click();
}

function removeImage() {
	uploadedImage = null;
	imagePreview = null;
	delete errors.image;
	if (fileInput) {
		fileInput.value = "";
	}
	if (cameraInput) {
		cameraInput.value = "";
	}
}

function openCameraDialog() {
	cameraInput?.click();
}

function handleCameraCapture(event: Event) {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (file) {
		processImageFile(file);
	}
}
</script>

<div class="space-y-4 image-upload-container">
	<div class="space-y-2">
		<h4 class="text-base font-medium md:text-lg">Upload Your Photo</h4>
		<p class="text-sm text-muted-foreground md:text-base leading-relaxed">
			Upload a clear photo of yourself to see how different beauty
			treatments might look
		</p>
	</div>

	{#if !imagePreview}
		<!-- Upload Area -->
		<div
			class="relative border-2 border-dashed rounded-xl p-6 md:p-8 text-center transition-all duration-200 cursor-pointer min-h-[200px] md:min-h-[240px] flex items-center justify-center {isDragOver
				? 'border-primary bg-primary/5'
				: 'border-border hover:border-primary hover:bg-muted/30'}"
			ondrop={handleDrop}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			onclick={openFileDialog}
			role="button"
			tabindex="0"
			aria-label="Upload image area - click to select file or drag and drop"
			onkeydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					openFileDialog();
				}
			}}
		>
			{#if isProcessing}
				<div class="flex flex-col items-center gap-3">
					<div
						class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"
					></div>
					<p class="text-sm text-muted-foreground">
						Processing image...
					</p>
				</div>
			{:else}
				<div class="flex flex-col items-center gap-4 w-full">
					<div
						class="w-16 h-16 md:w-20 md:h-20 bg-muted rounded-full flex items-center justify-center transition-colors"
					>
						<Image
							class="w-8 h-8 md:w-10 md:h-10 text-muted-foreground"
						/>
					</div>

					<div class="space-y-2 text-center">
						<p class="text-sm md:text-base font-medium">
							{isDragOver
								? "Drop your image here"
								: "Drag and drop your image here"}
						</p>
						<p class="text-xs md:text-sm text-muted-foreground">
							or tap to browse files
						</p>
					</div>

					<div
						class="text-xs md:text-sm text-muted-foreground space-y-1 text-center"
					>
						<p>Supported formats: JPEG, PNG, WebP</p>
						<p>Maximum size: {maxSize}MB</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Camera Options for Mobile -->
		{#if enableCamera && isMobile}
			<div class="flex flex-col sm:flex-row gap-3 sm:gap-2">
				<Button
					variant="outline"
					onclick={openFileDialog}
					class="flex-1 min-h-[48px] text-sm font-medium"
					aria-label="Choose image file from device storage"
				>
					<svg
						class="w-4 h-4 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
						/>
					</svg>
					Choose File
				</Button>
				<Button
					variant="outline"
					onclick={openCameraDialog}
					class="flex-1 min-h-[48px] text-sm font-medium"
					aria-label="Take photo with device camera"
				>
					<svg
						class="w-4 h-4 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					Take Photo
				</Button>
			</div>
		{/if}
	{:else}
		<!-- Image Preview -->
		<div class="space-y-4">
			<div class="relative bg-muted rounded-xl overflow-hidden">
				<img
					src={imagePreview}
					alt="Uploaded preview"
					class="w-full h-64 md:h-80 object-contain"
				/>
				<button
					onclick={removeImage}
					class="absolute top-3 right-3 w-10 h-10 md:w-8 md:h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors shadow-lg"
					aria-label="Remove uploaded image"
				>
					<svg
						class="w-5 h-5 md:w-4 md:h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div
				class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3"
			>
				<span class="font-medium truncate" title={uploadedImage?.name}
					>{uploadedImage?.name}</span
				>
				<span class="text-xs sm:text-sm font-mono">
					{uploadedImage
						? (uploadedImage.size / 1024 / 1024).toFixed(1)
						: "0"}MB
				</span>
			</div>

			<Button
				variant="outline"
				onclick={openFileDialog}
				class="w-full min-h-[48px] text-sm font-medium"
				aria-label="Upload a different image"
			>
				<svg
					class="w-4 h-4 mr-2"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
					/>
				</svg>
				Upload Different Image
			</Button>
		</div>
	{/if}

	<!-- Hidden file input -->
	<input
		bind:this={fileInput}
		type="file"
		accept={acceptedFormats.join(",")}
		onchange={handleFileSelect}
		class="hidden"
		aria-label="Upload image file"
	/>

	<!-- Hidden camera input -->
	<input
		bind:this={cameraInput}
		type="file"
		accept="image/*"
		capture="environment"
		onchange={handleCameraCapture}
		class="hidden"
		aria-label="Capture photo with camera"
	/>

	<!-- Error display -->
	{#if errors.image}
		<div
			class="bg-destructive/5 border border-destructive/20 rounded-lg p-3"
		>
			<p class="text-sm text-destructive flex items-start gap-2">
				<svg
					class="w-4 h-4 mt-0.5 flex-shrink-0"
					fill="currentColor"
					viewBox="0 0 20 20"
					aria-hidden="true"
				>
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
				<span class="leading-relaxed">{errors.image}</span>
			</p>
		</div>
	{/if}
</div>

<style>
	/* Mobile-first responsive design for image upload */
	.image-upload-container {
		width: 100%;
		max-width: 100%;
	}

	/* Touch-friendly interactions */
	@media (hover: none) and (pointer: coarse) {
		/* Mobile touch devices */
		:global(.image-upload-container button:active) {
			transform: scale(0.98);
		}

		/* Remove hover effects on touch devices */
		:global(.image-upload-container [role="button"]:hover) {
			background-color: transparent;
		}

		/* Improve drag and drop area for touch */
		:global(.image-upload-container [role="button"]) {
			-webkit-tap-highlight-color: rgba(59, 130, 246, 0.1);
		}
	}

	/* Landscape mobile optimizations */
	@media (max-height: 600px) and (orientation: landscape) {
		:global(.image-upload-container .space-y-4) {
			gap: 0.75rem;
		}

		:global(.image-upload-container .space-y-2) {
			gap: 0.5rem;
		}

		/* Reduce image preview height in landscape */
		:global(.image-upload-container img) {
			height: 200px;
		}

		/* Compact upload area */
		:global(.image-upload-container [role="button"]) {
			min-height: 160px;
			padding: 1rem;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		:global(.image-upload-container [role="button"]) {
			border-width: 3px;
		}

		:global(.image-upload-container button) {
			border-width: 2px;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		:global(.image-upload-container *) {
			transition-duration: 0.01ms;
		}

		:global(.image-upload-container button:active) {
			transform: none;
		}
	}

	/* Focus improvements for keyboard navigation */
	:global(.image-upload-container [role="button"]:focus-visible) {
		outline: 3px solid hsl(var(--primary));
		outline-offset: 2px;
	}

	:global(.image-upload-container button:focus-visible) {
		outline: 2px solid hsl(var(--primary));
		outline-offset: 2px;
	}

	/* Improve file input accessibility */
	:global(.image-upload-container input[type="file"]) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
