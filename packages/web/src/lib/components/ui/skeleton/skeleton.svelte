<script lang="ts">
import { cn } from "$lib/utils.js";

let className: string | undefined;
export { className as class };
</script>

<div class={cn("animate-pulse rounded-md bg-muted", className)} {...$$restProps}></div>