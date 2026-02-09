#!/bin/bash
set -e

# Script to update only the RPC_URL environment variable on Vercel
# This updates the RPC to use the public Polygon Amoy testnet (no API keys)

echo "🚀 Updating Vercel RPC to public Polygon Amoy testnet..."
echo ""
echo "⚠️  Make sure you've already logged in with: vercel login"
echo ""

# The new public RPC URL
NEW_RPC_URL="https://rpc-amoy.polygon.technology"

echo "📝 New RPC URL: $NEW_RPC_URL"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

# Update the RPC URL for all environments
echo ""
echo "📤 Updating NEXT_PUBLIC_RPC_URL..."
echo ""

echo "  ✓ Production environment"
echo "$NEW_RPC_URL" | vercel env add NEXT_PUBLIC_RPC_URL production --force

echo "  ✓ Preview environment"
echo "$NEW_RPC_URL" | vercel env add NEXT_PUBLIC_RPC_URL preview --force

echo "  ✓ Development environment"
echo "$NEW_RPC_URL" | vercel env add NEXT_PUBLIC_RPC_URL development --force

echo ""
echo "✅ RPC URL updated successfully on all environments!"
echo ""
echo "📦 Next steps:"
echo "1. Trigger a new deployment by pushing to your repo"
echo "2. Or manually redeploy from https://vercel.com/dashboard"
echo ""
echo "🎉 Done! Your Vercel app will now use the public Polygon Amoy RPC."
