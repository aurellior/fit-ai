import { Umbrella, BatteryLow, Clock, ShieldAlert, LucideIcon } from 'lucide-react';

export interface PresetObstacle {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
}

export const PRESET_OBSTACLES: PresetObstacle[] = [
  {
    id: 'rain',
    label: 'Hujan / Cuaca Buruk',
    desc: 'Jalanan licin dan risiko basah kuyup di luar ruangan',
    icon: Umbrella,
  },
  {
    id: 'fatigue',
    label: 'Kelelahan / DOMS Ekstrem',
    desc: 'Otot belum pulih dari sesi lari/gym sebelumnya',
    icon: BatteryLow,
  },
  {
    id: 'time',
    label: 'Waktu Terbatas (Sibuk)',
    desc: 'Hanya memiliki waktu 20 - 30 menit luang hari ini',
    icon: Clock,
  },
  {
    id: 'injury',
    label: 'Nyeri Sendi / Cedera Ringan',
    desc: 'Lutut, pergelangan kaki, atau tulang kering terasa nyeri',
    icon: ShieldAlert,
  },
];

export interface DefaultScheduleDay {
  dayName: string;
  focus: string;
  targetMetric: string;
  details: string;
  badge: string;
  isKey: boolean;
}

export const DEFAULT_WEEKLY_SCHEDULES: Record<number, DefaultScheduleDay> = {
  1: {
    dayName: 'Senin',
    focus: 'Tempo / Speed Run (Jadwal Kunci)',
    targetMetric: '4.5 km - 5.0 km • Pace 7:15 - 7:30/km',
    details:
      '1 km pemanasan santai (Pace 8:30), 2.5 km Tempo Run terkunci di Pace 7:15-7:30/km, ditutup 1 km pendinginan jalan aktif.',
    badge: 'Jadwal Kunci Speed',
    isKey: true,
  },
  2: {
    dayName: 'Selasa',
    focus: 'Gym Hypertrophy & Cross Training',
    targetMetric: '45-60 menit Resistance Training • Fokus Core & Lower Body',
    details: 'Squats, lunges, dan calf raises untuk memperkuat stabilitas sendi saat lari, ditutup stretching dinamis.',
    badge: 'Cross-Training',
    isKey: false,
  },
  3: {
    dayName: 'Rabu',
    focus: 'Active Recovery & Easy Walk',
    targetMetric: '20-30 menit Jalan Santai / Mobilisasi Sendi',
    details: 'Menjaga aliran darah dan sirkulasi limfatik tanpa membebani detak jantung tinggi. Hidrasi optimal.',
    badge: 'Recovery',
    isKey: false,
  },
  4: {
    dayName: 'Kamis',
    focus: 'Interval VO2Max Training (Jadwal Kunci)',
    targetMetric: '5x 400m @ Pace 6:45 - 7:00/km (Rest 90s)',
    details:
      '1 km jogging ringan dinamis. 5 set lari 400m cepat dengan istirahat jalan 90 detik tiap set. Jangan duduk saat jeda rest.',
    badge: 'Jadwal Kunci VO2Max',
    isKey: true,
  },
  5: {
    dayName: 'Jumat',
    focus: 'Rest & Carb Storing',
    targetMetric: 'Istirahat Total • Asupan Karbohidrat Kompleks',
    details: 'Persiapan simpanan glikogen otot sebelum menu lari jarak jauh akhir pekan (Long Run Sabtu).',
    badge: 'Rest Day',
    isKey: false,
  },
  6: {
    dayName: 'Sabtu',
    focus: 'Progressive Long Run (Jadwal Kunci)',
    targetMetric: '6.5 km - 7.0 km • Pace 8:15 - 8:40/km',
    details:
      'Lari jarak jauh murni di Zona 2 (conversational pace). Kenaikan jarak terkontrol agar aman dari risiko cedera tulang kering.',
    badge: 'Jadwal Kunci Endurance',
    isKey: true,
  },
  0: {
    dayName: 'Minggu',
    focus: 'Post-Long Run Rest & Refuel',
    targetMetric: 'Pemulihan Pasif / Jalan Santai • Protein 1.6-2.0g/kg',
    details: 'Pemulihan serat otot, mandi air hangat, dan rehidrasi elektrolit untuk persiapan minggu baru.',
    badge: 'Recovery',
    isKey: false,
  },
};
