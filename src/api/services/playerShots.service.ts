import type {
  ApiPlayerShotZoneRow,
  ApiPlayerShotZonesResponse,
} from '@/api/types/playerShots.api';

export interface PlayerShotZonesParams {
  season?: string;
  gameType?: string;
}

const DEFAULT_SEASON = '20252026';
const DEFAULT_GAME_TYPE = '2';

type RawObject = Record<string, unknown>;

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asRows(payload: unknown): RawObject[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (entry): entry is RawObject =>
        !!entry && typeof entry === 'object' && !Array.isArray(entry)
    );
  }

  if (!payload || typeof payload !== 'object') return [];

  const root = payload as RawObject;
  const directKeys = [
    'shots',
    'shotLocations',
    'shotLocationDetails',
    'locations',
    'data',
    'results',
    'stats',
  ];

  for (const key of directKeys) {
    const value = root[key];
    if (Array.isArray(value)) {
      return value.filter(
        (entry): entry is RawObject =>
          !!entry && typeof entry === 'object' && !Array.isArray(entry)
      );
    }
  }

  for (const value of Object.values(root)) {
    if (!Array.isArray(value)) continue;

    const rows = value.filter(
      (entry): entry is RawObject =>
        !!entry && typeof entry === 'object' && !Array.isArray(entry)
    );

    if (rows.length > 0) return rows;
  }

  return [];
}

function normalizeRow(row: RawObject): ApiPlayerShotZoneRow | null {
  const zone =
    toText(row.zone) ||
    toText(row.area) ||
    toText(row.abbrev) ||
    toText(row.shotLocation) ||
    toText(row.location) ||
    toText(row.label) ||
    toText(row.name);

  if (!zone) return null;

  const sog = toNumber(
    row.shotsOnGoal ??
      row.sog ??
      row.shotsOnNet ??
      row.onGoal ??
      row.shots ??
      row.count
  );

  return {
    zone,
    sog: sog > 0 ? sog : 0,
  };
}

function normalizePayload(payload: unknown): ApiPlayerShotZoneRow[] {
  return asRows(payload)
    .map(normalizeRow)
    .filter((row): row is ApiPlayerShotZoneRow => row !== null && row.sog > 0);
}

async function fetchShotZones(
  url: string,
  source: 'season' | 'now'
): Promise<ApiPlayerShotZonesResponse | null> {
  const response = await fetch(url);
  if (!response.ok) return null;

  const payload = await response.json();
  const rows = normalizePayload(payload);

  return {
    rows,
    source,
  };
}

export async function getPlayerShotZones(
  playerId: string,
  params: PlayerShotZonesParams = {}
): Promise<ApiPlayerShotZonesResponse> {
  const season = params.season ?? DEFAULT_SEASON;
  const gameType = params.gameType ?? DEFAULT_GAME_TYPE;

  const seasonUrl = `/api-nhl/v1/edge/skater-shot-location-detail/${playerId}/${season}/${gameType}`;
  const nowUrl = `/api-nhl/v1/edge/skater-shot-location-detail/${playerId}/now`;

  const seasonData = await fetchShotZones(seasonUrl, 'season');
  if (seasonData && seasonData.rows.length > 0) return seasonData;

  const nowData = await fetchShotZones(nowUrl, 'now');
  if (nowData) return nowData;

  throw new Error(
    `Erreur lors de la récupération des zones de tir pour le joueur ${playerId}`
  );
}
