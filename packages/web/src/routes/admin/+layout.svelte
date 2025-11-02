<script>
import { LogOut } from "@lucide/svelte";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { Button } from "$lib/components/ui/button";

export let data;

async function handleLogout() {
	try {
		const response = await fetch("/api/admin/logout", {
			method: "POST",
		});

		const result = await response.json();

		if (result.success) {
			toast.success("Logged out successfully");
			goto("/admin/login");
		} else {
			toast.error("Logout failed");
		}
	} catch (error) {
		console.error("Logout error:", error);
		toast.error("Logout failed");
	}
}
</script>

<div class="min-h-screen bg-background">
	<div class="border-b bg-muted/40">
		<div class="container mx-auto px-4 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<h1 class="text-xl font-semibold">Admin Panel</h1>
					<nav class="flex items-center gap-4">
						<a 
							href="/admin" 
							class="text-sm font-medium hover:text-primary transition-colors"
							class:text-primary={$page.url.pathname === '/admin'}
							class:text-muted-foreground={$page.url.pathname !== '/admin'}
						>
							Schedules
						</a>
						<a 
							href="/admin/activities" 
							class="text-sm font-medium hover:text-primary transition-colors"
							class:text-primary={$page.url.pathname.startsWith('/admin/activities')}
							class:text-muted-foreground={!$page.url.pathname.startsWith('/admin/activities')}
						>
							Activities
						</a>
					</nav>
				</div>
				<div class="flex items-center gap-2">
					<a href="/" class="text-sm text-muted-foreground hover:text-foreground">
						← Back to Site
					</a>
					{#if data?.isAuthenticated}
						<Button variant="ghost" size="sm" onclick={handleLogout} class="flex items-center gap-2">
							<LogOut size={14} />
							Logout
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</div>
	
	<slot />
</div>