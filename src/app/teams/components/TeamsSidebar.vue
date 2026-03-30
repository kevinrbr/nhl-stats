<script setup lang="ts">
import { useStandingsQuery } from '@/app/standings/queries/useStandingsQuery';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  selectedTeam?: string;
  isPremium?: boolean;
}>(), {
  selectedTeam: 'COL',
  isPremium: false,
});

const emit = defineEmits<{
  (e: 'select-team', teamAbbrev: string): void
}>();

const { data: standings } = useStandingsQuery();

const sortedTeams = computed(() => {
  if (!standings.value) return [];

  return [...standings.value]
    .sort((a, b) => a.teamName.default.localeCompare(b.teamName.default));
});

const firstTeamAbbrev = computed(() => sortedTeams.value[0]?.teamAbbrev ?? null);

const handleTeamClick = (teamAbbrev: string) => {
  if (!props.isPremium && firstTeamAbbrev.value && teamAbbrev !== firstTeamAbbrev.value) {
    return;
  }

  emit('select-team', teamAbbrev);
};
</script>

<template>
  <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/65 p-3">
    <h3 class="text-zinc-100 text-sm font-semibold mb-3 px-2">Teams</h3>
    
    <ul class="space-y-1">
      <li
        v-for="team in sortedTeams"
        :key="team.teamAbbrev"
      >
        <button
          @click="handleTeamClick(team.teamAbbrev)"
          class="w-full flex items-center justify-between gap-3 p-2 rounded-lg transition-colors text-left"
          :class="[
            props.selectedTeam === team.teamAbbrev ? 'bg-zinc-800/90' : 'hover:bg-zinc-800/70',
            !props.isPremium && firstTeamAbbrev && team.teamAbbrev !== firstTeamAbbrev
              ? 'opacity-70 cursor-not-allowed'
              : '',
          ]"
        >
          <div class="flex items-center gap-3 min-w-0">
            <img 
              :src="team.logo" 
              :alt="team.teamName.default"
              class="w-8 h-8 object-contain"
            />
            <span class="text-zinc-100 text-sm truncate">
              {{ team.teamName.default }}
            </span>
          </div>

          <span
            v-if="!props.isPremium && firstTeamAbbrev && team.teamAbbrev !== firstTeamAbbrev"
            class="text-[11px] rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-amber-200"
          >
            Premium
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
