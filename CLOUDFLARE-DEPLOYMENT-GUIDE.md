# 🚀 PRODUCTION DEPLOYMENT GUIDE
## Deploy Zipp Super App to Cloudflare Pages (zipp.sg)

**Target:** Production deployment to zipp.sg
**Platform:** Cloudflare Pages + Supabase
**Date:** March 11, 2026

---

## ⚡ **QUICK START - DEPLOYMENT COMMANDS**

```bash
cd /Users/petermoss/Downloads/studio-stable-build

# 1. Deploy Supabase Edge Function
supabase functions deploy migrate-vendor-photos --no-verify-jwt

# 2. Push to GitHub (triggers Cloudflare deployment)
git add .
git commit -m "Production deployment: Supabase migration complete"
git push origin main

# 3. Configure Cloudflare Pages (one-time setup in dashboard)
# See detailed steps below
```

---

## 📋 **DEPLOYMENT CHECKLIST**

### **PHASE 1: SUPABASE PREPARATION** ✅

- [x] Supabase project created (yvryxnbeeskuwuikzcgn)
- [x] Database tables created (16 tables)
- [x] RLS policies configured
- [ ] Edge Function deployed
- [ ] Storage bucket 'uploads' created with policies
- [ ] Secrets configured

---

### **PHASE 2: GITHUB SETUP** 

- [ ] Code pushed to GitHub
- [ ] Branch: main (or production)
- [ ] Repository: zippsuperapp-hash/studio

---

### **PHASE 3: CLOUDFLARE PAGES SETUP**

- [ ] Cloudflare Pages project created
- [ ] Connected to GitHub repository
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Custom domain (zipp.sg) connected

---

## 🔧 **STEP-BY-STEP DEPLOYMENT**

---

## **STEP 1: DEPLOY SUPABASE EDGE FUNCTION**

### **1.1 Login to Supabase**

```bash
cd /Users/petermoss/Downloads/studio-stable-build

# Login
supabase login
```

### **1.2 Link Project**

```bash
supabase link --project-ref yvryxnbeeskuwuikzcgn
```

### **1.3 Deploy Photo Migration Function**

```bash
supabase functions deploy migrate-vendor-photos --no-verify-jwt
```

**Expected output:**
```
Deploying migrate-vendor-photos (version xxxxxxxx)
Function URL: https://yvryxnbeeskuwuikzcgn.supabase.co/functions/v1/migrate-vendor-photos
✅ Deployed successfully
```

### **1.4 Set Secrets**

```bash
# Set Google Places API key (use placeholder for now)
supabase secrets set GOOGLE_PLACES_API_KEY=PLACEHOLDER_KEY

# Verify
supabase secrets list
```

---

## **STEP 2: CREATE SUPABASE STORAGE BUCKET**

### **2.1 Go to Supabase Dashboard**

Visit: https://supabase.com/dashboard/project/yvryxnbeeskuwuikzcgn/storage/buckets

### **2.2 Create 'uploads' Bucket**

1. Click **"New bucket"**
2. Name: `uploads`
3. **Public bucket:** ✅ **YES**
4. Click **"Create bucket"**

### **2.3 Add Storage Policies**

Go to: Storage → uploads → Policies

**Policy 1: Public Read**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');
```

**Policy 2: Authenticated Upload**
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');
```

**Policy 3: Service Role Access**
```sql
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'uploads');
```

Click **"Save policy"** for each.

---

## **STEP 3: PUSH TO GITHUB**

### **3.1 Check Git Status**

```bash
cd /Users/petermoss/Downloads/studio-stable-build

git status
```

### **3.2 Commit All Changes**

```bash
# Stage all files
git add .

# Commit with descriptive message
git commit -m "Production deployment: Complete Supabase migration

- Migrated all authentication to Supabase Auth
- Migrated all database operations to PostgreSQL
- Migrated file uploads to Supabase Storage
- Added photo migration Edge Function
- Updated all 46+ application files
- Zero Firebase dependencies in application code
- Ready for production deployment"

# Push to GitHub
git push origin main
```

**Note:** If you don't have a remote set up:
```bash
git remote add origin https://github.com/zippsuperapp-hash/studio.git
git push -u origin main
```

---

## **STEP 4: CONFIGURE CLOUDFLARE PAGES**

### **4.1 Login to Cloudflare Dashboard**

Visit: https://dash.cloudflare.com/

### **4.2 Navigate to Pages**

1. Click **"Workers & Pages"** in sidebar
2. Click **"Create application"**
3. Choose **"Pages"** tab
4. Click **"Connect to Git"**

### **4.3 Connect GitHub Repository**

1. Select **GitHub**
2. Authorize Cloudflare if needed
3. Select repository: **zippsuperapp-hash/studio**
4. Click **"Begin setup"**

### **4.4 Configure Build Settings**

**Project name:** `zipp-super-app` (or your choice)

**Production branch:** `main`

**Build settings:**
```
Framework preset: Next.js
Build command: npm run build
Build output directory: .next
Root directory: /
```

**Environment variables (set these NOW):**

Click **"Add variable"** for each:

```
NODE_VERSION = 20.11.0
NEXT_PUBLIC_SUPABASE_URL = https://yvryxnbeeskuwuikzcgn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cnl4bmJlZXNrdXd1aWt6Y2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NDQ1MjEsImV4cCI6MjA4NTUyMDUyMX0.GfbvStpPGHJ7M5rK3jATaaH2fLrNW5YBr_nhBh60pxI
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cnl4bmJlZXNrdXd1aWt6Y2duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0NDUyMSwiZXhwIjoyMDg1NTIwNTIxfQ.cZf1OY8wuF7MEo5n-vNQWBW0KrJfA4Dny4QTz7rbCpU
GOOGLE_PLACES_API_KEY = PLACEHOLDER_KEY
```

**CRITICAL:** Make sure all variables are set for **Production** environment!

Click **"Save and Deploy"**

---

## **STEP 5: WAIT FOR BUILD**

### **5.1 Monitor Build Progress**

Cloudflare will now:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Build your app (`npm run build`)
4. Deploy to CDN

**Build time:** 5-10 minutes

### **5.2 Check Build Logs**

Watch for:
- ✅ Dependencies installed
- ✅ TypeScript compiled
- ✅ Build successful
- ✅ Deployment complete

### **5.3 Get Deployment URL**

Once complete, you'll get a URL like:
```
https://zipp-super-app.pages.dev
```

**Test this URL first before connecting your domain!**

---

## **STEP 6: CONNECT CUSTOM DOMAIN (zipp.sg)**

### **6.1 Go to Custom Domains**

In Cloudflare Pages:
1. Click your project
2. Go to **"Custom domains"** tab
3. Click **"Set up a custom domain"**

### **6.2 Add zipp.sg**

1. Enter: `zipp.sg`
2. Click **"Continue"**

Cloudflare will detect you own this domain (since it's in your account)

### **6.3 Add www Subdomain**

Also add: `www.zipp.sg`

### **6.4 DNS Configuration**

Cloudflare will automatically configure:
```
Type: CNAME
Name: zipp.sg
Target: zipp-super-app.pages.dev
Proxy: ✅ Proxied
```

**This happens automatically!**

### **6.5 Wait for SSL Certificate**

Cloudflare will provision SSL certificate (2-5 minutes)

---

## **STEP 7: VERIFY DEPLOYMENT** ✅

### **7.1 Visit Your Site**

Open: https://zipp.sg

### **7.2 Quick Smoke Tests**

**Test 1: Homepage loads**
- [ ] Homepage appears
- [ ] No errors in console
- [ ] Images load

**Test 2: Authentication**
- [ ] Can visit login page
- [ ] Can visit signup page

**Test 3: Search**
- [ ] Search page loads
- [ ] Can search vendors

**Test 4: Vendor Pages**
- [ ] Can view vendor profiles
- [ ] Photos display

**Test 5: Admin Login**
- [ ] Can login as admin
- [ ] Dashboard loads
- [ ] Can access data management

---

## **STEP 8: POST-DEPLOYMENT CONFIGURATION**

### **8.1 Update Supabase Auth URLs**

Go to: https://supabase.com/dashboard/project/yvryxnbeeskuwuikzcgn/auth/url-configuration

**Site URL:** `https://zipp.sg`

**Redirect URLs:** Add these:
```
https://zipp.sg/verify-email
https://zipp.sg/auth/callback
https://zipp.sg/*
```

Click **"Save"**

### **8.2 Test Email Verification**

1. Sign up new user
2. Check email
3. Click verification link
4. Should redirect to https://zipp.sg/verify-email

---

## **STEP 9: ENABLE GOOGLE PLACES API** (When Ready)

### **9.1 Get Google Places API Key**

1. Go to: https://console.cloud.google.com/
2. Create new project or select existing
3. Enable **Places API**
4. Create API key

### **9.2 Update Secrets**

**In Cloudflare:**
```bash
# Go to Settings → Environment variables
# Edit GOOGLE_PLACES_API_KEY
# Replace PLACEHOLDER_KEY with real key
```

**In Supabase:**
```bash
supabase secrets set GOOGLE_PLACES_API_KEY=your_real_key_here
```

### **9.3 Test Photo Migration**

1. Login as admin
2. Go to Data Management
3. Run photo migration tool
4. Verify photos download and upload

---

## 🔒 **SECURITY CHECKLIST**

- [ ] All Supabase RLS policies enabled
- [ ] Environment variables not exposed in client code
- [ ] Storage bucket policies configured
- [ ] Admin routes protected
- [ ] HTTPS enabled (automatic with Cloudflare)
- [ ] API keys secured

---

## 📊 **PERFORMANCE OPTIMIZATION**

### **Already Configured:**
- ✅ Cloudflare CDN (global edge network)
- ✅ Image optimization disabled (required for Cloudflare)
- ✅ Supabase connection pooling
- ✅ Static asset caching

### **Optional Enhancements:**
- [ ] Enable Cloudflare Argo for faster routing
- [ ] Configure cache rules for assets
- [ ] Enable Cloudflare Analytics

---

## 🚨 **TROUBLESHOOTING**

### **Issue: Build fails**

**Solution:**
```bash
# Check build logs in Cloudflare dashboard
# Common fixes:

# 1. Verify Node version
NODE_VERSION = 20.11.0

# 2. Clear cache and rebuild
# In Cloudflare: Deployments → ⋮ → Retry deployment

# 3. Check package.json scripts
# Verify: "build": "next build"
```

### **Issue: Environment variables not working**

**Solution:**
1. Go to Settings → Environment variables
2. Verify all variables are set for **Production**
3. Redeploy after adding variables

### **Issue: 500 Internal Server Error**

**Solution:**
1. Check Cloudflare Functions logs
2. Verify Supabase credentials
3. Check browser console for errors

### **Issue: Images not loading**

**Solution:**
1. Verify Supabase Storage bucket is public
2. Check storage policies
3. Verify image URLs in database

### **Issue: Auth redirect fails**

**Solution:**
1. Update Supabase redirect URLs
2. Include https://zipp.sg/*
3. Clear browser cache

---

## 📈 **MONITORING**

### **Cloudflare Analytics**

Visit: Dashboard → Analytics

Monitor:
- Page views
- Request rates
- Bandwidth usage
- Error rates

### **Supabase Dashboard**

Visit: https://supabase.com/dashboard/project/yvryxnbeeskuwuikzcgn

Monitor:
- Database queries
- Storage usage
- API requests
- Edge Function invocations

---

## 🎉 **SUCCESS CRITERIA**

Your deployment is successful when:

- ✅ https://zipp.sg loads without errors
- ✅ Users can sign up and login
- ✅ Vendors can be searched and viewed
- ✅ Admin dashboard accessible
- ✅ Photo uploads work
- ✅ No console errors
- ✅ SSL certificate valid
- ✅ All features functional

---

## 📝 **POST-DEPLOYMENT TASKS**

- [ ] Test all critical user flows
- [ ] Monitor error logs for 24 hours
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Configure backup strategy
- [ ] Document any issues found
- [ ] Train team on new Supabase dashboard

---

## 🚀 **CONTINUOUS DEPLOYMENT**

Once set up, future deployments are automatic:

```bash
# Make changes to code
git add .
git commit -m "Feature: New functionality"
git push origin main

# Cloudflare automatically:
# 1. Detects the push
# 2. Builds the app
# 3. Deploys to production
# 4. Updates https://zipp.sg
```

**Zero downtime deployments!** ✨

---

## ✅ **DEPLOYMENT COMPLETE!**

**Your Zipp Super App is now live at: https://zipp.sg**

**Powered by:**
- 🟦 Cloudflare Pages (Edge hosting)
- 🟩 Supabase (Database, Auth, Storage)
- ⚡ Next.js 15 (React framework)

**Congratulations! 🎊**
