import type {
  GameCenterBoxscoreResponse,
  GameCenterGoalieStatLine,
  GameCenterSkaterStatLine,
  GameTeamSide,
  TeamAggregatedStats,
  TeamComparisonRow,
  TeamComparisonStatKey,
} from '@/app/games/types/gameCenter';

const TEAM_STAT_KEYS: TeamComparisonStatKey[] = [
  'goals',
  'sog',
  'hits',
  'blockedShots',
  'pim',
  'giveaways',
  'takeaways',
  'powerPlayGoals',
];

const TEAM_STAT_LABELS: Record<TeamComparisonStatKey, string> = {
  goals: 'Goals',
  sog: 'SOG',
  hits: 'Hits',
  blockedShots: 'Blocks',
  pim: 'PIM',
  giveaways: 'Giveaways',
  takeaways: 'Takeaways',
  powerPlayGoals: 'PP Goals',
};

function toSafeNumber(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function sumSkaterStat(
  lines: GameCenterSkaterStatLine[] | undefined,
  key: keyof GameCenterSkaterStatLine
): number {
  return (lines ?? []).reduce((total, line) => total + toSafeNumber(line[key]), 0);
}

function sumGoalieStat(
  lines: GameCenterGoalieStatLine[] | undefined,
  key: keyof GameCenterGoalieStatLine
): number {
  return (lines ?? []).reduce((total, line) => total + toSafeNumber(line[key]), 0);
}

export function getTeamStats(
  boxscore: GameCenterBoxscoreResponse,
  side: GameTeamSide
): TeamAggregatedStats {
  const team = boxscore[side];
  const playerStats = boxscore.playerByGameStats?.[side];
  const skaters = [...(playerStats?.forwards ?? []), ...(playerStats?.defense ?? [])];

  return {
    goals: toSafeNumber(team.score),
    sog: toSafeNumber(team.sog),
    hits: sumSkaterStat(skaters, 'hits'),
    blockedShots: sumSkaterStat(skaters, 'blockedShots'),
    pim: sumSkaterStat(skaters, 'pim') + sumGoalieStat(playerStats?.goalies, 'pim'),
    giveaways: sumSkaterStat(skaters, 'giveaways'),
    takeaways: sumSkaterStat(skaters, 'takeaways'),
    powerPlayGoals: sumSkaterStat(skaters, 'powerPlayGoals'),
  };
}

function toPercent(value: number, total: number): number {
  if (total <= 0) return 50;
  return Math.round((value / total) * 100);
}

export function getTeamComparisonRows(boxscore: GameCenterBoxscoreResponse): TeamComparisonRow[] {
  const awayStats = getTeamStats(boxscore, 'awayTeam');
  const homeStats = getTeamStats(boxscore, 'homeTeam');

  return TEAM_STAT_KEYS.map((key) => {
    const away = awayStats[key];
    const home = homeStats[key];
    const total = away + home;

    return {
      key,
      label: TEAM_STAT_LABELS[key],
      away,
      home,
      awayPercent: toPercent(away, total),
      homePercent: toPercent(home, total),
    };
  });
}

export function getGameStatusLabel(boxscore: GameCenterBoxscoreResponse): string {
  const state = (boxscore.gameState ?? '').toUpperCase();

  if (state === 'OFF' || state === 'FINAL') {
    const periodType = (boxscore.periodDescriptor?.periodType ?? '').toUpperCase();
    if (periodType === 'SO') return 'Final (SO)';
    if (periodType === 'OT') return 'Final (OT)';
    return 'Final';
  }

  if (state === 'LIVE' || state === 'CRIT') return 'Live';
  if (state === 'PRE' || state === 'FUT') return 'Upcoming';
  return state || 'Unknown';
}

export function hasDetailedStats(boxscore: GameCenterBoxscoreResponse): boolean {
  const awayStats = boxscore.playerByGameStats?.awayTeam;
  const homeStats = boxscore.playerByGameStats?.homeTeam;

  const awayCount =
    (awayStats?.forwards?.length ?? 0) +
    (awayStats?.defense?.length ?? 0) +
    (awayStats?.goalies?.length ?? 0);
  const homeCount =
    (homeStats?.forwards?.length ?? 0) +
    (homeStats?.defense?.length ?? 0) +
    (homeStats?.goalies?.length ?? 0);

  return awayCount > 0 || homeCount > 0;
}
