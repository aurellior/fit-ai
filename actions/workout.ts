'use server';

import { rescheduleWorkoutWithAI, RescheduleRequestPayload } from '@/lib/services/workout-rescheduler';

export async function rescheduleWorkoutAction(payload: RescheduleRequestPayload) {
  try {
    const result = await rescheduleWorkoutWithAI(payload);
    return {
      success: true,
      data: result,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal menghasilkan reschedule adaptif';
    return {
      success: false,
      error: errorMsg,
    };
  }
}
