import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Role,
  UserProfile,
  getUserProfileFromSession,
  signInWithUsername,
  registerCaptain,
  signOutUser,
} from '../services/authService';
import { clientSupabase } from '../config/supabase';

export type User = UserProfile;

interface AuthContextType {
  user: User | null;
  signIn: (username: string, password: string) => Promise<User>;
  registerCaptain: (username: string, teamId: string, teamCode: string) => Promise<User>;
  logout: () => Promise<void>;
  loginAsAdmin: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Force loading to false after 2 seconds no matter what
    const timeoutId = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2000);

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await clientSupabase.auth.getSession();
        if (session && isMounted) {
          const profile = await getUserProfileFromSession(session);
          if (isMounted) setUser(profile);
        } else if (localStorage.getItem('admin_authenticated') === 'true') {
          localStorage.removeItem('admin_authenticated');
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = clientSupabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (!session?.user) {
        localStorage.removeItem('admin_authenticated');
        setUser(null);
        setLoading(false);
        return;
      }
      const profile = await getUserProfileFromSession(session);
      if (isMounted) {
        setUser(profile);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    const profile = await signInWithUsername(username, password);
    setUser(profile);
    return profile;
  };

  const registerCaptainContext = async (username: string, teamId: string, teamCode: string) => {
    const profile = await registerCaptain(username, teamId, teamCode);
    setUser(profile);
    return profile;
  };

  const loginAsAdmin = () => {
    localStorage.setItem('admin_authenticated', 'true');
    setUser({
      id: 'admin_local',
      username: 'admin_tournoi',
      email: 'admin_tournoi@tournoi-foot.com',
      full_name: 'Administrateur',
      role: 'admin',
    });
  };

  const logout = async () => {
    localStorage.removeItem('admin_authenticated');
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Supabase signout skipped or failed (local admin session):', e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, registerCaptain: registerCaptainContext, logout, loginAsAdmin, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
