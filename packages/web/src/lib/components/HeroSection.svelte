<section class="relative py-16 lg:py-24">
    <div class="container mx-auto px-4 lg:px-6 max-w-7xl">
        <div class="text-center space-y-8">
            <div class="space-y-4">
                <h1
                    class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
                >
                    <span
                        class="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
                    >
                        Your Beauty Tour
                    </span>
                    <br class="hidden sm:block" />
                    <span class="text-foreground">Starts Here</span>
                </h1>
                <p
                    class="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
                >
                    Create your personalized beauty and wellness experience with
                    AI-powered recommendations tailored to your goals and
                    preferences.
                </p>
            </div>

            <!-- Trust Indicators -->
            <div
                class="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground"
            >
                <div class="flex items-center gap-2">
                    <span
                        class="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    ></span>
                    <span class="whitespace-nowrap"
                        >Trusted by 10,000+ travelers</span
                    >
                </div>
                <span class="hidden sm:inline text-muted-foreground/50">•</span>
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                    ></span>
                    <span class="whitespace-nowrap"
                        >AI-powered recommendations</span
                    >
                </div>
                <span class="hidden sm:inline text-muted-foreground/50">•</span>
                <div class="flex items-center gap-2">
                    <span
                        class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                    ></span>
                    <span class="whitespace-nowrap"
                        >Medical tourism experts</span
                    >
                </div>
            </div>

            <!-- Scroll indicator -->
            <div class="pt-8">
                <div
                    class="inline-flex flex-col items-center gap-2 text-muted-foreground/60"
                >
                    <span class="text-xs uppercase tracking-wider"
                        >Start Planning Below</span
                    >
                    <div
                        class="w-px h-8 bg-gradient-to-b from-muted-foreground/60 to-transparent"
                    ></div>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }

    .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
</style>
