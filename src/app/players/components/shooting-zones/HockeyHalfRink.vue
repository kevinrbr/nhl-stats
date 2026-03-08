<script setup lang="ts">
import { computed } from 'vue';
import ShootingZoneBubble from '@/app/players/components/shooting-zones/ShootingZoneBubble.vue';
import type { PlayerShootingZoneStat } from '@/app/players/types/playerShootingZones';

const props = defineProps<{
  zones: PlayerShootingZoneStat[];
}>();

const maxSog = computed(() =>
  props.zones.reduce((currentMax, zone) => Math.max(currentMax, zone.sog), 0)
);

function radiusFromSog(sog: number): number {
  if (maxSog.value <= 0) return 1.35;

  const minRadius = 1.35;
  const maxRadius = 5.2;
  const normalized = Math.sqrt(sog / maxSog.value);
  return minRadius + normalized * (maxRadius - minRadius);
}

const zonesByDensity = computed(() =>
  [...props.zones].sort((a, b) => a.sog - b.sog)
);

const zonesToRender = computed(() => zonesByDensity.value.filter((zone) => zone.sog > 0));

const rinkGeometry = {
  outerX: 4,
  outerY: 4,
  outerWidth: 92,
  outerHeight: 66,
  outerTopRadius: 10,
  goalLineY: 9.5,
  blueLineY: 42,
  centerLineY: 64.5,
  leftFaceoffX: 30,
  rightFaceoffX: 70,
  faceoffY: 27,
  faceoffRadius: 8.4,
  neutralDotY: 52,
  neutralDotLeftX: 39.5,
  neutralDotRightX: 60.5,
  creaseX: 50,
  creaseY: 9.5,
  creaseRadius: 4.1,
};

const rinkOuterRight = rinkGeometry.outerX + rinkGeometry.outerWidth;
const rinkOuterBottom = rinkGeometry.outerY + rinkGeometry.outerHeight;

const rinkShapePath = [
  `M ${rinkGeometry.outerX} ${rinkOuterBottom}`,
  `L ${rinkGeometry.outerX} ${rinkGeometry.outerY + rinkGeometry.outerTopRadius}`,
  `Q ${rinkGeometry.outerX} ${rinkGeometry.outerY} ${rinkGeometry.outerX + rinkGeometry.outerTopRadius} ${rinkGeometry.outerY}`,
  `L ${rinkOuterRight - rinkGeometry.outerTopRadius} ${rinkGeometry.outerY}`,
  `Q ${rinkOuterRight} ${rinkGeometry.outerY} ${rinkOuterRight} ${rinkGeometry.outerY + rinkGeometry.outerTopRadius}`,
  `L ${rinkOuterRight} ${rinkOuterBottom}`,
  `L ${rinkGeometry.outerX} ${rinkOuterBottom}`,
  'Z',
].join(' ');

const rinkOutlinePath = [
  `M ${rinkGeometry.outerX} ${rinkOuterBottom}`,
  `L ${rinkGeometry.outerX} ${rinkGeometry.outerY + rinkGeometry.outerTopRadius}`,
  `Q ${rinkGeometry.outerX} ${rinkGeometry.outerY} ${rinkGeometry.outerX + rinkGeometry.outerTopRadius} ${rinkGeometry.outerY}`,
  `L ${rinkOuterRight - rinkGeometry.outerTopRadius} ${rinkGeometry.outerY}`,
  `Q ${rinkOuterRight} ${rinkGeometry.outerY} ${rinkOuterRight} ${rinkGeometry.outerY + rinkGeometry.outerTopRadius}`,
  `L ${rinkOuterRight} ${rinkOuterBottom}`,
].join(' ');
</script>

<template>
  <div class="w-full max-w-[730px] mx-auto rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
    <svg
      viewBox="0 0 100 74"
      class="w-full h-auto max-h-[440px]"
      role="img"
      aria-label="Half offensive hockey rink with shooting zones"
    >
      <defs>
        <linearGradient id="rinkBackground" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1c2635" />
          <stop offset="100%" stop-color="#121a28" />
        </linearGradient>
        <pattern id="iceSpeckle" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.4" r="0.28" fill="#bfdbfe" fill-opacity="0.14" />
          <circle cx="4.6" cy="2.7" r="0.25" fill="#dbeafe" fill-opacity="0.1" />
          <circle cx="2.8" cy="5.2" r="0.24" fill="#93c5fd" fill-opacity="0.12" />
        </pattern>
        <clipPath id="creaseBelowGoalLine">
          <rect
            :x="rinkGeometry.outerX"
            :y="rinkGeometry.goalLineY"
            :width="rinkGeometry.outerWidth"
            :height="rinkGeometry.outerHeight - (rinkGeometry.goalLineY - rinkGeometry.outerY)"
          />
        </clipPath>
        <clipPath id="rinkShapeClip">
          <path :d="rinkShapePath" />
        </clipPath>
      </defs>

      <path :d="rinkShapePath" fill="url(#rinkBackground)" />
      <rect
        :x="rinkGeometry.outerX"
        :y="rinkGeometry.outerY"
        :width="rinkGeometry.outerWidth"
        :height="rinkGeometry.outerHeight"
        fill="url(#iceSpeckle)"
        opacity="0.55"
        clip-path="url(#rinkShapeClip)"
      />
      <path :d="rinkOutlinePath" fill="none" stroke="#8aa0bc" stroke-width="0.52" />

      <!-- Goal line / Blue line / Center line -->
      <line x1="8" :y1="rinkGeometry.goalLineY" x2="92" :y2="rinkGeometry.goalLineY" stroke="#ef4444" stroke-width="0.58" />
      <line x1="6" :y1="rinkGeometry.blueLineY" x2="94" :y2="rinkGeometry.blueLineY" stroke="#3b82f6" stroke-width="0.84" />
      <line x1="6" :y1="rinkGeometry.centerLineY" x2="94" :y2="rinkGeometry.centerLineY" stroke="#ef4444" stroke-width="0.84" />

      <!-- Slot/crease in front of goal -->
      <circle
        :cx="rinkGeometry.creaseX"
        :cy="rinkGeometry.creaseY"
        :r="rinkGeometry.creaseRadius"
        fill="#22d3ee"
        fill-opacity="0.22"
        clip-path="url(#creaseBelowGoalLine)"
      />
      <circle
        :cx="rinkGeometry.creaseX"
        :cy="rinkGeometry.creaseY"
        :r="rinkGeometry.creaseRadius"
        fill="none"
        stroke="#38bdf8"
        stroke-opacity="0.9"
        stroke-width="0.45"
        clip-path="url(#creaseBelowGoalLine)"
      />
      <circle :cx="rinkGeometry.creaseX" :cy="rinkGeometry.creaseY" r="0.55" fill="#ef4444" />
      <rect x="48.7" y="8.2" width="2.6" height="1.3" fill="#fca5a5" fill-opacity="0.45" stroke="#ef4444" stroke-width="0.18" />

      <!-- Offensive faceoff circles -->
      <circle :cx="rinkGeometry.leftFaceoffX" :cy="rinkGeometry.faceoffY" :r="rinkGeometry.faceoffRadius" fill="none" stroke="#ef4444" stroke-width="0.44" />
      <circle :cx="rinkGeometry.rightFaceoffX" :cy="rinkGeometry.faceoffY" :r="rinkGeometry.faceoffRadius" fill="none" stroke="#ef4444" stroke-width="0.44" />
      <circle :cx="rinkGeometry.leftFaceoffX" :cy="rinkGeometry.faceoffY" r="0.65" fill="#ef4444" />
      <circle :cx="rinkGeometry.rightFaceoffX" :cy="rinkGeometry.faceoffY" r="0.65" fill="#ef4444" />
      <line :x1="rinkGeometry.leftFaceoffX - 2.4" :y1="rinkGeometry.faceoffY" :x2="rinkGeometry.leftFaceoffX - 0.9" :y2="rinkGeometry.faceoffY" stroke="#ef4444" stroke-width="0.34" />
      <line :x1="rinkGeometry.leftFaceoffX + 0.9" :y1="rinkGeometry.faceoffY" :x2="rinkGeometry.leftFaceoffX + 2.4" :y2="rinkGeometry.faceoffY" stroke="#ef4444" stroke-width="0.34" />
      <line :x1="rinkGeometry.leftFaceoffX" :y1="rinkGeometry.faceoffY - 2.4" :x2="rinkGeometry.leftFaceoffX" :y2="rinkGeometry.faceoffY - 0.9" stroke="#ef4444" stroke-width="0.34" />
      <line :x1="rinkGeometry.leftFaceoffX" :y1="rinkGeometry.faceoffY + 0.9" :x2="rinkGeometry.leftFaceoffX" :y2="rinkGeometry.faceoffY + 2.4" stroke="#ef4444" stroke-width="0.34" />
      <line :x1="rinkGeometry.rightFaceoffX - 2.4" :y1="rinkGeometry.faceoffY" :x2="rinkGeometry.rightFaceoffX - 0.9" :y2="rinkGeometry.faceoffY" stroke="#ef4444" stroke-width="0.34" />
      <line :x1="rinkGeometry.rightFaceoffX + 0.9" :y1="rinkGeometry.faceoffY" :x2="rinkGeometry.rightFaceoffX + 2.4" :y2="rinkGeometry.faceoffY" stroke="#ef4444" stroke-width="0.34" />
      <line :x1="rinkGeometry.rightFaceoffX" :y1="rinkGeometry.faceoffY - 2.4" :x2="rinkGeometry.rightFaceoffX" :y2="rinkGeometry.faceoffY - 0.9" stroke="#ef4444" stroke-width="0.34" />
      <line :x1="rinkGeometry.rightFaceoffX" :y1="rinkGeometry.faceoffY + 0.9" :x2="rinkGeometry.rightFaceoffX" :y2="rinkGeometry.faceoffY + 2.4" stroke="#ef4444" stroke-width="0.34" />

      <!-- Neutral dots -->
      <circle :cx="rinkGeometry.neutralDotLeftX" :cy="rinkGeometry.neutralDotY" r="0.6" fill="#ef4444" />
      <circle :cx="rinkGeometry.neutralDotRightX" :cy="rinkGeometry.neutralDotY" r="0.6" fill="#ef4444" />

      <ShootingZoneBubble
        v-for="zone in zonesToRender"
        :key="zone.id"
        :x="zone.position.x"
        :y="zone.position.y"
        :label="zone.label"
        :sog="zone.sog"
        :share-pct="zone.sharePct"
        :radius="radiusFromSog(zone.sog)"
      />
    </svg>
  </div>
</template>
