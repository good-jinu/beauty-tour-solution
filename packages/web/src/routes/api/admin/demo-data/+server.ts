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
				items: [
					{
						activityId: "demo_activity_001",
						scheduledTime: "09:00",
						duration: "2 hours",
						status: "planned",
						notes:
							"Deep cleansing facial with Korean skincare techniques and premium products",
						customPrice: 300,
					},
					{
						activityId: "demo_activity_002",
						scheduledTime: "14:00",
						duration: "1 hour",
						status: "planned",
						notes:
							"Professional skin analysis and personalized skincare recommendations",
						customPrice: 150,
					},
					{
						activityId: "demo_activity_003",
						scheduledTime: "16:00",
						duration: "3 hours",
						status: "planned",
						notes:
							"Relaxing traditional Korean spa experience with various baths and saunas",
						customPrice: 80,
					},
				],
				totalCost: 530,
				notes: "First day focusing on assessment and initial treatments",
			},
			{
				date: "2024-12-16",
				dayNumber: 2,
				items: [
					{
						activityId: "demo_activity_004",
						scheduledTime: "10:00",
						duration: "2.5 hours",
						status: "planned",
						notes:
							"Advanced anti-aging treatment with latest Korean technology",
						customPrice: 450,
					},
					{
						activityId: "demo_activity_005",
						scheduledTime: "15:00",
						duration: "90 minutes",
						status: "planned",
						notes: "Therapeutic massage for relaxation and recovery",
						customPrice: 120,
					},
				],
				totalCost: 570,
				notes: "Focus on advanced treatments and recovery",
			},
			{
				date: "2024-12-17",
				dayNumber: 3,
				items: [
					{
						activityId: "demo_activity_006",
						scheduledTime: "11:00",
						duration: "3 hours",
						status: "planned",
						notes:
							"Guided tour of best Korean skincare shops with expert recommendations",
						customPrice: 200,
					},
					{
						activityId: "demo_activity_007",
						scheduledTime: "16:00",
						duration: "1 hour",
						status: "planned",
						notes: "Final assessment and take-home skincare routine planning",
						customPrice: 100,
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
				items: [
					{
						activityId: "demo_activity_008",
						scheduledTime: "10:00",
						duration: "2 hours",
						status: "planned",
						notes: "Relaxing spa treatment with ocean views",
						customPrice: 180,
					},
					{
						activityId: "demo_activity_009",
						scheduledTime: "14:00",
						duration: "3 hours",
						status: "planned",
						notes: "Traditional Korean public bath experience",
						customPrice: 50,
					},
				],
				totalCost: 230,
				notes: "Relaxing beach day with traditional wellness",
			},
			{
				date: "2024-12-21",
				dayNumber: 2,
				items: [
					{
						activityId: "demo_activity_010",
						scheduledTime: "09:00",
						duration: "4 hours",
						status: "planned",
						notes: "Guided nature walk and forest therapy session",
						customPrice: 30,
					},
					{
						activityId: "demo_activity_011",
						scheduledTime: "15:00",
						duration: "2 hours",
						status: "planned",
						notes: "Traditional meditation and mindfulness practice",
						customPrice: 40,
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
