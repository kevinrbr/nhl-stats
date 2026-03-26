export interface UpcomingGame {
  id: number;
  date: string;
  dayAbbrev: string;
  startTime: string; // Format: "1:00 AM"
  venue: string;
  homeTeam: {
    id: number;
    name: string;
    abbrev: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    abbrev: string;
    logo: string;
  };
  gameState: string;
  odds?: UpcomingGameOdds | null;
}

export interface UpcomingGameOdds {
  bookmakerName: string;
  moneyline: {
    home: number | null;
    away: number | null;
  } | null;
  total: {
    line: number | null;
    over: number | null;
    under: number | null;
  } | null;
}

export interface GamesByDate {
  date: string;
  dayAbbrev: string;
  games: UpcomingGame[];
}

interface PartnerGameOddsMarket {
  description?: string;
  value?: number | string;
  qualifier?: string;
}

interface PartnerGameTeamOdds {
  odds?: PartnerGameOddsMarket[];
}

interface PartnerGameOddsGame {
  gameId?: number;
  homeTeam?: PartnerGameTeamOdds;
  awayTeam?: PartnerGameTeamOdds;
}

interface PartnerGameOddsResponse {
  bettingPartner?: {
    name?: string;
  };
  games?: PartnerGameOddsGame[];
}

interface SchedulePayload {
  gameWeek?: Array<{
    date?: string;
    dayAbbrev?: string;
    games?: any[];
  }>;
}

interface PresentedGameEntry {
  game: UpcomingGame;
  startAtMs: number;
}

interface GamesByDateBucket {
  date: string;
  dayAbbrev: string;
  games: PresentedGameEntry[];
  gameIds: Set<number>;
}

const COMPLETED_GAME_STATES = new Set([
  'OFF',
  'FINAL',
  'FINAL_OT',
  'FINAL_SO',
]);

const ONE_HOUR_MS = 60 * 60 * 1000;
const ESTIMATED_GAME_DURATION_MS = 3 * 60 * 60 * 1000;
const RECENT_COMPLETED_WINDOW_MS = ESTIMATED_GAME_DURATION_MS + ONE_HOUR_MS;
const LIVE_WINDOW_MS = 4 * 60 * 60 * 1000;

function getGameStartMs(game: any): number | null {
  const startAtMs = Date.parse(game?.startTimeUTC ?? '');
  return Number.isNaN(startAtMs) ? null : startAtMs;
}

function isCompletedGame(game: any): boolean {
  const normalizedState = String(game?.gameState ?? '').toUpperCase();
  return COMPLETED_GAME_STATES.has(normalizedState);
}

function isUpcomingGame(game: any, nowMs: number): boolean {
  const startAtMs = getGameStartMs(game);
  if (startAtMs === null) return false;

  if (isCompletedGame(game)) {
    return nowMs - startAtMs <= RECENT_COMPLETED_WINDOW_MS;
  }

  return startAtMs >= nowMs - LIVE_WINDOW_MS;
}

function isPastCompletedGame(game: any, nowMs: number): boolean {
  const startAtMs = getGameStartMs(game);
  if (startAtMs === null) return false;
  if (!isCompletedGame(game)) return false;

  return nowMs - startAtMs > RECENT_COMPLETED_WINDOW_MS;
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTotalQualifier(qualifier: unknown): {
  side: 'over' | 'under' | null;
  line: number | null;
} {
  const normalized = String(qualifier ?? '').trim().toUpperCase();
  const side = normalized.startsWith('O')
    ? 'over'
    : normalized.startsWith('U')
      ? 'under'
      : null;
  const lineMatch = normalized.match(/([0-9]+(?:\.[0-9]+)?)/);

  return {
    side,
    line: lineMatch ? toFiniteNumber(lineMatch[1]) : null,
  };
}

function findMarketValue(
  markets: PartnerGameOddsMarket[],
  description: string
): number | null {
  const market = markets.find((entry) => entry.description === description);
  return toFiniteNumber(market?.value);
}

function buildOddsByGameId(data: unknown): Map<number, UpcomingGameOdds> {
  const response = data as PartnerGameOddsResponse | null | undefined;
  const games = Array.isArray(response?.games) ? response.games : [];
  const partnerName = response?.bettingPartner?.name?.trim() || 'Bookmaker';
  const byGameId = new Map<number, UpcomingGameOdds>();

  for (const game of games) {
    const gameId = toFiniteNumber(game?.gameId ?? (game as { id?: number }).id);
    if (gameId === null) continue;

    const homeMarkets = Array.isArray(game?.homeTeam?.odds) ? game.homeTeam.odds : [];
    const awayMarkets = Array.isArray(game?.awayTeam?.odds) ? game.awayTeam.odds : [];

    const homeMoneyline = findMarketValue(homeMarkets, 'MONEY_LINE_2_WAY');
    const awayMoneyline = findMarketValue(awayMarkets, 'MONEY_LINE_2_WAY');
    const hasMoneyline = homeMoneyline !== null || awayMoneyline !== null;

    let totalLine: number | null = null;
    let overOdds: number | null = null;
    let underOdds: number | null = null;

    for (const market of [...homeMarkets, ...awayMarkets]) {
      if (market.description !== 'OVER_UNDER') continue;

      const value = toFiniteNumber(market.value);
      if (value === null) continue;

      const { side, line } = parseTotalQualifier(market.qualifier);
      if (line !== null && totalLine === null) {
        totalLine = line;
      }

      if (side === 'over' && overOdds === null) {
        overOdds = value;
      }

      if (side === 'under' && underOdds === null) {
        underOdds = value;
      }
    }

    const hasTotal = totalLine !== null || overOdds !== null || underOdds !== null;
    if (!hasMoneyline && !hasTotal) continue;

    byGameId.set(gameId, {
      bookmakerName: partnerName,
      moneyline: hasMoneyline
        ? {
            home: homeMoneyline,
            away: awayMoneyline,
          }
        : null,
      total: hasTotal
        ? {
            line: totalLine,
            over: overOdds,
            under: underOdds,
          }
        : null,
    });
  }

  return byGameId;
}

function formatStartTime(startTimeUTC: unknown): string {
  const startDate = new Date(String(startTimeUTC ?? ''));
  const hours = startDate.getHours();
  const minutes = startDate.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function mapScheduleGame(
  day: { date?: string; dayAbbrev?: string },
  game: any,
  oddsByGameId?: Map<number, UpcomingGameOdds>
): UpcomingGame {
  return {
    id: game.id,
    date: day.date ?? '',
    dayAbbrev: day.dayAbbrev ?? '',
    startTime: formatStartTime(game.startTimeUTC),
    venue: game?.venue?.default ?? '-',
    homeTeam: {
      id: game?.homeTeam?.id,
      name: game?.homeTeam?.commonName?.default ?? game?.homeTeam?.abbrev ?? '-',
      abbrev: game?.homeTeam?.abbrev ?? '-',
      logo: game?.homeTeam?.logo ?? '',
    },
    awayTeam: {
      id: game?.awayTeam?.id,
      name: game?.awayTeam?.commonName?.default ?? game?.awayTeam?.abbrev ?? '-',
      abbrev: game?.awayTeam?.abbrev ?? '-',
      logo: game?.awayTeam?.logo ?? '',
    },
    gameState: game?.gameState ?? '',
    odds: oddsByGameId?.get(game.id) ?? null,
  };
}

function toGamesByDateArray(
  buckets: Map<string, GamesByDateBucket>,
  dateDirection: 'asc' | 'desc'
): GamesByDate[] {
  return [...buckets.values()]
    .map((bucket) => ({
      date: bucket.date,
      dayAbbrev: bucket.dayAbbrev,
      games: bucket.games
        .sort((a, b) => (dateDirection === 'asc' ? a.startAtMs - b.startAtMs : b.startAtMs - a.startAtMs))
        .map((entry) => entry.game),
    }))
    .sort((a, b) => {
      const aDateMs = Date.parse(a.date);
      const bDateMs = Date.parse(b.date);
      return dateDirection === 'asc' ? aDateMs - bDateMs : bDateMs - aDateMs;
    })
    .filter((day) => day.games.length > 0);
}

export function upcomingGamesPresenter(data: any, oddsData?: unknown): GamesByDate[] {
  if (!data?.gameWeek) return [];

  const nowMs = Date.now();
  const oddsByGameId = buildOddsByGameId(oddsData);
  const buckets = new Map<string, GamesByDateBucket>();

  for (const day of data.gameWeek) {
    const dayDate = day?.date;
    if (!dayDate) continue;

    for (const game of day?.games ?? []) {
      const startAtMs = getGameStartMs(game);
      if (startAtMs === null || !isUpcomingGame(game, nowMs)) continue;

      const gameId = Number(game?.id);
      if (!Number.isFinite(gameId)) continue;

      if (!buckets.has(dayDate)) {
        buckets.set(dayDate, {
          date: dayDate,
          dayAbbrev: day?.dayAbbrev ?? '',
          games: [],
          gameIds: new Set<number>(),
        });
      }

      const bucket = buckets.get(dayDate);
      if (!bucket) continue;
      if (bucket.gameIds.has(gameId)) continue;

      bucket.gameIds.add(gameId);
      bucket.games.push({
        game: mapScheduleGame(day, game, oddsByGameId),
        startAtMs,
      });
    }
  }

  return toGamesByDateArray(buckets, 'asc');
}

export function pastGamesPresenter(dataList: unknown[]): GamesByDate[] {
  if (!dataList.length) return [];

  const nowMs = Date.now();
  const buckets = new Map<string, GamesByDateBucket>();

  for (const payload of dataList) {
    const schedule = payload as SchedulePayload;
    if (!Array.isArray(schedule?.gameWeek)) continue;

    for (const day of schedule.gameWeek) {
      const dayDate = day?.date;
      if (!dayDate) continue;

      for (const game of day?.games ?? []) {
        const startAtMs = getGameStartMs(game);
        if (startAtMs === null || !isPastCompletedGame(game, nowMs)) continue;

        const gameId = Number(game?.id);
        if (!Number.isFinite(gameId)) continue;

        if (!buckets.has(dayDate)) {
          buckets.set(dayDate, {
            date: dayDate,
            dayAbbrev: day?.dayAbbrev ?? '',
            games: [],
            gameIds: new Set<number>(),
          });
        }

        const bucket = buckets.get(dayDate);
        if (!bucket) continue;
        if (bucket.gameIds.has(gameId)) continue;

        bucket.gameIds.add(gameId);
        bucket.games.push({
          game: mapScheduleGame(day, game),
          startAtMs,
        });
      }
    }
  }

  return toGamesByDateArray(buckets, 'desc');
}
