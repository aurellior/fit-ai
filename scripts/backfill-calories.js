/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function estimateActivityCalories({ type, distanceMeters, durationSec, avgSpeedMs, weightKg = 68 }) {
  const durationHours = Math.max(0.01, durationSec / 3600);
  const distanceKm = distanceMeters && distanceMeters > 0 ? distanceMeters / 1000 : 0;
  const effectiveWeight = weightKg && weightKg >= 35 && weightKg <= 200 ? weightKg : 68;

  switch (type) {
    case 'RUN': {
      if (distanceKm > 0) {
        return Math.max(1, Math.round(distanceKm * effectiveWeight * 1.036));
      }
      return Math.max(1, Math.round(durationHours * 10.0 * effectiveWeight));
    }
    case 'RIDE': {
      const speedKmh =
        distanceKm > 0 && durationHours > 0
          ? distanceKm / durationHours
          : avgSpeedMs && avgSpeedMs > 0
          ? avgSpeedMs * 3.6
          : 20;

      let met = 7.0;
      if (speedKmh >= 26) met = 10.0;
      else if (speedKmh >= 22) met = 8.5;
      else if (speedKmh < 16) met = 4.5;
      else met = 6.8;

      return Math.max(1, Math.round(durationHours * met * effectiveWeight));
    }
    case 'SWIM':
      return Math.max(1, Math.round(durationHours * 7.0 * effectiveWeight));
    case 'WALK':
    case 'HIKE': {
      const factor = type === 'HIKE' ? 0.85 : 0.73;
      if (distanceKm > 0) {
        return Math.max(1, Math.round(distanceKm * effectiveWeight * factor));
      }
      return Math.max(1, Math.round(durationHours * 3.8 * effectiveWeight));
    }
    case 'WEIGHT_TRAINING':
      return Math.max(1, Math.round(durationHours * 5.5 * effectiveWeight));
    default:
      return Math.max(1, Math.round(durationHours * 5.0 * effectiveWeight));
  }
}

async function main() {
  console.log('--- Starting Calorie Backfill ---');
  const activities = await prisma.activity.findMany({
    where: {
      OR: [{ calories: null }, { calories: 0 }],
    },
    include: {
      user: {
        include: {
          weightLogs: {
            orderBy: { loggedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  console.log(`Found ${activities.length} activities with missing or zero calories.`);

  let updated = 0;
  for (const act of activities) {
    const userWeight = act.user?.weightLogs[0]?.weightKg || 68;
    const estimated = estimateActivityCalories({
      type: act.type,
      distanceMeters: act.distanceMeters,
      durationSec: act.durationSec,
      weightKg: userWeight,
    });

    await prisma.activity.update({
      where: { id: act.id },
      data: { calories: estimated },
    });

    const distStr = act.distanceMeters ? (act.distanceMeters / 1000).toFixed(2) + ' km' : act.durationSec + 's';
    console.log(`Updated [${act.title}] (${act.type} • ${distStr}): ${estimated} kcal`);
    updated++;
  }

  console.log(`--- Finished! Successfully backfilled ${updated} activities. ---`);
}

main()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
