<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
  GamePlayerUsageItem,
  GameTeamUsageSnapshot,
} from '@/app/games/types/gamePlayerUsage';

type SortMetric = 'toi' | 'sog' | 'xg' | 'points' | 'goals';

const SORT_OPTIONS: Array<{ key: SortMetric; label: string }> = [
  { key: 'sog', label: 'SOG' },
  { key: 'xg', label: 'xG' },
  { key: 'toi', label: 'TOI' },
  { key: 'points', label: 'PTS' },
  { key: 'goals', label: 'G' },
];

const props = defineProps<{
  homeSnapshot: GameTeamUsageSnapshot;
  awaySnapshot: GameTeamUsageSnapshot;
}>();

const selectedMetric = ref<SortMetric>('sog');

function formatXg(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—';
  return value.toFixed(2);
}

function getMetricSortValue(player: GamePlayerUsageItem, metric: SortMetric): number {
  if (metric === 'toi') return player.toiMinutes;
  if (metric === 'sog') return player.sog;
  if (metric === 'points') return player.points;
  if (metric === 'goals') return player.goals;
  return player.xg ?? -1;
}

function getMetricVisualValue(player: GamePlayerUsageItem, metric: SortMetric): number {
  if (metric === 'toi') return player.toiMinutes;
  if (metric === 'sog') return player.sog;
  if (metric === 'points') return player.points;
  if (metric === 'goals') return player.goals;
  return Math.max(0, player.xg ?? 0);
}

function getMetricDisplay(player: GamePlayerUsageItem, metric: SortMetric): string {
  if (metric === 'toi') return player.toi;
  if (metric === 'sog') return String(player.sog);
  if (metric === 'points') return String(player.points);
  if (metric === 'goals') return String(player.goals);
  return formatXg(player.xg);
}

function getMetricLabel(metric: SortMetric): string {
  if (metric === 'sog') return 'SOG';
  if (metric === 'toi') return 'TOI';
  if (metric === 'points') return 'PTS';
  if (metric === 'goals') return 'G';
  return 'xG';
}

function getPlayerKey(player: GamePlayerUsageItem, index: number): string {
  if (player.playerId) return `player-${player.playerId}`;
  return `${player.name}-${index}`;
}

const teamSnapshots = computed(() => [props.homeSnapshot, props.awaySnapshot]);

const topMetricBySide = computed(() => {
  const values = new Map<string, number>();

  for (const snapshot of teamSnapshots.value) {
    let topValue = 0;
    for (const player of snapshot.players) {
      const current = getMetricVisualValue(player, selectedMetric.value);
      if (current > topValue) topValue = current;
    }
    values.set(snapshot.side, topValue);
  }

  return values;
});

function getNormalizedMetric(player: GamePlayerUsageItem, snapshot: GameTeamUsageSnapshot): number {
  const topValue = topMetricBySide.value.get(snapshot.side) ?? 0;
  const metricValue = getMetricVisualValue(player, selectedMetric.value);

  if (topValue <= 0) return 0;
  return Math.max(0, Math.min(1, metricValue / topValue));
}

function getTeamTone(snapshot: GameTeamUsageSnapshot): [number, number, number] {
  if (snapshot.side === 'homeTeam') return [56, 189, 248];
  return [245, 158, 11];
}

function getSegmentStyle(player: GamePlayerUsageItem, snapshot: GameTeamUsageSnapshot) {
  const ratio = getNormalizedMetric(player, snapshot);
  const [r, g, b] = getTeamTone(snapshot);
  const minHeight = 28;
  const maxHeight = 76;
  const height = Math.round(minHeight + (maxHeight - minHeight) * ratio);
  const backgroundAlpha = 0.12 + ratio * 0.34;
  const borderAlpha = 0.26 + ratio * 0.46;

  return {
    height: `${height}px`,
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${backgroundAlpha.toFixed(3)})`,
    borderColor: `rgba(${r}, ${g}, ${b}, ${borderAlpha.toFixed(3)})`,
  };
}

function getNameStyle(player: GamePlayerUsageItem, snapshot: GameTeamUsageSnapshot) {
  const ratio = getNormalizedMetric(player, snapshot);
  const size = 12 + ratio * 8;
  return {
    fontSize: `${size.toFixed(1)}px`,
  };
}

function getValueStyle(player: GamePlayerUsageItem, snapshot: GameTeamUsageSnapshot) {
  const ratio = getNormalizedMetric(player, snapshot);
  const size = 13 + ratio * 9;
  return {
    fontSize: `${size.toFixed(1)}px`,
  };
}

const sortedPlayersBySide = computed(() => {
  const bySide = new Map<string, GamePlayerUsageItem[]>();

  for (const snapshot of teamSnapshots.value) {
    const sortedPlayers = [...snapshot.players].sort((a, b) => {
      const metricDiff =
        getMetricSortValue(b, selectedMetric.value) - getMetricSortValue(a, selectedMetric.value);
      if (metricDiff !== 0) return metricDiff;
      return b.toiMinutes - a.toiMinutes;
    });

    bySide.set(snapshot.side, sortedPlayers);
  }

  return bySide;
});
</script>

<template>
  <section class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-5 space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 class="text-zinc-100 text-base font-semibold">H2H Player Snapshot</h3>
        <p class="text-zinc-300 text-sm mt-0.5">Plus haut en haut, plus bas en bas</p>
      </div>

      <div class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-1">
        <button
          v-for="option in SORT_OPTIONS"
          :key="option.key"
          type="button"
          class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
          :class="selectedMetric === option.key
            ? 'bg-sky-500/20 text-sky-200 border border-sky-500/35'
            : 'text-zinc-300 border border-transparent hover:bg-zinc-800/70'"
          @click="selectedMetric = option.key"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <article
        v-for="snapshot in teamSnapshots"
        :key="snapshot.side"
        class="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4"
      >
        <div class="flex items-center justify-between gap-3 mb-2">
          <div class="flex items-center gap-2 min-w-0">
            <img
              v-if="snapshot.teamLogo"
              :src="snapshot.teamLogo"
              :alt="snapshot.teamName"
              class="w-7 h-7 object-contain"
            />
            <div class="min-w-0">
              <p class="text-zinc-100 text-sm font-semibold truncate">{{ snapshot.teamName }}</p>
              <p class="text-zinc-400 text-xs">{{ snapshot.teamAbbrev }}</p>
            </div>
          </div>
          <span class="text-zinc-400 text-xs">{{ snapshot.players.length }} joueurs</span>
        </div>

        <div v-if="!snapshot.players.length" class="text-zinc-400 text-sm">
          Donnees joueurs indisponibles.
        </div>

        <div v-else class="max-h-[68vh] overflow-y-auto pr-1 space-y-1.5">
          <div class="flex items-center justify-between px-2 text-[11px] uppercase tracking-wide text-zinc-500">
            <span>Joueur</span>
            <span>{{ getMetricLabel(selectedMetric) }}</span>
          </div>

          <div class="space-y-1.5">
            <div
              v-for="(player, playerIndex) in sortedPlayersBySide.get(snapshot.side) ?? []"
              :key="getPlayerKey(player, playerIndex)"
              class="rounded-md border px-3 py-2 flex items-center justify-between gap-3"
              :style="getSegmentStyle(player, snapshot)"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-zinc-300/70 text-xs w-6 text-right tabular-nums">{{ playerIndex + 1 }}</span>

                <p class="text-zinc-100 font-semibold truncate" :style="getNameStyle(player, snapshot)">
                  <span v-if="player.sweaterNumber" class="text-zinc-300/85">#{{ player.sweaterNumber }} </span>
                  {{ player.name }}
                </p>
              </div>

              <span class="text-zinc-50 font-bold tabular-nums" :style="getValueStyle(player, snapshot)">
                {{ getMetricDisplay(player, selectedMetric) }}
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
