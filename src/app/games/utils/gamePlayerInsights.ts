import type { TeamScheduleGame } from '@/app/teams/presenters/teams.presenter';
import type { GameCenterBoxscoreResponse, GameCenterSkaterStatLine } from '@/app/games/types/gameCenter';
import type {
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
