<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { KeyRound, Loader2, Sparkles } from 'lucide-vue-next';
import { useAuth } from '@/app/auth/composables/useAuth';

const router = useRouter();
const {
  initializeAuth,
  isAuthenticated,
  isPremium,
  premiumUntilDate,
  userEmail,
  redeemPremiumCode,
} = useAuth();

const premiumCode = ref('');
const isSubmitting = ref(false);
const successMessage = ref<string | null>(null);
const errorMessage = ref<string | null>(null);

const premiumUntilLabel = computed(() => {
  if (!premiumUntilDate.value) return null;
  return premiumUntilDate.value.toLocaleString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

async function handleRedeemCode() {
  successMessage.value = null;
  errorMessage.value = null;

  const code = premiumCode.value.trim();
  if (!code) {
    errorMessage.value = 'Entre un code premium valide.';
    return;
  }

  isSubmitting.value = true;

  try {
    const response = await redeemPremiumCode(code);
    successMessage.value = response.message ?? 'Code activé. Ton accès premium est actif.';
    premiumCode.value = '';
  } catch (error) {
    if (error instanceof Error) {
      errorMessage.value = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage.value = String((error as { message?: unknown }).message ?? 'Activation impossible');
    } else {
      errorMessage.value = 'Activation impossible';
    }
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(async () => {
  await initializeAuth();
  if (!isAuthenticated.value) {
    await router.replace({
      name: 'login',
      query: {
        redirect: '/premium',
      },
    });
  }
});
</script>

<template>
  <section class="app-view">
    <div class="mx-auto w-full max-w-xl rounded-2xl border border-zinc-800/90 bg-zinc-900/75 p-6 md:p-7">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h1 class="text-zinc-100 text-2xl font-semibold">Accès Premium</h1>
          <p class="text-zinc-400 text-sm mt-1">
            Active ton accès avec un code unique lié à ton email.
          </p>
        </div>
        <Sparkles class="w-6 h-6 text-amber-300" />
      </div>

      <div class="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-950/70 p-4 space-y-2">
        <p class="text-xs uppercase tracking-wide text-zinc-500">Compte connecté</p>
        <p class="text-zinc-100 text-sm font-medium">{{ userEmail ?? '-' }}</p>
        <p class="text-sm" :class="isPremium ? 'text-emerald-300' : 'text-zinc-300'">
          <template v-if="isPremium">
            Premium actif
            <template v-if="premiumUntilLabel">
              · jusqu’au {{ premiumUntilLabel }}
            </template>
          </template>
          <template v-else>
            Compte standard (non premium)
          </template>
        </p>
      </div>

      <form class="mt-5 space-y-3" @submit.prevent="handleRedeemCode">
        <label class="block text-xs uppercase tracking-wide text-zinc-400">
          Code premium
        </label>
        <div class="flex flex-col gap-2 sm:flex-row">
          <div class="relative flex-1">
            <KeyRound class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              v-model="premiumCode"
              type="text"
              class="w-full rounded-md border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-500/70"
              placeholder="ex: NHL-2026-XXXX"
              autocomplete="off"
            />
          </div>
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-md border border-sky-400/35 bg-sky-500/18 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-500/28 disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            Activer
          </button>
        </div>

        <p v-if="errorMessage" class="rounded-md border border-rose-500/35 bg-rose-500/12 px-3 py-2 text-sm text-rose-200">
          {{ errorMessage }}
        </p>

        <p v-if="successMessage" class="rounded-md border border-emerald-500/35 bg-emerald-500/12 px-3 py-2 text-sm text-emerald-200">
          {{ successMessage }}
        </p>
      </form>

      <p class="mt-4 text-xs text-zinc-500">
        Chaque code est à usage unique et vérifié côté base de données. Impossible de l’utiliser deux fois.
      </p>
    </div>
  </section>
</template>
