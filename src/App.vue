<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
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
          to="/teams"
          class="app-nav-link"
          exact-active-class="app-nav-link-active"
        >
          Equipes
        </RouterLink>

        <RouterLink
          to="/players"
          class="app-nav-link"
          exact-active-class="app-nav-link-active"
        >
          Players
        </RouterLink>

        <RouterLink
          to="/games"
          class="app-nav-link"
          exact-active-class="app-nav-link-active"
        >
          Games
        </RouterLink>
      </nav>
    </div>
  </header>

  <main class="app-main">
    <RouterView />
  </main>
</template>
