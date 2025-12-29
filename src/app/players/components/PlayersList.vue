<script setup lang="ts">
import { computed } from 'vue'
import type { PlayersByPosition } from '@/app/players/types/player'
import type { Player } from '@/app/players/types/player'

const emit = defineEmits<{
  (e: 'select', playerId: number): void
}>()

const props = defineProps<{
  players: PlayersByPosition
}>()

const playersList = computed<Player[]>(() => [
  ...props.players.forwards,
  ...props.players.defensemen,
  ...props.players.goalies,
])
</script>

<template>
  <div>
    <ul class="mt-8">
      <li
        v-for="player in playersList"
        :key="player.id"
        class="flex items-center mb-2"
        @click="emit('select', player.id)"
      >
        <img
          :src="player.headshot"
          alt=""
          class="w-12 h-12 rounded-full mr-4"
        />
        <span class="font-medium">
            {{ player.name }} #{{ player.number }}
        </span>
      </li>
    </ul>
  </div>
</template>


