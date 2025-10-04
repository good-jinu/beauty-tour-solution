<script lang="ts">
const year = new Date().getFullYear();
const footerLinks = {
	company: [
		{ name: "About Us", href: "/about" },
		{ name: "Careers", href: "/careers" },
		{ name: "Press", href: "/press" },
		{ name: "Blog", href: "/blog" },
	],
	support: [
		{ name: "Help Center", href: "/help" },
		{ name: "Contact Us", href: "/contact" },
		{ name: "Safety", href: "/safety" },
		{ name: "Terms of Service", href: "/terms" },
	],
	destinations: [
		{ name: "Europe Tours", href: "/destinations/europe" },
		{ name: "Asia Tours", href: "/destinations/asia" },
		{ name: "Americas Tours", href: "/destinations/americas" },
		{ name: "Africa Tours", href: "/destinations/africa" },
	],
};
const socials = [
	{ name: "Facebook", href: "#", icon: "📘" },
	{ name: "Twitter", href: "#", icon: "🐦" },
	{ name: "Instagram", href: "#", icon: "📷" },
	{ name: "YouTube", href: "#", icon: "📹" },
];
</script>

<footer class="bg-foreground/5 text-foreground py-16">
  <div class="container mx-auto px-4 grid gap-12 md:grid-cols-[1.5fr_2fr_1.5fr]">
    <div class="space-y-4">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🏖️</span>
        <span class="text-xl font-semibold">Beauty Tours</span>
      </div>
      <p class="text-muted-foreground max-w-sm">
        Discover the world's most beautiful destinations with our expertly curated travel experiences.
        Your dream vacation is just a click away.
      </p>
      <div class="flex gap-2">
        {#each socials as s}
          <a href={s.href} class="size-10 grid place-items-center rounded-lg bg-background border hover:bg-accent transition" aria-label={s.name} title={s.name}>
            <span>{s.icon}</span>
          </a>
        {/each}
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-8">
      <div>
        <h4 class="text-lg font-semibold mb-4">Company</h4>
        <ul class="space-y-2 text-sm text-muted-foreground">
          {#each footerLinks.company as link}
            <li><a href={link.href} class="hover:text-foreground transition">{link.name}</a></li>
          {/each}
        </ul>
      </div>
      <div>
        <h4 class="text-lg font-semibold mb-4">Support</h4>
        <ul class="space-y-2 text-sm text-muted-foreground">
          {#each footerLinks.support as link}
            <li><a href={link.href} class="hover:text-foreground transition">{link.name}</a></li>
          {/each}
        </ul>
      </div>
      <div>
        <h4 class="text-lg font-semibold mb-4">Destinations</h4>
        <ul class="space-y-2 text-sm text-muted-foreground">
          {#each footerLinks.destinations as link}
            <li><a href={link.href} class="hover:text-foreground transition">{link.name}</a></li>
          {/each}
        </ul>
      </div>
    </div>
    <div class="bg-background rounded-xl border p-6">
      <h4 class="text-lg font-semibold mb-2">Stay Updated</h4>
      <p class="text-sm text-muted-foreground mb-4">Get the latest travel deals and destination insights delivered to your inbox.</p>
      <form class="flex gap-2">
        <input type="email" class="flex-1 h-10 rounded-md border bg-background px-3 text-sm" placeholder="Enter your email" required />
        <button type="submit" class="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Subscribe</button>
      </form>
    </div>
  </div>
  <div class="container mx-auto px-4 mt-8 pt-6 border-t text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-2">
    <p>© {year} Beauty Tours. All rights reserved.</p>
    <div class="flex items-center gap-3">
      <a href="/privacy" class="hover:text-foreground transition">Privacy Policy</a>
      <span>•</span>
      <a href="/terms" class="hover:text-foreground transition">Terms of Service</a>
      <span>•</span>
      <a href="/cookies" class="hover:text-foreground transition">Cookie Policy</a>
    </div>
  </div>
</footer>