<script setup lang="ts">
import { ref, computed } from "vue";

import {
  Select,
  SelectItem,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStandingsQuery } from "@/app/standings/queries/useStandingsQuery";

const DIVISION_MAP: Record<string, string> = {
  atlantique: "Atlantic",
  metropolitaine: "Metropolitan",
  centrale: "Central",
  pacifique: "Pacific",
};

type SortKey = "teamName" | "points" | "wins" | "losses" | "gamesPlayed";
type SortOrder = "asc" | "desc";

const { data: rankings } = useStandingsQuery();

const sortKey = ref<SortKey>("points");
const sortOrder = ref<SortOrder>("desc");
const selectedDivision = ref("toutes");

const handleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
};

const filteredTeams = computed(() => {
  if (!rankings.value) return [];

  if (selectedDivision.value === "toutes") {
    return rankings.value;
  }

  return rankings.value.filter(
    (team) => team.divisionName === DIVISION_MAP[selectedDivision.value]
  );
});

const sortedTeams = computed(() => {
  const teams = [...filteredTeams.value];

  return teams.sort((a, b) => {
    let valA, valB;

    switch (sortKey.value) {
      case "teamName":
        valA = a.teamName;
        valB = b.teamName;
        break;

      case "points":
        valA = a.points;
        valB = b.points;
        break;

      case "wins":
        valA = a.wins;
        valB = b.wins;
        break;

      case "losses":
        valA = a.losses;
        valB = b.losses;
        break;

      case "gamesPlayed":
        valA = a.gamesPlayed;
        valB = b.gamesPlayed;
        break;

      default:
        return 0;
    }

    if (valA < valB) return sortOrder.value === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder.value === "asc" ? 1 : -1;
    return 0;
  });
});
</script>

<template>
  <div>
    <h2 class="text-5xl font-bold mb-6">Standings</h2>

    <Select v-model="selectedDivision">
      <SelectTrigger class="w-[280px]">
        <SelectValue placeholder="Toutes les divisions" />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          <SelectItem value="toutes">Toutes les divisions</SelectItem>
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Conférence Est</SelectLabel>
          <SelectItem value="atlantique">Division Atlantique</SelectItem>
          <SelectItem value="metropolitaine">Division Métropolitaine</SelectItem>
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>Conférence Ouest</SelectLabel>
          <SelectItem value="centrale">Division Centrale</SelectItem>
          <SelectItem value="pacifique">Division Pacifique</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>

    <!-- Table -->
    <Table class="mt-6">
      <TableHeader>
        <TableRow>
          <TableHead
            class="cursor-pointer select-none"
            @click="handleSort('teamName')"
          >
            Équipe
            <span v-if="sortKey === 'teamName'">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </TableHead>

          <TableHead
            class="cursor-pointer select-none text-center"
            @click="handleSort('points')"
          >
            Points
            <span v-if="sortKey === 'points'">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </TableHead>

          <TableHead
            class="cursor-pointer select-none text-center"
            @click="handleSort('gamesPlayed')"
          >
            G
            <span v-if="sortKey === 'gamesPlayed'">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </TableHead>

          <TableHead
            class="cursor-pointer select-none text-center"
            @click="handleSort('wins')"
          >
            W
            <span v-if="sortKey === 'wins'">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </TableHead>

          <TableHead
            class="cursor-pointer select-none text-center"
            @click="handleSort('losses')"
          >
            L
            <span v-if="sortKey === 'losses'">
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        <TableRow
          v-for="(team, i) in sortedTeams"
          :key="i"
        >
          <TableCell class="flex items-center gap-2">
            <img
              :src="team.logo"
              :alt="team.teamName.default"
              class="w-8 h-8 rounded-sm"
            />
            <span>{{ team.teamName.default }}</span>
          </TableCell>

          <TableCell class="text-center">{{ team.points }}</TableCell>
          <TableCell class="text-center">{{ team.gamesPlayed }}</TableCell>
          <TableCell class="text-center">{{ team.wins }}</TableCell>
          <TableCell class="text-center">{{ team.losses }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
