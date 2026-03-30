import { createRouter, createWebHistory } from 'vue-router'
import { initializeAuth, useAuth } from '@/app/auth/composables/useAuth';
import LandingView from '@/app/landing/views/LandingView.vue'
import StandingsView from '@/app/standings/views/StandingsView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: LandingView,
  },
  {
    path: '/standings',
    name: 'standings',
    component: StandingsView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/app/auth/views/LoginView.vue'),
    meta: {
      publicOnly: true,
    },
  },
  {
    path: '/premium',
    name: 'premium-access',
    component: () => import('@/app/auth/views/PremiumAccessView.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/players',
    name: 'players',
    component: () => import('@/app/players/views/PlayersStatsView.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/teams',
    name: 'teams',
    component: () => import('@/app/teams/views/TeamsStatsView.vue'),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/games',
    name: 'games',
    component: () => import('@/app/games/views/GamesView.vue'),
    meta: {
      requiresAuth: true,
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  await initializeAuth();

  const { isAuthenticated } = useAuth();

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (to.meta.publicOnly && isAuthenticated.value) {
    return {
      name: 'games',
    };
  }

  return true;
});

export default router
