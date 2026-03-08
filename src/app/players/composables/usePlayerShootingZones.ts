import { computed, type Ref } from 'vue';
import { usePlayerShootingZonesQuery } from '@/app/players/queries/usePlayerShootingZonesQuery';
import {
  PLAYER_SHOOTING_ZONE_DEFINITIONS,
  type PlayerShootingZoneDefinition,
  type PlayerShootingZoneId,
  type PlayerShootingZonesSummary,
} from '@/app/players/types/playerShootingZones';

function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const zoneAliasMap = PLAYER_SHOOTING_ZONE_DEFINITIONS.reduce<
  Record<string, PlayerShootingZoneId>
>((acc, zone) => {
  for (const alias of zone.aliases) {
    acc[normalizeKey(alias)] = zone.id;
  }

  acc[normalizeKey(zone.label)] = zone.id;
  return acc;
}, {});

function getZoneId(rawZone: string): PlayerShootingZoneId | null {
  return zoneAliasMap[normalizeKey(rawZone)] ?? null;
}

function createEmptySummary(): PlayerShootingZonesSummary {
  return {
    zones: PLAYER_SHOOTING_ZONE_DEFINITIONS.map((zone) => ({
      id: zone.id,
      label: zone.label,
      sog: 0,
      sharePct: 0,
      position: zone.position,
    })),
    totalSog: 0,
    source: null,
  };
}

function buildZoneStats(
  zones: PlayerShootingZoneDefinition[],
  counters: Map<PlayerShootingZoneId, number>,
  totalSog: number
) {
  return zones.map((zone) => {
    const sog = counters.get(zone.id) ?? 0;
    const sharePct = totalSog > 0 ? Number(((sog / totalSog) * 100).toFixed(1)) : 0;

    return {
      id: zone.id,
      label: zone.label,
      sog,
      sharePct,
      position: zone.position,
    };
  });
}

export function usePlayerShootingZones(playerId: Ref<string>) {
  const query = usePlayerShootingZonesQuery(playerId);

  const summary = computed<PlayerShootingZonesSummary>(() => {
    const data = query.data.value;
    if (!data) return createEmptySummary();

    const counters = new Map<PlayerShootingZoneId, number>();

    for (const row of data.rows) {
      const zoneId = getZoneId(row.zone);
      if (!zoneId) continue;

      const current = counters.get(zoneId) ?? 0;
      counters.set(zoneId, current + row.sog);
    }

    const totalSog = Array.from(counters.values()).reduce((sum, value) => sum + value, 0);

    return {
      zones: buildZoneStats(PLAYER_SHOOTING_ZONE_DEFINITIONS, counters, totalSog),
      totalSog,
      source: data.source,
    };
  });

  return {
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    summary,
  };
}
