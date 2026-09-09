/**
 * Format score as fixed 6 digits with comma, e.g. 012,450
 */
export function formatScore(score: number): string {
  const clamped = Math.max(0, Math.floor(score));
  const str = clamped.toString().padStart(6, '0');
  if (str.length > 3) {
    const left = str.slice(0, str.length - 3);
    const right = str.slice(str.length - 3);
    return `${left},${right}`;
  }
  return str;
}

/**
 * Format sector and wave, e.g. SECTOR 3-2
 */
export function formatSector(sector: number, wave: number): string {
  return `SECTOR ${sector}-${wave}`;
}
