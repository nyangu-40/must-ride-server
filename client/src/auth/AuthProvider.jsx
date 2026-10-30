import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(Boolean(window.sessionStorage.getItem('viewAsToken')));

  const refreshIdentity = useCallback(async (nextSession) => {
    setSession(nextSession);
    if (!nextSession) {
      setIdentity(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/api/auth/me');
      setIdentity(data);
      return data;
    } catch (error) {
      setSession(null);
      setIdentity(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    const client = getSupabaseClient();
    client.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (active) return refreshIdentity(data.session);
    }).catch((error) => {
      console.error('Unable to restore authentication session:', error);
      if (active) {
        setSession(null);
        setIdentity(null);
        setLoading(false);
      }
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (active) refreshIdentity(nextSession).catch((error) => console.error('Unable to load account:', error));
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshIdentity]);

  const signIn = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email: email.trim(), password });
    const { error } = await getSupabaseClient().auth.setSession(data.session);
    if (error) throw error;
    const identity = await refreshIdentity(data.session);
    return { role: data.role, status: identity?.organizer?.status };
  }, [refreshIdentity]);

  const signOut = useCallback(async () => {
    window.sessionStorage.removeItem('viewAsToken');
    setImpersonating(false);
    if (isSupabaseConfigured()) {
      const { error } = await getSupabaseClient().auth.signOut();
      if (error) throw error;
    }
    setSession(null);
    setIdentity(null);
  }, []);

  const enterViewAs = useCallback(async (token) => {
    window.sessionStorage.setItem('viewAsToken', token);
    setImpersonating(true);
    const { data } = await api.get('/api/auth/me');
    setIdentity(data);
  }, []);

  const exitViewAs = useCallback(async () => {
    window.sessionStorage.removeItem('viewAsToken');
    setImpersonating(false);
    const { data } = await api.get('/api/auth/me');
    setIdentity(data);
  }, []);

  const value = useMemo(() => ({
    session,
    user: identity?.user || null,
    role: identity?.role || null,
    organizer: identity?.organizer || null,
    loading,
    impersonating,
    signIn,
    signOut,
    enterViewAs,
    exitViewAs,
  }), [session, identity, loading, impersonating, signIn, signOut, enterViewAs, exitViewAs]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
