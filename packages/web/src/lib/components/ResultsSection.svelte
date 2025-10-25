<script lang="ts">
import { BadgeCheck, Info, Plus, Save, Share2 } from "@lucide/svelte";
import ScheduleSolutions from "$lib/components/ScheduleSolutions.svelte";
import Button from "$lib/components/ui/button/button.svelte";
import type { StepperFormData } from "$lib/types";

interface Props {
	formData: StepperFormData;
	onReset: () => void;
}

let { formData, onReset }: Props = $props();
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
                <BadgeCheck class="w-4 h-4" />
                Schedule Ready
            </div>

            <div
                class="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8"
            >
                <div class="text-center sm:text-left">
                    <h2 class="text-3xl sm:text-4xl font-bold mb-2">
                        Your Beauty Journey Schedule
                    </h2>
                    <p class="text-muted-foreground">
                        Detailed schedule based on your preferences
                    </p>
                </div>
                <Button
                    onclick={onReset}
                    variant="outline"
                    size="lg"
                    class="flex-shrink-0"
                >
                    <Plus class="w-4 h-4 mr-2" />
                    Create New Plan
                </Button>
            </div>
        </div>

        <!-- Results Content -->
        <div
            class="bg-card/60 backdrop-blur-sm border rounded-3xl shadow-xl overflow-hidden"
        >
            <div class="p-8 lg:p-12">
                <ScheduleSolutions {formData} />
            </div>
        </div>

        <!-- Action Buttons and Disclaimer -->
        <div class="mt-12 space-y-8">
            <!-- Disclaimer -->
            <div
                class="bg-muted/30 border border-muted rounded-2xl p-6 text-center"
            >
                <div class="flex items-center justify-center gap-2 mb-3">
                    <Info class="w-5 h-5 text-muted-foreground" />
                    <span class="text-sm font-medium text-muted-foreground"
                        >Important Notice</span
                    >
                </div>
                <p class="text-sm text-muted-foreground leading-relaxed">
                    This schedule is generated based on your preferences. 
                    Please consult with qualified medical professionals and 
                    conduct thorough research before making any medical tourism decisions.
                </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" class="min-w-[200px]">
                    <Save class="w-4 h-4 mr-2" />
                    Save This Plan
                </Button>
                <Button size="lg" variant="outline" class="min-w-[200px]">
                    <Share2 class="w-4 h-4 mr-2" />
                    Share with Doctor
                </Button>
            </div>
        </div>
    </div>
</section>


