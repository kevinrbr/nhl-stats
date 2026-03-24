import type { TeamScheduleGame } from '@/app/teams/presenters/teams.presenter';
import type { GameCenterBoxscoreResponse, GameCenterSkaterStatLine } from '@/app/games/types/gameCenter';
import type {
  MatchupTopPick,
  MatchupStyleEdge,
  SimilarMatchLine,
  PlayerInsightLine,
  TeamAngleInsightGroup,
  TeamPlayerInsightGroup,
  TeamStyleProfile,
  TeamStyleScore,
  TeamStyleSimilarGames,
} from '@/app/games/types/gamePlayerInsights';
import { getTeamStats } from '@/app/games/utils/gameBoxscore';

type InsightMode = 'h2h' | 'recent';

type TeamAngleInsightOptions = {
  sogLine?: number;
};

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

const DEFAULT_TEAM_SOG_LINE = 29.5;
const TEAM_SOG_LINE_MIN = 15.5;
const TEAM_SOG_LINE_MAX = 45.5;
const TEAM_SOG_LINE_STEP = 0.5;
const GOALS_LINE_VALUE = 3; // over 2.5
const TOP_PICK_MIN_SAMPLE = 5;
const TOP_PICK_FLOOR_SCORE = 80;

const STYLE_SCORE_RANGES = {
  pace: { min: 24, max: 38 },
  defensiveLoad: { min: 24, max: 38 },
  physicality: { min: 9, max: 28 },
  chaos: { min: 8, max: 25 },
  discipline: { min: 3, max: 15 },
} as const;

const STYLE_VECTOR_DIMENSIONS = 5;

function toSafeNumber(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function roundToOne(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundToInteger(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeTeamSogLine(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_TEAM_SOG_LINE;

  const clamped = clamp(parsed, TEAM_SOG_LINE_MIN, TEAM_SOG_LINE_MAX);
  return Math.round(clamped / TEAM_SOG_LINE_STEP) * TEAM_SOG_LINE_STEP;
}

function toPercentScale(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return roundToInteger(clamp(((value - min) / (max - min)) * 100, 0, 100));
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

function buildStyleMetrics(
  teamSog: number,
  opponentSog: number,
  hits: number,
  giveaways: number,
  takeaways: number,
  pim: number
): Omit<TeamStyleProfile, 'sampleGames' | 'tags'> {
  const pace = roundToOne((teamSog + opponentSog) / 2);
  const defensiveLoad = roundToOne(opponentSog);
  const physicality = roundToOne(hits);
  const chaos = roundToOne(giveaways + takeaways);
  const discipline = roundToOne(pim);

  return {
    pace,
    defensiveLoad,
    physicality,
    chaos,
    discipline,
    score: buildStyleScore(pace, defensiveLoad, physicality, chaos, discipline),
  };
}

function buildStyleScore(
  pace: number,
  defensiveLoad: number,
  physicality: number,
  chaos: number,
  discipline: number
): TeamStyleScore {
  const score: TeamStyleScore = {
    pace: toPercentScale(pace, STYLE_SCORE_RANGES.pace.min, STYLE_SCORE_RANGES.pace.max),
    defensiveLoad: toPercentScale(
      defensiveLoad,
      STYLE_SCORE_RANGES.defensiveLoad.min,
      STYLE_SCORE_RANGES.defensiveLoad.max
    ),
    physicality: toPercentScale(
      physicality,
      STYLE_SCORE_RANGES.physicality.min,
      STYLE_SCORE_RANGES.physicality.max
    ),
    chaos: toPercentScale(chaos, STYLE_SCORE_RANGES.chaos.min, STYLE_SCORE_RANGES.chaos.max),
    discipline: toPercentScale(
      discipline,
      STYLE_SCORE_RANGES.discipline.min,
      STYLE_SCORE_RANGES.discipline.max
    ),
  };

  return score;
}

function getTeamStyleMetricsForGame(
  boxscore: GameCenterBoxscoreResponse,
  teamAbbrev: string
): Omit<TeamStyleProfile, 'sampleGames' | 'tags'> | null {
  const teamSide = getTeamSide(boxscore, teamAbbrev);
  if (!teamSide) return null;

  const opponentSide = getOpponentSide(teamSide);
  const teamStats = getTeamStats(boxscore, teamSide);
  const opponentStats = getTeamStats(boxscore, opponentSide);

  return buildStyleMetrics(
    teamStats.sog,
    opponentStats.sog,
    teamStats.hits,
    teamStats.giveaways,
    teamStats.takeaways,
    teamStats.pim
  );
}

function getStyleTags(profile: TeamStyleProfile): string[] {
  const tags: string[] = [];

  if (profile.score.pace >= 65) tags.push('High pace');
  else if (profile.score.pace <= 35) tags.push('Low event');

  if (profile.score.defensiveLoad >= 65) tags.push('Def pressure');
  else if (profile.score.defensiveLoad <= 35) tags.push('Shot suppression');

  if (profile.score.physicality >= 65) tags.push('Physical');
  if (profile.score.chaos >= 65) tags.push('High chaos');
  if (profile.score.discipline >= 65) tags.push('Penalty prone');
  if (profile.score.discipline <= 35) tags.push('Disciplined');

  return tags.slice(0, 3);
}

function getStyleSimilarity(a: TeamStyleScore, b: TeamStyleScore): number {
  const sumSquareDiff =
    (a.pace - b.pace) ** 2 +
    (a.defensiveLoad - b.defensiveLoad) ** 2 +
    (a.physicality - b.physicality) ** 2 +
    (a.chaos - b.chaos) ** 2 +
    (a.discipline - b.discipline) ** 2;

  const distance = Math.sqrt(sumSquareDiff);
  const maxDistance = Math.sqrt(STYLE_VECTOR_DIMENSIONS * 100 ** 2);

  return roundToOne(clamp(100 - (distance / maxDistance) * 100, 0, 100));
}

function getMatchupStyleTags(homeStyleProfile: TeamStyleProfile, awayStyleProfile: TeamStyleProfile): string[] {
  const tags: string[] = [];

  const paceGap = Math.abs(homeStyleProfile.score.pace - awayStyleProfile.score.pace);
  const defensiveGap = Math.abs(
    homeStyleProfile.score.defensiveLoad - awayStyleProfile.score.defensiveLoad
  );
  const physicalGap = Math.abs(homeStyleProfile.score.physicality - awayStyleProfile.score.physicality);
  const chaosGap = Math.abs(homeStyleProfile.score.chaos - awayStyleProfile.score.chaos);
  const disciplineGap = Math.abs(homeStyleProfile.score.discipline - awayStyleProfile.score.discipline);
  const styleSimilarity = getStyleSimilarity(homeStyleProfile.score, awayStyleProfile.score);

  if (styleSimilarity >= 75) tags.push('Mirror styles');
  if (styleSimilarity <= 58) tags.push('Style clash');
  if (paceGap >= 15) tags.push('Tempo gap');
  if (defensiveGap >= 15) tags.push('Defense gap');
  if (physicalGap >= 15) tags.push('Physical gap');
  if (chaosGap >= 15) tags.push('Chaos gap');
  if (disciplineGap >= 15) tags.push('Discipline gap');

  return tags.slice(0, 4);
}

type EdgeContext = {
  homePoints: number;
  awayPoints: number;
  homeReasons: string[];
  awayReasons: string[];
};

function evaluateStyleEdge(
  homeStyleProfile: TeamStyleProfile,
  awayStyleProfile: TeamStyleProfile
): EdgeContext {
  const context: EdgeContext = {
    homePoints: 0,
    awayPoints: 0,
    homeReasons: [],
    awayReasons: [],
  };

  const homeDiscAdv = awayStyleProfile.score.discipline - homeStyleProfile.score.discipline;
  if (homeDiscAdv >= 14) {
    context.homePoints += 2;
    context.homeReasons.push('better discipline, fewer penalty-risk sequences');
  }
  if (homeDiscAdv <= -14) {
    context.awayPoints += 2;
    context.awayReasons.push('better discipline, fewer penalty-risk sequences');
  }

  const homePaceVsOppDefense = homeStyleProfile.score.pace - awayStyleProfile.score.defensiveLoad;
  if (homePaceVsOppDefense >= 12) {
    context.homePoints += 1;
    context.homeReasons.push('tempo profile can stress opponent defensive load');
  }
  if (homePaceVsOppDefense <= -12) {
    context.awayPoints += 1;
    context.awayReasons.push('tempo profile can stress opponent defensive load');
  }

  const homeSuppressionVsOppPace = awayStyleProfile.score.pace - homeStyleProfile.score.defensiveLoad;
  if (homeSuppressionVsOppPace <= -12) {
    context.homePoints += 1;
    context.homeReasons.push('shot suppression profile can reduce opponent volume');
  }
  if (homeSuppressionVsOppPace >= 12) {
    context.awayPoints += 1;
    context.awayReasons.push('shot suppression profile can reduce opponent volume');
  }

  const homePhysicalAdv = homeStyleProfile.score.physicality - awayStyleProfile.score.physicality;
  if (homePhysicalAdv >= 14) {
    context.homePoints += 1;
    context.homeReasons.push('physical edge in board and net-front battles');
  }
  if (homePhysicalAdv <= -14) {
    context.awayPoints += 1;
    context.awayReasons.push('physical edge in board and net-front battles');
  }

  const homeChaosControlAdv =
    (awayStyleProfile.score.chaos - homeStyleProfile.score.chaos) +
    (awayStyleProfile.score.discipline - homeStyleProfile.score.discipline);
  if (homeChaosControlAdv >= 20) {
    context.homePoints += 1;
    context.homeReasons.push('cleaner profile versus higher-variance opponent');
  }
  if (homeChaosControlAdv <= -20) {
    context.awayPoints += 1;
    context.awayReasons.push('cleaner profile versus higher-variance opponent');
  }

  return context;
}

function buildMatchupStyleEdge(
  homeStyleProfile: TeamStyleProfile,
  awayStyleProfile: TeamStyleProfile,
  homeTeamAbbrev: string,
  awayTeamAbbrev: string
): MatchupStyleEdge {
  const styleSimilarity = getStyleSimilarity(homeStyleProfile.score, awayStyleProfile.score);
  const { homePoints, awayPoints, homeReasons, awayReasons } = evaluateStyleEdge(
    homeStyleProfile,
    awayStyleProfile
  );

  const pointGap = Math.abs(homePoints - awayPoints);
  const confidence = roundToInteger(clamp(52 + pointGap * 11 + (100 - styleSimilarity) * 0.18, 52, 86));

  if (homePoints === awayPoints) {
    return {
      side: 'even',
      confidence: roundToInteger(clamp(50 + (styleSimilarity - 50) * 0.25, 48, 68)),
      summary: 'No clear stylistic edge',
      reasons: [
        'both teams project similar style pressure across key dimensions',
        'edge likely shifts to execution and special teams on game day',
      ],
    };
  }

  if (homePoints > awayPoints) {
    return {
      side: 'home',
      confidence,
      summary: `${homeTeamAbbrev} theoretical style edge`,
      reasons: homeReasons.slice(0, 3),
    };
  }

  return {
    side: 'away',
    confidence,
    summary: `${awayTeamAbbrev} theoretical style edge`,
    reasons: awayReasons.slice(0, 3),
  };
}

function getTeamFlags(group: TeamAngleInsightGroup): string[] {
  if (group.sampleGames === 0) return [];

  const flags: string[] = [];

  if (group.sogForPerGame >= 32 && group.sogForOverLineRate >= 67) {
    flags.push('High shot volume');
  }

  if (group.sogAgainstPerGame >= 33 && group.sogAgainstOverLineRate >= 67) {
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
  boxscoresByGameId: Map<number, GameCenterBoxscoreResponse>,
  options: TeamAngleInsightOptions = {}
): TeamAngleInsightGroup {
  const sogLine = normalizeTeamSogLine(options.sogLine);
  let sampleGames = 0;
  let sogFor = 0;
  let sogAgainst = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let sogForOverLineCount = 0;
  let sogAgainstOverLineCount = 0;
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
    if (currentSogFor > sogLine) sogForOverLineCount += 1;
    if (currentSogAgainst > sogLine) sogAgainstOverLineCount += 1;
    if (currentGoalsFor >= GOALS_LINE_VALUE) goalsForOver25Count += 1;
    if (currentGoalsAgainst >= GOALS_LINE_VALUE) goalsAgainstOver25Count += 1;
  }

  const safeGames = Math.max(sampleGames, 1);
  const group: TeamAngleInsightGroup = {
    sampleGames,
    sogLine,
    sogFor,
    sogAgainst,
    goalsFor,
    goalsAgainst,
    sogForPerGame: roundToOne(sogFor / safeGames),
    sogAgainstPerGame: roundToOne(sogAgainst / safeGames),
    goalsForPerGame: roundToOne(goalsFor / safeGames),
    goalsAgainstPerGame: roundToOne(goalsAgainst / safeGames),
    sogForOverLineCount,
    sogAgainstOverLineCount,
    goalsForOver25Count,
    goalsAgainstOver25Count,
    sogForOverLineRate: sampleGames ? roundToOne((sogForOverLineCount / sampleGames) * 100) : 0,
    sogAgainstOverLineRate: sampleGames
      ? roundToOne((sogAgainstOverLineCount / sampleGames) * 100)
      : 0,
    goalsForOver25Rate: sampleGames ? roundToOne((goalsForOver25Count / sampleGames) * 100) : 0,
    goalsAgainstOver25Rate: sampleGames ? roundToOne((goalsAgainstOver25Count / sampleGames) * 100) : 0,
    flags: [],
  };

  group.flags = getTeamFlags(group);
  return group;
}

export function buildTeamStyleProfile(
  teamAbbrev: string,
  gameIds: number[],
  boxscoresByGameId: Map<number, GameCenterBoxscoreResponse>
): TeamStyleProfile {
  let sampleGames = 0;
  let pace = 0;
  let defensiveLoad = 0;
  let physicality = 0;
  let chaos = 0;
  let discipline = 0;

  for (const gameId of gameIds) {
    const boxscore = boxscoresByGameId.get(gameId);
    if (!boxscore) continue;

    const styleMetrics = getTeamStyleMetricsForGame(boxscore, teamAbbrev);
    if (!styleMetrics) continue;

    sampleGames += 1;
    pace += styleMetrics.pace;
    defensiveLoad += styleMetrics.defensiveLoad;
    physicality += styleMetrics.physicality;
    chaos += styleMetrics.chaos;
    discipline += styleMetrics.discipline;
  }

  const safeGames = Math.max(sampleGames, 1);
  const profile: TeamStyleProfile = {
    sampleGames,
    pace: roundToOne(pace / safeGames),
    defensiveLoad: roundToOne(defensiveLoad / safeGames),
    physicality: roundToOne(physicality / safeGames),
    chaos: roundToOne(chaos / safeGames),
    discipline: roundToOne(discipline / safeGames),
    score: {
      pace: 0,
      defensiveLoad: 0,
      physicality: 0,
      chaos: 0,
      discipline: 0,
    },
    tags: [],
  };

  profile.score = buildStyleScore(
    profile.pace,
    profile.defensiveLoad,
    profile.physicality,
    profile.chaos,
    profile.discipline
  );
  profile.tags = getStyleTags(profile);

  return profile;
}

export function buildTeamStyleSimilarGames(
  teamAbbrev: string,
  gameIds: number[],
  boxscoresByGameId: Map<number, GameCenterBoxscoreResponse>,
  targetOpponentStyle: TeamStyleProfile,
  targetOpponentAbbrev: string,
  limit = 3
): TeamStyleSimilarGames {
  let sampleGames = 0;
  const similarMatches: SimilarMatchLine[] = [];

  for (const gameId of gameIds) {
    const boxscore = boxscoresByGameId.get(gameId);
    if (!boxscore) continue;

    const teamSide = getTeamSide(boxscore, teamAbbrev);
    if (!teamSide) continue;

    const opponentSide = getOpponentSide(teamSide);
    const opponentAbbrev = boxscore[opponentSide].abbrev;
    if (!opponentAbbrev || opponentAbbrev === targetOpponentAbbrev) continue;

    sampleGames += 1;

    const opponentStyle = getTeamStyleMetricsForGame(boxscore, opponentAbbrev);
    if (!opponentStyle) continue;

    const similarity = getStyleSimilarity(opponentStyle.score, targetOpponentStyle.score);

    similarMatches.push({
      gameId: boxscore.id,
      gameDate: boxscore.gameDate ?? boxscore.startTimeUTC,
      opponentAbbrev,
      similarity,
      teamGoals: toSafeNumber(boxscore[teamSide].score),
      opponentGoals: toSafeNumber(boxscore[opponentSide].score),
      teamSog: toSafeNumber(boxscore[teamSide].sog),
      opponentSog: toSafeNumber(boxscore[opponentSide].sog),
    });
  }

  similarMatches.sort((a, b) => {
    if (b.similarity !== a.similarity) return b.similarity - a.similarity;
    return new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime();
  });

  return {
    sampleGames,
    matches: similarMatches.slice(0, limit),
  };
}

type PlayerProfile = {
  key: string;
  playerId?: number;
  playerName: string;
  teamAbbrev: string;
  impactScore: number;
  h2hGames: number;
  h2hSogPerGame: number;
  h2hPointsPerGame: number;
  h2hGoalsPerGame: number;
  h2hSogOver25Count: number;
  h2hPointsOver05Count: number;
  h2hGoalsOver05Count: number;
  h2hSogOver25Rate: number;
  h2hPointsOver05Rate: number;
  h2hGoalsOver05Rate: number;
  recentGames: number;
  recentSogPerGame: number;
  recentPointsPerGame: number;
  recentGoalsPerGame: number;
  recentSogOver25Count: number;
  recentPointsOver05Count: number;
  recentGoalsOver05Count: number;
  recentSogOver25Rate: number;
  recentPointsOver05Rate: number;
  recentGoalsOver05Rate: number;
};

type TopPickCandidate = MatchupTopPick & {
  score: number;
  uniqueKey: string;
};

type MatchupTopPickOptions = {
  homeTeamAbbrev: string;
  awayTeamAbbrev: string;
  h2hHomePlayers: TeamPlayerInsightGroup;
  h2hAwayPlayers: TeamPlayerInsightGroup;
  recentHomePlayers: TeamPlayerInsightGroup;
  recentAwayPlayers: TeamPlayerInsightGroup;
  h2hHomeTeamAngles: TeamAngleInsightGroup;
  h2hAwayTeamAngles: TeamAngleInsightGroup;
  recentHomeTeamAngles: TeamAngleInsightGroup;
  recentAwayTeamAngles: TeamAngleInsightGroup;
  teamSogLine: number;
  playerHeadshotsById?: Map<number, string>;
  maxPicks?: number;
};

function createEmptyPlayerProfile(key: string, player: PlayerInsightLine, teamAbbrev: string): PlayerProfile {
  return {
    key,
    playerId: player.playerId,
    playerName: player.name,
    teamAbbrev,
    impactScore: player.impactScore,
    h2hGames: 0,
    h2hSogPerGame: 0,
    h2hPointsPerGame: 0,
    h2hGoalsPerGame: 0,
    h2hSogOver25Count: 0,
    h2hPointsOver05Count: 0,
    h2hGoalsOver05Count: 0,
    h2hSogOver25Rate: 0,
    h2hPointsOver05Rate: 0,
    h2hGoalsOver05Rate: 0,
    recentGames: 0,
    recentSogPerGame: 0,
    recentPointsPerGame: 0,
    recentGoalsPerGame: 0,
    recentSogOver25Count: 0,
    recentPointsOver05Count: 0,
    recentGoalsOver05Count: 0,
    recentSogOver25Rate: 0,
    recentPointsOver05Rate: 0,
    recentGoalsOver05Rate: 0,
  };
}

function mergeProfiles(
  teamAbbrev: string,
  h2hGroup: TeamPlayerInsightGroup,
  recentGroup: TeamPlayerInsightGroup
): PlayerProfile[] {
  const profiles = new Map<string, PlayerProfile>();

  for (const player of h2hGroup.players) {
    const key = player.key;
    const profile = profiles.get(key) ?? createEmptyPlayerProfile(key, player, teamAbbrev);

    profile.playerId = player.playerId ?? profile.playerId;
    profile.playerName = player.name;
    profile.impactScore = Math.max(profile.impactScore, player.impactScore);
    profile.h2hGames = player.games;
    profile.h2hSogPerGame = player.sogPerGame;
    profile.h2hPointsPerGame = player.pointsPerGame;
    profile.h2hGoalsPerGame = player.goalsPerGame;
    profile.h2hSogOver25Count = player.sogOver25Count;
    profile.h2hPointsOver05Count = player.pointsOver05Count;
    profile.h2hGoalsOver05Count = player.goalsOver05Count;
    profile.h2hSogOver25Rate = player.sogOver25Rate;
    profile.h2hPointsOver05Rate = player.pointsOver05Rate;
    profile.h2hGoalsOver05Rate = player.goalsOver05Rate;

    profiles.set(key, profile);
  }

  for (const player of recentGroup.players) {
    const key = player.key;
    const profile = profiles.get(key) ?? createEmptyPlayerProfile(key, player, teamAbbrev);

    profile.playerId = player.playerId ?? profile.playerId;
    profile.playerName = player.name;
    profile.impactScore = Math.max(profile.impactScore, player.impactScore);
    profile.recentGames = player.games;
    profile.recentSogPerGame = player.sogPerGame;
    profile.recentPointsPerGame = player.pointsPerGame;
    profile.recentGoalsPerGame = player.goalsPerGame;
    profile.recentSogOver25Count = player.sogOver25Count;
    profile.recentPointsOver05Count = player.pointsOver05Count;
    profile.recentGoalsOver05Count = player.goalsOver05Count;
    profile.recentSogOver25Rate = player.sogOver25Rate;
    profile.recentPointsOver05Rate = player.pointsOver05Rate;
    profile.recentGoalsOver05Rate = player.goalsOver05Rate;

    profiles.set(key, profile);
  }

  return Array.from(profiles.values());
}

function weightedRate(recentRate: number, h2hRate: number, recentGames: number, h2hGames: number): number {
  const recentWeight = recentGames > 0 ? 0.6 + Math.min(recentGames, 5) * 0.04 : 0;
  const h2hWeight = h2hGames > 0 ? 0.4 + Math.min(h2hGames, 5) * 0.05 : 0;
  const totalWeight = recentWeight + h2hWeight;

  if (totalWeight <= 0) return 0;
  return roundToOne((recentRate * recentWeight + h2hRate * h2hWeight) / totalWeight);
}

function weightedAverage(recentValue: number, h2hValue: number, recentGames: number, h2hGames: number): number {
  const totalGames = recentGames + h2hGames;
  if (totalGames <= 0) return 0;
  return roundToOne((recentValue * recentGames + h2hValue * h2hGames) / totalGames);
}

function sampleBonus(recentGames: number, h2hGames: number): number {
  return clamp((recentGames + h2hGames) * 1.8, 0, 14);
}

function consistencyBonus(recentRate: number, h2hRate: number, recentGames: number, h2hGames: number): number {
  if (recentGames > 0 && h2hGames > 0 && recentRate >= 55 && h2hRate >= 55) return 4;
  if (recentGames > 0 && h2hGames > 0 && recentRate >= 65 && h2hRate >= 65) return 6;
  return 0;
}

function buildHitSampleLabel(recentCount: number, recentGames: number, h2hCount: number, h2hGames: number): string {
  const parts: string[] = [];

  if (recentGames > 0) parts.push(`recent ${recentCount}/${recentGames}`);
  if (h2hGames > 0) parts.push(`h2h ${h2hCount}/${h2hGames}`);
  if (parts.length === 0) return 'low sample';

  return parts.join(' · ');
}

function buildPlayerPickCandidates(
  profile: PlayerProfile,
  playerHeadshotsById?: Map<number, string>
): TopPickCandidate[] {
  const picks: TopPickCandidate[] = [];
  const totalGames = profile.h2hGames + profile.recentGames;
  if (totalGames <= 0) return picks;

  const headshot = profile.playerId ? playerHeadshotsById?.get(profile.playerId) : undefined;
  const base = {
    rank: 0,
    teamAbbrev: profile.teamAbbrev,
    playerId: profile.playerId,
    playerName: profile.playerName,
    playerHeadshot: headshot,
    sampleGames: totalGames,
  };

  const sogHitRate = weightedRate(
    profile.recentSogOver25Rate,
    profile.h2hSogOver25Rate,
    profile.recentGames,
    profile.h2hGames
  );
  const sogAverage = weightedAverage(
    profile.recentSogPerGame,
    profile.h2hSogPerGame,
    profile.recentGames,
    profile.h2hGames
  );
  if (sogHitRate >= 45 || sogAverage >= 2.6) {
    const edge = clamp((sogAverage - 2.5) / 1.7, -0.3, 0.4);
    const confidence = roundToInteger(
      clamp(
        41 +
          sogHitRate * 0.46 +
          sampleBonus(profile.recentGames, profile.h2hGames) +
          Math.max(edge, 0) * 16 +
          consistencyBonus(
            profile.recentSogOver25Rate,
            profile.h2hSogOver25Rate,
            profile.recentGames,
            profile.h2hGames
          ) +
          profile.impactScore * 0.4,
        48,
        92
      )
    );

    picks.push({
      ...base,
      id: `player-sog-${profile.key}`,
      uniqueKey: `player-${profile.key}`,
      type: 'player_sog_over',
      title: `${profile.playerName} O2.5 SOG`,
      lineLabel: 'O2.5 SOG',
      confidence,
      hitRate: sogHitRate,
      rationale: `${buildHitSampleLabel(
        profile.recentSogOver25Count,
        profile.recentGames,
        profile.h2hSogOver25Count,
        profile.h2hGames
      )} · avg ${sogAverage.toFixed(1)} sog/g`,
      score: confidence + sogHitRate * 0.18 + profile.impactScore * 0.45,
    });
  }

  const pointsHitRate = weightedRate(
    profile.recentPointsOver05Rate,
    profile.h2hPointsOver05Rate,
    profile.recentGames,
    profile.h2hGames
  );
  const pointsAverage = weightedAverage(
    profile.recentPointsPerGame,
    profile.h2hPointsPerGame,
    profile.recentGames,
    profile.h2hGames
  );
  if (pointsHitRate >= 43 || pointsAverage >= 0.8) {
    const edge = clamp((pointsAverage - 0.5) / 0.8, -0.3, 0.45);
    const confidence = roundToInteger(
      clamp(
        40 +
          pointsHitRate * 0.45 +
          sampleBonus(profile.recentGames, profile.h2hGames) +
          Math.max(edge, 0) * 14 +
          consistencyBonus(
            profile.recentPointsOver05Rate,
            profile.h2hPointsOver05Rate,
            profile.recentGames,
            profile.h2hGames
          ) +
          profile.impactScore * 0.38,
        47,
        91
      )
    );

    picks.push({
      ...base,
      id: `player-pts-${profile.key}`,
      uniqueKey: `player-${profile.key}`,
      type: 'player_points_over',
      title: `${profile.playerName} O0.5 PTS`,
      lineLabel: 'O0.5 PTS',
      confidence,
      hitRate: pointsHitRate,
      rationale: `${buildHitSampleLabel(
        profile.recentPointsOver05Count,
        profile.recentGames,
        profile.h2hPointsOver05Count,
        profile.h2hGames
      )} · avg ${pointsAverage.toFixed(1)} pts/g`,
      score: confidence + pointsHitRate * 0.17 + profile.impactScore * 0.42,
    });
  }

  const goalsHitRate = weightedRate(
    profile.recentGoalsOver05Rate,
    profile.h2hGoalsOver05Rate,
    profile.recentGames,
    profile.h2hGames
  );
  const goalsAverage = weightedAverage(
    profile.recentGoalsPerGame,
    profile.h2hGoalsPerGame,
    profile.recentGames,
    profile.h2hGames
  );
  if (goalsHitRate >= 34 || goalsAverage >= 0.55) {
    const edge = clamp((goalsAverage - 0.5) / 0.7, -0.35, 0.35);
    const confidence = roundToInteger(
      clamp(
        35 +
          goalsHitRate * 0.5 +
          sampleBonus(profile.recentGames, profile.h2hGames) * 0.9 +
          Math.max(edge, 0) * 14 +
          consistencyBonus(
            profile.recentGoalsOver05Rate,
            profile.h2hGoalsOver05Rate,
            profile.recentGames,
            profile.h2hGames
          ) * 0.9 +
          profile.impactScore * 0.35,
        49,
        90
      )
    );

    picks.push({
      ...base,
      id: `player-goals-${profile.key}`,
      uniqueKey: `player-${profile.key}`,
      type: 'player_goals_over',
      title: `${profile.playerName} O0.5 G`,
      lineLabel: 'O0.5 G',
      confidence,
      hitRate: goalsHitRate,
      rationale: `${buildHitSampleLabel(
        profile.recentGoalsOver05Count,
        profile.recentGames,
        profile.h2hGoalsOver05Count,
        profile.h2hGames
      )} · avg ${goalsAverage.toFixed(1)} g/g`,
      score: confidence + goalsHitRate * 0.19 + profile.impactScore * 0.34,
    });
  }

  return picks;
}

function buildTeamSogPickCandidate(
  teamAbbrev: string,
  h2hGroup: TeamAngleInsightGroup,
  recentGroup: TeamAngleInsightGroup,
  teamSogLine: number
): TopPickCandidate | null {
  const totalSample = h2hGroup.sampleGames + recentGroup.sampleGames;
  if (totalSample <= 0) return null;

  const hitRate = weightedRate(
    recentGroup.sogForOverLineRate,
    h2hGroup.sogForOverLineRate,
    recentGroup.sampleGames,
    h2hGroup.sampleGames
  );
  const average = weightedAverage(
    recentGroup.sogForPerGame,
    h2hGroup.sogForPerGame,
    recentGroup.sampleGames,
    h2hGroup.sampleGames
  );

  if (hitRate < 50 && average < teamSogLine + 0.8) return null;

  const edge = clamp((average - teamSogLine) / 2.2, -0.35, 0.4);
  const confidence = roundToInteger(
    clamp(
      42 +
        hitRate * 0.44 +
        sampleBonus(recentGroup.sampleGames, h2hGroup.sampleGames) +
        Math.max(edge, 0) * 14,
      52,
      89
    )
  );

  return {
    id: `team-sog-${teamAbbrev}`,
    uniqueKey: `team-${teamAbbrev}`,
    rank: 0,
    type: 'team_sog_over',
    title: `${teamAbbrev} O${teamSogLine.toFixed(1)} SOG`,
    lineLabel: `O${teamSogLine.toFixed(1)} SOG`,
    confidence,
    hitRate,
    sampleGames: totalSample,
    teamAbbrev,
    rationale: `${buildHitSampleLabel(
      recentGroup.sogForOverLineCount,
      recentGroup.sampleGames,
      h2hGroup.sogForOverLineCount,
      h2hGroup.sampleGames
    )} · avg ${average.toFixed(1)} sog/g`,
    score: confidence + hitRate * 0.16,
  };
}

function isStrongTopPick(candidate: TopPickCandidate): boolean {
  if (candidate.sampleGames < TOP_PICK_MIN_SAMPLE) return false;
  if (candidate.score < TOP_PICK_FLOOR_SCORE) return false;

  if (candidate.type === 'player_sog_over') {
    return candidate.confidence >= 67 && candidate.hitRate >= 57;
  }

  if (candidate.type === 'player_points_over') {
    return candidate.confidence >= 66 && candidate.hitRate >= 55;
  }

  if (candidate.type === 'player_goals_over') {
    return candidate.confidence >= 63 && candidate.hitRate >= 34;
  }

  return candidate.confidence >= 68 && candidate.hitRate >= 60;
}

export function buildMatchupTopPicks(options: MatchupTopPickOptions): MatchupTopPick[] {
  const maxPicks = options.maxPicks ?? 4;
  const homeProfiles = mergeProfiles(
    options.homeTeamAbbrev,
    options.h2hHomePlayers,
    options.recentHomePlayers
  );
  const awayProfiles = mergeProfiles(
    options.awayTeamAbbrev,
    options.h2hAwayPlayers,
    options.recentAwayPlayers
  );

  const playerCandidates = [...homeProfiles, ...awayProfiles]
    .flatMap((profile) => buildPlayerPickCandidates(profile, options.playerHeadshotsById))
    .filter(isStrongTopPick)
    .sort((a, b) => b.score - a.score);

  const teamCandidates = [
    buildTeamSogPickCandidate(
      options.homeTeamAbbrev,
      options.h2hHomeTeamAngles,
      options.recentHomeTeamAngles,
      options.teamSogLine
    ),
    buildTeamSogPickCandidate(
      options.awayTeamAbbrev,
      options.h2hAwayTeamAngles,
      options.recentAwayTeamAngles,
      options.teamSogLine
    ),
  ]
    .filter((candidate): candidate is TopPickCandidate => Boolean(candidate))
    .filter(isStrongTopPick)
    .sort((a, b) => b.score - a.score);

  const selected: TopPickCandidate[] = [];
  const usedPlayers = new Set<string>();

  for (const candidate of playerCandidates) {
    if (selected.length >= maxPicks) break;
    if (usedPlayers.has(candidate.uniqueKey)) continue;

    selected.push(candidate);
    usedPlayers.add(candidate.uniqueKey);
  }

  for (const candidate of teamCandidates) {
    if (selected.length >= maxPicks) break;
    selected.push(candidate);
  }

  selected.sort((a, b) => b.score - a.score);

  return selected.slice(0, maxPicks).map((pick, index) => ({
    ...pick,
    rank: index + 1,
  }));
}

export function buildMatchupStyleSimilarity(
  homeStyleProfile: TeamStyleProfile,
  awayStyleProfile: TeamStyleProfile
): number {
  return getStyleSimilarity(homeStyleProfile.score, awayStyleProfile.score);
}

export function buildMatchupStyleTags(
  homeStyleProfile: TeamStyleProfile,
  awayStyleProfile: TeamStyleProfile
): string[] {
  return getMatchupStyleTags(homeStyleProfile, awayStyleProfile);
}

export function buildMatchupStyleTheoreticalEdge(
  homeStyleProfile: TeamStyleProfile,
  awayStyleProfile: TeamStyleProfile,
  homeTeamAbbrev: string,
  awayTeamAbbrev: string
): MatchupStyleEdge {
  return buildMatchupStyleEdge(homeStyleProfile, awayStyleProfile, homeTeamAbbrev, awayTeamAbbrev);
}
