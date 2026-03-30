<script setup lang="ts">
import type { UpcomingGame } from '@/app/games/presenters/games.presenter';
import { RouterLink } from 'vue-router';
import { getTeamsRoute } from '@/app/teams/utils/teamNavigation';

const props = withDefaults(defineProps<{
  game: UpcomingGame;
  locked?: boolean;
}>(), {
  locked: false,
});

const emit = defineEmits<{
  (e: 'select', game: UpcomingGame): void;
}>();

const handleSelect = () => {
  if (props.locked) return;
  emit('select', props.game);
};
</script>

<template>
  <div
    :role="props.locked ? undefined : 'button'"
    :tabindex="props.locked ? -1 : 0"
    @click="handleSelect"
    @keydown.enter.prevent="handleSelect"
    @keydown.space.prevent="handleSelect"
    class="w-full rounded-lg p-4 transition-colors border border-zinc-800/90 bg-zinc-950/35"
    :class="props.locked
      ? 'opacity-70 cursor-not-allowed'
      : 'hover:bg-zinc-800/55 cursor-pointer'"
  >
    <div class="flex items-center justify-between gap-4">
      <div class="flex flex-col items-center flex-1">
        <img 
          :src="game.homeTeam.logo" 
          :alt="game.homeTeam.name"
          class="w-12 h-12 object-contain mb-2"
        />
        <RouterLink
          :to="getTeamsRoute(game.homeTeam.abbrev)"
          class="text-zinc-100 text-sm font-medium hover:underline underline-offset-2"
          @click.stop
        >
          {{ game.homeTeam.abbrev }}
        </RouterLink>
      </div>

      <div class="flex flex-col items-center">
        <span class="text-zinc-400 text-xs mb-1">{{ game.dayAbbrev }}</span>
        <span class="text-zinc-100 text-sm font-semibold">{{ game.startTime }}</span>
      </div>

      <div class="flex flex-col items-center flex-1">
        <img 
          :src="game.awayTeam.logo" 
          :alt="game.awayTeam.name"
          class="w-12 h-12 object-contain mb-2"
        />
        <RouterLink
          :to="getTeamsRoute(game.awayTeam.abbrev)"
          class="text-zinc-100 text-sm font-medium hover:underline underline-offset-2"
          @click.stop
        >
          @{{ game.awayTeam.abbrev }}
        </RouterLink>
      </div>
    </div>

    <div
      v-if="props.locked"
      class="mt-3 rounded-md border border-amber-500/35 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200"
    >
      Premium requis pour ouvrir ce match
    </div>
  </div>
</template>
