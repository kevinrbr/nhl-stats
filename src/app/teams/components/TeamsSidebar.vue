<script setup lang="ts">
import { useStandingsQuery } from '@/app/standings/queries/useStandingsQuery';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  selectedTeam?: string;
}>(), {
  selectedTeam: 'COL',
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

const handleTeamClick = (teamAbbrev: string) => {
  emit('select-team', teamAbbrev);
};
</script>

<template>
  <div>
    <h3 class="text-white font-semibold mb-4">Teams</h3>
    
    <ul class="space-y-1">
      <li
        v-for="team in sortedTeams"
        :key="team.teamAbbrev"
      >
        <button
          @click="handleTeamClick(team.teamAbbrev)"
          class="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors text-left"
          :class="{ 'bg-gray-800': props.selectedTeam === team.teamAbbrev }"
        >
          <img 
            :src="team.logo" 
            :alt="team.teamName.default"
            class="w-8 h-8 object-contain"
          />
          <span class="text-white text-sm">
            {{ team.teamName.default }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
