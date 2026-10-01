/**
 * FitPulse AI Timezone Utilities (WIB / UTC+7 - Asia/Jakarta)
 * 
 * Standar zona waktu untuk memastikan konsistensi kalender antara:
 * - Server cloud (Vercel/Node.js yang berjalan di UTC)
 * - Database PostgreSQL (timestamptz)
 * - Browser/Client di perangkat seluler
 */

export const WIB_TIMEZONE = 'Asia/Jakarta';

export const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Mengambil bagian tanggal (YYYY, MM, DD, dayOfWeek, hour, minute) dalam zona waktu WIB
 */
export function getWibParts(date: Date | string | number = new Date()): {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  dayOfWeek: number; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
} {
  const d = typeof date === 'object' ? date : new Date(date);
  
  // Format parts menggunakan Intl dalam zona Asia/Jakarta
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: WIB_TIMEZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  let year = 1970;
  let month = 1;
  let day = 1;
  let hour = 0;
  let minute = 0;
  let second = 0;
  let weekdayStr = 'Sun';

  for (const part of parts) {
    if (part.type === 'year') year = parseInt(part.value, 10);
    else if (part.type === 'month') month = parseInt(part.value, 10);
    else if (part.type === 'day') day = parseInt(part.value, 10);
    else if (part.type === 'hour') hour = parseInt(part.value, 10) % 24;
    else if (part.type === 'minute') minute = parseInt(part.value, 10);
    else if (part.type === 'second') second = parseInt(part.value, 10);
    else if (part.type === 'weekday') weekdayStr = part.value;
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const dayOfWeek = weekdayMap[weekdayStr] ?? 0;

  return { year, month, day, dayOfWeek, hour, minute, second };
}

/**
 * Menghasilkan string tanggal YYYY-MM-DD dalam WIB (contoh: "2026-10-01")
 */
export function getWibDateString(date: Date | string | number = new Date()): string {
  const { year, month, day } = getWibParts(date);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * Menghasilkan string format input datetime-local dalam WIB (contoh: "2026-10-01T17:45")
 */
export function getWibDateTimeLocalString(date: Date | string | number = new Date()): string {
  const { year, month, day, hour, minute } = getWibParts(date);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  const min = String(minute).padStart(2, '0');
  return `${year}-${mm}-${dd}T${hh}:${min}`;
}

/**
 * Menghasilkan indeks hari dalam WIB (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
 */
export function getWibDayIndex(date: Date | string | number = new Date()): number {
  return getWibParts(date).dayOfWeek;
}

/**
 * Menghasilkan nama hari bahasa Indonesia dalam WIB (contoh: "Kamis")
 */
export function getWibDayName(date: Date | string | number = new Date()): string {
  return INDONESIAN_DAYS[getWibDayIndex(date)];
}

/**
 * Format tanggal ramah pengguna dalam WIB (contoh: "Kamis, 1 Oktober 2026")
 */
export function formatWibDateIndonesian(date: Date | string | number = new Date()): string {
  const { year, month, day, dayOfWeek } = getWibParts(date);
  const dayName = INDONESIAN_DAYS[dayOfWeek];
  const monthName = INDONESIAN_MONTHS[month - 1];
  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Format tanggal & jam dalam WIB (contoh: "1 Okt 2026, 06:30 WIB")
 */
export function formatWibDateTime(date: Date | string | number): string {
  const d = typeof date === 'object' ? date : new Date(date);
  const formatted = d.toLocaleDateString('id-ID', {
    timeZone: WIB_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${formatted} WIB`;
}

/**
 * Menghitung batas startOfDay dan endOfDay yang akurat secara UTC untuk rentang 00:00:00 - 23:59:59.999 WIB.
 * 
 * Karena WIB adalah UTC+7:
 * - 00:00:00 WIB = 17:00:00 UTC hari sebelumnya
 * - 23:59:59.999 WIB = 16:59:59.999 UTC hari yang bersangkutan
 */
export function getWibStartAndEndOfDay(targetDateOrString: Date | string = new Date()): {
  startOfDay: Date;
  endOfDay: Date;
  dateStr: string;
} {
  const dateStr =
    typeof targetDateOrString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(targetDateOrString)
      ? targetDateOrString
      : getWibDateString(targetDateOrString);

  const [yStr, mStr, dStr] = dateStr.split('-');
  const year = parseInt(yStr, 10);
  const month = parseInt(mStr, 10) - 1; // 0-indexed for Date.UTC
  const day = parseInt(dStr, 10);

  // 00:00:00 WIB = 17:00:00 UTC di hari sebelumnya
  const startOfDay = new Date(Date.UTC(year, month, day - 1, 17, 0, 0, 0));

  // 23:59:59.999 WIB = 16:59:59.999 UTC di hari target
  const endOfDay = new Date(Date.UTC(year, month, day, 16, 59, 59, 999));

  return { startOfDay, endOfDay, dateStr };
}

/**
 * Memeriksa apakah timestamp aktivitas berada di tanggal kalender WIB yang sama
 */
export function isSameWibDate(dateA: Date | string | number, dateB: Date | string | number): boolean {
  return getWibDateString(dateA) === getWibDateString(dateB);
}
