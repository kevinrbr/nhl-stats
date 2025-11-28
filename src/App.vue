<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header class="w-full fixed top-0 left-0 z-50 px-8 py-4 bg-transparent">
    <nav class="flex gap-6 items-center text-white">
      <RouterLink 
        to="/" 
        class="no-underline text-white hover:opacity-80"
        active-class="font-semibold"
      >
        Accueil
      </RouterLink>

      <RouterLink 
        to="/about" 
        class="no-underline text-white hover:opacity-80"
        active-class="font-semibold"
      >
        Equipes
      </RouterLink>

      <RouterLink 
        to="/about" 
        class="no-underline text-white hover:opacity-80"
        active-class="font-semibold"
      >
        Joueurs
      </RouterLink>

      <RouterLink 
        to="/about" 
        class="no-underline text-white hover:opacity-80"
        active-class="font-semibold"
      >
        Games
      </RouterLink>

      <RouterLink 
        to="/about" 
        class="no-underline text-white hover:opacity-80"
        active-class="font-semibold"
      >
        Classement
      </RouterLink>
    </nav>
  </header>

  <RouterView />
</template>
