import { computed, ref } from 'vue';
import type { User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/app/auth/lib/supabase';
import type { AuthProfile, RedeemPremiumCodeResponse } from '@/app/auth/types/auth';

const user = ref<User | null>(null);
const profile = ref<AuthProfile | null>(null);
const isInitialized = ref(false);
const isInitializing = ref(false);
const isProfileLoading = ref(false);
const authError = ref<string | null>(null);

let initializePromise: Promise<void> | null = null;
let authListenerAttached = false;

function clearAuthState() {
  user.value = null;
  profile.value = null;
}

function getMissingConfigErrorMessage(): string {
  return 'Supabase non configure (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).';
}

async function syncProfile(currentUser: User): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    profile.value = null;
    return;
  }

  isProfileLoading.value = true;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('id, email, is_premium, premium_until')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      profile.value = data as AuthProfile;
      return;
    }

    const { error: insertError } = await client
      .from('profiles')
      .insert({
        id: currentUser.id,
        email: currentUser.email ?? null,
        is_premium: false,
        premium_until: null,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: duplicatedProfile, error: duplicateFetchError } = await client
          .from('profiles')
          .select('id, email, is_premium, premium_until')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (duplicateFetchError) {
          throw duplicateFetchError;
        }

        if (duplicatedProfile) {
          profile.value = duplicatedProfile as AuthProfile;
          return;
        }
      }

      throw insertError;
    }

    profile.value = {
      id: currentUser.id,
      email: currentUser.email ?? null,
      is_premium: false,
      premium_until: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur profile inconnue';
    authError.value = message;
  } finally {
    isProfileLoading.value = false;
  }
}

async function setSessionUser(currentUser: User | null): Promise<void> {
  user.value = currentUser;

  if (!currentUser) {
    profile.value = null;
    return;
  }

  await syncProfile(currentUser);
}

export async function initializeAuth(): Promise<void> {
  if (isInitialized.value) return;
  if (initializePromise) {
    await initializePromise;
    return;
  }

  initializePromise = (async () => {
    isInitializing.value = true;
    authError.value = null;

    if (!isSupabaseConfigured) {
      authError.value = getMissingConfigErrorMessage();
      isInitialized.value = true;
      isInitializing.value = false;
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      authError.value = getMissingConfigErrorMessage();
      isInitialized.value = true;
      isInitializing.value = false;
      return;
    }

    if (!authListenerAttached) {
      client.auth.onAuthStateChange((_event, session) => {
        void setSessionUser(session?.user ?? null);
      });
      authListenerAttached = true;
    }

    const { data, error } = await client.auth.getSession();

    if (error) {
      authError.value = error.message;
      clearAuthState();
    } else {
      await setSessionUser(data.session?.user ?? null);
    }

    isInitialized.value = true;
    isInitializing.value = false;
  })().finally(() => {
    initializePromise = null;
  });

  await initializePromise;
}

export async function refreshProfile(): Promise<void> {
  if (!user.value) {
    profile.value = null;
    return;
  }

  await syncProfile(user.value);
}

export async function signInWithGoogle(redirectPath = '/games'): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(getMissingConfigErrorMessage());
  }

  const client = getSupabaseClient();
  if (!client) throw new Error(getMissingConfigErrorMessage());

  const safeRedirectPath = redirectPath.startsWith('/') ? redirectPath : '/games';
  const redirectTo = `${window.location.origin}${safeRedirectPath}`;

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) throw error;
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(getMissingConfigErrorMessage());
  }

  const client = getSupabaseClient();
  if (!client) throw new Error(getMissingConfigErrorMessage());

  const { error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
}

export async function signUpWithPassword(email: string, password: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(getMissingConfigErrorMessage());
  }

  const client = getSupabaseClient();
  if (!client) throw new Error(getMissingConfigErrorMessage());

  const { error } = await client.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) {
    clearAuthState();
    return;
  }

  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function redeemPremiumCode(code: string): Promise<RedeemPremiumCodeResponse> {
  if (!code.trim()) {
    throw new Error('Code requis');
  }

  if (!isSupabaseConfigured) {
    throw new Error(getMissingConfigErrorMessage());
  }

  const client = getSupabaseClient();
  if (!client) throw new Error(getMissingConfigErrorMessage());

  const { data, error } = await client.rpc('redeem_premium_code', {
    input_code: code.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }

  const response = (data ?? {}) as RedeemPremiumCodeResponse;
  const isSuccess = response.success === true;

  if (!isSuccess) {
    throw new Error(response.message ?? 'Code invalide ou deja utilise');
  }

  await refreshProfile();
  return response;
}

const isAuthenticated = computed(() => Boolean(user.value));

const premiumUntilDate = computed(() => {
  const premiumUntilValue = profile.value?.premium_until;
  if (!premiumUntilValue) return null;

  const parsedDate = new Date(premiumUntilValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
});

const isPremium = computed(() => {
  if (!profile.value) return false;
  if (profile.value.is_premium) return true;

  const premiumUntil = premiumUntilDate.value;
  if (!premiumUntil) return false;

  return premiumUntil.getTime() > Date.now();
});

const userEmail = computed(() => user.value?.email ?? profile.value?.email ?? null);

export function useAuth() {
  return {
    user,
    profile,
    isInitialized,
    isInitializing,
    isProfileLoading,
    isAuthenticated,
    isPremium,
    premiumUntilDate,
    userEmail,
    authError,
    initializeAuth,
    refreshProfile,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    redeemPremiumCode,
  };
}
