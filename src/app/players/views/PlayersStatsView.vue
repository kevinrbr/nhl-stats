<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useAuth } from '@/app/auth/composables/useAuth';
import PlayerDashboard from '@/app/players/components/PlayerDashboard.vue';
import PlayersSidebar from '@/app/players/components/PlayersSidebar.vue';
import type { Player } from '@/app/players/types/player';
import { ref } from 'vue';

const { isPremium } = useAuth();
const selectedPlayerId = ref<string>('8482947');
const selectedPlayer = ref<Player | null>(null);

const handleSelectPlayer = (player: Player) => {
  selectedPlayerId.value = player.id.toString();
  selectedPlayer.value = player;
};

</script>

<template>
  <section class="app-view app-split">
    <aside class="app-split-sidebar">
      <PlayersSidebar
        :selected-player-id="selectedPlayerId"
        :is-premium="isPremium"
        @select-player="handleSelectPlayer"
      />
    </aside>

    <section class="app-split-content">
      <div
        v-if="!isPremium"
        class="mb-4 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
      >
        Mode free: un seul joueur disponible.
        <RouterLink to="/premium" class="underline underline-offset-2 font-medium">
          Activer premium
        </RouterLink>
      </div>
      <PlayerDashboard
        :selected-player-id="selectedPlayerId"
        :selected-player="selectedPlayer"
      />
    </section>
  </section>
</template>
