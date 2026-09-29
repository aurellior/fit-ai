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

export type ScheduledDayStatus = 'completed' | 'skipped' | 'upcoming' | 'today';

export interface CoachWorkoutDay {
  dayName: 'Senin' | 'Kamis' | 'Sabtu';
  focus: string;
  originalFocus?: string;
  targetMetric: string;
  details: string;
  intensityBadge: 'Moderate' | 'High' | 'Endurance';
  status?: ScheduledDayStatus;
  isAdjusted?: boolean;
  adjustmentReason?: string | null;
  completedActivity?: {
    title: string;
    distanceKm: number;
    paceFormatted: string;
  } | null;
}

export interface SmartSkipAudit {
  hasSkippedDays: boolean;
  skippedDayNames: string[];
  activeAdjustmentNote: string | null;
  auditDetails: {
    monday: { status: ScheduledDayStatus; dateLabel: string };
    thursday: { status: ScheduledDayStatus; dateLabel: string };
    saturday: { status: ScheduledDayStatus; dateLabel: string };
  };
}

export interface CoachPlanData {
  coachGreeting: string;
  intensityVerdict: 'Kurang (Under-training)' | 'Pas (Balanced)' | 'Terlalu Berat (Over-training)';
  lastWeekAnalysis: string;
  smartSkipAudit: SmartSkipAudit;
  nextWorkoutDay: {
    dayName: string;
    label: string;
    focus: string;
    summary: string;
    targetMetric: string;
    isAdjusted: boolean;
    adjustmentBadge?: string | null;
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

