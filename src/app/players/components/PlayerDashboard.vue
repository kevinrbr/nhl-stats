<script lang="ts" setup>
import { usePlayerLogs } from '@/app/players/queries/usePlayerLogs';
import { toRefs } from 'vue';

const props = defineProps<{
  selectedPlayerId: string
}>()

const { selectedPlayerId } = toRefs(props);

const { data: playerLogs } = usePlayerLogs(selectedPlayerId);
</script>
<template>
    <section>
        ici
        <pre>{{ playerLogs }}</pre>
    </section>
</template>
