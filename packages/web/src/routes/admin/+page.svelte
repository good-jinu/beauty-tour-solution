<script lang="ts">
import { onMount } from "svelte";
import { goto } from "$app/navigation";
import { page } from "$app/state";

// Redirect /admin to /admin/activities since we removed the schedule page
onMount(() => {
	if (page.url.pathname === "/admin") {
		goto("/admin/activities", { replaceState: true });
	}
});
</script>