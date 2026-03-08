<script setup lang="ts">
import { computed, toRefs } from 'vue';
import HockeyHalfRink from '@/app/players/components/shooting-zones/HockeyHalfRink.vue';
import ShootingZonesLegend from '@/app/players/components/shooting-zones/ShootingZonesLegend.vue';
import ShootingZonesTable from '@/app/players/components/shooting-zones/ShootingZonesTable.vue';
import { usePlayerShootingZones } from '@/app/players/composables/usePlayerShootingZones';

const props = defineProps<{
  playerId: string;
}>();

const { playerId } = toRefs(props);
const { isLoading, isFetching, isError, summary } = usePlayerShootingZones(playerId);

const sourceLabel = computed(() => {
  if (summary.value.source === 'now') return 'Now';
  if (summary.value.source === 'season') return 'Season';
  return '-';
});

const hasData = computed(() => summary.value.totalSog > 0);

const sortedZones = computed(() => [...summary.value.zones].sort((a, b) => b.sog - a.sog || b.sharePct - a.sharePct));
const topZone = computed(() => sortedZones.value[0] ?? null);
const activeZones = computed(() => sortedZones.value.filter((zone) => zone.sog > 0).length);
</script>

<template>
  <section class="rounded-xl border border-zinc-800/80 bg-zinc-900/78 p-4 space-y-3">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-zinc-100 text-sm font-semibold">Shooting Zones</h3>
        <p class="text-zinc-500 text-xs mt-0.5">Distribution des tirs cadres par zone</p>
      </div>

      <span class="inline-flex items-center text-zinc-300 text-[10px] px-2 py-1 rounded-md bg-zinc-950/75 border border-zinc-800/80">
        Source {{ sourceLabel }}
      </span>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/72 px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-zinc-500">Total SOG</p>
        <p class="text-zinc-100 text-base font-semibold mt-1">{{ summary.totalSog }}</p>
      </div>

      <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/72 px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-zinc-500">Zone #1</p>
        <p class="text-zinc-100 text-sm font-semibold mt-1 truncate">{{ topZone?.label ?? '-' }}</p>
      </div>

      <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/72 px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-zinc-500">Top Share</p>
        <p class="text-zinc-100 text-base font-semibold mt-1">{{ topZone ? `${topZone.sharePct.toFixed(1)}%` : '-' }}</p>
      </div>

      <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/72 px-3 py-2">
        <p class="text-[10px] uppercase tracking-wide text-zinc-500">Zones actives</p>
        <p class="text-zinc-100 text-base font-semibold mt-1">{{ activeZones }}</p>
      </div>
    </div>

    <ShootingZonesLegend />

    <div v-if="isLoading || isFetching" class="space-y-2">
      <div class="h-[260px] rounded-lg border border-zinc-800 bg-zinc-950/60 animate-pulse"></div>
      <div class="h-[120px] rounded-lg border border-zinc-800 bg-zinc-950/60 animate-pulse"></div>
    </div>

    <div v-else-if="isError" class="text-zinc-400 text-sm text-center py-10">
      Impossible de charger les zones de tir pour ce joueur.
    </div>

    <div v-else-if="!hasData" class="text-zinc-400 text-sm text-center py-10">
      Aucune donnée de tirs pour la saison.
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-[minmax(0,760px)_290px] xl:justify-between gap-3">
      <HockeyHalfRink :zones="summary.zones" />
      <ShootingZonesTable :zones="summary.zones" />
    </div>
  </section>
</template>
