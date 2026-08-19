/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Authentication service for GitHub OAuth and session management with Supabase
 */

import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthorProfile {
  id: string;
  user_id: string;
  github_id?: string | null;
  is_admin?: boolean;
  name: string;
  handle: string;
  bio: string;
  avatar_url: string;
  github: string;
  website: string;
  verified: boolean;
  reputation: number;
  total_prompts: number;
  created_at: string;
  updated_at: string;
}

function sanitizeHandle(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

function buildAuthorProfileDataFromUser(user: User): Partial<AuthorProfile> {
  const rawMetadata = (user.user_metadata ?? {}) as Record<string, any>;
  const userMetadata = (user.user_metadata ?? {}) as Record<string, any>;
  const email = user.email ?? '';
  const candidateName = String(
    rawMetadata.login ||
      userMetadata.login ||
      userMetadata.username ||
      userMetadata.name ||
      userMetadata.full_name ||
      email.split('@')[0] ||
      `user_${user.id.slice(0, 8)}`,
  ).trim();
  const rawHandle = sanitizeHandle(candidateName) || `user_${user.id.slice(0, 8)}`;
  const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
  const name = String(
    rawMetadata.name || userMetadata.name || userMetadata.full_name || email || `User ${user.id.slice(0, 8)}`,
  ).trim();
  const githubId = rawMetadata.id ? String(rawMetadata.id) : null;
  const avatarUrl = rawMetadata.avatar_url || userMetadata.avatar_url || null;
  const githubProfile = rawMetadata.html_url || rawMetadata.url || userMetadata.profile_url || null;

  return {
    handle,
    name,
    avatar_url: avatarUrl,
    github: githubProfile,
    github_id: githubId,
    verified: false,
    reputation: 0,
  };
}

export async function ensureAuthorProfileExists(user: User): Promise<{ author: AuthorProfile | null; error: Error | null }> {
  const { author, error } = await fetchAuthorProfile(user.id);
  if (error) {
    return { author: null, error };
  }

  if (author) {
    return { author, error: null };
  }

  return upsertAuthorProfile(user.id, buildAuthorProfileDataFromUser(user));
}

/**
 * Initialize GitHub OAuth login flow
 * Redirects to Supabase auth with GitHub provider
 */
export async function signInWithGithub(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const redirectUrl = `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectUrl,
      scopes: 'user:email',
    },
  });

  if (error) {
    console.error('[Auth] GitHub OAuth error:', error);
    throw new Error(error.message || 'Failed to initiate GitHub login');
  }

  if (!data.url) {
    throw new Error('No redirect URL provided by OAuth provider');
  }

  // Redirect to GitHub OAuth
  window.location.href = data.url;
}

/**
 * Handle OAuth callback after GitHub redirect
 * Called from /auth/callback page
 */
export async function handleOAuthCallback(): Promise<{ session: Session | null; error: Error | null }> {
  if (!supabase) {
    return { session: null, error: new Error('Supabase client not initialized') };
  }

  try {
    console.log('[Auth] OAuth callback processing...');
    console.log('[Auth] Current URL:', window.location.href);
    console.log('[Auth] location.search:', window.location.search);
    console.log('[Auth] location.hash:', window.location.hash);

    // Dump any localStorage keys that look related to Supabase/Auth for debugging
    try {
      const keys = Object.keys(window.localStorage || {}).filter((k) => /supabase|sb:|sb-|auth|gotrue/i.test(k));
      console.log('[Auth] Relevant localStorage keys:', keys);
      for (const k of keys) {
        try {
          console.log('[Auth] localStorage', k, window.localStorage.getItem(k));
        } catch (e) {
          console.log('[Auth] localStorage read error for', k, e);
        }
      }
    } catch (e) {
      console.warn('[Auth] localStorage inspection failed', e);
    }

    // Attempt to extract session from URL hash/fragment (Supabase sets this after redirect)
    // The session is typically embedded in the URL fragment by Supabase
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Try getSessionFromUrl first (newer Supabase versions)
    const auth = supabase.auth as any;
    let result: any;

    if (typeof auth.getSessionFromUrl === 'function') {
      console.log('[Auth] Using getSessionFromUrl...');
      try {
        // Prefer storing session if supported
        result = await auth.getSessionFromUrl?.({ storeSession: true });
      } catch (e) {
        console.warn('[Auth] getSessionFromUrl threw, falling back to getSession', e);
        result = await supabase.auth.getSession();
      }
    } else {
      console.log('[Auth] getSessionFromUrl not available, using getSession...');
      result = await supabase.auth.getSession();
    }

    let { data, error } = result || {};

    // If Supabase didn't parse the URL fragment for some reason, try extracting tokens
    // manually from the URL hash and set the session explicitly.
    const session = data?.session;
    if (!session) {
      const hash = window.location.hash || '';
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token) {
          console.log('[Auth] Found access_token in URL hash, setting session...');
          const { data: setData, error: setError } = await supabase.auth.setSession({
            access_token: access_token,
            refresh_token: refresh_token || undefined,
          });

          if (setError) {
            console.error('[Auth] setSession error:', setError);
            return { session: null, error: setError };
          }

          const { data: newSessionData, error: newSessionError } = await supabase.auth.getSession();
          if (newSessionError) {
            return { session: null, error: newSessionError };
          }

          if (newSessionData?.session) {
            console.log('[Auth] Session set from URL hash:', newSessionData.session.user?.id);
            return { session: newSessionData.session, error: null };
          }
        }
      }
    }

    // If no session yet, and there's a PKCE/code flow present, try exchanging the code for a session
    try {
      const urlParams = new URL(window.location.href).searchParams;
      const codeParam = urlParams.get('code');
      if (!session && codeParam && typeof auth.exchangeCodeForSession === 'function') {
        console.log('[Auth] Found code in URL, exchanging for session...');
        const exchangeResult = await auth.exchangeCodeForSession(codeParam as any);
        const exData = exchangeResult?.data;
        const exError = exchangeResult?.error;

        if (exError) {
          console.error('[Auth] exchangeCodeForSession error:', exError);
          return { session: null, error: exError };
        }

        if (exData?.session) {
          console.log('[Auth] Session obtained from code exchange:', exData.session.user?.id);
          return { session: exData.session, error: null };
        }
      }
    } catch (e) {
      console.warn('[Auth] Code exchange attempt failed', e);
    }

    if (error) {
      console.error('[Auth] Session extraction error:', error);
      return { session: null, error };
    }

    if (data?.session) {
      console.log('[Auth] Session extracted successfully:', data.session.user?.id);
      return { session: data.session, error: null };
    }

    console.warn('[Auth] No session found after callback');
    return { session: null, error: new Error('No session available after authentication') };
  } catch (error) {
    console.error('[Auth] OAuth callback error:', error);
    return { session: null, error: error instanceof Error ? error : new Error('OAuth callback failed') };
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<{ user: User | null; error: Error | null }> {
  if (!supabase) {
    return { user: null, error: new Error('Supabase client not initialized') };
  }

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    console.error('[Auth] Get user error:', error);
    return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<{ session: Session | null; error: Error | null }> {
  if (!supabase) {
    return { session: null, error: new Error('Supabase client not initialized') };
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error };
    }

    return { session: data.session, error: null };
  } catch (error) {
    console.error('[Auth] Get session error:', error);
    return { session: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

/**
 * Fetch author profile for a given user ID
 */
export async function fetchAuthorProfile(userId: string): Promise<{ author: AuthorProfile | null; error: Error | null }> {
  if (!supabase) {
    return { author: null, error: new Error('Supabase client not initialized') };
  }

  try {
    const { data, error } = await supabase
      .from('authors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - author profile doesn't exist yet
        return { author: null, error: null };
      }
      return { author: null, error };
    }

    return { author: data as AuthorProfile, error: null };
  } catch (error) {
    console.error('[Auth] Fetch author profile error:', error);
    return { author: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

/**
 * Create or update author profile
 */
export async function upsertAuthorProfile(
  userId: string,
  profileData: Partial<AuthorProfile>,
): Promise<{ author: AuthorProfile | null; error: Error | null }> {
  if (!supabase) {
    return { author: null, error: new Error('Supabase client not initialized') };
  }

  try {
    const { data, error } = await supabase
      .from('authors')
      .upsert(
        {
          user_id: userId,
          ...profileData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        },
      )
      .select()
      .single();

    if (error) {
      return { author: null, error };
    }

    return { author: data as AuthorProfile, error: null };
  } catch (error) {
    console.error('[Auth] Upsert author profile error:', error);
    return { author: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  if (!supabase) {
    return { error: new Error('Supabase client not initialized') };
  }

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('[Auth] Sign out error:', error);
    return { error: error instanceof Error ? error : new Error('Unknown error') };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (!supabase) {
    console.warn('[Auth] Supabase client not initialized');
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });

  // Return unsubscribe function
  return () => {
    data.subscription?.unsubscribe();
  };
}
