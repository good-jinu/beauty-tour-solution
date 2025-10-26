import type { Component } from "svelte";
import type { StepperFormData } from "./stepper";

// Solution type identifiers
export type SolutionType = "topranking" | "premium" | "budget";

// Icon component type for Lucide Svelte icons
export type IconComponent = Component<{
	class?: string;
	size?: number | string;
}>;

// Cost multipliers for different solution types
export interface SolutionCostMultipliers {
	budget: number;
	topranking: number;
	premium: number;
}

// Default cost multipliers
export const DEFAULT_COST_MULTIPLIERS: SolutionCostMultipliers = {
	budget: 0.6,
	topranking: 1.0,
	premium: 1.5,
};

// Solution configuration interface
export interface SolutionConfig {
	id: SolutionType;
	name: string;
	icon: IconComponent;
	description: string;
	features: string[];
	highlight: string;
	color: string;
	estimatedCost: number;
	costLabel: string;
}

// Props interface for ScheduleSolutions component
export interface ScheduleSolutionsProps {
	formData: StepperFormData;
}

// Props interface for ScheduleContents component
export interface ScheduleContentsProps {
	formData: StepperFormData;
	solutionType?: SolutionType;
	isLoading?: boolean;
	error?: string | null;
	scheduleData?: import("@bts/core").GenerateScheduleResponse | null;
	onRetry?: () => void;
}

// Cost calculation configuration
export interface CostCalculationConfig {
	baseCostPercentage: number; // Percentage of budget to use as base cost
	multipliers: SolutionCostMultipliers;
}

// Default cost calculation configuration
export const DEFAULT_COST_CONFIG: CostCalculationConfig = {
	baseCostPercentage: 0.8, // Use 80% of budget as base
	multipliers: DEFAULT_COST_MULTIPLIERS,
};

// Utility functions for cost calculations
export const SolutionCostUtils = {
	// Calculate estimated cost for a solution type
	calculateSolutionCost: (
		solutionType: SolutionType,
		budget: number,
		config: CostCalculationConfig = DEFAULT_COST_CONFIG,
	): number => {
		const baseCost = budget * config.baseCostPercentage;
		return Math.round(baseCost * config.multipliers[solutionType]);
	},

	// Calculate savings compared to top ranking solution
	calculateSavings: (currentCost: number, topRankingCost: number): number => {
		return Math.max(0, topRankingCost - currentCost);
	},

	// Calculate premium cost difference
	calculatePremiumDifference: (
		premiumCost: number,
		topRankingCost: number,
	): number => {
		return Math.max(0, premiumCost - topRankingCost);
	},

	// Calculate budget percentage used
	calculateBudgetPercentage: (
		estimatedCost: number,
		totalBudget: number,
	): number => {
		return Math.round((estimatedCost / totalBudget) * 100);
	},

	// Get cost comparison text
	getCostComparisonText: (
		solutionType: SolutionType,
		currentCost: number,
		topRankingCost: number,
	): string => {
		switch (solutionType) {
			case "budget": {
				const savings = SolutionCostUtils.calculateSavings(
					currentCost,
					topRankingCost,
				);
				return `Save $${savings.toLocaleString()}`;
			}
			case "premium": {
				const premium = SolutionCostUtils.calculatePremiumDifference(
					currentCost,
					topRankingCost,
				);
				return `+$${premium.toLocaleString()} for premium experience`;
			}
			default:
				return "Balanced cost and quality";
		}
	},
};

// Solution metadata for UI rendering
export interface SolutionMetadata {
	borderClass: string;
	badgeVariant: "default" | "secondary";
	progressBarClass: string;
}

// Get UI metadata for a solution type
export const getSolutionMetadata = (
	solutionType: SolutionType,
): SolutionMetadata => {
	switch (solutionType) {
		case "topranking":
			return {
				borderClass: "border-primary",
				badgeVariant: "default",
				progressBarClass: "bg-primary",
			};
		case "budget":
			return {
				borderClass: "border-border",
				badgeVariant: "secondary",
				progressBarClass: "bg-green-500",
			};
		case "premium":
			return {
				borderClass: "border-border",
				badgeVariant: "secondary",
				progressBarClass: "bg-purple-500",
			};
		default:
			return {
				borderClass: "border-border",
				badgeVariant: "secondary",
				progressBarClass: "bg-primary",
			};
	}
};
