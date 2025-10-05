<script lang="ts">
interface Props {
	specialRequests: string;
}

let { specialRequests = $bindable() }: Props = $props();
</script>

<div class="space-y-4">
    <div class="space-y-2">
        <label for="special-requests" class="text-sm font-medium block">
            Any special medical conditions, allergies, or preferences?
            (Optional)
        </label>
        <p class="text-xs text-muted-foreground">
            This information helps us provide better recommendations for your
            safety and comfort.
        </p>
    </div>

    <textarea
        id="special-requests"
        bind:value={specialRequests}
        placeholder="Tell us about medical conditions, allergies, recovery preferences, dietary restrictions, specific treatment goals, or anything else we should know for your beauty journey..."
        class="w-full min-h-[120px] p-4 border rounded-xl bg-background text-sm resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        rows="5"
    ></textarea>
</div>
