
// src/app/offline/page.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw, BookOpen, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <WifiOff className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              You're Offline
            </CardTitle>
            <CardDescription className="text-gray-600">
              Don't worry! You can still access your saved content and continue your spiritual journey.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Available Offline Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Available Offline:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Daily Devotionals</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Heart className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Prayer Wall</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Journal Entries</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                Go to Home
              </Button>
            </div>

            {/* Quick Access Links */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Quick Access:</h4>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/daily-devotional">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Devotional
                  </Button>
                </Link>
                <Link href="/prayer-wall">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Heart className="w-4 h-4 mr-2" />
                    Prayers
                  </Button>
                </Link>
                <Link href="/journal">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Journal
                  </Button>
                </Link>
                <Link href="/favorites">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Heart className="w-4 h-4 mr-2" />
                    Favorites
                  </Button>
                </Link>
              </div>
            </div>

            {/* Offline Tips */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Offline Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your journal entries will sync when you're back online</li>
                <li>• Prayer requests can be saved for later submission</li>
                <li>• Check your connection and try again</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
