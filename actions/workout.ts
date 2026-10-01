'use server';

import { rescheduleWorkoutWithAI, RescheduleRequestPayload } from '@/lib/services/workout-rescheduler';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { parseCoachPlanFromInsight, generateWeeklyPerformanceInsight } from '@/lib/services/performance-insights';
import { CoachPlanData } from '@/types';
import { revalidatePath } from 'next/cache';

export async function rescheduleWorkoutAction(payload: RescheduleRequestPayload) {
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
          const currentDay = coachPlan.schedule[dayKey];
          currentDay.isAdjusted = true;
          currentDay.status = 'rescheduled';
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
          }

          // Perbarui target sesi berikutnya di kartu AI Coach
          coachPlan.nextWorkoutDay = {
            ...coachPlan.nextWorkoutDay,
            dayName: result.newDayOrTime.includes('Geser ke')
              ? result.newDayOrTime.replace('Geser ke', '').trim()
              : payload.dayName,
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

          updatedCoachPlan = coachPlan;

          revalidatePath('/');
          revalidatePath('/dashboard');
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
