import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  authError: string | null;
  signUp: (email: string, password: string, metadata?: { name?: string }) => Promise<{ error: Error | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TIMEOUT_MS = 10_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId: string): Promise<ProfileRow | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch failed:', error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('Profile fetch exception:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    if (mountedRef.current) {
      setProfile(p);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    mountedRef.current = true;

    const timeoutId = setTimeout(() => {
      if (mountedRef.current && loading) {
        console.warn('Auth initialization timed out after', AUTH_TIMEOUT_MS, 'ms');
        setLoading(false);
        setAuthError('Connection timed out. Please refresh.');
      }
    }, AUTH_TIMEOUT_MS);

    const initSession = async () => {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession();
        if (!mountedRef.current) return;

        if (error) {
          console.error('Error getting initial session:', error.message);
          setAuthError(null);
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          const p = await fetchProfile(s.user.id);
          if (mountedRef.current) setProfile(p);
        }
      } catch (err) {
        if (!mountedRef.current) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Unexpected error during auth init:', err);
        setAuthError(null);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (!mountedRef.current) return;

        setSession(s);
        setUser(s?.user ?? null);
        setAuthError(null);

        if (s?.user) {
          const p = await fetchProfile(s.user.id);
          if (mountedRef.current) setProfile(p);
        } else {
          setProfile(null);
        }

        if (mountedRef.current) setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: { name?: string }
  ): Promise<{ error: Error | null; needsConfirmation: boolean }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });

      if (error) return { error: error as Error, needsConfirmation: false };

      const hasSession = !!data.session;
      return { error: null, needsConfirmation: !hasSession };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Signup failed'), needsConfirmation: false };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setProfile(null);
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, authError,
      signUp, signIn, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
