'use server';

import { z } from 'zod';
import { rescheduleWorkoutWithAI, RescheduledWorkoutResult } from '@/lib/services/workout-rescheduler';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { parseCoachPlanFromInsight, generateWeeklyPerformanceInsight } from '@/lib/services/performance-insights';
import { CoachPlanData } from '@/types';
import { revalidatePath } from 'next/cache';

const reschedulePayloadSchema = z.object({
  dayName: z.string().min(1, 'Nama hari wajib diisi'),
  originalFocus: z.string().min(1, 'Fokus latihan wajib diisi'),
  originalTarget: z.string().default(''),
  obstacleType: z.string().min(1, 'Jenis kendala wajib diisi'),
  customNotes: z.string().optional(),
});

export type RescheduleWorkoutInput = z.infer<typeof reschedulePayloadSchema>;

export interface RescheduleActionResult {
  success: boolean;
  data?: RescheduledWorkoutResult;
  coachPlan?: CoachPlanData | null;
  error?: string;
  errors?: Record<string, string[]>;
}

export async function rescheduleWorkoutAction(input: unknown): Promise<RescheduleActionResult> {
  const parseResult = reschedulePayloadSchema.safeParse(input);
  if (!parseResult.success) {
    return {
      success: false,
      error: 'Data penyesuaian jadwal latihan tidak valid',
      errors: parseResult.error.flatten().fieldErrors,
    };
  }

  const payload = parseResult.data;

  try {
    const result = await rescheduleWorkoutWithAI(payload);
    let updatedCoachPlan: CoachPlanData | null = null;

    // Sinkronisasi dan simpan perubahan adaptif ke dalam AiInsight aktif pengguna
    try {
      const dbUser = await getCurrentUser();
      let latestInsight = await prisma.aiInsight.findFirst({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
      });

      let coachPlan: CoachPlanData | null = null;
      if (latestInsight) {
        coachPlan = parseCoachPlanFromInsight(latestInsight).coachPlan || null;
      }
      if (!coachPlan) {
        const generated = await generateWeeklyPerformanceInsight(dbUser.id);
        coachPlan = generated.coachPlan || null;
        latestInsight = await prisma.aiInsight.findFirst({
          where: { userId: dbUser.id },
          orderBy: { createdAt: 'desc' },
        });
      }

      if (coachPlan && latestInsight) {
        // Tentukan kunci hari berdasarkan dayName (Senin / Kamis / Sabtu)
        const dayKey = payload.dayName.toLowerCase().includes('senin')
          ? 'monday'
          : payload.dayName.toLowerCase().includes('kamis')
          ? 'thursday'
          : payload.dayName.toLowerCase().includes('sabtu')
          ? 'saturday'
          : null;

        if (dayKey && coachPlan.schedule && coachPlan.schedule[dayKey]) {
          const targetDay = result.newDayOrTime.includes('Geser ke')
            ? result.newDayOrTime.replace('Geser ke', '').trim()
            : payload.dayName;
          const isShiftedDay = targetDay.toLowerCase() !== payload.dayName.toLowerCase();

          const currentDay = coachPlan.schedule[dayKey];
          currentDay.isAdjusted = true;
          currentDay.status = 'rescheduled';
          currentDay.dayName = targetDay;
          currentDay.defaultDayName = payload.dayName;
          currentDay.isShifted = isShiftedDay;
          currentDay.focus = result.newFocus;
          currentDay.targetMetric = result.newTargetMetric;
          currentDay.details = `${result.coachAdvice} [Kendala: ${payload.obstacleType}]`;
          currentDay.adjustmentReason = `Diadaptasi AI (${result.badge}): Dialihkan ke ${result.newDayOrTime} akibat kendala ${payload.obstacleType}`;

          // Perbarui alert audit kepatuhan
          coachPlan.smartSkipAudit = {
            ...coachPlan.smartSkipAudit,
            hasSkippedDays: true,
            activeAdjustmentNote: `Jadwal ${payload.dayName} dialihkan (${result.badge}): ${result.newDayOrTime} - ${result.newFocus}`,
          };

          if (coachPlan.smartSkipAudit.auditDetails?.[dayKey]) {
            coachPlan.smartSkipAudit.auditDetails[dayKey].status = 'rescheduled';
            coachPlan.smartSkipAudit.auditDetails[dayKey].dayName = targetDay;
            coachPlan.smartSkipAudit.auditDetails[dayKey].defaultDayName = payload.dayName;
            coachPlan.smartSkipAudit.auditDetails[dayKey].isShifted = isShiftedDay;
            coachPlan.smartSkipAudit.auditDetails[dayKey].shiftReason = `Dialihkan ke ${targetDay}`;
          }

          // Perbarui target sesi berikutnya di kartu AI Coach
          coachPlan.nextWorkoutDay = {
            ...coachPlan.nextWorkoutDay,
            dayName: targetDay,
            label: result.badge,
            focus: result.newFocus,
            targetMetric: result.newTargetMetric,
            summary: result.coachAdvice,
            isAdjusted: true,
            adjustmentBadge: result.badge,
          };

          // Perbarui ringkasan arahan pelatih
          coachPlan.coachGreeting = `Penyesuaian Adaptif Aktif: Sesi ${payload.dayName} telah dialihkan ke ${result.newDayOrTime} karena kendala ${payload.obstacleType}.`;

          // Simpan kembali ke basis data
          await prisma.aiInsight.update({
            where: { id: latestInsight.id },
            data: {
              summary: coachPlan.coachGreeting,
              recommendations: JSON.stringify(coachPlan),
            },
          });

          // Simpan juga ke tabel workout_reschedules untuk riwayat audit persisten
          try {
            const origDate = new Date();
            origDate.setHours(0, 0, 0, 0);
            const reschedDate = new Date(origDate);
            if (result.decisionType === 'RESCHEDULE_DAY') {
              reschedDate.setDate(reschedDate.getDate() + 1);
            }
            await prisma.workoutReschedule.upsert({
              where: {
                userId_originalDate: {
                  userId: dbUser.id,
                  originalDate: origDate,
                },
              },
              update: {
                rescheduledDate: reschedDate,
                activityType: payload.originalFocus,
                reason: payload.obstacleType + (payload.customNotes ? ` (${payload.customNotes})` : ''),
                aiRecommendation: JSON.stringify(result),
              },
              create: {
                userId: dbUser.id,
                originalDate: origDate,
                rescheduledDate: reschedDate,
                activityType: payload.originalFocus,
                reason: payload.obstacleType + (payload.customNotes ? ` (${payload.customNotes})` : ''),
                aiRecommendation: JSON.stringify(result),
              },
            });
          } catch (tableErr) {
            console.warn('Gagal mencatat ke WorkoutReschedule table:', tableErr);
          }

          updatedCoachPlan = coachPlan;

          revalidatePath('/');
          revalidatePath('/dashboard');
          revalidatePath('/coach');
          revalidatePath('/ai-coach');
        }
      }
    } catch (saveErr) {
      console.warn('Penyimpanan sinkronisasi AiInsight gagal:', saveErr);
    }

    return {
      success: true,
      data: result,
      coachPlan: updatedCoachPlan,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal menghasilkan reschedule adaptif';
    return {
      success: false,
      error: errorMsg,
    };
  }
}
