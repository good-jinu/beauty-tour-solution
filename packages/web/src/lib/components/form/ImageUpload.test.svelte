<script lang="ts">
import type { FormErrors } from "$lib/types";
import ImageUpload from "./ImageUpload.svelte";

// Test component to verify ImageUpload functionality
let uploadedImage: File | null = $state(null);
let imagePreview: string | null = $state(null);
let errors: FormErrors = $state({});

function handleImageChange() {
	console.log(
		"Image changed:",
		uploadedImage?.name,
		imagePreview ? "Preview available" : "No preview",
	);
}

$effect(() => {
	handleImageChange();
});
</script>

<div class="p-8 max-w-md mx-auto">
    <h2 class="text-xl font-bold mb-4">Image Upload Test</h2>

    <ImageUpload
        bind:uploadedImage
        bind:imagePreview
        {errors}
        maxSize={5}
        enableCamera={true}
    />

    {#if uploadedImage}
        <div class="mt-4 p-4 bg-green-100 rounded">
            <p class="text-green-800">✅ Image uploaded successfully!</p>
            <p class="text-sm">File: {uploadedImage.name}</p>
            <p class="text-sm">
                Size: {(uploadedImage.size / 1024 / 1024).toFixed(2)}MB
            </p>
            <p class="text-sm">Type: {uploadedImage.type}</p>
        </div>
    {/if}
</div>
