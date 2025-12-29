<script setup lang="ts">
import { useStandingsQuery } from '@/app/standings/queries/useStandingsQuery';
import TeamSelect from '@/app/teams/components/TeamSelect.vue';
import { useTeamRoster } from '@/app/teams/queries/useTeamRoster';
import { computed, ref } from 'vue';
import PlayersList from './PlayersList.vue';
import type { PlayersByPosition } from '../types/player';

const emit = defineEmits<{
  (e: 'select-player', playerId: number): void
}>()

const selectedTeam = ref('COL');
const { data: standings } = useStandingsQuery();
const { data: rosters } = useTeamRoster(selectedTeam);

const teams = computed(() => {
    if (!standings.value) return [];

    return standings.value.map(team => ({
        name: team.teamName.default,
        abbrev: team.teamAbbrev,
    }));
});

const playersByPosition = computed<PlayersByPosition>(() => {
  if (!rosters.value) {
    return { forwards: [], defensemen: [], goalies: [] };
  }

  return {
    forwards: rosters.value.forwards.map(p => ({
      id: p.id,
      name: `${p.firstName.default} ${p.lastName.default}`,
      number: p.sweaterNumber,
      headshot: p.headshot,
    })),
    defensemen: rosters.value.defensemen.map(p => ({
      id: p.id,
      name: `${p.firstName.default} ${p.lastName.default}`,
      number: p.sweaterNumber,
      headshot: p.headshot,
    })),
    goalies: rosters.value.goalies.map(p => ({
      id: p.id,
      name: `${p.firstName.default} ${p.lastName.default}`,
      number: p.sweaterNumber,
      headshot: p.headshot,
    })),
  };
});
</script>

<template>
    <TeamSelect
      v-if="standings"
      v-model="selectedTeam"
      :teams="teams"
    />
    <PlayersList 
      v-if="rosters" 
      :players="playersByPosition" 
      @select="emit('select-player', $event)"
    />
</template>
