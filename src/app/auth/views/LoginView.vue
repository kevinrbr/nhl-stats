<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Chrome, Loader2 } from 'lucide-vue-next';
import { useAuth } from '@/app/auth/composables/useAuth';

type AuthMode = 'login' | 'signup';

const route = useRoute();
const router = useRouter();

const {
  initializeAuth,
  isAuthenticated,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} = useAuth();

const mode = ref<AuthMode>('login');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const redirectPath = computed(() => {
  const target = route.query.redirect;
  if (typeof target === 'string' && target.startsWith('/')) return target;
  return '/games';
});

const modeTitle = computed(() =>
  mode.value === 'login' ? 'Connexion' : 'Créer un compte'
);

async function handleGoogleSignIn() {
  errorMessage.value = null;
  successMessage.value = null;
  isSubmitting.value = true;

  try {
    await signInWithGoogle(redirectPath.value);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erreur Google OAuth';
  } finally {
    isSubmitting.value = false;
  }
}

async function handleSubmit() {
  errorMessage.value = null;
  successMessage.value = null;

  const normalizedEmail = email.value.trim().toLowerCase();
  if (!normalizedEmail || !password.value) {
    errorMessage.value = 'Email et mot de passe requis.';
    return;
  }

  if (mode.value === 'signup' && password.value !== confirmPassword.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas.';
    return;
  }

  isSubmitting.value = true;

  try {
    if (mode.value === 'login') {
      await signInWithPassword(normalizedEmail, password.value);
      await router.replace(redirectPath.value);
    } else {
      await signUpWithPassword(normalizedEmail, password.value);
      successMessage.value = 'Compte créé. Tu peux maintenant te connecter.';
      mode.value = 'login';
      password.value = '';
      confirmPassword.value = '';
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Erreur d’authentification';
  } finally {
    isSubmitting.value = false;
  }
}

watch(
  isAuthenticated,
  async (connected) => {
    if (connected) {
      await router.replace(redirectPath.value);
    }
  },
  { immediate: true }
);

onMounted(() => {
  void initializeAuth();
});
</script>

<template>
  <section class="app-view">
    <div class="mx-auto w-full max-w-md rounded-2xl border border-zinc-800/90 bg-zinc-900/75 p-6 md:p-7">
      <div class="mb-5">
        <h1 class="text-zinc-100 text-2xl font-semibold">{{ modeTitle }}</h1>
        <p class="text-zinc-400 text-sm mt-1">Accède aux insights NHL et débloque le mode premium</p>
      </div>

      <div class="inline-flex rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-1 mb-5">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="mode === 'login'
            ? 'bg-sky-500/20 text-sky-200 border border-sky-500/35'
            : 'text-zinc-300 border border-transparent hover:bg-zinc-800/70'"
          @click="mode = 'login'"
        >
          Connexion
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="mode === 'signup'
            ? 'bg-sky-500/20 text-sky-200 border border-sky-500/35'
            : 'text-zinc-300 border border-transparent hover:bg-zinc-800/70'"
          @click="mode = 'signup'"
        >
          Inscription
        </button>
      </div>

      <button
        type="button"
        class="w-full inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-950/70 px-4 py-2.5 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800/80 disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="isSubmitting"
        @click="handleGoogleSignIn"
      >
        <Chrome class="w-4 h-4" />
        Continuer avec Google
      </button>

      <div class="my-4 flex items-center gap-3">
        <div class="h-px flex-1 bg-zinc-800"></div>
        <span class="text-xs uppercase tracking-wide text-zinc-500">ou</span>
        <div class="h-px flex-1 bg-zinc-800"></div>
      </div>

      <form class="space-y-3" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs uppercase tracking-wide text-zinc-400 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500/70"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label class="block text-xs uppercase tracking-wide text-zinc-400 mb-1">Mot de passe</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500/70"
            placeholder="••••••••"
            required
          />
        </div>

        <div v-if="mode === 'signup'">
          <label class="block text-xs uppercase tracking-wide text-zinc-400 mb-1">Confirmer le mot de passe</label>
          <input
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            class="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500/70"
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="errorMessage" class="rounded-md border border-rose-500/35 bg-rose-500/12 px-3 py-2 text-sm text-rose-200">
          {{ errorMessage }}
        </p>

        <p v-if="successMessage" class="rounded-md border border-emerald-500/35 bg-emerald-500/12 px-3 py-2 text-sm text-emerald-200">
          {{ successMessage }}
        </p>

        <button
          type="submit"
          class="w-full inline-flex items-center justify-center gap-2 rounded-md border border-sky-400/35 bg-sky-500/18 px-4 py-2.5 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/28 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isSubmitting"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span>{{ mode === 'login' ? 'Se connecter' : 'Créer le compte' }}</span>
        </button>
      </form>
    </div>
  </section>
</template>
