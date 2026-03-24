import { computed } from 'vue';
import { useStorage } from '@vueuse/core';

const TEAM_SOG_LINE_STORAGE_KEY = 'nhl-team-sog-line';
const TEAM_SOG_LINE_DEFAULT = 29.5;
const TEAM_SOG_LINE_MIN = 15.5;
const TEAM_SOG_LINE_MAX = 45.5;
const TEAM_SOG_LINE_STEP = 0.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundToHalf(value: number): number {
  return Math.round(value / TEAM_SOG_LINE_STEP) * TEAM_SOG_LINE_STEP;
}

function normalizeTeamSogLine(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return TEAM_SOG_LINE_DEFAULT;
  return clamp(roundToHalf(parsed), TEAM_SOG_LINE_MIN, TEAM_SOG_LINE_MAX);
}

export function useBettingLines() {
  const storedTeamSogLine = useStorage<number>(
    TEAM_SOG_LINE_STORAGE_KEY,
    TEAM_SOG_LINE_DEFAULT
  );

  const teamSogLine = computed<number>({
    get: () => normalizeTeamSogLine(storedTeamSogLine.value),
    set: (value) => {
      storedTeamSogLine.value = normalizeTeamSogLine(value);
    },
  });

  const teamSogLineLabel = computed(() => teamSogLine.value.toFixed(1));

  return {
    teamSogLine,
    teamSogLineLabel,
  };
}
