import type { TeamScheduleGame } from '@/app/teams/presenters/teams.presenter';
import type { GameCenterBoxscoreResponse, GameCenterSkaterStatLine } from '@/app/games/types/gameCenter';
import type {
  PlayerInsightLine,
  TeamAngleInsightGroup,
  TeamPlayerInsightGroup,
} from '@/app/games/types/gamePlayerInsights';

type InsightMode = 'h2h' | 'recent';

const COMPLETED_GAME_STATES = new Set(['OFF', 'FINAL', 'FINAL_OT', 'FINAL_SO']);

const H2H_IMPACT_WEIGHTS = {
  pointsPerGame: 2.7,
  goalsPerGame: 1.1,
  sogPerGame: 0.9,
};

const RECENT_IMPACT_WEIGHTS = {
  pointsPerGame: 2.2,
  goalsPerGame: 0.8,
  sogPerGame: 1.0,
};

const SOG_LINE_VALUE = 30; // over 29.5
const GOALS_LINE_VALUE = 3; // over 2.5

function toSafeNumber(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function isCompletedGame(game: TeamScheduleGame): boolean {
  return COMPLETED_GAME_STATES.has((game.gameState ?? '').toUpperCase());
}

function sortByMostRecent(a: TeamScheduleGame, b: TeamScheduleGame): number {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function getOpponentAbbrev(game: TeamScheduleGame): string {
  return game.isHome ? game.awayTeam.abbrev : game.homeTeam.abbrev;
}

function getTeamSide(
  boxscore: GameCenterBoxscoreResponse,
  teamAbbrev: string
): 'homeTeam' | 'awayTeam' | null {
  if (boxscore.homeTeam.abbrev === teamAbbrev) return 'homeTeam';
  if (boxscore.awayTeam.abbrev === teamAbbrev) return 'awayTeam';
  return null;
}

function getSkaterLinesForTeam(
  boxscore: GameCenterBoxscoreResponse,
  teamAbbrev: string
): GameCenterSkaterStatLine[] {
  const side = getTeamSide(boxscore, teamAbbrev);
  if (!side) return [];

  const teamStats = boxscore.playerByGameStats?.[side];
  return [...(teamStats?.forwards ?? []), ...(teamStats?.defense ?? [])];
}

function getPlayerDisplayName(line: GameCenterSkaterStatLine): string {
  const defaultName = line.name?.default?.trim();
  if (defaultName) return defaultName;

  if (line.sweaterNumber) return `#${line.sweaterNumber}`;
  if (line.playerId) return `Player ${line.playerId}`;
  return 'Unknown player';
}

function getImpactScore(player: Omit<PlayerInsightLine, 'impactScore'>, mode: InsightMode): number {
  const weights = mode === 'h2h' ? H2H_IMPACT_WEIGHTS : RECENT_IMPACT_WEIGHTS;

  return roundToOne(
    player.pointsPerGame * weights.pointsPerGame +
      player.goalsPerGame * weights.goalsPerGame +
      player.sogPerGame * weights.sogPerGame
  );
}

export function getRecentCompletedGameIds(
  scheduleGames: TeamScheduleGame[],
  limit: number
): number[] {
  return scheduleGames
    .filter((game) => isCompletedGame(game))
    .sort(sortByMostRecent)
    .slice(0, limit)
    .map((game) => game.id);
}

export function getHeadToHeadGameIds(
  scheduleGames: TeamScheduleGame[],
  opponentTeamAbbrev: string,
  limit: number
): number[] {
  return scheduleGames
    .filter((game) => isCompletedGame(game))
    .filter((game) => getOpponentAbbrev(game) === opponentTeamAbbrev)
    .sort(sortByMostRecent)
    .slice(0, limit)
    .map((game) => game.id);
}

export function buildTeamPlayerInsightGroup(
  teamAbbrev: string,
  gameIds: number[],
  boxscoresByGameId: Map<number, GameCenterBoxscoreResponse>,
  mode: InsightMode,
  maxPlayers = 4
): TeamPlayerInsightGroup {
  const playersByKey = new Map<
    string,
    {
      key: string;
      playerId?: number;
      name: string;
      games: number;
      goals: number;
      assists: number;
      points: number;
      sog: number;
      sogOver25Count: number;
      pointsOver05Count: number;
      goalsOver05Count: number;
    }
  >();

  let sampleGames = 0;

  for (const gameId of gameIds) {
    const boxscore = boxscoresByGameId.get(gameId);
    if (!boxscore) continue;

    const skaterLines = getSkaterLinesForTeam(boxscore, teamAbbrev);
    if (skaterLines.length === 0) continue;

    sampleGames += 1;

    for (const line of skaterLines) {
      const playerName = getPlayerDisplayName(line);
      const key = line.playerId ? `id-${line.playerId}` : `name-${playerName}`;
      const existing = playersByKey.get(key);
      const goals = toSafeNumber(line.goals);
      const points = toSafeNumber(line.points);
      const sog = toSafeNumber(line.sog);
      const isSogOver25 = sog >= 3 ? 1 : 0;
      const isPointsOver05 = points >= 1 ? 1 : 0;
      const isGoalsOver05 = goals >= 1 ? 1 : 0;

      if (!existing) {
        playersByKey.set(key, {
          key,
          playerId: line.playerId,
          name: playerName,
          games: 1,
          goals,
          assists: toSafeNumber(line.assists),
          points,
          sog,
          sogOver25Count: isSogOver25,
          pointsOver05Count: isPointsOver05,
          goalsOver05Count: isGoalsOver05,
        });
        continue;
      }

      existing.games += 1;
      existing.goals += goals;
      existing.assists += toSafeNumber(line.assists);
      existing.points += points;
      existing.sog += sog;
      existing.sogOver25Count += isSogOver25;
      existing.pointsOver05Count += isPointsOver05;
      existing.goalsOver05Count += isGoalsOver05;
    }
  }

  const players = Array.from(playersByKey.values())
    .map((player) => {
      const goalsPerGame = roundToOne(player.goals / player.games);
      const pointsPerGame = roundToOne(player.points / player.games);
      const sogPerGame = roundToOne(player.sog / player.games);
      const sogOver25Rate = roundToOne((player.sogOver25Count / player.games) * 100);
      const pointsOver05Rate = roundToOne((player.pointsOver05Count / player.games) * 100);
      const goalsOver05Rate = roundToOne((player.goalsOver05Count / player.games) * 100);

      const basePlayer = {
        ...player,
        goalsPerGame,
        pointsPerGame,
        sogPerGame,
        sogOver25Rate,
        pointsOver05Rate,
        goalsOver05Rate,
      };

      return {
        ...basePlayer,
        impactScore: getImpactScore(basePlayer, mode),
      };
    })
    .sort((a, b) => {
      if (b.impactScore !== a.impactScore) return b.impactScore - a.impactScore;
      if (b.pointsPerGame !== a.pointsPerGame) return b.pointsPerGame - a.pointsPerGame;
      if (b.sogPerGame !== a.sogPerGame) return b.sogPerGame - a.sogPerGame;
      return b.points - a.points;
    })
    .slice(0, maxPlayers);

  return {
    sampleGames,
    players,
  };
}

function getOpponentSide(side: 'homeTeam' | 'awayTeam'): 'homeTeam' | 'awayTeam' {
  return side === 'homeTeam' ? 'awayTeam' : 'homeTeam';
}

function getTeamFlags(group: TeamAngleInsightGroup): string[] {
  if (group.sampleGames === 0) return [];

  const flags: string[] = [];

  if (group.sogForPerGame >= 32 && group.sogForOver295Rate >= 67) {
    flags.push('High shot volume');
  }

  if (group.sogAgainstPerGame >= 33 && group.sogAgainstOver295Rate >= 67) {
    flags.push('Allows many shots');
  }

  if (group.goalsForPerGame >= 3.4 && group.goalsForOver25Rate >= 67) {
    flags.push('Consistent scoring');
  }

  if (group.goalsAgainstPerGame >= 3.4 && group.goalsAgainstOver25Rate >= 67) {
    flags.push('Defensive leak');
  }

  return flags.slice(0, 2);
}

export function buildTeamAngleInsightGroup(
  teamAbbrev: string,
  gameIds: number[],
  boxscoresByGameId: Map<number, GameCenterBoxscoreResponse>
): TeamAngleInsightGroup {
  let sampleGames = 0;
  let sogFor = 0;
  let sogAgainst = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let sogForOver295Count = 0;
  let sogAgainstOver295Count = 0;
  let goalsForOver25Count = 0;
  let goalsAgainstOver25Count = 0;

  for (const gameId of gameIds) {
    const boxscore = boxscoresByGameId.get(gameId);
    if (!boxscore) continue;

    const teamSide = getTeamSide(boxscore, teamAbbrev);
    if (!teamSide) continue;

    const opponentSide = getOpponentSide(teamSide);
    const currentSogFor = toSafeNumber(boxscore[teamSide].sog);
    const currentSogAgainst = toSafeNumber(boxscore[opponentSide].sog);
    const currentGoalsFor = toSafeNumber(boxscore[teamSide].score);
    const currentGoalsAgainst = toSafeNumber(boxscore[opponentSide].score);

    sampleGames += 1;
    sogFor += currentSogFor;
    sogAgainst += currentSogAgainst;
    goalsFor += currentGoalsFor;
    goalsAgainst += currentGoalsAgainst;
    if (currentSogFor >= SOG_LINE_VALUE) sogForOver295Count += 1;
    if (currentSogAgainst >= SOG_LINE_VALUE) sogAgainstOver295Count += 1;
    if (currentGoalsFor >= GOALS_LINE_VALUE) goalsForOver25Count += 1;
    if (currentGoalsAgainst >= GOALS_LINE_VALUE) goalsAgainstOver25Count += 1;
  }

  const safeGames = Math.max(sampleGames, 1);
  const group: TeamAngleInsightGroup = {
    sampleGames,
    sogFor,
    sogAgainst,
    goalsFor,
    goalsAgainst,
    sogForPerGame: roundToOne(sogFor / safeGames),
    sogAgainstPerGame: roundToOne(sogAgainst / safeGames),
    goalsForPerGame: roundToOne(goalsFor / safeGames),
    goalsAgainstPerGame: roundToOne(goalsAgainst / safeGames),
    sogForOver295Count,
    sogAgainstOver295Count,
    goalsForOver25Count,
    goalsAgainstOver25Count,
    sogForOver295Rate: sampleGames ? roundToOne((sogForOver295Count / sampleGames) * 100) : 0,
    sogAgainstOver295Rate: sampleGames ? roundToOne((sogAgainstOver295Count / sampleGames) * 100) : 0,
    goalsForOver25Rate: sampleGames ? roundToOne((goalsForOver25Count / sampleGames) * 100) : 0,
    goalsAgainstOver25Rate: sampleGames ? roundToOne((goalsAgainstOver25Count / sampleGames) * 100) : 0,
    flags: [],
  };

  group.flags = getTeamFlags(group);
  return group;
}
