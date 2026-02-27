<script setup lang="ts">
import { CircleHelp } from 'lucide-vue-next';
import type { TeamKpiMetric } from '@/app/teams/types/teamInsights';

const props = withDefaults(defineProps<{
  metrics: TeamKpiMetric[];
  isLoading?: boolean;
}>(), {
  isLoading: false,
});

function toneClass(tone: TeamKpiMetric['tone'] = 'neutral'): string {
  if (tone === 'positive') return 'text-emerald-300';
  if (tone === 'negative') return 'text-rose-300';
  return 'text-zinc-100';
}
</script>

<template>
  <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/70 p-2">
    <div v-if="props.isLoading" class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
      <div
        v-for="index in 7"
        :key="index"
        class="h-[66px] rounded-lg border border-zinc-800 bg-zinc-950/60 animate-pulse"
      ></div>
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">
      <div
        v-for="metric in props.metrics"
        :key="metric.id"
        class="rounded-lg border border-zinc-800 bg-zinc-950/65 px-3 py-2"
      >
        <div class="flex items-center gap-1.5">
          <p class="text-[11px] uppercase tracking-wide text-zinc-500">{{ metric.label }}</p>
          <span
            v-if="metric.helpText"
            class="relative inline-flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-help group/help"
            :aria-label="metric.helpText"
            tabindex="0"
          >
            <CircleHelp class="w-3.5 h-3.5" />
            <span
              class="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover/help:opacity-100 group-focus-visible/help:opacity-100"
            >
              {{ metric.helpText }}
            </span>
          </span>
        </div>
        <p class="text-base leading-none font-semibold mt-1.5" :class="toneClass(metric.tone)">
          {{ metric.value }}
        </p>
        <p class="text-[11px] text-zinc-500 mt-1 min-h-[14px]">
          {{ metric.meta ?? '' }}
        </p>
      </div>
    </div>
  </div>
</template>
