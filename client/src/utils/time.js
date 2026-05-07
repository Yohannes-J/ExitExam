/**
 * Format duration in minutes to human-readable string
 * 30 → "30 min"
 * 90 → "1h 30m"
 * 180 → "3h"
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};
