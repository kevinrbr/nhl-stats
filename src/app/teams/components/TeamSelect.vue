<script setup lang="ts">
import { computed } from 'vue'

import Select from '@/components/ui/select/Select.vue'
import SelectContent from '@/components/ui/select/SelectContent.vue'
import SelectGroup from '@/components/ui/select/SelectGroup.vue'
import SelectItem from '@/components/ui/select/SelectItem.vue'
import SelectTrigger from '@/components/ui/select/SelectTrigger.vue'
import SelectValue from '@/components/ui/select/SelectValue.vue'

interface TeamOption {
  abbrev: string
  name: string
}

const props = defineProps<{
  modelValue: string
  teams: TeamOption[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const selectedTeam = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
})
</script>

<template>
  <section class="team-select">
    <Select v-model="selectedTeam" :disabled="props.disabled">
      <SelectTrigger class="w-full">
        <SelectValue />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectItem
            v-for="team in teams"
            :key="team.abbrev"
            :value="team.abbrev"
          >
            {{ team.name }}
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </section>
</template>
