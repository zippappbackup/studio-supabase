#!/bin/bash

# QUICK PRODUCTION DEPLOYMENT SCRIPT
# Deploy Zipp Super App to Cloudflare Pages

echo "🚀 ZIPP SUPER APP - PRODUCTION DEPLOYMENT"
echo "=========================================="
echo ""

PROJECT_ROOT="/Users/petermoss/Downloads/studio-stable-build"
cd "$PROJECT_ROOT" || exit 1

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting deployment sequence...${NC}"
echo ""

# STEP 1: Deploy Supabase Edge Function
echo "📦 STEP 1: Deploy Supabase Edge Function"
echo "----------------------------------------"
echo ""

if [ -d "supabase/functions/migrate-vendor-photos" ]; then
    echo "✅ Edge function found"
    echo ""
    echo -e "${YELLOW}Running: supabase functions deploy migrate-vendor-photos${NC}"
    echo ""
    
    # Uncomment to actually deploy:
    # supabase functions deploy migrate-vendor-photos --no-verify-jwt
    
    echo -e "${GREEN}Note: Deployment command ready. Uncomment in script to execute.${NC}"
else
    echo -e "${RED}❌ Edge function not found!${NC}"
    echo "Expected: supabase/functions/migrate-vendor-photos/index.ts"
    exit 1
fi

echo ""

# STEP 2: Check Git Status
echo "📂 STEP 2: Check Git Repository"
echo "--------------------------------"
echo ""

if [ -d ".git" ]; then
    echo "✅ Git repository initialized"
    echo ""
    
    # Show current branch
    BRANCH=$(git branch --show-current)
    echo "Current branch: ${BRANCH}"
    
    # Show status
    echo ""
    echo "Git status:"
    git status --short
    
    # Check for remote
    if git remote -v | grep -q "origin"; then
        echo ""
        echo "✅ Remote 'origin' configured"
        git remote -v | grep origin | head -1
    else
        echo ""
        echo -e "${YELLOW}⚠️  No remote configured${NC}"
        echo "Add remote: git remote add origin https://github.com/zippsuperapp-hash/studio.git"
    fi
else
    echo -e "${RED}❌ Not a git repository!${NC}"
    echo "Initialize: git init"
    exit 1
fi

echo ""

# STEP 3: Environment Variables Check
echo "🔐 STEP 3: Environment Variables Check"
echo "---------------------------------------"
echo ""

ENV_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "GOOGLE_PLACES_API_KEY"
)

if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    echo ""
    echo "Checking required variables:"
    
    MISSING=0
    for var in "${ENV_VARS[@]}"; do
        if grep -q "^${var}=" .env.local; then
            echo -e "  ${GREEN}✓${NC} $var"
        else
            echo -e "  ${RED}✗${NC} $var ${RED}(MISSING)${NC}"
            ((MISSING++))
        fi
    done
    
    if [ $MISSING -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ All environment variables present${NC}"
    else
        echo ""
        echo -e "${RED}❌ $MISSING variables missing!${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.local not found${NC}"
    echo "Create .env.local with required variables"
fi

echo ""

# STEP 4: Build Test
echo "🔨 STEP 4: Build Test"
echo "---------------------"
echo ""

echo "Checking build configuration..."

if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    
    # Check for build script
    if grep -q '"build"' package.json; then
        echo "✅ Build script found"
        
        BUILD_SCRIPT=$(grep '"build"' package.json)
        echo "   $BUILD_SCRIPT"
    else
        echo -e "${RED}❌ No build script in package.json${NC}"
    fi
    
    # Check Next.js config
    if [ -f "next.config.mjs" ] || [ -f "next.config.js" ]; then
        echo "✅ Next.js config found"
    else
        echo -e "${YELLOW}⚠️  next.config not found${NC}"
    fi
else
    echo -e "${RED}❌ package.json not found!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Optional: Run 'npm run build' to test build locally${NC}"

echo ""

# STEP 5: Deployment Checklist
echo "📋 STEP 5: Deployment Checklist"
echo "--------------------------------"
echo ""

echo "Before deploying, ensure:"
echo ""
echo "  [ ] Supabase project is ready"
echo "  [ ] Database tables created (16 tables)"
echo "  [ ] RLS policies configured"
echo "  [ ] Storage bucket 'uploads' created"
echo "  [ ] Edge function deployed"
echo "  [ ] GitHub repository created"
echo "  [ ] Code pushed to GitHub"
echo "  [ ] Cloudflare account ready"
echo "  [ ] Domain zipp.sg in Cloudflare"
echo ""

# STEP 6: Next Actions
echo "🎯 NEXT ACTIONS"
echo "==============="
echo ""

echo -e "${BLUE}1. Deploy Supabase Edge Function:${NC}"
echo "   supabase login"
echo "   supabase link --project-ref yvryxnbeeskuwuikzcgn"
echo "   supabase functions deploy migrate-vendor-photos --no-verify-jwt"
echo ""

echo -e "${BLUE}2. Create Supabase Storage Bucket:${NC}"
echo "   Go to: https://supabase.com/dashboard/project/yvryxnbeeskuwuikzcgn/storage/buckets"
echo "   Create bucket: 'uploads' (public)"
echo "   Add storage policies (see guide)"
echo ""

echo -e "${BLUE}3. Push to GitHub:${NC}"
echo "   git add ."
echo "   git commit -m 'Production deployment: Supabase migration complete'"
echo "   git push origin main"
echo ""

echo -e "${BLUE}4. Configure Cloudflare Pages:${NC}"
echo "   Go to: https://dash.cloudflare.com/"
echo "   Workers & Pages → Create → Connect to Git"
echo "   Select: zippsuperapp-hash/studio"
echo "   Configure build settings (see guide)"
echo "   Add environment variables"
echo "   Deploy!"
echo ""

echo -e "${BLUE}5. Connect Domain:${NC}"
echo "   In Cloudflare Pages → Custom domains"
echo "   Add: zipp.sg"
echo "   DNS configured automatically"
echo ""

echo -e "${GREEN}📚 Full guide: CLOUDFLARE-DEPLOYMENT-GUIDE.md${NC}"
echo ""

echo "✅ Pre-deployment check complete!"
echo ""
echo -e "${YELLOW}Ready to deploy? Follow the steps above!${NC}"
