'use client';

import React from 'react';
import TodayCoachDirectiveBanner from '@/components/dashboard/TodayCoachDirectiveBanner';
import { CoachPlanData } from '@/types';

export interface TodayWorkoutCardProps {
  coachPlan?: CoachPlanData | null;
  onRescheduled?: (newCoachPlan: CoachPlanData) => void;
}

/**
 * @deprecated Use TodayCoachDirectiveBanner instead for modern banner directives.
 */
export default function TodayWorkoutCard({ coachPlan, onRescheduled }: TodayWorkoutCardProps) {
  return <TodayCoachDirectiveBanner coachPlan={coachPlan} onRescheduled={onRescheduled} />;
}
