<script setup lang="ts">
import { computed } from 'vue';
import type { PlayerShootingZoneStat } from '@/app/players/types/playerShootingZones';
import { getShootingZoneTone } from '@/app/players/utils/shootingZoneUi';

const props = defineProps<{
  zones: PlayerShootingZoneStat[];
}>();

const sortedZones = computed(() =>
  [...props.zones].sort((a, b) => b.sog - a.sog || b.sharePct - a.sharePct)
);

const activeZonesCount = computed(() => sortedZones.value.filter((zone) => zone.sog > 0).length);
</script>

<template>
  <aside class="rounded-lg border border-zinc-800/80 bg-zinc-950/72 p-3">
    <div class="flex items-center justify-between gap-2 mb-2">
      <p class="text-zinc-400 text-[11px] uppercase tracking-wide">Zone Details</p>
      <span class="text-zinc-500 text-[11px]">{{ activeZonesCount }} actives</span>
    </div>

    <div class="grid grid-cols-[minmax(0,1fr)_44px_48px] gap-2 px-2 pb-1 text-[10px] uppercase tracking-wide text-zinc-500 border-b border-zinc-800/80">
      <span>Zone</span>
      <span class="text-right">SOG</span>
      <span class="text-right">Share</span>
    </div>

    <ul class="mt-1 max-h-[420px] overflow-y-auto pr-1 space-y-1">
      <li
        v-for="zone in sortedZones"
        :key="zone.id"
        class="rounded-md border border-zinc-900/60 bg-zinc-900/45 px-2 py-1.5"
      >
        <div class="grid grid-cols-[minmax(0,1fr)_44px_48px] gap-2 items-center text-xs">
          <div class="flex items-center gap-2 min-w-0">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :style="{
                backgroundColor: getShootingZoneTone(zone.sharePct).fillHex,
                opacity: getShootingZoneTone(zone.sharePct).fillOpacity
              }"
            ></span>
            <span class="text-zinc-300 truncate">{{ zone.label }}</span>
          </div>

          <span class="text-zinc-100 text-right font-medium">{{ zone.sog }}</span>
          <span class="text-zinc-300 text-right">{{ zone.sharePct.toFixed(1) }}%</span>
        </div>

        <div class="mt-1 h-1 rounded-full bg-zinc-800/90 overflow-hidden">
          <div
            class="h-full rounded-full"
            :style="{
              width: `${Math.max(zone.sharePct, zone.sog > 0 ? 2 : 0)}%`,
              backgroundColor: getShootingZoneTone(zone.sharePct).fillHex,
              opacity: getShootingZoneTone(zone.sharePct).fillOpacity
            }"
          ></div>
        </div>
      </li>
    </ul>
  </aside>
</template>
