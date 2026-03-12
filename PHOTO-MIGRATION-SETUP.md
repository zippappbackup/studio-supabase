# 📸 VENDOR PHOTO MIGRATION - COMPLETE SETUP GUIDE

## 🎯 WHAT YOU'RE SETTING UP

A **Supabase Edge Function** that:
- ✅ Fetches vendors with Google Place IDs from database
- ✅ Downloads photos from Google Places API  
- ✅ Uploads photos to Supabase Storage
- ✅ Updates vendor records with permanent URLs
- ✅ Processes in controlled batches (prevents API overload)
- ✅ Admin-only access with detailed logging

---

## 📦 STEP 1: INSTALL FILES

### **1.1 Install PhotoMigrationCard Component**

```bash
cd /Users/petermoss/Downloads/studio-stable-build

# Copy the component
cp ~/Downloads/PhotoMigrationCard.tsx src/app/\(admin\)/admin/data-management/PhotoMigrationCard.tsx

# Verify
head -5 src/app/\(admin\)/admin/data-management/PhotoMigrationCard.tsx
```

**Expected output:** Should show `"use client";` on line 1

---

### **1.2 Update Data Management Page**

```bash
# Replace the page
cp ~/Downloads/data-management-page-UPDATED.tsx src/app/\(admin\)/admin/data-management/page.tsx

# Verify
grep "PhotoMigrationCard" src/app/\(admin\)/admin/data-management/page.tsx
```

**Expected output:** Should show import and usage of PhotoMigrationCard

---

## 🚀 STEP 2: DEPLOY SUPABASE EDGE FUNCTION

### **2.1 Create Edge Function Directory**

```bash
cd /Users/petermoss/Downloads/studio-stable-build

# Create the functions directory structure
mkdir -p supabase/functions/migrate-vendor-photos
```

---

### **2.2 Create Edge Function File**

```bash
# Copy the edge function code to the correct location
cp ~/Downloads/supabase-edge-function-migrate-photos.ts supabase/functions/migrate-vendor-photos/index.ts

# Verify
head -5 supabase/functions/migrate-vendor-photos/index.ts
```

---

### **2.3 Deploy to Supabase**

```bash
# Login to Supabase (if not already logged in)
supabase login

# Link your project
supabase link --project-ref yvryxnbeeskuwuikzcgn

# Deploy the function
supabase functions deploy migrate-vendor-photos --no-verify-jwt

# Set environment variables for the function
supabase secrets set GOOGLE_PLACES_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

**Note:** Replace `YOUR_ACTUAL_API_KEY_HERE` with your actual Google Places API key when you have it. For now, use `PLACEHOLDER_KEY`.

---

### **2.4 Verify Deployment**

```bash
# List all deployed functions
supabase functions list
```

**Expected output:** You should see `migrate-vendor-photos` in the list

---

## 🔑 STEP 3: ENVIRONMENT VARIABLES SETUP

### **3.1 Local Environment (.env.local)**

Add to your `.env.local` file:

```bash
# Existing Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://yvryxnbeeskuwuikzcgn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Places API Key (add this)
GOOGLE_PLACES_API_KEY=PLACEHOLDER_KEY
```

**When you get the real API key**, replace `PLACEHOLDER_KEY` with your actual key.

---

### **3.2 Supabase Edge Function Secrets**

The Edge Function needs the Google Places API key as a secret:

```bash
# Set the secret (do this AFTER you have the real API key)
supabase secrets set GOOGLE_PLACES_API_KEY=your_actual_google_places_api_key
```

**For now with placeholder:**
```bash
supabase secrets set GOOGLE_PLACES_API_KEY=PLACEHOLDER_KEY
```

---

## 🗄️ STEP 4: SUPABASE STORAGE SETUP

The function uploads photos to Supabase Storage. Make sure the `uploads` bucket exists:

### **4.1 Create Storage Bucket (if not exists)**

Go to: https://yvryxnbeeskuwuikzcgn.supabase.co/project/yvryxnbeeskuwuikzcgn/storage/buckets

1. Click **"New bucket"**
2. Name: `uploads`
3. Public: ✅ **YES** (photos need to be publicly accessible)
4. Click **"Create bucket"**

---

### **4.2 Set Storage Policies**

Go to bucket settings and add these policies:

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

**Policy 3: Service Role Full Access**
```sql
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'uploads');
```

---

## 🧪 STEP 5: TEST THE SETUP

### **5.1 Start Your App**

```bash
cd /Users/petermoss/Downloads/studio-stable-build
npm run dev
```

---

### **5.2 Access the Tool**

1. Login as **admin** user
2. Go to: http://localhost:3000/admin/data-management
3. Scroll to **"Vendor Photo Migration Tool"** card
4. Set batch size (start with 1-2 for testing)
5. Click **"Run Photo Migration"**

---

### **5.3 What to Expect**

**With PLACEHOLDER_KEY:**
- ✅ Function will execute
- ⚠️ Photo downloads will fail (expected - no real API key)
- ✅ You'll see logs showing the attempt

**With REAL API KEY:**
- ✅ Function downloads photos from Google Places
- ✅ Uploads to Supabase Storage  
- ✅ Updates vendor records
- ✅ Detailed logs show progress

---

## 🔍 STEP 6: VERIFY EVERYTHING WORKS

### **6.1 Check Deployed Function**

```bash
# View function logs
supabase functions logs migrate-vendor-photos
```

---

### **6.2 Check Function URL**

Your function will be available at:
```
https://yvryxnbeeskuwuikzcgn.supabase.co/functions/v1/migrate-vendor-photos
```

---

### **6.3 Test Direct API Call (Optional)**

```bash
# Get your auth token first from browser dev tools
# Then test the function:

curl -X POST \
  'https://yvryxnbeeskuwuikzcgn.supabase.co/functions/v1/migrate-vendor-photos' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"limit": 2}'
```

---

## 📋 COMPLETE FILE CHECKLIST

After setup, you should have:

```
studio-stable-build/
├── src/
│   └── app/
│       └── (admin)/
│           └── admin/
│               └── data-management/
│                   ├── page.tsx ✅ (updated with PhotoMigrationCard)
│                   ├── PhotoMigrationCard.tsx ✅ (new component)
│                   ├── DataImporterClientPage.tsx ✅ (already updated)
│                   └── ...other files
├── supabase/
│   └── functions/
│       └── migrate-vendor-photos/
│           └── index.ts ✅ (edge function)
└── .env.local ✅ (with GOOGLE_PLACES_API_KEY)
```

---

## 🚨 TROUBLESHOOTING

### **Issue: Function not found**
```bash
# Redeploy
supabase functions deploy migrate-vendor-photos --no-verify-jwt
```

### **Issue: Permission denied**
- Make sure you're logged in as admin in the app
- Check Supabase RLS policies allow admin access

### **Issue: Photos not uploading**
- Verify `uploads` bucket exists and is public
- Check storage policies are set correctly

### **Issue: Google API errors**
- Replace `PLACEHOLDER_KEY` with real Google Places API key
- Update both local `.env.local` AND Supabase secrets

---

## ✅ WHEN YOU GET THE REAL GOOGLE PLACES API KEY

**Update in 2 places:**

1. **Local environment:**
```bash
# Edit .env.local
GOOGLE_PLACES_API_KEY=AIzaSy...your_real_key
```

2. **Supabase secrets:**
```bash
supabase secrets set GOOGLE_PLACES_API_KEY=AIzaSy...your_real_key
```

Then restart your app and the edge function will automatically use the new key!

---

## 🎉 SUCCESS INDICATORS

You'll know it's working when:
- ✅ Component appears in Data Management page
- ✅ Click "Run Photo Migration" shows logs
- ✅ Logs show vendors being processed
- ✅ Photos appear in Supabase Storage `uploads/place-photos/`
- ✅ Vendor records updated with new photo URLs

---

**Need help? Check the logs or let me know!** 🚀
