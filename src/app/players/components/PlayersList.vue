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
  isPremium?: boolean
}>()

const playersList = computed<Player[]>(() => [
  ...props.players.forwards,
  ...props.players.defensemen,
  ...props.players.goalies,
])

const isPlayerLocked = (index: number) => !props.isPremium && index > 0;
</script>

<template>
  <div>
    <ul class="mt-3 space-y-1">
      <li
        v-for="(player, index) in playersList"
        :key="player.id"
      >
        <button
          type="button"
          class="w-full flex items-center gap-4 p-2 rounded-lg text-left transition-colors"
          :class="{
            'bg-zinc-800/90': props.selectedPlayerId === player.id.toString(),
            'hover:bg-zinc-800/70': props.selectedPlayerId !== player.id.toString() && !isPlayerLocked(index),
            'opacity-70 cursor-not-allowed': isPlayerLocked(index),
          }"
          @click="!isPlayerLocked(index) && emit('select', player)"
        >
          <img
            :src="player.headshot"
            :alt="player.name"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div class="flex-1 min-w-0 flex items-center justify-between gap-2">
            <span class="font-medium text-zinc-100 truncate">
                {{ player.name }} #{{ player.number }}
            </span>
            <span
              v-if="isPlayerLocked(index)"
              class="text-[11px] rounded border border-amber-500/35 bg-amber-500/10 px-1.5 py-0.5 text-amber-200"
            >
              Premium
            </span>
          </div>
        </button>
      </li>
    </ul>
  </div>
</template>
