<script setup lang="ts">
import type { Component } from 'vue';
import { RouterLink } from 'vue-router';
import {
  BarChart3,
  Bolt,
  CalendarCheck2,
  ChartNoAxesCombined,
  Crosshair,
  Flag,
  MapPinned,
  ShieldCheck,
  Timer,
} from 'lucide-vue-next';

interface LandingFeature {
  title: string;
  description: string;
  icon: Component;
  tone: 'sky' | 'amber' | 'emerald';
}

const features: LandingFeature[] = [
  {
    title: 'Player Prop Radar',
    description: 'Repere vite les profils chauds via SOG, points, goals et tendances recentes.',
    icon: Crosshair,
    tone: 'sky',
  },
  {
    title: 'H2H Matchup Engine',
    description: 'Visualise les confrontations directes avec des signaux lisibles et actionnables.',
    icon: ChartNoAxesCombined,
    tone: 'amber',
  },
  {
    title: 'Travel + Fatigue Context',
    description: 'Ajoute les impacts de repos, road trip et rythme dans chaque prise de decision.',
    icon: MapPinned,
    tone: 'emerald',
  },
];

const TEAM_LOGO_BASE_URL = 'https://assets.nhle.com/logos/nhl/svg';

const featuredTeams = [
  'BOS',
  'NYR',
  'TOR',
  'VGK',
  'DAL',
  'FLA',
  'COL',
  'EDM',
  'CAR',
  'NJD',
  'TBL',
  'LAK',
];

const showcaseMatchups = [
  {
    home: 'NYR',
    away: 'PHI',
    label: 'Tonight edge',
    note: 'pace gap + road fatigue',
    metric: 'Projected SOG pressure: 32.4',
    tone: 'sky',
  },
  {
    home: 'BOS',
    away: 'TOR',
    label: 'Prop setup',
    note: 'high-event h2h profile',
    metric: 'Top prop confidence: 78%',
    tone: 'amber',
  },
  {
    home: 'DAL',
    away: 'COL',
    label: 'Travel impact',
    note: 'rest advantage detected',
    metric: 'Fatigue delta: medium',
    tone: 'emerald',
  },
] as const;

const proofPoints = [
  {
    title: 'Action-ready board',
    text: 'Matchups, player trends and team context in one flow.',
    icon: Bolt,
    tone: 'sky',
  },
  {
    title: 'Reliable context',
    text: 'Road trip, rest windows and recent h2h blended together.',
    icon: ShieldCheck,
    tone: 'emerald',
  },
  {
    title: 'Fast execution',
    text: 'Move from scan to decision in minutes before puck drop.',
    icon: Flag,
    tone: 'amber',
  },
] as const;

function getTeamLogoUrl(teamAbbrev: string): string {
  return `${TEAM_LOGO_BASE_URL}/${teamAbbrev}_light.svg`;
}

function getFeatureToneClass(tone: LandingFeature['tone']): string {
  if (tone === 'amber') return 'border-amber-400/30 bg-amber-500/10 text-amber-200';
  if (tone === 'emerald') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
  return 'border-sky-400/30 bg-sky-500/10 text-sky-200';
}

function getShowcaseToneClass(tone: (typeof showcaseMatchups)[number]['tone']): string {
  if (tone === 'amber') return 'border-amber-400/30 bg-amber-500/12';
  if (tone === 'emerald') return 'border-emerald-400/30 bg-emerald-500/12';
  return 'border-sky-400/30 bg-sky-500/12';
}

function getProofToneClass(tone: (typeof proofPoints)[number]['tone']): string {
  if (tone === 'amber') return 'border-amber-400/30 bg-amber-500/10 text-amber-100';
  if (tone === 'emerald') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100';
  return 'border-sky-400/30 bg-sky-500/10 text-sky-100';
}
</script>

<template>
  <section class="app-view space-y-6">
    <section
      class="relative overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/80 px-5 py-8 md:px-8 md:py-10"
    >
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-amber-500/10"></div>
      <div class="pointer-events-none absolute -top-28 -left-20 h-80 w-80 rounded-full bg-sky-500/25 blur-3xl"></div>
      <div class="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl"></div>
      <div class="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl"></div>

      <div class="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="space-y-5">
          <div class="inline-flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-950/80 px-3 py-1 text-xs text-zinc-300">
            <CalendarCheck2 class="h-3.5 w-3.5 text-sky-300" />
            NHL Betting Intelligence Platform
          </div>

          <div class="space-y-3">
            <h1 class="text-3xl font-semibold tracking-tight text-zinc-50 md:text-5xl md:leading-[1.04]">
              Analyse plus vite.
              <span class="block bg-gradient-to-r from-sky-300 via-cyan-200 to-amber-300 bg-clip-text text-transparent">
                Prends de meilleures decisions.
              </span>
            </h1>
            <p class="max-w-2xl text-sm leading-relaxed text-zinc-300 md:text-base">
              Donnees NHL structurees, tendances joueur/equipe et contexte matchup dans une interface faite pour l’action.
              Concentre-toi sur les picks solides, pas sur la collecte manuelle.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <RouterLink
              to="/games"
              class="inline-flex items-center gap-2 rounded-md border border-sky-400/40 bg-sky-500/20 px-4 py-2.5 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/30"
            >
              <BarChart3 class="h-4 w-4" />
              Commencer l’analyse
            </RouterLink>

            <RouterLink
              to="/standings"
              class="inline-flex items-center gap-2 rounded-md border border-zinc-700/80 bg-zinc-950/70 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800/80"
            >
              Voir le classement
            </RouterLink>
          </div>

          <div class="rounded-xl border border-zinc-800/80 bg-zinc-950/75 p-3">
            <div class="flex items-center justify-between gap-2 mb-2">
              <p class="text-[11px] uppercase tracking-wide text-zinc-400">Featured teams</p>
              <p class="text-[11px] text-zinc-500">Live NHL coverage</p>
            </div>
            <div class="logo-track flex items-center gap-2 overflow-x-auto pb-1">
              <div
                v-for="teamAbbrev in featuredTeams"
                :key="teamAbbrev"
                class="flex h-10 min-w-10 items-center justify-center rounded-md border border-zinc-800/80 bg-zinc-900/80 px-2"
                :title="teamAbbrev"
              >
                <img
                  :src="getTeamLogoUrl(teamAbbrev)"
                  :alt="teamAbbrev"
                  class="h-7 w-7 object-contain"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2.5">
              <p class="text-[11px] uppercase tracking-wide text-zinc-500">Signal time</p>
              <p class="mt-1 text-sm font-semibold text-zinc-100">&lt; 10 min / game</p>
            </div>
            <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2.5">
              <p class="text-[11px] uppercase tracking-wide text-zinc-500">Core markets</p>
              <p class="mt-1 text-sm font-semibold text-zinc-100">SOG, PTS, Goals</p>
            </div>
            <div class="rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2.5">
              <p class="text-[11px] uppercase tracking-wide text-zinc-500">Designed for</p>
              <p class="mt-1 text-sm font-semibold text-zinc-100">NHL bettors & analysts</p>
            </div>
          </div>
        </div>

        <aside class="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-4 md:p-5">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-zinc-200">Tonight preview</h2>
            <span class="rounded-full border border-emerald-500/35 bg-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-200">
              Live
            </span>
          </div>

          <div class="mt-4 space-y-2.5">
            <div class="rounded-lg border border-zinc-800/80 bg-zinc-900/75 p-3">
              <p class="text-xs text-zinc-400">Game context</p>
              <p class="mt-1 text-sm font-medium text-zinc-100">Rangers vs Flyers</p>
              <p class="mt-1 text-xs text-zinc-300">Fatigue gap + pace mismatch detecte</p>
            </div>

            <div
              v-for="matchup in showcaseMatchups"
              :key="`${matchup.home}-${matchup.away}`"
              class="rounded-lg border p-3"
              :class="getShowcaseToneClass(matchup.tone)"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] uppercase tracking-wide text-zinc-300">{{ matchup.label }}</span>
                <span class="text-[11px] text-zinc-300">{{ matchup.home }} vs {{ matchup.away }}</span>
              </div>

              <div class="mt-2 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <img :src="getTeamLogoUrl(matchup.home)" :alt="matchup.home" class="h-7 w-7 object-contain" />
                  <img :src="getTeamLogoUrl(matchup.away)" :alt="matchup.away" class="h-7 w-7 object-contain" />
                </div>
                <p class="text-xs font-medium text-zinc-100">{{ matchup.metric }}</p>
              </div>

              <p class="mt-1.5 text-xs text-zinc-300">{{ matchup.note }}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>

    <section class="grid gap-3 md:grid-cols-3">
      <article
        v-for="feature in features"
        :key="feature.title"
        class="rounded-xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/75 to-zinc-950/80 p-4"
      >
        <div
          class="inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium"
          :class="getFeatureToneClass(feature.tone)"
        >
          <component :is="feature.icon" class="h-4 w-4" />
          {{ feature.title }}
        </div>
        <p class="mt-3 text-sm leading-relaxed text-zinc-300">
          {{ feature.description }}
        </p>
      </article>
    </section>

    <section class="grid gap-3 md:grid-cols-3">
      <article
        v-for="proof in proofPoints"
        :key="proof.title"
        class="rounded-xl border p-4"
        :class="getProofToneClass(proof.tone)"
      >
        <div class="flex items-center gap-2">
          <component :is="proof.icon" class="h-4 w-4" />
          <h3 class="text-sm font-semibold">{{ proof.title }}</h3>
        </div>
        <p class="mt-2 text-sm leading-relaxed text-zinc-200/90">{{ proof.text }}</p>
      </article>
    </section>

    <section class="rounded-2xl border border-zinc-800/90 bg-zinc-900/75 p-6 md:p-7">
      <div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 class="text-2xl font-semibold tracking-tight text-zinc-50">
            Passe de l’intuition au process.
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-zinc-300 md:text-base">
            Tu peux garder la version gratuite pour explorer. Quand tu veux aller plus loin, la version payante te donne
            un workflow complet pour preparer tes picks NHL rapidement.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 lg:justify-end">
          <RouterLink
            to="/games"
            class="inline-flex items-center gap-2 rounded-md border border-zinc-700/80 bg-zinc-950/70 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800/80"
          >
            <Timer class="h-4 w-4 text-zinc-300" />
            Tester les matchs
          </RouterLink>

          <RouterLink
            to="/teams"
            class="inline-flex items-center gap-2 rounded-md border border-sky-400/35 bg-sky-500/15 px-4 py-2.5 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/25"
          >
            <ChartNoAxesCombined class="h-4 w-4" />
            Explorer les equipes
          </RouterLink>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.logo-track {
  scrollbar-width: none;
}

.logo-track::-webkit-scrollbar {
  display: none;
}
</style>
