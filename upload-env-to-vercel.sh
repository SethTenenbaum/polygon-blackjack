#!/bin/bash
set -e

# Script to upload environment variables from .env.local to Vercel
# This makes it easy to sync your local env vars to Vercel

echo "🚀 Uploading environment variables to Vercel..."
echo ""
echo "⚠️  Make sure you've already:"
echo "   1. Created the project on Vercel (https://vercel.com/new)"
echo "   2. Logged in with: vercel login"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Login to Vercel if needed
echo ""
echo "🔐 Logging in to Vercel (if needed)..."
vercel login

# Link to your Vercel project
echo ""
echo "🔗 Linking to your Vercel project..."
vercel link

# Upload each environment variable from .env.local
echo ""
echo "📤 Uploading environment variables..."
echo ""

# Read .env.local and upload each non-comment line
while IFS= read -r line || [ -n "$line" ]; do
  # Skip comments and empty lines
  if [[ $line =~ ^#.*$ ]] || [[ -z "${line// }" ]]; then
    continue
  fi
  
  # Extract key and value
  if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    
    echo "  Adding: $key"
    
    # Add to production, preview, and development
    echo "$value" | vercel env add "$key" production --force
    echo "$value" | vercel env add "$key" preview --force
    echo "$value" | vercel env add "$key" development --force
  fi
done < .env.local

echo ""
echo "✅ All environment variables uploaded successfully!"
echo ""
echo "📦 Next steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Find your 'polygon-blackjack' project"
echo "3. Click 'Deploy' or push changes to trigger a new deployment"
echo ""
echo "🎉 Done!"
