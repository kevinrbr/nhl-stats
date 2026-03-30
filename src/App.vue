<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { computed, onMounted } from 'vue';
import { useAuth } from '@/app/auth/composables/useAuth';

const { initializeAuth, isAuthenticated, isPremium, userEmail, signOut } = useAuth();

const accessBadgeLabel = computed(() => {
  if (!isAuthenticated.value) return 'Guest';
  return isPremium.value ? 'Premium' : 'Free';
});

const accessBadgeClass = computed(() => {
  if (!isAuthenticated.value) return 'border-zinc-700 text-zinc-300';
  if (isPremium.value) return 'border-emerald-500/35 bg-emerald-500/12 text-emerald-200';
  return 'border-amber-500/35 bg-amber-500/12 text-amber-200';
});

async function handleSignOut() {
  await signOut();
}

onMounted(() => {
  void initializeAuth();
});
</script>

<template>
  <header class="app-topbar">
    <div class="app-topbar-inner">
      <nav class="app-nav">
        <RouterLink
          to="/"
          class="app-nav-link"
          exact-active-class="app-nav-link-active"
        >
          Accueil
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated"
          to="/standings"
          class="app-nav-link"
          exact-active-class="app-nav-link-active"
        >
          Classement
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated"
          to="/teams"
          class="app-nav-link"
          exact-active-class="app-nav-link-active"
        >
          Equipes
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated"
          to="/players"
          class="app-nav-link"
          exact-active-class="app-nav-link-active"
        >
          Players
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated"
          to="/games"
          class="app-nav-link"
          exact-active-class="app-nav-link-active"
        >
          Games
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated"
          to="/premium"
          class="app-nav-link"
          exact-active-class="app-nav-link-active"
        >
          Premium
        </RouterLink>

        <RouterLink
          v-if="!isAuthenticated"
          to="/login"
          class="app-nav-link"
          exact-active-class="app-nav-link-active"
        >
          Login
        </RouterLink>

        <span
          class="ml-auto inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium"
          :class="accessBadgeClass"
        >
          {{ accessBadgeLabel }}
        </span>

        <span
          v-if="isAuthenticated && userEmail"
          class="hidden xl:inline text-zinc-400 text-xs"
        >
          {{ userEmail }}
        </span>

        <button
          v-if="isAuthenticated"
          type="button"
          class="app-nav-link"
          @click="handleSignOut"
        >
          Logout
        </button>
      </nav>
    </div>
  </header>

  <main class="app-main">
    <RouterView />
  </main>
</template>
