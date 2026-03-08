import type { RouteLocationNamedRaw } from 'vue-router';

export const DEFAULT_TEAM_ABBREV = 'COL';

const TEAM_ABBREV_PATTERN = /^[A-Z]{2,4}$/;

export function normalizeTeamAbbrev(value: unknown, fallback = DEFAULT_TEAM_ABBREV): string {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (typeof rawValue !== 'string') return fallback;

  const normalized = rawValue.trim().toUpperCase();
  if (!normalized) return fallback;

  return TEAM_ABBREV_PATTERN.test(normalized) ? normalized : fallback;
}

export function getTeamsRoute(teamAbbrev: string): RouteLocationNamedRaw {
  return {
    name: 'teams',
    query: {
      team: normalizeTeamAbbrev(teamAbbrev),
    },
  };
}
