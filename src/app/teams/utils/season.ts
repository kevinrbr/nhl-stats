export function getNhlSeasonIdFromDate(dateInput: string | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const startYear = month >= 7 ? year : year - 1;

  return `${startYear}${startYear + 1}`;
}

export function getPreviousNhlSeasonId(seasonId: string): string {
  if (!/^\d{8}$/.test(seasonId)) return '';

  const startYear = Number(seasonId.slice(0, 4));
  if (!Number.isFinite(startYear)) return '';

  const previousStartYear = startYear - 1;
  return `${previousStartYear}${previousStartYear + 1}`;
}
