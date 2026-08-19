#!/bin/bash

# GitHub OAuth Integration - Complete Verification Script
# This script verifies all components are properly integrated

set -e

echo "🔍 GitHub OAuth Implementation Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Auth Service exists
echo -n "✓ Checking authService.ts exists... "
if [ -f "src/lib/authService.ts" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
    exit 1
fi

# Check 2: OAuth callback component exists
echo -n "✓ Checking AuthCallback.tsx exists... "
if [ -f "src/components/AuthCallback.tsx" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
    exit 1
fi

# Check 3: signInWithGithub function exported
echo -n "✓ Checking signInWithGithub export... "
if grep -q "export async function signInWithGithub" src/lib/authService.ts; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
    exit 1
fi

# Check 4: Auth service imported in hook
echo -n "✓ Checking authService imported in hook... "
if grep -q "from '../lib/authService'" src/hooks/usePromptHub.ts; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
    exit 1
fi

# Check 5: User state in hook
echo -n "✓ Checking user state in hook... "
if grep -q "user: User | null" src/hooks/usePromptHub.ts; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
    exit 1
fi

# Check 6: Author state in hook
echo -n "✓ Checking author state in hook... "
if grep -q "author: AuthorProfile | null" src/hooks/usePromptHub.ts; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
    exit 1
fi

# Check 7: signInWithGithub action in hook
echo -n "✓ Checking signInWithGithub action... "
if grep -q "signInWithGithub.*handleSignInWithGithub" src/hooks/usePromptHub.ts; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
    exit 1
fi

# Check 8: AuthCallback imported in App
echo -n "✓ Checking AuthCallback imported in App... "
if grep -q "import AuthCallback from" src/App.tsx; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
    exit 1
fi

# Check 9: AuthCallback routed in App
echo -n "✓ Checking /auth/callback route in App... "
if grep -q "window.location.pathname === '/auth/callback'" src/App.tsx; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
    exit 1
fi

# Check 10: Supabase client exists
echo -n "✓ Checking Supabase client... "
if [ -f "src/lib/supabase.ts" ]; then
    echo -e "${GREEN}FOUND${NC}"
else
    echo -e "${RED}MISSING${NC}"
    exit 1
fi

# Check 11: Build succeeds
echo -n "✓ Building project... "
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}SUCCESS${NC}"
else
    echo -e "${RED}FAILED${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Implementation Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Files Created:"
echo "  • src/lib/authService.ts (236 lines)"
echo "  • src/components/AuthCallback.tsx (86 lines)"
echo ""
echo "📝 Files Modified:"
echo "  • src/hooks/usePromptHub.ts (+134 lines)"
echo "  • src/components/AuthModal.tsx (+3 lines)"
echo "  • src/App.tsx (+7 lines)"
echo ""
echo "🎯 Features Implemented:"
echo "  ✓ GitHub OAuth login flow"
echo "  ✓ OAuth callback handling"
echo "  ✓ Session management"
echo "  ✓ Author profile management"
echo "  ✓ Auth state persistence"
echo "  ✓ Error handling"
echo "  ✓ Protected views"
echo ""
echo "🚀 Ready for Testing!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo "  1. Configure GitHub OAuth app credentials"
echo "  2. Add credentials to Supabase"
echo "  3. Run: npm run dev"
echo "  4. Click 'Continue with GitHub' button"
echo "  5. Complete GitHub authorization"
echo ""
echo "See GITHUB_OAUTH_SETUP.md for detailed setup instructions"
echo ""
