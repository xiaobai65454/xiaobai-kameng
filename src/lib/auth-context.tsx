'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getSupabaseBrowserClientWithRetry, useSupabaseConfig } from '@/lib/supabase-browser';
import type { SupabaseClient, User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: string;
  invite_code: string;
  parent_id: string | null;
  level_id: string | null;
  total_sales: string;
  total_orders: number;
  team_count: number;
  balance: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isChannel: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null; profile?: Profile | null }>;
  register: (email: string, password: string, name: string, inviteCode?: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isChannel: false,
  login: async () => ({ error: 'Not implemented' }),
  register: async () => ({ error: 'Not implemented' }),
  logout: async () => {},
  refreshProfile: async () => {},
  getAuthHeaders: () => ({}),
});

export function useAuth() {
  return useContext(AuthContext);
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isReady: configReady } = useSupabaseConfig();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string, token: string): Promise<Profile | null> => {
    try {
      const res = await fetch(`/api/profiles/${userId}`, {
        headers: { 'x-session': token },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.profile;
    } catch {
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user && session) {
      const p = await fetchProfile(user.id, session.access_token);
      setProfile(p);
    }
  }, [user, session, fetchProfile]);

  useEffect(() => {
    if (!configReady) return;

    const initAuth = async () => {
      try {
        const supabase = await getSupabaseBrowserClientWithRetry();
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          const p = await fetchProfile(currentSession.user.id, currentSession.access_token);
          setProfile(p);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    let subscription: { unsubscribe: () => void } | undefined;

    const setupListener = async () => {
      try {
        const supabase = await getSupabaseBrowserClientWithRetry();
        const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'SIGNED_IN' && newSession?.user) {
            setSession(newSession);
            setUser(newSession.user);
            const p = await fetchProfile(newSession.user.id, newSession.access_token);
            setProfile(p);
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setProfile(null);
          } else if (event === 'TOKEN_REFRESHED' && newSession) {
            setSession(newSession);
          }
        });
        subscription = sub;
      } catch {
        // ignore
      }
    };

    setupListener();

    return () => {
      subscription?.unsubscribe();
    };
  }, [configReady, fetchProfile]);

  const login = async (account: string, password: string) => {
    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      
      // 判断账号是邮箱还是用户名
      let email = account;
      if (!account.includes('@')) {
        // 不是邮箱，尝试通过用户名查找邮箱
        try {
          const res = await fetch(`/api/profiles/by-name/${encodeURIComponent(account)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.profile?.email) {
              email = data.profile.email;
            } else {
              return { error: '未找到该用户名对应的账号' };
            }
          } else {
            return { error: '未找到该用户名对应的账号' };
          }
        } catch {
          return { error: '查询用户信息失败' };
        }
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        const p = await fetchProfile(data.user.id, data.session.access_token);
        setProfile(p);
        return { error: null, profile: p };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Login failed' };
    }
  };

  const register = async (email: string, password: string, name: string, inviteCode?: string) => {
    try {
      const supabase = await getSupabaseBrowserClientWithRetry();

      let parentId: string | null = null;
      let levelId: string | null = null;
      if (inviteCode) {
        // 先查找邀请记录，获取等级信息
        const invRes = await fetch(`/api/invitations/by-code/${inviteCode}`);
        if (invRes.ok) {
          const invData = await invRes.json();
          parentId = invData.invitation?.inviter_id || null;
          levelId = invData.invitation?.level_id || null;
        } else {
          // 兼容旧逻辑：直接通过邀请码查找用户
          const res = await fetch(`/api/profiles/by-invite/${inviteCode}`);
          if (res.ok) {
            const data = await res.json();
            parentId = data.profile?.id || null;
          }
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (authError) return { error: authError.message };
      if (!authData.user) return { error: 'Registration failed' };

      const profileRes = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session': authData.session?.access_token || '',
        },
        body: JSON.stringify({
          id: authData.user.id,
          email,
          name,
          parent_id: parentId,
          level_id: levelId,
          role: 'agent',
          invite_code: generateInviteCode(),
        }),
      });

      if (!profileRes.ok) {
        const errData = await profileRes.json();
        return { error: errData.error || 'Failed to create profile' };
      }

      if (authData.session) {
        setSession(authData.session);
        setUser(authData.user);
        const p = await fetchProfile(authData.user.id, authData.session.access_token);
        setProfile(p);
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      const supabase = await getSupabaseBrowserClientWithRetry();
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch {
      // ignore
    }
  };

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (session?.access_token) {
      return { 'x-session': session.access_token };
    }
    return {};
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading: isLoading || !configReady,
        isAuthenticated: !!user,
        isAdmin: profile?.role === 'admin',
        isChannel: profile?.role === 'channel',
        login,
        register,
        logout,
        refreshProfile,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
