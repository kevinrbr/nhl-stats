<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterLink } from 'vue-router';

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
import { getTeamsRoute } from '@/app/teams/utils/teamNavigation';

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

// Vérifier si une équipe est en playoffs
const isInPlayoffs = (team: any): boolean => {
  // Top 3 de la division
  if (team.divisionSequence <= 3) return true;
  
  // Ou Wildcard 1 ou 2
  if (team.wildcardSequence > 0 && team.wildcardSequence <= 2) return true;
  
  return false;
};

// Obtenir le badge de position playoff
const getPlayoffBadge = (team: any): string | null => {
  if (team.divisionSequence <= 3) {
    return `${team.divisionSequence}`;
  }
  if (team.wildcardSequence > 0 && team.wildcardSequence <= 2) {
    return `WC${team.wildcardSequence}`;
  }
  return null;
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
  <section class="app-view space-y-5">
    <header class="rounded-xl border border-zinc-800/80 bg-zinc-900/65 p-5">
      <h1 class="text-zinc-100 text-3xl font-semibold tracking-tight">Standings</h1>
      <p class="text-zinc-400 text-sm mt-1">
        Classement NHL par division et course playoffs
      </p>
    </header>

    <div class="rounded-xl border border-zinc-800/80 bg-zinc-900/65 p-5">
      <div class="flex flex-wrap items-center gap-4 mb-6">
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

        <div class="flex items-center gap-2 rounded-md border border-blue-500/35 bg-blue-500/10 px-3 py-2 text-sm text-zinc-300">
          <div class="w-3 h-3 bg-blue-500/30 border border-blue-400/60 rounded-sm"></div>
          <span>Playoff Position</span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <Table class="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead class="w-12">#</TableHead>
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
              :class="{
                'bg-blue-600/10 hover:bg-blue-600/20': isInPlayoffs(team),
              }"
            >
              <TableCell class="text-center">
                <span
                  v-if="getPlayoffBadge(team)"
                  class="inline-flex items-center justify-center w-8 h-8 text-xs font-bold rounded bg-blue-600 text-white"
                >
                  {{ getPlayoffBadge(team) }}
                </span>
                <span v-else class="text-zinc-500 text-sm">
                  {{ i + 1 }}
                </span>
              </TableCell>

              <TableCell class="flex items-center gap-2">
                <img
                  :src="team.logo"
                  :alt="team.teamName.default"
                  class="w-8 h-8 rounded-sm"
                />
                <RouterLink
                  :to="getTeamsRoute(team.teamAbbrev)"
                  class="text-zinc-100 hover:text-zinc-200 hover:underline underline-offset-2"
                >
                  {{ team.teamName.default }}
                </RouterLink>
              </TableCell>

              <TableCell class="text-center font-semibold">{{ team.points }}</TableCell>
              <TableCell class="text-center">{{ team.gamesPlayed }}</TableCell>
              <TableCell class="text-center">{{ team.wins }}</TableCell>
              <TableCell class="text-center">{{ team.losses }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </section>
</template>
