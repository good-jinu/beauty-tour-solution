<script lang="ts">
import { BadgeCheck, Info, Plus } from "@lucide/svelte";
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
    class="py-8 sm:py-12 lg:py-16 xl:py-24 bg-gradient-to-b from-muted/10 to-background"
>
    <div class="container mx-auto px-3 sm:px-4 lg:px-6 max-w-6xl">
        <!-- Results Header -->
        <div class="text-center mb-8 sm:mb-10 lg:mb-12">
            <div
                class="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6"
            >
                <BadgeCheck class="w-3 h-3 sm:w-4 sm:h-4" />
                Schedule Ready
            </div>

            <div
                class="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8"
            >
                <div class="text-center sm:text-left">
                    <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                        Your Beauty Tour Schedule
                    </h2>
                    <p class="text-sm sm:text-base text-muted-foreground px-2 sm:px-0">
                        Detailed schedule based on your preferences
                    </p>
                </div>
                <Button
                    onclick={onReset}
                    variant="outline"
                    size="lg"
                    class="flex-shrink-0 w-full sm:w-auto min-h-[44px]"
                >
                    <Plus class="w-4 h-4 mr-2" />
                    <span class="hidden sm:inline">Create New Plan</span>
                    <span class="sm:hidden">New Plan</span>
                </Button>
            </div>
        </div>

        <!-- Results Content -->
        <div
            class="bg-card/60 backdrop-blur-sm border rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden"
        >
            <div class="p-4 sm:p-6 lg:p-8 xl:p-12">
                <ScheduleSolutions {formData} />
            </div>
        </div>

        <!-- Action Buttons and Disclaimer -->
        <div class="mt-8 sm:mt-10 lg:mt-12 space-y-6 sm:space-y-8">
            <!-- Disclaimer -->
            <div
                class="bg-muted/30 border border-muted rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center"
            >
                <div class="flex items-center justify-center gap-2 mb-2 sm:mb-3">
                    <Info class="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <span class="text-xs sm:text-sm font-medium text-muted-foreground"
                        >Important Notice</span
                    >
                </div>
                <p class="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    This schedule is generated based on your preferences and is automatically saved for your convenience. 
                    Please consult with qualified medical professionals and 
                    conduct thorough research before making any medical tourism decisions.
                </p>
            </div>
        </div>
    </div>
</section>


