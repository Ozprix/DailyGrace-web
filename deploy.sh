#!/bin/bash

# Daily Grace App Deployment Script
echo "🚀 Starting Daily Grace App Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run type checking
echo "🔍 Running TypeScript type checking..."
npx tsc --noEmit --skipLibCheck

if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Please fix them before deploying."
    exit 1
fi

# Build the application
echo "🏗️ Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Build completed successfully!"

# Optional: Start the production server
if [ "$1" = "--start" ]; then
    echo "🚀 Starting production server..."
    npm start
fi

echo "🎉 Deployment script completed!"
echo ""
echo "📋 Next steps:"
echo "1. The build is ready for deployment"
echo "2. You can deploy to Vercel, Netlify, or any other platform"
echo "3. Make sure to set up your environment variables"
echo "4. Configure your Firebase project settings"
echo ""
echo "🔧 Environment variables needed:"
echo "- NEXT_PUBLIC_FIREBASE_API_KEY"
echo "- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "- NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "- NEXT_PUBLIC_FIREBASE_APP_ID"
echo "- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" 