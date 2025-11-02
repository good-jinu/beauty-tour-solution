<script lang="ts">
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { Button } from "$lib/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "$lib/components/ui/card";
import Input from "$lib/components/ui/input/input.svelte";
import { Label } from "$lib/components/ui/label";

let password = "";
let loading = false;

async function handleLogin() {
	if (!password.trim()) {
		toast.error("Please enter a password");
		return;
	}

	loading = true;
	try {
		const response = await fetch("/api/admin/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ password }),
		});

		const result = await response.json();

		if (result.success) {
			toast.success("Login successful");
			goto("/admin");
		} else {
			toast.error(result.error || "Invalid password");
		}
	} catch (error) {
		console.error("Login error:", error);
		toast.error("Login failed");
	} finally {
		loading = false;
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Enter") {
		handleLogin();
	}
}
</script>

<svelte:head>
	<title>Admin Login</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
	<Card class="w-full max-w-md">
		<CardHeader class="text-center">
			<CardTitle class="text-2xl">Admin Login</CardTitle>
			<p class="text-muted-foreground">Enter your password to access the admin panel</p>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					type="password"
					bind:value={password}
					placeholder="Enter admin password"
					disabled={loading}
					onkeydown={handleKeydown}
				/>
			</div>
			
			<Button 
				onclick={handleLogin} 
				disabled={loading || !password.trim()}
				class="w-full"
			>
				{loading ? 'Logging in...' : 'Login'}
			</Button>
		</CardContent>
	</Card>
</div>