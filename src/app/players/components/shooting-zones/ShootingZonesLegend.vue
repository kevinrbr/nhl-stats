<script setup lang="ts">
import { getShootingZoneTone } from '@/app/players/utils/shootingZoneUi';

const toneVeryHigh = getShootingZoneTone(24);
const toneHigh = getShootingZoneTone(15);
const toneMedium = getShootingZoneTone(8);
const toneLow = getShootingZoneTone(2);
</script>

<template>
  <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2">
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] gap-3 items-center">
      <p class="text-[11px] text-zinc-400 leading-none">
        Taille du cercle = volume SOG
      </p>

      <div class="inline-flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-zinc-500/80"></span>
        <span class="w-3 h-3 rounded-full bg-zinc-400/80"></span>
        <span class="w-4 h-4 rounded-full bg-zinc-300/90"></span>
      </div>

      <div class="inline-flex items-center gap-1.5 text-[11px] text-zinc-300">
        <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: toneLow.fillHex, opacity: toneLow.fillOpacity }"></span>
        <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: toneMedium.fillHex, opacity: toneMedium.fillOpacity }"></span>
        <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: toneHigh.fillHex, opacity: toneHigh.fillOpacity }"></span>
        <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: toneVeryHigh.fillHex, opacity: toneVeryHigh.fillOpacity }"></span>
        <span class="text-zinc-400 ml-1">Couleur = share %</span>
      </div>
    </div>
  </div>
</template>
