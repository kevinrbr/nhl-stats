<script setup lang="ts">
import { computed } from 'vue'
import type { PlayersByPosition } from '@/app/players/types/player'
import type { Player } from '@/app/players/types/player'

const emit = defineEmits<{
  (e: 'select', player: Player): void
}>()

const props = defineProps<{
  players: PlayersByPosition
  selectedPlayerId?: string
}>()

const playersList = computed<Player[]>(() => [
  ...props.players.forwards,
  ...props.players.defensemen,
  ...props.players.goalies,
])
</script>

<template>
  <div>
    <ul class="mt-3 space-y-1">
      <li
        v-for="player in playersList"
        :key="player.id"
      >
        <button
          type="button"
          class="w-full flex items-center gap-4 p-2 rounded-lg text-left transition-colors"
          :class="{
            'bg-zinc-800/90': props.selectedPlayerId === player.id.toString(),
            'hover:bg-zinc-800/70': props.selectedPlayerId !== player.id.toString(),
          }"
          @click="emit('select', player)"
        >
          <img
            :src="player.headshot"
            :alt="player.name"
            class="w-10 h-10 rounded-full object-cover"
          />
          <span class="font-medium text-zinc-100 truncate">
              {{ player.name }} #{{ player.number }}
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>
