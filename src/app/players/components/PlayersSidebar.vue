<script setup lang="ts">
import { useStandingsQuery } from '@/app/standings/queries/useStandingsQuery';
import TeamSelect from '@/app/teams/components/TeamSelect.vue';
import { useTeamRoster } from '@/app/teams/queries/useTeamRoster';
import { computed, ref, watch } from 'vue';
import PlayersList from '@/app/players/components/PlayersList.vue';
import type { PlayersByPosition } from '@/app/players/types/player';
import type { Player } from '@/app/players/types/player';

const props = withDefaults(defineProps<{
  selectedPlayerId?: string;
}>(), {
  selectedPlayerId: '',
});

const emit = defineEmits<{
  (e: 'select-player', player: Player): void
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

const playersList = computed<Player[]>(() => [
  ...playersByPosition.value.forwards,
  ...playersByPosition.value.defensemen,
  ...playersByPosition.value.goalies,
]);

watch([playersList, () => props.selectedPlayerId], ([players, selectedId]) => {
  if (!players.length) return;

  const selectedPlayer =
    players.find((player) => player.id.toString() === selectedId) ?? players[0];

  if (!selectedPlayer) return;
  emit('select-player', selectedPlayer);
}, { immediate: true });
</script>

<template>
  <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/65 p-3">
    <h3 class="text-zinc-100 text-sm font-semibold mb-3 px-1">Players</h3>
    <TeamSelect
      v-if="standings"
      v-model="selectedTeam"
      :teams="teams"
    />
    <PlayersList 
      v-if="rosters" 
      :players="playersByPosition"
      :selected-player-id="props.selectedPlayerId"
      @select="emit('select-player', $event)"
    />
  </div>
</template>
