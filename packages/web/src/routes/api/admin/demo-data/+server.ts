import type { GenerateScheduleRequest, ScheduleDay } from "@bts/core";
import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import { getScheduleService } from "$lib/utils/apiHelpers";

/**
 * POST /api/admin/demo-data
 * Create demo schedule data for testing the admin interface
 */
export const POST: RequestHandler = async () => {
	try {
		const scheduleService = await getScheduleService();

		// Demo schedule 1: Seoul Beauty Tour
		const seoulRequest: GenerateScheduleRequest = {
			region: "Seoul",
			startDate: "2024-12-15",
			endDate: "2024-12-18",
			selectedThemes: ["skincare", "wellness", "anti-aging"],
			budget: 3000,
			solutionType: "premium",
		};

		const seoulSchedule: ScheduleDay[] = [
			{
				date: "2024-12-15",
				dayNumber: 1,
				activities: [
					{
						time: "09:00",
						activity: "Premium Facial Treatment",
						location: "Gangnam Beauty Clinic",
						duration: "2 hours",
						cost: 300,
						description:
							"Deep cleansing facial with Korean skincare techniques and premium products",
						category: "treatment",
					},
					{
						time: "14:00",
						activity: "Skin Analysis Consultation",
						location: "Seoul Dermatology Center",
						duration: "1 hour",
						cost: 150,
						description:
							"Professional skin analysis and personalized skincare recommendations",
						category: "consultation",
					},
					{
						time: "16:00",
						activity: "Traditional Korean Spa",
						location: "Dragon Hill Spa",
						duration: "3 hours",
						cost: 80,
						description:
							"Relaxing traditional Korean spa experience with various baths and saunas",
						category: "wellness",
					},
				],
				totalCost: 530,
				notes: "First day focusing on assessment and initial treatments",
			},
			{
				date: "2024-12-16",
				dayNumber: 2,
				activities: [
					{
						time: "10:00",
						activity: "Anti-Aging Treatment",
						location: "Premium Beauty Center",
						duration: "2.5 hours",
						cost: 450,
						description:
							"Advanced anti-aging treatment with latest Korean technology",
						category: "treatment",
					},
					{
						time: "15:00",
						activity: "Wellness Massage",
						location: "Healing Touch Spa",
						duration: "90 minutes",
						cost: 120,
						description: "Therapeutic massage for relaxation and recovery",
						category: "wellness",
					},
				],
				totalCost: 570,
				notes: "Focus on advanced treatments and recovery",
			},
			{
				date: "2024-12-17",
				dayNumber: 3,
				activities: [
					{
						time: "11:00",
						activity: "Skincare Shopping Tour",
						location: "Myeongdong Beauty District",
						duration: "3 hours",
						cost: 200,
						description:
							"Guided tour of best Korean skincare shops with expert recommendations",
						category: "wellness",
					},
					{
						time: "16:00",
						activity: "Final Consultation",
						location: "Beauty Clinic",
						duration: "1 hour",
						cost: 100,
						description:
							"Final assessment and take-home skincare routine planning",
						category: "consultation",
					},
				],
				totalCost: 300,
				notes: "Shopping and final consultation day",
			},
		];

		// Demo schedule 2: Busan Wellness Retreat
		const busanRequest: GenerateScheduleRequest = {
			region: "Busan",
			startDate: "2024-12-20",
			endDate: "2024-12-22",
			selectedThemes: ["wellness", "relaxation", "spa"],
			budget: 1500,
			solutionType: "budget",
		};

		const busanSchedule: ScheduleDay[] = [
			{
				date: "2024-12-20",
				dayNumber: 1,
				activities: [
					{
						time: "10:00",
						activity: "Beach Spa Treatment",
						location: "Haeundae Beach Resort",
						duration: "2 hours",
						cost: 180,
						description: "Relaxing spa treatment with ocean views",
						category: "wellness",
					},
					{
						time: "14:00",
						activity: "Traditional Korean Bath",
						location: "Busan Jjimjilbang",
						duration: "3 hours",
						cost: 50,
						description: "Traditional Korean public bath experience",
						category: "wellness",
					},
				],
				totalCost: 230,
				notes: "Relaxing beach day with traditional wellness",
			},
			{
				date: "2024-12-21",
				dayNumber: 2,
				activities: [
					{
						time: "09:00",
						activity: "Hiking and Nature Therapy",
						location: "Geumjeongsan Mountain",
						duration: "4 hours",
						cost: 30,
						description: "Guided nature walk and forest therapy session",
						category: "wellness",
					},
					{
						time: "15:00",
						activity: "Meditation Session",
						location: "Beomeosa Temple",
						duration: "2 hours",
						cost: 40,
						description: "Traditional meditation and mindfulness practice",
						category: "wellness",
					},
				],
				totalCost: 70,
				notes: "Nature and mindfulness focused day",
			},
		];

		// Create demo schedules
		const demoGuestId = "demo_guest_admin";

		const results = await Promise.allSettled([
			scheduleService.saveSchedule({
				guestId: demoGuestId,
				title: "Seoul Premium Beauty Tour",
				request: seoulRequest,
				schedule: seoulSchedule,
			}),
			scheduleService.saveSchedule({
				guestId: demoGuestId,
				title: "Busan Wellness Retreat",
				request: busanRequest,
				schedule: busanSchedule,
			}),
		]);

		const successful = results.filter(
			(r) => r.status === "fulfilled" && r.value.success,
		).length;
		const failed = results.length - successful;

		return json({
			success: true,
			message: `Demo data created: ${successful} schedules created, ${failed} failed`,
			data: {
				created: successful,
				failed: failed,
				guestId: demoGuestId,
			},
		});
	} catch (error) {
		console.error("Error creating demo data:", error);
		return json(
			{
				success: false,
				error: "Failed to create demo data",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
};
