<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TeamsSidebar from '@/app/teams/components/TeamsSidebar.vue';
import TeamDashboard from '@/app/teams/components/TeamDashboard.vue';
import {
  DEFAULT_TEAM_ABBREV,
  normalizeTeamAbbrev,
} from '@/app/teams/utils/teamNavigation';

const route = useRoute();
const router = useRouter();

const routeTeam = computed(() =>
  normalizeTeamAbbrev(route.query.team, DEFAULT_TEAM_ABBREV)
);

const selectedTeam = ref<string>(routeTeam.value);

watch(routeTeam, (nextTeam) => {
  if (selectedTeam.value !== nextTeam) {
    selectedTeam.value = nextTeam;
  }
});

watch(selectedTeam, (nextTeam) => {
  const normalizedTeam = normalizeTeamAbbrev(nextTeam, DEFAULT_TEAM_ABBREV);

  if (selectedTeam.value !== normalizedTeam) {
    selectedTeam.value = normalizedTeam;
    return;
  }

  if (routeTeam.value === normalizedTeam) return;

  void router.replace({
    name: 'teams',
    query: {
      ...route.query,
      team: normalizedTeam,
    },
  });
});

const handleSelectTeam = (teamAbbrev: string) => {
  selectedTeam.value = normalizeTeamAbbrev(teamAbbrev, DEFAULT_TEAM_ABBREV);
};
</script>

<template>
  <section class="app-view app-split">
    <aside class="app-split-sidebar">
      <TeamsSidebar
        :selected-team="selectedTeam"
        @select-team="handleSelectTeam"
      />
    </aside>

    <section class="app-split-content">
      <TeamDashboard
        :team="selectedTeam"
        @select-team="handleSelectTeam"
      />
    </section>
  </section>
</template>
