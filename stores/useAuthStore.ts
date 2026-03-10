import { create } from 'zustand';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { claimAnonymousData } from '@/services/dataMigration';
import { authStorage } from '@/services/authStorage';
import type { Session, User } from '@supabase/supabase-js';

const PROVIDER_TOKEN_KEY = 'google_provider_token';
const PROVIDER_REFRESH_KEY = 'google_provider_refresh_token';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  authError: string | null;
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getGoogleAccessToken: () => Promise<string | null>;
  clearGoogleToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,
  authError: null,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, initialized: true });

    supabase.auth.onAuthStateChange(async (event, session) => {
      // Persist Google provider tokens when first received
      if (session?.provider_token) {
        await authStorage.setItem(PROVIDER_TOKEN_KEY, session.provider_token);
      }
      if (session?.provider_refresh_token) {
        await authStorage.setItem(PROVIDER_REFRESH_KEY, session.provider_refresh_token);
      }

      // Update state immediately so the UI reflects the login
      set({ session, user: session?.user ?? null });

      // Claim anonymous data in the background (non-blocking)
      if (event === 'SIGNED_IN' && session?.user) {
        claimAnonymousData(session.user.id).catch((err) => {
          console.warn('Data migration failed:', err);
        });
      }
    });
  },

  signUp: async (email, password) => {
    set({ loading: true, authError: null });
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (err) {
      set({ authError: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ loading: true, authError: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      set({ authError: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true });
    try {
      const redirectTo = Platform.OS === 'web'
        ? window.location.origin  // e.g. http://localhost:8081
        : 'kairosurf://auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: 'https://www.googleapis.com/auth/calendar.events',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        if (Platform.OS === 'web') {
          // On web, redirect back to the app URL — detectSessionInUrl handles the rest
          window.location.href = data.url;
        } else {
          // On native, use expo-web-browser
          const WebBrowser = require('expo-web-browser');
          const Linking = require('expo-linking');
          const redirectUrl = Linking.createURL('auth/callback');

          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
          if (result.type === 'success' && result.url) {
            const params = new URLSearchParams(result.url.split('#')[1] ?? '');
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            const provider_token = params.get('provider_token');
            const provider_refresh_token = params.get('provider_refresh_token');

            if (access_token && refresh_token) {
              await supabase.auth.setSession({ access_token, refresh_token });
            }

            // Store Google tokens for Calendar API access
            // (setSession doesn't include provider tokens in the session)
            if (provider_token) {
              await authStorage.setItem(PROVIDER_TOKEN_KEY, provider_token);
            }
            if (provider_refresh_token) {
              await authStorage.setItem(PROVIDER_REFRESH_KEY, decodeURIComponent(provider_refresh_token));
            }
          }
        }
      }
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    await authStorage.removeItem(PROVIDER_TOKEN_KEY);
    await authStorage.removeItem(PROVIDER_REFRESH_KEY);
    set({ session: null, user: null });
  },

  getGoogleAccessToken: async () => {
    // 1. Check current session's provider_token (only set on initial sign-in)
    const { session } = get();
    if (session?.provider_token) return session.provider_token;

    // 2. Check locally stored access token
    const stored = await authStorage.getItem(PROVIDER_TOKEN_KEY);
    if (stored) return stored;

    // 3. Try refreshing the Supabase session (may return refreshed provider token)
    try {
      const { data } = await supabase.auth.refreshSession();
      if (data.session?.provider_token) {
        await authStorage.setItem(PROVIDER_TOKEN_KEY, data.session.provider_token);
        return data.session.provider_token;
      }
    } catch {
      // fall through
    }

    // 4. Refresh via server-side Edge Function (keeps client_secret off the client)
    const refreshToken = await authStorage.getItem(PROVIDER_REFRESH_KEY);
    if (refreshToken) {
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke(
          'refresh-google-token',
          { body: { refresh_token: refreshToken } }
        );
        if (!fnError && fnData?.access_token) {
          await authStorage.setItem(PROVIDER_TOKEN_KEY, fnData.access_token);
          return fnData.access_token as string;
        }
      } catch {
        // fall through
      }
    }

    return null;
  },

  clearGoogleToken: async () => {
    await authStorage.removeItem(PROVIDER_TOKEN_KEY);
  },
}));
