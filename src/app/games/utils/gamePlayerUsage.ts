import type {
  GameCenterBoxscoreResponse,
  GameCenterSkaterStatLine,
  GameTeamSide,
} from '@/app/games/types/gameCenter';
import type {
  GamePlayerUsageItem,
  GameTeamUsageSnapshot,
} from '@/app/games/types/gamePlayerUsage';

function toSafeNumber(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toNullableNumber(value: unknown): number | null {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseToiMinutes(toi: string | undefined): number {
  if (!toi) return 0;

  const [minutesPart, secondsPart] = toi.split(':');
  const minutes = Number(minutesPart);
  const seconds = Number(secondsPart ?? 0);

  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;
  return minutes + seconds / 60;
}

function getPlayerDisplayName(line: GameCenterSkaterStatLine): string {
  const defaultName = line.name?.default?.trim();
  if (defaultName) return defaultName;
  if (line.sweaterNumber) return `#${line.sweaterNumber}`;
  if (line.playerId) return `Player ${line.playerId}`;
  return 'Unknown player';
}

function getSkaterExpectedGoals(line: GameCenterSkaterStatLine): number | null {
  const dynamicLine = line as GameCenterSkaterStatLine & {
    xGoals?: number | string;
    expectedGoals?: number | string;
    ixG?: number | string;
    xg?: number | string;
  };

  return (
    toNullableNumber(dynamicLine.xGoals) ??
    toNullableNumber(dynamicLine.expectedGoals) ??
    toNullableNumber(dynamicLine.ixG) ??
    toNullableNumber(dynamicLine.xg)
  );
}

function getTeamSkaters(
  boxscore: GameCenterBoxscoreResponse,
  side: GameTeamSide
): GamePlayerUsageItem[] {
  const teamStats = boxscore.playerByGameStats?.[side];
  const lines = [...(teamStats?.forwards ?? []), ...(teamStats?.defense ?? [])];

  return lines
    .map((line) => {
      const toi = line.toi ?? '00:00';

      return {
        playerId: line.playerId ?? null,
        sweaterNumber: line.sweaterNumber ?? null,
        name: getPlayerDisplayName(line),
        position: line.position ?? '-',
        toi,
        toiMinutes: parseToiMinutes(toi),
        sog: toSafeNumber(line.sog),
        points: toSafeNumber(line.points),
        goals: toSafeNumber(line.goals),
        xg: getSkaterExpectedGoals(line),
      };
    })
    .sort((a, b) => b.toiMinutes - a.toiMinutes);
}

function getTeamName(boxscore: GameCenterBoxscoreResponse, side: GameTeamSide): string {
  const team = boxscore[side];
  return team.commonName?.default?.trim() || team.abbrev;
}

export function buildTeamUsageSnapshot(
  boxscore: GameCenterBoxscoreResponse,
  side: GameTeamSide
): GameTeamUsageSnapshot {
  const players = getTeamSkaters(boxscore, side);

  return {
    side,
    teamAbbrev: boxscore[side].abbrev,
    teamName: getTeamName(boxscore, side),
    teamLogo: boxscore[side].logo ?? '',
    players,
  };
}
