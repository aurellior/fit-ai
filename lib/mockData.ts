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
    title: 'Tempo Threshold Run 6K',
    source: ActivitySource.MANUAL,
    type: ActivityType.RUN,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 28),
    durationSec: 2160, // 36 mins
    distanceMeters: 6000,
    avgPaceSecPerKm: 360, // 6'00"
    calories: 420,
    notes: 'Lari tempo terkontrol di ambang laktat. Ritme nafas stabil 2-2.',
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
    title: 'Progressive Long Run 10K',
    source: ActivitySource.MANUAL,
    type: ActivityType.RUN,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 76),
    durationSec: 3600, // 60 mins
    distanceMeters: 10100,
    avgPaceSecPerKm: 356, // 5'56"
    calories: 680,
    notes: 'Long run progresif: 7 km pertama di Zona 2, tutup 3 km terakhir di pace tempo.',
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
    title: 'Easy Recovery Run 4K',
    source: ActivitySource.MANUAL,
    type: ActivityType.RUN,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 124),
    durationSec: 1560, // 26 mins
    distanceMeters: 4000,
    avgPaceSecPerKm: 390, // 6'30"
    calories: 260,
    notes: 'Lari santai pemulihan tanpa beban pace, fokus pada fleksibilitas kaki.',
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
    title: 'Easy Fartlek Run 5K',
    source: ActivitySource.MANUAL,
    type: ActivityType.RUN,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 196),
    durationSec: 1800,
    distanceMeters: 5000,
    avgPaceSecPerKm: 360,
    calories: 350,
    notes: 'Variasi lari cepat santai sesuai kontur jalan.',
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
    title: 'Easy Aerobic Base Run 5K',
    source: ActivitySource.MANUAL,
    type: ActivityType.RUN,
    startTime: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 244),
    durationSec: 1800,
    distanceMeters: 5000,
    avgPaceSecPerKm: 360,
    calories: 340,
    notes: 'Lari santai sore hari fokus pada irama pernapasan.',
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
    'Volume lari mingguan seimbang. Pace pada lari pagi menunjukkan efisiensi aerobik yang konsisten pada zona 2-3.',
  strengths:
    'Konsistensi cadence stabil dan pacing merata di setiap sesi lari mingguan.',
  recommendations:
    'Pertahankan hidrasi elektrolit dan pastikan waktu tidur cukup untuk pemulihan optimal.',
  periodStart: new Date(BASE_DATE.getTime() - 1000 * 60 * 60 * 24 * 7),
  periodEnd: BASE_DATE,
  createdAt: BASE_DATE,
};

export interface MockStepLog {
  id: string;
  dateStr: string;
  stepCount: number;
  source: string;
}

export const MOCK_STEP_LOGS: MockStepLog[] = [
  { id: 'step-1', dateStr: '2026-09-28', stepCount: 10850, source: 'APPLE_HEALTH' },
  { id: 'step-2', dateStr: '2026-09-27', stepCount: 5200, source: 'APPLE_HEALTH' },
  { id: 'step-3', dateStr: '2026-09-26', stepCount: 14200, source: 'APPLE_HEALTH' },
  { id: 'step-4', dateStr: '2026-09-25', stepCount: 7800, source: 'APPLE_HEALTH' },
  { id: 'step-5', dateStr: '2026-09-24', stepCount: 11400, source: 'APPLE_HEALTH' },
  { id: 'step-6', dateStr: '2026-09-23', stepCount: 6500, source: 'APPLE_HEALTH' },
  { id: 'step-7', dateStr: '2026-09-22', stepCount: 8900, source: 'APPLE_HEALTH' },
];

