import { ActivitySource, ActivityType } from '@prisma/client';

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface StravaTokenData {
  id: string;
  userId: string;
  athleteId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scope?: string | null;
}

export interface GymSet {
  exercise: string;
  sets: number;
  reps: number;
  weightKg: number;
}

export interface ActivityData {
  id: string;
  userId?: string;
  source: ActivitySource;
  type: ActivityType;
  title: string;
  startTime: Date | string;
  durationSec: number;
  distanceMeters?: number | null;
  avgPaceSecPerKm?: number | null;
  elevationGainM?: number | null;
  calories?: number | null;
  stravaActivityId?: string | null;
  summaryPolyline?: string | null;
  notes?: string | null;
  gymSets?: GymSet[] | null;
}

export interface WeightLogData {
  id: string;
  weightKg: number;
  loggedAt: Date | string;
  notes?: string | null;
}

export interface FoodLogData {
  id: string;
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  imageUrl?: string | null;
  loggedAt: Date | string;
}

export interface CoachWorkoutDay {
  dayName: 'Senin' | 'Kamis' | 'Sabtu';
  focus: string;
  targetMetric: string;
  details: string;
  intensityBadge: 'Moderate' | 'High' | 'Endurance';
}

export interface CoachPlanData {
  coachGreeting: string;
  intensityVerdict: 'Kurang (Under-training)' | 'Pas (Balanced)' | 'Terlalu Berat (Over-training)';
  lastWeekAnalysis: string;
  nextWorkoutDay: {
    dayName: string;
    label: string;
    focus: string;
    summary: string;
    targetMetric: string;
  };
  schedule: {
    monday: CoachWorkoutDay;
    thursday: CoachWorkoutDay;
    saturday: CoachWorkoutDay;
  };
  recoveryAdvice: {
    nutrition: string;
    restAndGym: string;
    proteinRecommendation: string;
  };
}

export interface AiInsightData {
  id: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  summary: string;
  strengths: string;
  recommendations: string;
  createdAt: Date | string;
  coachPlan?: CoachPlanData | null;
}

