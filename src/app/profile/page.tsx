
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword, type User as FirebaseUser } from 'firebase/auth';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Camera, LockKeyhole, User as UserLucide, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/ui/header'; // Using the main header
import { analytics } from '@/lib/firebase/config';
import { logEvent } from 'firebase/analytics';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const UserProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const { preferences: userPreferences, isLoaded: preferencesLoaded } = useUserPreferences();
  const router = useRouter();

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, 'view_page', { page_name: 'user_profile_page' });
    }
  }, []);

  const pageIsLoading = authLoading || !preferencesLoaded;

  return (
    <div className="min-h-screen flex flex-col items-center bg-background text-foreground">
      <Header title="User Profile" />
      <main className="container mx-auto py-8 max-w-3xl flex-grow">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-primary">Your Profile</h1>
          </div>
          {pageIsLoading ? (
             <div className="flex flex-col items-center gap-6">
                <Card className="w-full max-w-md mx-auto">
                    <CardHeader><CardTitle><Skeleton className="h-6 w-32"/></CardTitle></CardHeader>
                    <CardContent className="flex items-center space-x-4">
                        <Skeleton className="h-16 w-16 rounded-full"/>
                        <div className="space-y-2">
                           <Skeleton className="h-5 w-48"/>
                           <Skeleton className="h-4 w-56"/>
                        </div>
                    </CardContent>
                </Card>
                 <Card className="w-full max-w-md mx-auto"><CardHeader><Skeleton className="h-6 w-40"/></CardHeader><CardContent><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-24 mt-3"/></CardContent></Card>
                 <Card className="w-full max-w-md mx-auto"><CardHeader><Skeleton className="h-6 w-40"/></CardHeader><CardContent><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-24 mt-3"/></CardContent></Card>
             </div>
          ) : user ? (
            <div className="flex flex-col items-center gap-8">
              <Card className="w-full max-w-md mx-auto shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><UserLucide className="h-5 w-5"/> Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                      <Avatar className="w-16 h-16 border-2 border-primary">
                        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User Avatar'} />}
                        <AvatarFallback className="text-lg font-semibold">{user.email?.charAt(0).toUpperCase() || 'DG'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-lg font-semibold">{user.displayName || 'Display Name Not Set'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Picture Upload - Only for premium users */}
              {user && preferencesLoaded && userPreferences.subscriptionStatus === 'premium' && <ProfilePictureUploadForm user={user} />}

              {/* Display Name Update Form */}
              {user && <DisplayNameUpdateForm user={user} />}

              {/* Password Change Form - Only for email/password users */}
              {user && user.providerData.some(provider => provider.providerId === 'password') && <PasswordChangeForm user={user} />}
            </div>
          ) : (<p className="text-center text-muted-foreground">Please log in to view your profile.</p>)}
      </main>
       <footer className="w-full text-center py-6 px-4 border-t border-border/60">
        <div className="mb-2">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace.</p>
        </div>
        <div className="flex justify-center space-x-4">
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <span className="text-xs text-muted-foreground">|</span>
          <Link href="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
};

interface DisplayNameUpdateFormProps {
  user: FirebaseUser;
}

const DisplayNameUpdateForm: React.FC<DisplayNameUpdateFormProps> = ({ user }) => {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      await updateProfile(user, { displayName });
      toast({
        title: "Display Name Updated",
        description: "Your display name has been successfully updated.",
      });
      if(analytics) logEvent(analytics, 'profile_update_success', { update_type: 'display_name' });
    } catch (error: any) {
      console.error("Error updating display name:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update display name. Please try again.",
        variant: "destructive",
      });
       if(analytics) logEvent(analytics, 'profile_update_failed', { update_type: 'display_name', error_message: error.message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-md">
      <CardHeader>
        <CardTitle>Update Display Name</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateDisplayName} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isUpdating} />
          </div>
          <Button type="submit" disabled={isUpdating || displayName === (user.displayName || '')}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {isUpdating ? 'Updating...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

interface PasswordChangeFormProps {
    user: FirebaseUser;
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ user }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChanging, setIsChanging] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const { toast } = useToast();

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);

        if (!newPassword || !confirmPassword) {
            setPasswordError("New password and confirm password are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirm password do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters long.");
            return;
        }

        setIsChanging(true);
        try {
            if (!user.email) {
                 setPasswordError("User email is not available for re-authentication.");
                 setIsChanging(false);
                 return;
            }
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            toast({
                title: "Password Changed",
                description: "Your password has been successfully updated.",
            });
            if(analytics) logEvent(analytics, 'profile_update_success', { update_type: 'password' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            console.error("Error changing password:", error);
            const friendlyError = error.code === 'auth/wrong-password' ? 'The current password you entered is incorrect.' : error.message;
            setPasswordError(friendlyError);
            toast({
                title: "Password Change Failed",
                description: friendlyError,
                variant: "destructive",
            });
            if(analytics) logEvent(analytics, 'profile_update_failed', { update_type: 'password', error_message: error.message });
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5"/> Change Password</CardTitle>
                <CardDescription>Update your account password.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={isChanging} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isChanging} required minLength={6} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isChanging} required minLength={6} />
                    </div>
                    {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                    <Button type="submit" disabled={isChanging || !currentPassword || !newPassword || !confirmPassword}>
                         {isChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        {isChanging ? 'Changing...' : 'Change Password'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

interface ProfilePictureUploadFormProps {
    user: FirebaseUser;
}

const ProfilePictureUploadForm: React.FC<ProfilePictureUploadFormProps> = ({ user }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = () => fileInputRef.current?.click();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            setUploadError('Please select a valid image file.');
            return;
        }
        setIsUploading(true);
        setUploadError(null);

        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        try {
            await uploadBytes(storageRef, file);
            const photoURL = await getDownloadURL(storageRef);
            await updateProfile(user, { photoURL });

            toast({
                title: "Profile Picture Updated",
                description: "Your avatar has been successfully changed. It may take a moment to appear everywhere.",
            });
             if(analytics) logEvent(analytics, 'profile_update_success', { update_type: 'photo_url' });
            // You might need to force a re-fetch of the user object in useAuth context or simply reload the page
            window.location.reload();
        } catch (error: any) {
            console.error("Error uploading profile picture:", error);
            setUploadError(error.message || "Could not upload image.");
            toast({
                title: "Upload Failed",
                description: error.message || "Could not upload image. Please try again.",
                variant: "destructive",
            });
             if(analytics) logEvent(analytics, 'profile_update_failed', { update_type: 'photo_url', error_message: error.message });
        } finally {
            setIsUploading(false);
        }
    };


    return (
         <Card className="w-full max-w-md mx-auto shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5"/> Profile Picture (Premium)</CardTitle>
                <CardDescription>Change your profile avatar.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-start gap-4">
                     <Input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                        disabled={isUploading}
                    />
                    <Button onClick={handleFileSelect} disabled={isUploading}>
                         {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                         {isUploading ? 'Uploading...' : 'Choose Image'}
                    </Button>
                    {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
                </div>
            </CardContent>
        </Card>
    );
};
export default UserProfilePage;
