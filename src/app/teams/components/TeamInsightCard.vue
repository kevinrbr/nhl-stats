<script setup lang="ts">
import { CircleHelp } from 'lucide-vue-next';
import type { Component } from 'vue';
import type {
  TeamInsightCardVariant,
  TeamInsightMetric,
} from '@/app/teams/types/teamInsights';

const props = withDefaults(defineProps<{
  title: string;
  subtitle?: string;
  metrics?: TeamInsightMetric[];
  icon?: Component;
  variant?: TeamInsightCardVariant;
  isLoading?: boolean;
}>(), {
  subtitle: '',
  metrics: () => [],
  icon: undefined,
  variant: 'slate',
  isLoading: false,
});

const toneClass = (tone: TeamInsightMetric['tone'] = 'neutral') => {
  if (tone === 'positive') return 'text-emerald-300';
  if (tone === 'negative') return 'text-rose-300';
  return 'text-zinc-100';
};

const variantClasses: Record<TeamInsightCardVariant, string> = {
  slate: 'border-zinc-700/60 bg-gradient-to-br from-zinc-900/95 via-zinc-900/85 to-slate-900/90',
  emerald: 'border-emerald-700/35 bg-gradient-to-br from-emerald-950/30 via-zinc-900/90 to-zinc-900/95',
  amber: 'border-amber-700/35 bg-gradient-to-br from-amber-950/30 via-zinc-900/90 to-zinc-900/95',
};

const accentClasses: Record<TeamInsightCardVariant, string> = {
  slate: 'from-zinc-400/70 to-slate-400/70',
  emerald: 'from-emerald-400/70 to-teal-300/70',
  amber: 'from-amber-300/70 to-orange-300/70',
};
</script>

<template>
  <div
    class="relative overflow-hidden rounded-xl p-4 border shadow-[0_12px_40px_-30px_rgba(0,0,0,0.9)]"
    :class="variantClasses[props.variant]"
  >
    <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r" :class="accentClasses[props.variant]"></div>

    <div class="flex items-center justify-between gap-3 mb-3">
      <div class="flex items-center gap-2 min-w-0">
        <div
          v-if="props.icon"
          class="w-7 h-7 rounded-md bg-zinc-950/70 border border-zinc-700/60 flex items-center justify-center text-zinc-200"
        >
          <component :is="props.icon" class="w-4 h-4" />
        </div>
        <h3 class="text-zinc-100 text-sm font-semibold truncate">{{ props.title }}</h3>
      </div>
      <span v-if="props.subtitle" class="text-zinc-400 text-xs shrink-0">{{ props.subtitle }}</span>
    </div>

    <div v-if="props.isLoading" class="grid grid-cols-2 gap-3">
      <div v-for="i in 4" :key="i" class="h-11 rounded bg-zinc-700/70 animate-pulse"></div>
    </div>

    <div v-else-if="props.metrics.length > 0" class="grid grid-cols-2 gap-3">
      <div
        v-for="metric in props.metrics"
        :key="metric.id"
        class="bg-zinc-950/65 rounded-lg p-2.5 border border-zinc-700/40"
      >
        <div class="flex items-center gap-1.5">
          <p class="text-zinc-400 text-xs">{{ metric.label }}</p>
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
        <p class="text-base font-semibold mt-1 leading-none" :class="toneClass(metric.tone)">
          {{ metric.value }}
        </p>
      </div>
    </div>

    <div v-else class="text-zinc-400 text-sm py-2">
      No data available
    </div>
  </div>
</template>
