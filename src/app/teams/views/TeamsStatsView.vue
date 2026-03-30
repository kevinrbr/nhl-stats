<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/app/auth/composables/useAuth';
import { useStandingsQuery } from '@/app/standings/queries/useStandingsQuery';
import TeamsSidebar from '@/app/teams/components/TeamsSidebar.vue';
import TeamDashboard from '@/app/teams/components/TeamDashboard.vue';
import {
  DEFAULT_TEAM_ABBREV,
  normalizeTeamAbbrev,
} from '@/app/teams/utils/teamNavigation';

const route = useRoute();
const router = useRouter();
const { isPremium } = useAuth();
const { data: standings } = useStandingsQuery();

const firstAllowedTeam = computed(() => {
  if (!standings.value?.length) return DEFAULT_TEAM_ABBREV;

  const alphabeticTeams = [...standings.value].sort((a, b) =>
    a.teamName.default.localeCompare(b.teamName.default)
  );

  return alphabeticTeams[0]?.teamAbbrev ?? DEFAULT_TEAM_ABBREV;
});

const routeTeam = computed(() =>
  normalizeTeamAbbrev(route.query.team, DEFAULT_TEAM_ABBREV)
);

const normalizeAccessibleTeam = (teamAbbrev: string) => {
  const normalizedTeam = normalizeTeamAbbrev(teamAbbrev, DEFAULT_TEAM_ABBREV);
  if (isPremium.value) return normalizedTeam;
  return firstAllowedTeam.value;
};

const selectedTeam = ref<string>(routeTeam.value);

watch([routeTeam, isPremium, firstAllowedTeam], ([nextTeam]) => {
  const allowedTeam = normalizeAccessibleTeam(nextTeam);
  if (selectedTeam.value !== allowedTeam) {
    selectedTeam.value = allowedTeam;
  }
});

watch([selectedTeam, isPremium, firstAllowedTeam], ([nextTeam]) => {
  const normalizedTeam = normalizeAccessibleTeam(nextTeam);

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
  selectedTeam.value = normalizeAccessibleTeam(teamAbbrev);
};
</script>

<template>
  <section class="app-view app-split">
    <aside class="app-split-sidebar">
      <TeamsSidebar
        :selected-team="selectedTeam"
        :is-premium="isPremium"
        @select-team="handleSelectTeam"
      />
    </aside>

    <section class="app-split-content">
      <div
        v-if="!isPremium"
        class="mb-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
      >
        Mode free: une seule équipe disponible.
        <RouterLink to="/premium" class="underline underline-offset-2 font-medium">
          Activer premium
        </RouterLink>
      </div>
      <TeamDashboard
        :team="selectedTeam"
        @select-team="handleSelectTeam"
      />
    </section>
  </section>
</template>
