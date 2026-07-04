import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { identifyUser } from '@/lib/posthog';
import type { Profile } from '@/lib/plans';

export interface Agency {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  brand_color: string;
  logo_url: string | null;
  favicon_url: string | null;
  is_active: boolean;
  created_at: string | null;
}

interface AgencyMember {
  id: string;
  agency_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  restoring: boolean;
  restoreError: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  retryRestore: () => Promise<void>;
  isAdmin: boolean;
  agency: Agency | null;
  agencyRole: string | null;
  isAgencyOwner: boolean;
  isAgencyAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_RESTORE_RETRIES = 3;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [agencyRole, setAgencyRole] = useState<string | null>(null);
  const loadingResolved = useRef(false);
  const restoreAttempts = useRef(0);
  const restoreTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const activeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const attemptRestoreRef = useRef<((userId: string) => Promise<boolean>) | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return data as Profile | null;
  }, []);

  const fetchAgency = useCallback(async (userId: string) => {
    const { data: memberData } = await supabase
      .from('agency_members')
      .select('role, agency_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (memberData) {
      setAgencyRole(memberData.role);
      const { data: agencyData } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', memberData.agency_id)
        .maybeSingle();
      if (agencyData) {
        setAgency(agencyData as Agency);
        return;
      }
    }
    setAgency(null);
    setAgencyRole(null);
  }, []);

  const attemptRestore = useCallback(async (userId: string): Promise<boolean> => {
    setRestoring(true);
    setRestoreError(null);
    try {
      const { data, error } = await supabase.rpc('restore_user_profile', { p_user_id: userId });
      if (error) throw error;
      if (data === true) {
        const p = await fetchProfile(userId);
        if (p) {
          setProfile(p);
          restoreAttempts.current = 0;
          setRestoring(false);
          return true;
        }
      }
      throw new Error('Profile could not be created');
    } catch (err) {
      restoreAttempts.current++;
      if (restoreAttempts.current >= MAX_RESTORE_RETRIES) {
        setRestoreError(
          err instanceof Error ? err.message : 'Could not restore your account. Please contact support.'
        );
        setRestoring(false);
        return false;
      }
      setRestoring(false);
      const delay = Math.min(1000 * Math.pow(2, restoreAttempts.current), 10000);
      restoreTimeoutRef.current = setTimeout(() => attemptRestoreRef.current?.(userId), delay);
      return false;
    }
  }, [fetchProfile]);

  attemptRestoreRef.current = attemptRestore;

  const retryRestore = useCallback(async () => {
    if (!user) return;
    restoreAttempts.current = 0;
    setRestoreError(null);
    clearTimeout(restoreTimeoutRef.current);
    await attemptRestore(user.id);
  }, [user, attemptRestore]);

  const checkAdmin = async (userId: string) => {
    try {
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin');
      setIsAdmin(!!data && data.length > 0);
    } catch {
      setIsAdmin(false);
    }
  };

  const resolveLoading = () => {
    if (!loadingResolved.current) {
      loadingResolved.current = true;
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const timerId = setTimeout(async () => {
          try {
            const p = await fetchProfile(session.user.id);
            if (p) {
              setProfile(p);
              identifyUser(session.user.id, { email: session.user.email, name: p.full_name || undefined });
              await checkAdmin(session.user.id);
              await fetchAgency(session.user.id);
              resolveLoading();
            } else {
              setProfile(null);
              setIsAdmin(false);
              resolveLoading();
              await attemptRestore(session.user.id);
            }
          } catch (err) {
            console.error('Profile fetch failed:', err);
            setProfile(null);
            setIsAdmin(false);
            resolveLoading();
          }
        }, 0);
        activeTimeoutsRef.current.push(timerId);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setAgency(null);
        setAgencyRole(null);
        resolveLoading();
      }
    });

    const timeout = setTimeout(() => resolveLoading(), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
      clearTimeout(restoreTimeoutRef.current);
      activeTimeoutsRef.current.forEach(clearTimeout);
      activeTimeoutsRef.current = [];
    };
  }, [fetchProfile, attemptRestore, fetchAgency]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const emailRedirectTo = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo },
    });
    if (error) throw error;
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('An account with this email already exists. Try signing in or resetting your password.');
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setAgency(null);
    setAgencyRole(null);
    setRestoreError(null);
    restoreAttempts.current = 0;
    clearTimeout(restoreTimeoutRef.current);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('signOut failed:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
      await fetchAgency(user.id);
    }
  };

  const isAgencyOwner = agencyRole === 'owner';
  const isAgencyAdmin = agencyRole === 'admin';

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, restoring, restoreError,
      signUp, signIn, signInWithGoogle, signOut, refreshProfile, retryRestore, isAdmin,
      agency, agencyRole, isAgencyOwner, isAgencyAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
