<script setup lang="ts">
import { ref } from 'vue';
import TeamsSidebar from '@/app/teams/components/TeamsSidebar.vue';
import TeamDashboard from '@/app/teams/components/TeamDashboard.vue';

const selectedTeam = ref<string>('COL'); // Valeur par défaut

const handleSelectTeam = (teamAbbrev: string) => {
  selectedTeam.value = teamAbbrev;
};
</script>

<template>
  <section class="flex">
    <aside
      class="w-[250px] pr-4 sticky self-start top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain"
    >
      <TeamsSidebar @select-team="handleSelectTeam" />
    </aside>

    <section class="flex-1">
      <TeamDashboard :team="selectedTeam" />
    </section>
  </section>
</template>
