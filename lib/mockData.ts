import { ActivitySource, ActivityType } from '@prisma/client';
import { ActivityData, AiInsightData, FoodLogData, WeightLogData } from '@/types';

const BASE_DATE = new Date('2026-09-28T08:00:00Z');

export const MOCK_ACTIVITIES: ActivityData[] = [
  {
    id: 'act-1',
    title: 'Morning Easy Run 5K',
    source: ActivitySource.STRAVA,
    type: ActivityType.RUN,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 6),
    durationSec: 1680, // 28 mins
    distanceMeters: 5120,
    avgPaceSecPerKm: 328, // 5'28"
    elevationGainM: 35,
    calories: 340,
    stravaActivityId: '12345678901',
    notes: 'Kondisi cuaca cerah dan sejuk. Cadence rata-rata 172 spm.',
  },
  {
    id: 'act-2',
    title: 'Upper Body Hypertrophy',
    source: ActivitySource.MANUAL,
    type: ActivityType.WEIGHT_TRAINING,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 28),
    durationSec: 3300, // 55 mins
    calories: 280,
    notes: 'Target dada dan tricep. Menambah beban pada incline dumbbell press.',
    gymSets: [
      { exercise: 'Barbell Bench Press', sets: 4, reps: 8, weightKg: 75 },
      { exercise: 'Incline Dumbbell Press', sets: 3, reps: 10, weightKg: 24 },
      { exercise: 'Tricep Rope Pushdown', sets: 4, reps: 12, weightKg: 30 },
      { exercise: 'Cable Chest Fly', sets: 3, reps: 15, weightKg: 15 },
    ],
  },
  {
    id: 'act-3',
    title: 'Sunset Interval Run 8K',
    source: ActivitySource.STRAVA,
    type: ActivityType.RUN,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 52),
    durationSec: 2520, // 42 mins
    distanceMeters: 8050,
    avgPaceSecPerKm: 313, // 5'13"
    elevationGainM: 48,
    calories: 560,
    stravaActivityId: '12345678902',
    notes: 'Interval 6x800m dengan target pace 4:45/km. Heart rate zona 4.',
  },
  {
    id: 'act-4',
    title: 'Leg Day & Core Strength',
    source: ActivitySource.MANUAL,
    type: ActivityType.WEIGHT_TRAINING,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 76),
    durationSec: 3900, // 65 mins
    calories: 390,
    notes: 'Fokus paha depan dan glutes. Barbell Squat terasa solid.',
    gymSets: [
      { exercise: 'Barbell Back Squat', sets: 5, reps: 6, weightKg: 100 },
      { exercise: 'Romanian Deadlift', sets: 4, reps: 8, weightKg: 85 },
      { exercise: 'Bulgarian Split Squat', sets: 3, reps: 10, weightKg: 20 },
      { exercise: 'Hanging Leg Raise', sets: 3, reps: 15, weightKg: 0 },
    ],
  },
  {
    id: 'act-5',
    title: 'Weekend Endurance Ride 45K',
    source: ActivitySource.STRAVA,
    type: ActivityType.RIDE,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 100),
    durationSec: 5400, // 1h 30m
    distanceMeters: 45200,
    avgPaceSecPerKm: 120, // 30 km/h
    elevationGainM: 320,
    calories: 890,
    stravaActivityId: '12345678903',
    notes: 'Gowes rute perbukitan santai bersama peleton lokal.',
  },
  {
    id: 'act-6',
    title: 'Pull Day — Back & Biceps Focus',
    source: ActivitySource.MANUAL,
    type: ActivityType.WEIGHT_TRAINING,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 124),
    durationSec: 3000, // 50 mins
    calories: 270,
    notes: 'Pull up 4 set bodyweight lalu lat pulldown progresif beban.',
    gymSets: [
      { exercise: 'Weighted Pull-Up', sets: 4, reps: 8, weightKg: 10 },
      { exercise: 'Barbell Bent Over Row', sets: 4, reps: 10, weightKg: 65 },
      { exercise: 'Seated Cable Row', sets: 3, reps: 12, weightKg: 55 },
      { exercise: 'Incline Dumbbell Curl', sets: 3, reps: 12, weightKg: 14 },
    ],
  },
  {
    id: 'act-7',
    title: 'Recovery Tempo Run 6K',
    source: ActivitySource.STRAVA,
    type: ActivityType.RUN,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 148),
    durationSec: 1980,
    distanceMeters: 6200,
    avgPaceSecPerKm: 319,
    elevationGainM: 20,
    calories: 410,
    stravaActivityId: '12345678904',
    notes: 'Recovery run santai di lintasan aspal datar.',
  },
  {
    id: 'act-8',
    title: 'Trail Hike & Forest Elevation',
    source: ActivitySource.STRAVA,
    type: ActivityType.HIKE,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 172),
    durationSec: 7200, // 2 hours
    distanceMeters: 9800,
    elevationGainM: 650,
    calories: 780,
    stravaActivityId: '12345678905',
    notes: 'Trekking jalur bebatuan terjal, pemandangan puncak sangat memuaskan.',
  },
  {
    id: 'act-9',
    title: 'Shoulder & Core Explosive Session',
    source: ActivitySource.MANUAL,
    type: ActivityType.WEIGHT_TRAINING,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 196),
    durationSec: 2700,
    calories: 250,
    notes: 'Overhead press dan lateral raises untuk delt lateral.',
    gymSets: [
      { exercise: 'Overhead Barbell Press', sets: 4, reps: 8, weightKg: 50 },
      { exercise: 'Dumbbell Lateral Raise', sets: 4, reps: 15, weightKg: 10 },
      { exercise: 'Face Pull', sets: 4, reps: 15, weightKg: 25 },
      { exercise: 'Ab Wheel Rollout', sets: 3, reps: 12, weightKg: 0 },
    ],
  },
  {
    id: 'act-10',
    title: 'Morning Park Run 4K',
    source: ActivitySource.STRAVA,
    type: ActivityType.RUN,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 220),
    durationSec: 1320,
    distanceMeters: 4100,
    avgPaceSecPerKm: 322,
    elevationGainM: 15,
    calories: 280,
    stravaActivityId: '12345678906',
    notes: 'Lari pagi sebelum beraktivitas kantor.',
  },
  {
    id: 'act-11',
    title: 'Full Body Functional Conditioning',
    source: ActivitySource.MANUAL,
    type: ActivityType.WEIGHT_TRAINING,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 244),
    durationSec: 3600,
    calories: 420,
    notes: 'Kettlebell swings dipadukan dengan dips dan box jumps.',
    gymSets: [
      { exercise: 'Kettlebell Swing', sets: 4, reps: 20, weightKg: 24 },
      { exercise: 'Parallel Bar Dips', sets: 4, reps: 12, weightKg: 0 },
      { exercise: 'Plyo Box Jump', sets: 3, reps: 10, weightKg: 0 },
    ],
  },
  {
    id: 'act-12',
    title: 'Speed 5K Personal Record Attempt',
    source: ActivitySource.STRAVA,
    type: ActivityType.RUN,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 268),
    durationSec: 1440, // 24 mins
    distanceMeters: 5000,
    avgPaceSecPerKm: 288, // 4'48"
    elevationGainM: 10,
    calories: 360,
    stravaActivityId: '12345678907',
    notes: 'Laju pace tinggi, berhasil mencatat sub-25 menit.',
  },
];

export const MOCK_FOOD_LOGS: FoodLogData[] = [
  {
    id: 'fd-1',
    foodName: 'Dada Ayam Panggang & Nasi Merah',
    calories: 520,
    proteinG: 45,
    carbsG: 50,
    fatG: 12,
    loggedAt: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 3),
  },
  {
    id: 'fd-2',
    foodName: 'Oatmeal Pisang & Whey Protein Isolate',
    calories: 380,
    proteinG: 32,
    carbsG: 48,
    fatG: 6,
    loggedAt: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 7),
  },
  {
    id: 'fd-3',
    foodName: 'Telur Rebus 3 Butir & Alpukat',
    calories: 310,
    proteinG: 19,
    carbsG: 8,
    fatG: 22,
    loggedAt: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 12),
  },
  {
    id: 'fd-4',
    foodName: 'Salmon Bakar Madu & Brokoli Rebus',
    calories: 460,
    proteinG: 38,
    carbsG: 24,
    fatG: 20,
    loggedAt: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 26),
  },
  {
    id: 'fd-5',
    foodName: 'Greek Yogurt Madu & Granola Almond',
    calories: 290,
    proteinG: 22,
    carbsG: 34,
    fatG: 7,
    loggedAt: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 30),
  },
  {
    id: 'fd-6',
    foodName: 'Daging Sapi Tumis Lada Hitam & Nasi Putih',
    calories: 610,
    proteinG: 40,
    carbsG: 65,
    fatG: 18,
    loggedAt: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 50),
  },
];

export const MOCK_WEIGHT_LOGS: WeightLogData[] = [
  {
    id: 'wt-1',
    weightKg: 68.5,
    loggedAt: BASE_DATE,
    notes: 'Pagi hari setelah bangun tidur',
  },
  {
    id: 'wt-2',
    weightKg: 68.7,
    loggedAt: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 24),
    notes: 'Kondisi hidrasi normal',
  },
  {
    id: 'wt-3',
    weightKg: 69.0,
    loggedAt: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 48),
    notes: 'Pasca sesi leg day',
  },
  {
    id: 'wt-4',
    weightKg: 69.2,
    loggedAt: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 72),
  },
];

export const MOCK_AI_INSIGHT: AiInsightData = {
  id: 'ins-1',
  summary:
    'Volume latihan kardio dan latihan beban seimbang. Pace pada lari pagi menunjukkan efisiensi aerobik yang konsisten pada zona 2-3.',
  strengths:
    'Disiplin latihan beban secara terstruktur dan kemampuan mempertahankan cadence stabil pada sesi lari.',
  recommendations:
    'Jaga asupan protein harian minimal 1.6g/kg berat badan dan pastikan tidur 7-8 jam untuk pemulihan jaringan otot.',
  periodStart: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 24 * 7),
  periodEnd: BASE_DATE,
  createdAt: BASE_DATE,
};
