<script lang="ts">
import Button from "$lib/components/ui/button/button.svelte";

const features = [
	{
		icon: "🤖",
		title: "AI-Powered Recommendations",
		description:
			"Get personalized beauty treatment and tour packages based on your skin type, wellness goals, and travel preferences using advanced AI technology.",
	},
	{
		icon: "💆‍♀️",
		title: "Expert Beauty Services",
		description:
			"Access world-class skincare, plastic surgery, massage, and spa services in top destinations known for medical tourism and wellness.",
	},
	{
		icon: "💰",
		title: "Value Packages",
		description:
			"Combine beauty treatments with vacation packages for significant savings while enjoying premium services and destinations.",
	},
	{
		icon: "⚡",
		title: "Complete Care Planning",
		description:
			"Plan your beauty transformation journey with recovery time, aftercare, and sightseeing perfectly coordinated in one seamless package.",
	},
];

const destinations = [
	{
		name: "Seoul, South Korea",
		image:
			"https://images.unsplash.com/photo-1576020799627-aeac74d58064?w=400&h=300&fit=crop",
		price: "From $2,299",
		specialty: "K-Beauty & Plastic Surgery",
	},
	{
		name: "Bangkok, Thailand",
		image:
			"https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=300&fit=crop",
		price: "From $1,599",
		specialty: "Spa & Wellness Retreats",
	},
	{
		name: "Istanbul, Turkey",
		image:
			"https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400&h=300&fit=crop",
		price: "From $1,899",
		specialty: "Hair Transplant & Medical Tourism",
	},
	{
		name: "Dubai, UAE",
		image:
			"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop",
		price: "From $3,299",
		specialty: "Luxury Cosmetic Treatments",
	},
];
</script>

<!-- Hero Section -->
<section
  class="relative min-h-[600px] h-[85vh] flex items-center overflow-hidden text-white"
>
  <div
    class="absolute inset-0 bg-gradient-to-br from-blue-800 via-blue-600 to-cyan-500 animate-[pulse_15s_ease_infinite]"
  ></div>
  <div class="absolute inset-0 bg-black/30"></div>
  <div class="container mx-auto px-4 relative z-10">
    <div class="max-w-3xl mx-auto text-center">
      <h1 class="text-4xl md:text-6xl font-bold leading-tight mb-6">
        Transform Yourself While
        <span class="text-secondary">Exploring the World</span>
      </h1>
      <p class="text-lg md:text-xl text-white/90 mb-10">
        Combine world-class beauty treatments with unforgettable travel
        experiences. From K-beauty in Seoul to luxury spas in Dubai, discover
        your perfect wellness journey.
      </p>
      <div class="flex flex-wrap gap-4 justify-center">
        <Button href="/builder" size="lg">Plan My Beauty Journey</Button>
        <Button href="#featured" variant="outline" size="lg"
          >Explore Beauty Destinations</Button
        >
      </div>
    </div>
  </div>
</section>

<!-- Features Section -->
<section class="py-24 bg-muted/30">
  <div class="container mx-auto px-4">
    <div class="text-center mb-16">
      <h2 class="text-4xl mb-2">Why Choose Beauty Tour Solution?</h2>
      <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
        Experience the perfect blend of beauty treatments and travel with our
        comprehensive wellness tourism platform
      </p>
    </div>
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {#each features as feature}
        <div
          class="bg-background rounded-xl shadow p-6 text-center transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div class="text-4xl mb-2">{feature.icon}</div>
          <h3 class="text-xl font-semibold mb-1">{feature.title}</h3>
          <p class="text-muted-foreground">{feature.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- Featured Destinations -->
<section id="featured" class="py-24">
  <div class="container mx-auto px-4">
    <div class="text-center mb-16">
      <h2 class="text-4xl mb-2">Top Beauty Destinations</h2>
      <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
        Discover world-renowned locations for beauty treatments and wellness
        tourism
      </p>
    </div>
    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
      {#each destinations as destination}
        <div
          class="bg-background rounded-xl overflow-hidden shadow transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div class="relative h-52 overflow-hidden">
            <img
              src={destination.image}
              alt={destination.name}
              class="w-full h-full object-cover transition duration-500 hover:scale-105"
            />
            <div
              class="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition grid place-items-center"
            >
              <Button size="sm">View Details</Button>
            </div>
          </div>
          <div class="p-6 flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold mb-1">{destination.name}</h3>
              <p class="text-sm text-muted-foreground italic">
                {destination.specialty}
              </p>
            </div>
            <p class="text-lg font-semibold text-primary">
              {destination.price}
            </p>
          </div>
        </div>
      {/each}
    </div>
    <div class="text-center">
      <Button href="/builder" variant="secondary" size="lg"
        >Plan Your Beauty Journey</Button
      >
    </div>
  </div>
</section>

<!-- CTA Section -->
<section class="py-24 bg-primary text-primary-foreground">
  <div class="container mx-auto px-4">
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="text-4xl mb-4">Ready for Your Beauty Transformation?</h2>
      <p class="text-lg text-primary-foreground/90 mb-10">
        Join thousands who have discovered their perfect beauty and wellness
        journey with Beauty Tour Solution. Start planning your transformative
        experience today.
      </p>
      <Button href="/builder" size="lg">Get Started Now</Button>
    </div>
  </div>
</section>
