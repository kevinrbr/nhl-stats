<script setup lang="ts">
defineProps<{
  gameId: number;
}>();
</script>

<template>
  <div class="text-white">
    <h2 class="text-2xl font-bold mb-4">Game Details</h2>
    <p class="text-gray-400">Game ID: {{ gameId }}</p>
    <!-- TODO: Afficher les détails du match -->
  </div>
</template>