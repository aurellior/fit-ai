import { ActivitySource, ActivityType } from '@prisma/client';

export type ActionResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error?: string; errors?: Record<string, string[]> };

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

export type ScheduledDayStatus = 'completed' | 'skipped' | 'upcoming' | 'today' | 'rescheduled';

export interface CoachWorkoutDay {
  dayName: string;
  defaultDayName?: string;
  isShifted?: boolean;
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
    executedOnDay?: string;
  } | null;
}

export interface SmartSkipAuditSlot {
  status: ScheduledDayStatus;
  dateLabel: string;
  fulfilledOn?: string;
  dayName?: string;
  defaultDayName?: string;
  isShifted?: boolean;
  shiftReason?: string;
}

export interface SmartSkipAudit {
  hasSkippedDays: boolean;
  skippedDayNames: string[];
  activeAdjustmentNote: string | null;
  auditDetails: {
    monday: SmartSkipAuditSlot;
    thursday: SmartSkipAuditSlot;
    saturday: SmartSkipAuditSlot;
  };
  crossTrainingNotice?: string | null;
  adaptiveShifts?: Array<{
    targetSlot: string;
    actualDay: string;
    activityTitle: string;
    note: string;
  }>;
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
  todayDynamicDirective?: {
    dayName: string;
    focus: string;
    targetMetric: string;
    details: string;
    badge: string;
    isRecovery: boolean;
    reason?: string | null;
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

export interface StepLogData {
  id: string;
  userId?: string;
  dateStr: string;
  stepCount: number;
  loggedAt: Date | string;
  source?: string;
  notes?: string | null;
}

export type EnergyBalanceStatus = 'Surplus' | 'Defisit' | 'Balanced';

export interface StravaActivityStepSummary {
  id: string;
  title: string;
  type: string;
  calories: number;
  distanceKm?: number;
  durationSec: number;
  stepsAbsorbed: number;
  isStrava: boolean;
}

export interface DailyNutritionAuditData {
  date: string; // 'YYYY-MM-DD'
  dateFormatted: string; // e.g. "Rabu, 30 September 2026"
  dayName: string; // e.g. "Senin", "Kamis", "Sabtu", dll.
  dayScheduleFocus: string; // e.g. "Tempo / Speed Run", "Interval", "Long Run", "Active Recovery / Rest"
  isTrainingDay: boolean;

  // Energy & Calories
  caloriesIn: number;
  caloriesOut: number;
  activityCalories: number;
  bmrCalories: number;
  netCalories: number;
  status: EnergyBalanceStatus;
  calorieProgressPercent: number; // (caloriesIn / caloriesOut) * 100

  // Anti-Double Counting & Daily Steps Breakdown
  totalDailySteps: number;
  workoutStepsAbsorbed: number;
  pureNeatSteps: number;
  neatCalories: number;
  hasStravaWorkout: boolean;
  doubleCountingPrevented: boolean;
  deduplicatedCaloriesSaved: number;
  stepSource?: string;
  hasStepsLogged: boolean;
  stravaActivitiesSummary?: StravaActivityStepSummary[];

  // Macronutrients
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetProteinG: number;
  proteinProgressPercent: number;

  // AI Sports Nutritionist Analysis
  evaluationMessage: string;
  proteinStatus: string;
  actionableTip?: string;

  // Item counts
  foodCount: number;
  activityCount: number;
}


