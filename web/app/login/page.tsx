
// src/app/login/page.tsx
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, MailQuestion } from 'lucide-react';
import { AppLogo } from '@/components/icons/app-logo';
import { Separator } from '@/components/ui/separator';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { useToast } from '@/hooks/use-toast'; // Added

// A simple Google Icon SVG
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20px" height="20px">
    <path fill="#EA4335" d="M24 9.5c3.23 0 5.92 1.14 7.96 3.02l6.09-6.09C34.05 2.57 29.3 1 24 1 15.1 1 7.63 5.95 4.06 13.06l7.39 5.71C12.84 13.16 17.98 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.14 24.73c0-1.69-.15-3.31-.42-4.88H24v9.25h12.45c-.54 3-2.09 5.55-4.54 7.27l7.03 5.44c4.13-3.83 6.6-9.54 6.6-16.06z"/>
    <path fill="#34A853" d="M11.45 34.94c-1.01-3.02-1.01-6.36 0-9.38l-7.39-5.71C1.15 23.64 1.15 30.36 4.06 34.94l7.39-5.71z"/>
    <path fill="#FBBC05" d="M24 47c5.3 0 9.95-1.76 13.28-4.72l-7.03-5.44c-1.9 1.27-4.34 2.01-7.25 2.01-6.02 0-11.16-3.66-12.75-8.79l-7.39 5.71C7.63 41.05 15.1 47 24 47z"/>
    <path fill="none" d="M1 1h46v46H1z"/>
  </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithEmail, loginWithGoogle, sendPasswordReset, error: authError, loading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast(); // Added useToast
  const router = useRouter();

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'login_page' });
    }
  }, []);

  const handleLogoClick = () => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: 'home_from_auth_header', from_page: 'login_page_logo_link' });
    }
    router.push('/');
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null); 
    if (!email || !password) {
      setFormError("Please enter both email and password.");
      return;
    }
    const user = await loginWithEmail(email, password);
    if (user) {
      router.push('/');
    }
  };

  const handleGoogleSubmit = async () => {
    setFormError(null);
    const user = await loginWithGoogle();
    if (user) {
      router.push('/');
    }
  };

  const handleForgotPassword = async () => {
    setFormError(null); // Clear form-specific errors
    if (!email) {
      setFormError("Please enter your email address above to reset password.");
      toast({
        title: "Email Required",
        description: "Please enter your email address in the field above first.",
        variant: "default",
      });
      return;
    }
    // Clear previous auth errors specific to login before attempting password reset
    // This is tricky because authError is general. We want to ensure a fresh state for this specific action.
    // For now, sendPasswordReset itself will set a new authError if it fails.
    
    const success = await sendPasswordReset(email);
    if (success) {
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${email}, a password reset link has been sent.`,
        variant: "default",
      });
    } else {
      // authError from useAuth() should now be populated by sendPasswordReset
      toast({
        title: "Password Reset Failed",
        description: authError?.message || "Could not send password reset email. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-primary/20 selection:text-primary">
      <div
        onClick={handleLogoClick}
        className="absolute top-6 left-6 flex items-center gap-2 text-primary hover:opacity-80 transition-opacity cursor-pointer"
        role="link"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLogoClick();}}
      >
        <AppLogo size={24} />
        <span className="font-semibold">Daily Grace</span>
      </div>
      <Card className="w-full max-w-md shadow-xl bg-card/80 backdrop-blur-sm border-border/50 animate-scale-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue to Daily Grace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(formError || authError) && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Login Error</AlertTitle>
              <AlertDescription>
                {formError ? formError : null}
                {!formError && authError ? (
                  <>
                    {authError.message || "An unexpected error occurred."}
                    {authError.code && ` (Code: ${authError.code})`}
                  </>
                ) : null}
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-xs text-primary hover:underline"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Forgot password?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} variant="primaryGradient">
              {loading && !authError ? 'Signing In...' : 'Sign In with Email'}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
            <span className="ml-2">
              {loading && !authError ? 'Signing In...' : 'Sign In with Google'}
            </span>
          </Button>

        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="w-full">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
