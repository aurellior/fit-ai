import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}j ${minutes}m`;
  }
  return `${minutes}m ${secs > 0 ? `${secs}s` : ''}`.trim();
}

export function formatDistance(meters?: number | null): string {
  if (!meters) return '0 km';
  const km = meters / 1000;
  return `${km.toFixed(2)} km`;
}

export function formatPace(secPerKm?: number | null): string {
  if (!secPerKm || secPerKm <= 0) return '-';
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.floor(secPerKm % 60);
  return `${minutes}'${seconds < 10 ? '0' : ''}${seconds}"/km`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
