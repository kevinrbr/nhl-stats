<script setup lang="ts">
import { computed } from 'vue';
import { getShootingZoneTone } from '@/app/players/utils/shootingZoneUi';

const props = defineProps<{
  x: number;
  y: number;
  label: string;
  sog: number;
  sharePct: number;
  radius: number;
}>();

const tone = computed(() => getShootingZoneTone(props.sharePct));

const shouldShowValue = computed(() => props.sog > 0 && props.radius >= 3.1);
const textColor = computed(() => tone.value.textHex);
</script>

<template>
  <g :transform="`translate(${props.x}, ${props.y})`" style="filter: drop-shadow(0 0.75px 0.85px rgba(15, 23, 42, 0.5));">
    <circle
      :r="props.radius"
      :fill="tone.fillHex"
      :fill-opacity="tone.fillOpacity"
      stroke="#0f172a"
      stroke-opacity="0.58"
      stroke-width="0.42"
    />

    <circle
      :r="Math.max(props.radius - 1.1, 0)"
      fill="none"
      stroke="#f8fafc"
      stroke-opacity="0.3"
      stroke-width="0.35"
    />

    <text
      v-if="shouldShowValue"
      x="0"
      y="1.05"
      font-size="2.2"
      text-anchor="middle"
      :fill="textColor"
      font-weight="700"
    >
      {{ props.sog }}
    </text>

    <title>{{ props.label }} · {{ props.sog }} SOG · {{ props.sharePct.toFixed(1) }}%</title>
  </g>
</template>
