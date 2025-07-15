// src/contexts/auth-context.tsx
"use client";

import type { User, AuthError } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { app, auth, analytics } from '@/lib/firebase/config';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { logEvent } from 'firebase/analytics';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  loginWithEmail: (email: string, pass: string) => Promise<User | null>;
  signupWithEmail: (email: string, pass: string, referrerId: string | null) => Promise<User | null>;
  loginWithGoogle: () => Promise<User | null>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      setError(null); // Clear error on successful auth state change
    }, (authError) => {
      console.error("Auth state change error:", authError);
      setError({
        code: 'auth/state-changed-error',
        message: authError.message,
        name: authError.name,
        customData: {
          appName: app.name,
        }
      });
      setUser(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user);
      setLoading(false);
      if (analytics) {
        logEvent(analytics, 'login', { method: 'email' });
      }
      return userCredential.user;
    } catch (e: any) {
      console.error("Login error:", e);
      setError(e as AuthError);
      setLoading(false);
      if (analytics) {
        logEvent(analytics, 'login_failed', { method: 'email', error_message: (e as AuthError).message });
      }
      return null;
    }
  };

  const signupWithEmail = async (email: string, pass: string, referrerId: string | null): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      setUser(userCredential.user);
      setLoading(false);
      if (analytics) {
        logEvent(analytics, 'sign_up', { method: 'email' });
      }

      if (referrerId && userCredential.user) {
        try {
            const functions = getFunctions(app);
            const processReferral = httpsCallable(functions, 'processReferral');
            await processReferral({ referrerId });
            if (analytics) {
                logEvent(analytics, 'referral_processed_client', { referrer_id: referrerId });
            }
        } catch (referralError) {
            console.error("Failed to process referral:", referralError);
            if (analytics) {
                logEvent(analytics, 'referral_processing_failed_client', { referrer_id: referrerId, error: (referralError as Error).message });
            }
        }
      }

      return userCredential.user;
    } catch (e: any) {
      console.error("Signup error:", e);
      setError(e as AuthError);
      setLoading(false);
      if (analytics) {
        logEvent(analytics, 'sign_up_failed', { method: 'email', error_message: (e as AuthError).message });
      }
      return null;
    }
  };

  const loginWithGoogle = async (): Promise<User | null> => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setLoading(false);
      if (analytics) {
        logEvent(analytics, 'login', { method: 'google' });
      }
      return result.user;
    } catch (e: any) {
      console.error("Google login error:", e);
      setError(e as AuthError);
      setLoading(false);
      if (analytics) {
        logEvent(analytics, 'login_failed', { method: 'google', error_message: (e as AuthError).message });
      }
      return null;
    }
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    setLoading(true); 
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
      if (analytics) {
        logEvent(analytics, 'password_reset_email_sent', { email_provided: !!email });
      }
      return true;
    } catch (e: any) {
      console.error("Password reset error:", e);
      setError(e as AuthError);
      setLoading(false);
      if (analytics) {
        logEvent(analytics, 'password_reset_email_failed', { error_message: (e as AuthError).message });
      }
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      if (analytics && user) { 
        logEvent(analytics, 'logout');
      }
      await signOut(auth);
      setUser(null);
    } catch (e: any) {
      console.error("Logout error:", e);
      setError(e as AuthError);
    } finally {
      setLoading(false);
    }
  };
  
  const value = { user, loading, error, loginWithEmail, signupWithEmail, loginWithGoogle, sendPasswordReset, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
