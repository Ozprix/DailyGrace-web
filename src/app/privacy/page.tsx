// src/app/privacy/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/header';
import Link from 'next/link';


export default function PrivacyPolicyPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex flex-col items-center bg-background text-foreground">
            <Header title="Privacy Policy" />
            <main className="container mx-auto py-8 max-w-3xl flex-grow">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
                </div>

                 <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
                            <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
                        </CardHeader>
                        <CardContent className="prose dark:prose-invert max-w-none">
                            <h3>1. Information We Collect</h3>
                            <p>We collect information you provide directly to us, such as when you create an account. This includes your email address and any other information you choose to provide. We also collect information automatically as you use the App, such as your journal entries, favorited verses, and interactions with AI features.</p>
                            
                            <h3>2. How We Use Your Information</h3>
                            <p>We use the information we collect to:</p>
                            <ul>
                                <li>Provide, maintain, and improve our App.</li>
                                <li>Personalize your experience.</li>
                                <li>Communicate with you about products, services, offers, and events.</li>
                                <li>Monitor and analyze trends, usage, and activities in connection with our App.</li>
                                <li>Detect, investigate and prevent fraudulent transactions and other illegal activities and protect the rights and property of Daily Grace and others.</li>
                            </ul>

                            <h3>3. Information Sharing</h3>
                            <p>We do not share your personal information with third parties except as described in this Privacy Policy. We may share information with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf (e.g., Firebase for authentication and database services).</p>

                            <h3>4. Data Security</h3>
                            <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration, and destruction. Your journal entries and other personal data are stored securely using Firebase's built-in security features.</p>

                            <h3>5. Your Choices</h3>
                            <p>You may update, correct or delete information about you at any time by logging into your online account or emailing us. If you wish to delete your account, please contact us, but note that we may retain certain information as required by law or for legitimate business purposes.</p>
                        </CardContent>
                    </Card>
            </main>
             <footer className="w-full text-center py-6 px-4 border-t border-border/60">
                <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Daily Grace.</p>
            </footer>
        </div>
    );
}
