<script lang="ts">
import { marked } from "marked";
import Button from "$lib/components/ui/button/button.svelte";

interface Props {
	aiRecommendation: string;
	onReset: () => void;
}

let { aiRecommendation, onReset }: Props = $props();
</script>

<section
    id="results-section"
    class="py-16 lg:py-24 bg-gradient-to-b from-muted/10 to-background"
>
    <div class="container mx-auto px-4 lg:px-6 max-w-5xl">
        <!-- Results Header -->
        <div class="text-center mb-12">
            <div
                class="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fill-rule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"
                    />
                </svg>
                Recommendations Ready
            </div>

            <div
                class="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8"
            >
                <div class="text-center sm:text-left">
                    <h2 class="text-3xl sm:text-4xl font-bold mb-2">
                        Your Personalized Beauty Journey
                    </h2>
                    <p class="text-muted-foreground">
                        Tailored recommendations based on your preferences
                    </p>
                </div>
                <Button
                    onclick={onReset}
                    variant="outline"
                    size="lg"
                    class="flex-shrink-0"
                >
                    <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                    </svg>
                    Create New Plan
                </Button>
            </div>
        </div>

        <!-- Results Content -->
        <div
            class="bg-card/60 backdrop-blur-sm border rounded-3xl shadow-xl overflow-hidden"
        >
            <div class="p-8 lg:p-12">
                <div
                    class="prose prose-slate max-w-none dark:prose-invert prose-lg"
                >
                    {@html marked(aiRecommendation)}
                </div>
            </div>
        </div>

        <!-- Action Buttons and Disclaimer -->
        <div class="mt-12 space-y-8">
            <!-- Disclaimer -->
            <div
                class="bg-muted/30 border border-muted rounded-2xl p-6 text-center"
            >
                <div class="flex items-center justify-center gap-2 mb-3">
                    <svg
                        class="w-5 h-5 text-muted-foreground"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span class="text-sm font-medium text-muted-foreground"
                        >Important Notice</span
                    >
                </div>
                <p class="text-sm text-muted-foreground leading-relaxed">
                    This is an AI-generated recommendation based on your
                    preferences. Please consult with qualified medical
                    professionals and conduct thorough research before making
                    any medical tourism decisions.
                </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" class="min-w-[200px]">
                    <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    Save This Plan
                </Button>
                <Button size="lg" variant="outline" class="min-w-[200px]">
                    <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                    </svg>
                    Share with Doctor
                </Button>
            </div>
        </div>
    </div>
</section>

<style>
    :global(.prose) {
        line-height: 1.8;
    }

    :global(.prose h1),
    :global(.prose h2),
    :global(.prose h3) {
        scroll-margin-top: 2rem;
    }

    :global(.prose p) {
        margin-bottom: 1.25rem;
    }

    :global(.prose strong) {
        font-weight: 600;
    }
</style>
