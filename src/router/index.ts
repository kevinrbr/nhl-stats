import { createRouter, createWebHistory } from 'vue-router'
import StandingsView from '@/app/standings/views/StandingsView.vue'

const routes = [
  {
    path: '/',
    name: 'standings',
    component: StandingsView,
  },
  {
    path: '/players',
    name: 'players',
    component: () => import('@/app/players/views/PlayersStatsView.vue'),
  },
  {
    path: '/teams',
    name: 'teams',
    component: () => import('@/app/teams/views/TeamsStatsView.vue'),
  },
  {
    path: '/games',
    name: 'games',
    component: () => import('@/app/games/views/GamesView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
