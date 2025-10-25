<script lang="ts">
import { Backpack } from "@lucide/svelte";
import ThemeToggle from "$lib/components/ThemeToggle.svelte";
</script>

<header
    class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
    <div
        class="container flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8"
    >
        <!-- Logo/Brand -->
        <div class="flex items-center space-x-2">
            <a href="/" class="flex items-center space-x-2">
                <div
                    class="h-8 w-8 rounded-full bg-primary flex items-center justify-center"
                >
                    <span class="text-primary-foreground font-bold text-sm"
                        >BTS</span
                    >
                </div>
                <span class="font-bold text-lg hidden sm:inline-block"
                    >Beauty Tour Solution</span
                >
            </a>
        </div>

        <!-- Navigation and Theme Toggle -->
        <div class="flex items-center space-x-4">
            <!-- Navigation Links -->
            <nav class="flex items-center space-x-4">
                <a
                    href="/plans"
                    class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1"
                >
                    <Backpack size={18} />
                    <span class="hidden sm:inline">My Plans</span>
                </a>
            </nav>

            <!-- Theme Toggle -->
            <ThemeToggle />
        </div>
    </div>
</header>
