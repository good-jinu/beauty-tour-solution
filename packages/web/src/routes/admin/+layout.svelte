<div class="min-h-screen bg-background">
	<div class="border-b bg-muted/40">
		<div class="container mx-auto px-4 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<h1 class="text-xl font-semibold">Admin Panel</h1>
					<nav class="flex items-center gap-4">
						<a 
							href="/admin" 
							class="text-sm font-medium text-primary"
						>
							Schedules
						</a>
					</nav>
				</div>
				<a href="/" class="text-sm text-muted-foreground hover:text-foreground">
					← Back to Site
				</a>
			</div>
		</div>
	</div>
	
	<slot />
</div>