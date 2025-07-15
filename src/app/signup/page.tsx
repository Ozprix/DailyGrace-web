
// src/app/signup/page.tsx
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signupWithEmail, error: authError, loading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'signup_page' });
    }
    const refId = searchParams.get('ref');
    if (refId) {
        // Store in local storage to persist if the user navigates away and back
        localStorage.setItem('referrerId', refId);
    }
  }, [searchParams]);

  const handleLogoClick = () => {
    if (analytics) {
      logEvent(analytics, 'navigate_to_page', { page_name: 'home_from_auth_header', from_page: 'signup_page_logo_link' });
    }
    router.push('/');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!email || !password) {
      setFormError("Please fill in all fields.");
      return;
    }
    const refIdFromStorage = localStorage.getItem('referrerId');
    const user = await signupWithEmail(email, password, refIdFromStorage);
    if (user) {
      localStorage.removeItem('referrerId'); // Clean up after successful signup
      router.push('/');
    } else if (authError) {
       setFormError(authError.message || "Signup failed. Please try again.");
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
        <span className="font-semibold text-lg">Daily Grace</span>
      </div>
      <Card className="w-full max-w-md shadow-xl bg-card/80 backdrop-blur-sm border-border/50 animate-scale-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Create Account</CardTitle>
          <CardDescription>Join Daily Grace to save your journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {(formError || authError) && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Signup Error</AlertTitle>
                <AlertDescription>{formError || authError?.message}</AlertDescription>
              </Alert>
            )}
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••• (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading} variant="primaryGradient">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="w-full">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
