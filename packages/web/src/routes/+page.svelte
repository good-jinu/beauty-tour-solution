<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import type {
    GenerateJourneyRequest,
    GenerateJourneyResponse,
  } from "./api/generate-journey/$types";
  import { marked } from "marked";

  // Form state
  let selectedRegion = $state("");
  let startDate = $state("");
  let endDate = $state("");
  let selectedTheme = $state("");
  let budget = $state(2500);
  let includeFlights = $state(false);
  let includeHotels = $state(true);
  let includeActivities = $state(true);
  let includeTransport = $state(false);
  let travelers = $state(2);
  let specialRequests = $state("");

  let isLoading = $state(false);
  let errors = $state<{ [key: string]: string }>({});

  // AI Response state
  let aiRecommendation = $state("");
  let showResults = $state(false);

  // Form options with enhanced contextual information
  const regions = [
    {
      value: "south-korea",
      label: "South Korea - K-Beauty & Plastic Surgery",
      description: "World leader in advanced skincare and cosmetic procedures",
      priceRange: "$2,000 - $8,000",
      specialty:
        "K-Beauty treatments, plastic surgery, advanced skincare technology",
    },
    {
      value: "thailand",
      label: "Thailand - Spa & Wellness Retreats",
      description:
        "Traditional healing combined with luxury wellness experiences",
      priceRange: "$1,500 - $5,000",
      specialty: "Thai massage, herbal treatments, luxury spa resorts",
    },
    {
      value: "turkey",
      label: "Turkey - Hair Transplant & Medical Tourism",
      description:
        "Leading destination for hair restoration and cosmetic procedures",
      priceRange: "$2,500 - $7,000",
      specialty: "Hair transplants, dental work, cosmetic surgery",
    },
    {
      value: "uae",
      label: "UAE - Luxury Cosmetic Treatments",
      description:
        "Premium medical facilities with world-class luxury amenities",
      priceRange: "$3,000 - $12,000",
      specialty:
        "Luxury cosmetic procedures, advanced dermatology, premium recovery",
    },
    {
      value: "brazil",
      label: "Brazil - Cosmetic Surgery & Beach Recovery",
      description:
        "Renowned for body contouring and cosmetic surgery excellence",
      priceRange: "$2,000 - $9,000",
      specialty:
        "Brazilian butt lift, liposuction, breast procedures, beach recovery",
    },
    {
      value: "india",
      label: "India - Ayurvedic Treatments & Wellness",
      description: "Ancient healing traditions with modern medical expertise",
      priceRange: "$800 - $3,500",
      specialty:
        "Ayurvedic treatments, yoga retreats, holistic wellness, affordable procedures",
    },
    {
      value: "mexico",
      label: "Mexico - Dental Tourism & Spa Treatments",
      description:
        "High-quality dental care combined with relaxing spa experiences",
      priceRange: "$1,200 - $4,500",
      specialty:
        "Dental implants, cosmetic dentistry, spa treatments, medical tourism",
    },
    {
      value: "costa-rica",
      label: "Costa Rica - Medical Tourism & Eco-Wellness",
      description: "Medical excellence in a natural paradise setting",
      priceRange: "$1,800 - $6,000",
      specialty:
        "Eco-wellness, cosmetic surgery, dental work, nature-based recovery",
    },
  ];

  const themes = [
    {
      value: "skincare",
      label: "Skincare & Anti-Aging Treatments",
      description:
        "Advanced facial treatments, chemical peels, laser therapy, and anti-aging procedures to rejuvenate your skin",
      recoveryTime: "1-7 days",
      icon: "✨",
    },
    {
      value: "plastic-surgery",
      label: "Plastic Surgery & Cosmetic Procedures",
      description:
        "Surgical enhancements including facelifts, rhinoplasty, breast augmentation, and body contouring procedures",
      recoveryTime: "2-8 weeks",
      icon: "🏥",
    },
    {
      value: "wellness-spa",
      label: "Wellness & Spa Retreats",
      description:
        "Relaxing spa treatments, massages, detox programs, and holistic wellness experiences",
      recoveryTime: "No downtime",
      icon: "🧘‍♀️",
    },
    {
      value: "hair-treatments",
      label: "Hair Transplant & Hair Treatments",
      description:
        "Hair restoration procedures, transplants, PRP therapy, and advanced hair loss treatments",
      recoveryTime: "1-2 weeks",
      icon: "💇‍♀️",
    },
    {
      value: "dental-tourism",
      label: "Dental Tourism & Smile Makeovers",
      description:
        "Dental implants, veneers, teeth whitening, orthodontics, and comprehensive oral care",
      recoveryTime: "3-14 days",
      icon: "😁",
    },
    {
      value: "weight-loss",
      label: "Weight Loss & Body Contouring",
      description:
        "Liposuction, tummy tucks, gastric procedures, and non-invasive body sculpting treatments",
      recoveryTime: "2-6 weeks",
      icon: "🏃‍♀️",
    },
    {
      value: "holistic-wellness",
      label: "Holistic Wellness & Alternative Medicine",
      description:
        "Ayurvedic treatments, acupuncture, herbal medicine, and traditional healing practices",
      recoveryTime: "No downtime",
      icon: "🌿",
    },
    {
      value: "luxury-beauty",
      label: "Luxury Beauty & Premium Treatments",
      description:
        "High-end cosmetic procedures, premium skincare, and exclusive beauty treatments",
      recoveryTime: "1-14 days",
      icon: "💎",
    },
    {
      value: "recovery-vacation",
      label: "Recovery & Healing Vacation",
      description:
        "Post-procedure recovery programs with medical supervision and luxury amenities",
      recoveryTime: "Varies",
      icon: "🏖️",
    },
    {
      value: "preventive-care",
      label: "Preventive Care & Health Checkups",
      description:
        "Comprehensive health screenings, preventive treatments, and wellness assessments",
      recoveryTime: "No downtime",
      icon: "🔍",
    },
  ];

  function validateForm() {
    const newErrors: { [key: string]: string } = {};

    if (!selectedRegion) {
      newErrors.region = "Please select a destination";
    }
    if (!startDate) {
      newErrors.startDate = "Please select a start date";
    }
    if (!endDate) {
      newErrors.endDate = "Please select an end date";
    }
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      newErrors.endDate = "End date must be after start date";
    }
    if (!selectedTheme) {
      newErrors.theme = "Please select beauty services";
    }
    if (travelers < 1) {
      newErrors.travelers = "Number of travelers must be at least 1";
    }

    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    isLoading = true;
    showResults = false;
    aiRecommendation = "";

    const formData: GenerateJourneyRequest = {
      region: selectedRegion,
      startDate,
      endDate,
      theme: selectedTheme,
      budget,
      travelers,
      addOns: {
        flights: includeFlights,
        hotels: includeHotels,
        activities: includeActivities,
        transport: includeTransport,
      },
      specialRequests,
    };

    try {
      const response = await fetch("/api/generate-journey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate recommendations");
      }

      const data: GenerateJourneyResponse = await response.json();

      if (data.success) {
        aiRecommendation = data.recommendation ?? "";
        showResults = true;

        // Scroll to results
        setTimeout(() => {
          document.getElementById("results-section")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      } else {
        alert(`Error: ${data.error || "Unknown error occurred"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate recommendations. Please try again.");
    } finally {
      isLoading = false;
    }
  }

  function resetForm() {
    // Reset results display
    showResults = false;
    aiRecommendation = "";

    // Reset form fields
    selectedRegion = "";
    startDate = "";
    endDate = "";
    selectedTheme = "";
    budget = 2500;
    includeFlights = false;
    includeHotels = true;
    includeActivities = true;
    includeTransport = false;
    travelers = 2;
    specialRequests = "";

    // Clear any errors
    errors = {};

    // Scroll back to the top of the form
    setTimeout(() => {
      document.getElementById("planning-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }

  const formatBudget = $derived.by(() => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(budget);
  });
</script>

<svelte:head>
  <title>Plan Your Beauty Journey - Beauty Tour Solution</title>
  <meta
    name="description"
    content="Create your perfect beauty and wellness journey with our AI-powered beauty tour builder"
  />
</svelte:head>

<!-- Main Container with Optimized Layout -->
<div
  class="min-h-screen bg-gradient-to-b from-muted/20 via-background to-muted/10"
>
  <!-- Hero Section - Optimized for immediate engagement -->
  <section class="relative py-16 lg:py-24">
    <div class="container mx-auto px-4 lg:px-6 max-w-7xl">
      <div class="text-center space-y-8">
        <div class="space-y-4">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span
              class="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
            >
              Your Beauty Journey
            </span>
            <br class="hidden sm:block" />
            <span class="text-foreground">Starts Here</span>
          </h1>
          <p
            class="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Create your personalized beauty and wellness experience with
            AI-powered recommendations tailored to your goals and preferences.
          </p>
        </div>

        <!-- Trust Indicators - Enhanced for mobile -->
        <div
          class="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground"
        >
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"
            ></span>
            <span class="whitespace-nowrap">Trusted by 10,000+ travelers</span>
          </div>
          <span class="hidden sm:inline text-muted-foreground/50">•</span>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span class="whitespace-nowrap">AI-powered recommendations</span>
          </div>
          <span class="hidden sm:inline text-muted-foreground/50">•</span>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
            ></span>
            <span class="whitespace-nowrap">Medical tourism experts</span>
          </div>
        </div>

        <!-- Scroll indicator for better UX -->
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

  <!-- Planning Form Section - Enhanced spacing and organization -->
  <section id="planning-form" class="py-12 lg:py-16">
    <div class="container mx-auto px-4 lg:px-6 max-w-5xl">
      <!-- Form Container with improved responsive design -->
      <div
        class="bg-card/60 backdrop-blur-sm border rounded-3xl shadow-xl overflow-hidden"
      >
        <!-- Form Header -->
        <div
          class="bg-gradient-to-r from-primary/5 to-primary/10 px-6 sm:px-8 py-8 text-center border-b"
        >
          <h2 class="text-2xl sm:text-3xl font-bold mb-3">
            Let's Plan Your Journey
          </h2>
          <p class="text-muted-foreground max-w-2xl mx-auto">
            Fill out the details below to get your personalized recommendations
          </p>
        </div>

        <!-- Form Content with optimized spacing -->
        <div class="p-6 sm:p-8 lg:p-12">
          <form onsubmit={handleSubmit} class="space-y-12 lg:space-y-16">
            <!-- Basic Information Section -->
            <section class="space-y-8">
              <div
                class="flex items-center gap-4 pb-4 border-b border-border/50"
              >
                <div
                  class="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                >
                  1
                </div>
                <div>
                  <h3 class="text-xl sm:text-2xl font-semibold">
                    Basic Information
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    Tell us about your travel preferences
                  </p>
                </div>
              </div>
              <div class="space-y-8">
                <!-- Destination Selection -->
                <div class="space-y-4">
                  <div class="space-y-2">
                    <h4 class="text-base font-medium">
                      Where would you like to have your beauty treatments?
                    </h4>
                    <p class="text-sm text-muted-foreground">
                      Choose your preferred destination based on specialties and
                      budget
                    </p>
                  </div>
                  <div
                    class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                  >
                    {#each regions as region}
                      <label
                        class="group relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md {selectedRegion ===
                        region.value
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:bg-muted/30'}"
                      >
                        <input
                          type="radio"
                          bind:group={selectedRegion}
                          value={region.value}
                          class="sr-only"
                          required
                        />
                        <div class="flex items-start justify-between mb-3">
                          <h4
                            class="font-semibold text-sm sm:text-base leading-tight pr-2"
                          >
                            {region.label}
                          </h4>
                          <span
                            class="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                          >
                            {region.priceRange}
                          </span>
                        </div>
                        <p
                          class="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed"
                        >
                          {region.description}
                        </p>
                        <div class="text-xs sm:text-sm text-muted-foreground">
                          <span class="font-medium">Specialties:</span>
                          <span class="ml-1">{region.specialty}</span>
                        </div>

                        <!-- Selection indicator -->
                        {#if selectedRegion === region.value}
                          <div
                            class="absolute top-3 right-3 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                          >
                            <svg
                              class="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </div>
                        {/if}
                      </label>
                    {/each}
                  </div>
                  {#if errors.region}
                    <p class="text-sm text-destructive flex items-center gap-2">
                      <svg
                        class="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      {errors.region}
                    </p>
                  {/if}
                </div>

                <!-- Date Selection -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div class="space-y-3">
                    <label for="start-date" class="text-sm font-medium block"
                      >Start Date</label
                    >
                    <Input
                      id="start-date"
                      bind:value={startDate}
                      type="date"
                      required
                      class="h-12"
                    />
                    {#if errors.startDate}
                      <p
                        class="text-sm text-destructive flex items-center gap-2"
                      >
                        <svg
                          class="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        {errors.startDate}
                      </p>
                    {/if}
                  </div>
                  <div class="space-y-3">
                    <label for="end-date" class="text-sm font-medium block"
                      >End Date</label
                    >
                    <Input
                      id="end-date"
                      bind:value={endDate}
                      type="date"
                      required
                      class="h-12"
                    />
                    {#if errors.endDate}
                      <p
                        class="text-sm text-destructive flex items-center gap-2"
                      >
                        <svg
                          class="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        {errors.endDate}
                      </p>
                    {/if}
                  </div>
                </div>

                <!-- Treatment Type Selection -->
                <div class="space-y-4">
                  <div class="space-y-2">
                    <h4 class="text-base font-medium">
                      What type of beauty treatments are you interested in?
                    </h4>
                    <p class="text-sm text-muted-foreground">
                      Select the treatment category that best matches your goals
                    </p>
                  </div>
                  <div
                    class="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                  >
                    {#each themes as theme}
                      <label
                        class="group relative flex flex-col p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md {selectedTheme ===
                        theme.value
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-border hover:bg-muted/30'}"
                      >
                        <input
                          type="radio"
                          bind:group={selectedTheme}
                          value={theme.value}
                          class="sr-only"
                          required
                        />
                        <div class="flex items-start justify-between mb-3">
                          <div class="flex items-center gap-3">
                            <span class="text-xl">{theme.icon}</span>
                            <h4
                              class="font-semibold text-sm sm:text-base leading-tight pr-2"
                            >
                              {theme.label}
                            </h4>
                          </div>
                          <span
                            class="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                          >
                            {theme.recoveryTime}
                          </span>
                        </div>
                        <p
                          class="text-xs sm:text-sm text-muted-foreground leading-relaxed"
                        >
                          {theme.description}
                        </p>

                        <!-- Selection indicator -->
                        {#if selectedTheme === theme.value}
                          <div
                            class="absolute top-3 right-3 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center"
                          >
                            <svg
                              class="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </div>
                        {/if}
                      </label>
                    {/each}
                  </div>
                  {#if errors.theme}
                    <p class="text-sm text-destructive flex items-center gap-2">
                      <svg
                        class="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      {errors.theme}
                    </p>
                  {/if}
                </div>

                <!-- Number of Travelers -->
                <div class="space-y-3">
                  <label
                    for="number-of-travelers"
                    class="text-sm font-medium block"
                  >
                    Number of Travelers
                  </label>
                  <Input
                    id="number-of-travelers"
                    bind:value={travelers}
                    type="number"
                    min={1}
                    max={20}
                    required
                    class="h-12"
                  />
                  {#if errors.travelers}
                    <p class="text-sm text-destructive flex items-center gap-2">
                      <svg
                        class="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      {errors.travelers}
                    </p>
                  {/if}
                </div>
              </div>
            </section>

            <!-- Budget Section -->
            <section class="space-y-8">
              <div
                class="flex items-center gap-4 pb-4 border-b border-border/50"
              >
                <div
                  class="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                >
                  2
                </div>
                <div>
                  <h3 class="text-xl sm:text-2xl font-semibold">Budget</h3>
                  <p class="text-sm text-muted-foreground">
                    Set your preferred budget range
                  </p>
                </div>
              </div>

              <div
                class="bg-gradient-to-br from-muted/30 to-muted/50 p-6 lg:p-8 rounded-2xl border shadow-sm"
              >
                <div class="text-center mb-8">
                  <div class="space-y-2">
                    <span class="text-sm text-muted-foreground"
                      >Your budget</span
                    >
                    <div class="text-4xl lg:text-5xl font-bold text-primary">
                      {formatBudget}
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <input
                    type="range"
                    min="500"
                    max="15000"
                    step="250"
                    bind:value={budget}
                    class="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer slider"
                  />
                  <div
                    class="flex justify-between text-sm text-muted-foreground px-1"
                  >
                    <span class="font-medium">$500</span>
                    <span class="font-medium">$15,000+</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Package Add-ons Section -->
            <section class="space-y-8">
              <div
                class="flex items-center gap-4 pb-4 border-b border-border/50"
              >
                <div
                  class="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                >
                  3
                </div>
                <div>
                  <h3 class="text-xl sm:text-2xl font-semibold">
                    Package Inclusions
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    Choose what to include in your beauty journey
                  </p>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2 lg:gap-6">
                <label
                  class="group relative flex items-center gap-4 p-5 lg:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md {includeFlights
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'}"
                >
                  <input
                    type="checkbox"
                    bind:checked={includeFlights}
                    class="sr-only"
                  />
                  <div class="text-3xl">{includeFlights ? "✈️" : "✈️"}</div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-base mb-1">Flights</h4>
                    <p class="text-sm opacity-90">
                      Round-trip airfare included
                    </p>
                  </div>
                  <div
                    class="w-5 h-5 border-2 rounded border-current flex items-center justify-center {includeFlights
                      ? 'bg-primary-foreground'
                      : ''}"
                  >
                    {#if includeFlights}
                      <svg
                        class="w-3 h-3 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {/if}
                  </div>
                </label>

                <label
                  class="group relative flex items-center gap-4 p-5 lg:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md {includeHotels
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'}"
                >
                  <input
                    type="checkbox"
                    bind:checked={includeHotels}
                    class="sr-only"
                  />
                  <div class="text-3xl">🏨</div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-base mb-1">
                      Recovery Accommodation
                    </h4>
                    <p class="text-sm opacity-90">
                      Specialized recovery hotels & spas
                    </p>
                  </div>
                  <div
                    class="w-5 h-5 border-2 rounded border-current flex items-center justify-center {includeHotels
                      ? 'bg-primary-foreground'
                      : ''}"
                  >
                    {#if includeHotels}
                      <svg
                        class="w-3 h-3 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {/if}
                  </div>
                </label>

                <label
                  class="group relative flex items-center gap-4 p-5 lg:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md {includeActivities
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'}"
                >
                  <input
                    type="checkbox"
                    bind:checked={includeActivities}
                    class="sr-only"
                  />
                  <div class="text-3xl">💆‍♀️</div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-base mb-1">
                      Wellness Activities
                    </h4>
                    <p class="text-sm opacity-90">
                      Spa treatments & sightseeing
                    </p>
                  </div>
                  <div
                    class="w-5 h-5 border-2 rounded border-current flex items-center justify-center {includeActivities
                      ? 'bg-primary-foreground'
                      : ''}"
                  >
                    {#if includeActivities}
                      <svg
                        class="w-3 h-3 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {/if}
                  </div>
                </label>

                <label
                  class="group relative flex items-center gap-4 p-5 lg:p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md {includeTransport
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'}"
                >
                  <input
                    type="checkbox"
                    bind:checked={includeTransport}
                    class="sr-only"
                  />
                  <div class="text-3xl">🚗</div>
                  <div class="flex-1">
                    <h4 class="font-semibold text-base mb-1">
                      Medical Transport
                    </h4>
                    <p class="text-sm opacity-90">Airport & clinic transfers</p>
                  </div>
                  <div
                    class="w-5 h-5 border-2 rounded border-current flex items-center justify-center {includeTransport
                      ? 'bg-primary-foreground'
                      : ''}"
                  >
                    {#if includeTransport}
                      <svg
                        class="w-3 h-3 text-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    {/if}
                  </div>
                </label>
              </div>
            </section>

            <!-- Special Requests Section -->
            <section class="space-y-8">
              <div
                class="flex items-center gap-4 pb-4 border-b border-border/50"
              >
                <div
                  class="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
                >
                  4
                </div>
                <div>
                  <h3 class="text-xl sm:text-2xl font-semibold">
                    Special Requests
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    Tell us about any specific needs or preferences
                  </p>
                </div>
              </div>

              <div class="space-y-4">
                <div class="space-y-2">
                  <label
                    for="special-requests"
                    class="text-sm font-medium block"
                  >
                    Any special medical conditions, allergies, or preferences?
                    (Optional)
                  </label>
                  <p class="text-xs text-muted-foreground">
                    This information helps us provide better recommendations for
                    your safety and comfort.
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
            </section>

            <!-- Submit Section -->
            <div class="pt-8 border-t border-border/50">
              <div class="text-center space-y-4">
                <Button
                  type="submit"
                  size="lg"
                  class="w-full sm:w-auto min-w-[320px] h-14 text-base bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:via-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {#if isLoading}
                    <svg
                      class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Your Beauty Journey...
                  {:else}
                    Get My Beauty Journey Recommendations
                  {/if}
                </Button>
                <p class="text-xs text-muted-foreground max-w-md mx-auto">
                  By submitting this form, you agree to receive personalized
                  recommendations based on your preferences.
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- AI Results Section - Enhanced layout and spacing -->
  {#if showResults && aiRecommendation}
    <section
      id="results-section"
      class="py-16 lg:py-24 bg-gradient-to-b from-muted/10 to-background"
    >
      <div class="container mx-auto px-4 lg:px-6 max-w-5xl">
        <!-- Results Header -->
        <div class="text-center mb-12">
          <div
            class="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            Recommendations Ready
          </div>

          <div
            class="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8"
          >
            <div class="text-center sm:text-left">
              <h2 class="text-3xl sm:text-4xl font-bold mb-2">
                Your Personalized Beauty Journey
              </h2>
              <p class="text-muted-foreground">
                Tailored recommendations based on your preferences
              </p>
            </div>
            <Button
              onclick={resetForm}
              variant="outline"
              size="lg"
              class="flex-shrink-0"
            >
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create New Plan
            </Button>
          </div>
        </div>

        <!-- Results Content -->
        <div
          class="bg-card/60 backdrop-blur-sm border rounded-3xl shadow-xl overflow-hidden"
        >
          <div class="p-8 lg:p-12">
            <div
              class="prose prose-slate max-w-none dark:prose-invert prose-lg"
            >
              {@html marked(aiRecommendation)}
            </div>
          </div>
        </div>

        <!-- Action Buttons and Disclaimer -->
        <div class="mt-12 space-y-8">
          <!-- Disclaimer -->
          <div
            class="bg-muted/30 border border-muted rounded-2xl p-6 text-center"
          >
            <div class="flex items-center justify-center gap-2 mb-3">
              <svg
                class="w-5 h-5 text-muted-foreground"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="text-sm font-medium text-muted-foreground"
                >Important Notice</span
              >
            </div>
            <p class="text-sm text-muted-foreground leading-relaxed">
              This is an AI-generated recommendation based on your preferences.
              Please consult with qualified medical professionals and conduct
              thorough research before making any medical tourism decisions.
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" class="min-w-[200px]">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Save This Plan
            </Button>
            <Button size="lg" variant="outline" class="min-w-[200px]">
              <svg
                class="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              Share with Doctor
            </Button>
          </div>
        </div>
      </div>
    </section>
  {/if}
</div>

<style>
  /* Enhanced slider styling for better UX */
  .slider {
    background: linear-gradient(
      to right,
      hsl(var(--primary)) 0%,
      hsl(var(--primary)) var(--value, 0%),
      hsl(var(--muted)) var(--value, 0%),
      hsl(var(--muted)) 100%
    );
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
    border: 4px solid hsl(var(--background));
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.1);
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.2),
      0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .slider::-moz-range-thumb {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: hsl(var(--primary));
    cursor: pointer;
    border: 4px solid hsl(var(--background));
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.15),
      0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .slider::-moz-range-thumb:hover {
    transform: scale(1.1);
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.2),
      0 2px 6px rgba(0, 0, 0, 0.15);
  }

  /* Enhanced prose styling for better readability */
  .prose {
    line-height: 1.8;
  }

  :global(.prose h1),
  :global(.prose h2),
  :global(.prose h3) {
    scroll-margin-top: 2rem;
  }

  :global(.prose p) {
    margin-bottom: 1.25rem;
  }

  :global(.prose strong) {
    font-weight: 600;
  }

  /* Smooth scroll behavior */
  :global(html) {
    scroll-behavior: smooth;
  }

  /* Enhanced focus states for accessibility */
  .group:focus-within {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }

  /* Animation for trust indicators */
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

  /* Responsive improvements */
  @media (max-width: 640px) {
    .container {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }

  /* Loading animation */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
