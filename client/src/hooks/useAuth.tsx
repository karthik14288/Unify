import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  isDemoUser: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signInAsDemo: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  app_metadata: {},
  user_metadata: { full_name: 'Dr. Jane Vance (Principal Researcher)' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'researcher@unify.ai',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(() => {
    return localStorage.getItem('unify_demo_mode') === 'true';
  });

  useEffect(() => {
    // Check initial demo mode
    if (isDemoUser) {
      setUser(DEMO_USER);
      setToken('demo-test-token');
      setLoading(false);
      return;
    }

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isDemoUser) {
        setSession(session);
        setUser(session?.user ?? null);
        setToken(session?.access_token ?? null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemoUser]);

  const signInWithEmail = async (email: string, password: string) => {
    setIsDemoUser(false);
    localStorage.removeItem('unify_demo_mode');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
      setToken(data.session.access_token);
    }
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setIsDemoUser(false);
    localStorage.removeItem('unify_demo_mode');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: email.split('@')[0] },
      },
    });
    if (!error && data.session) {
      setSession(data.session);
      setUser(data.user);
      setToken(data.session.access_token);
    }
    return { error };
  };

  const signInAsDemo = () => {
    setIsDemoUser(true);
    localStorage.setItem('unify_demo_mode', 'true');
    setUser(DEMO_USER);
    setToken('demo-test-token');
    setLoading(false);
  };

  const signOut = async () => {
    setIsDemoUser(false);
    localStorage.removeItem('unify_demo_mode');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        loading,
        isDemoUser,
        signInWithEmail,
        signUpWithEmail,
        signInAsDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
