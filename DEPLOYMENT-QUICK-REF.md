# ⚡ DEPLOYMENT QUICK REFERENCE
## Deploy to zipp.sg in 15 Minutes

---

## 🎯 **THE 5-STEP DEPLOYMENT**

### **STEP 1: Deploy Edge Function** (2 min)
```bash
cd /Users/petermoss/Downloads/studio-stable-build
supabase login
supabase link --project-ref yvryxnbeeskuwuikzcgn
supabase functions deploy migrate-vendor-photos --no-verify-jwt
supabase secrets set GOOGLE_PLACES_API_KEY=PLACEHOLDER_KEY
```

---

### **STEP 2: Create Storage Bucket** (2 min)

Visit: https://supabase.com/dashboard/project/yvryxnbeeskuwuikzcgn/storage/buckets

1. Click "New bucket"
2. Name: `uploads`
3. Public: ✅ YES
4. Add 3 policies (see guide)

---

### **STEP 3: Push to GitHub** (1 min)
```bash
git add .
git commit -m "Production: Supabase migration complete"
git push origin main
```

---

### **STEP 4: Deploy to Cloudflare** (5 min)

Visit: https://dash.cloudflare.com/

1. Workers & Pages → Create
2. Connect to Git → Select repo
3. Build settings:
   - Framework: Next.js
   - Build: `npm run build`
   - Output: `.next`
4. Add env variables:
   ```
   NODE_VERSION = 20.11.0
   NEXT_PUBLIC_SUPABASE_URL = https://yvryxnbeeskuwuikzcgn.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...
   GOOGLE_PLACES_API_KEY = PLACEHOLDER_KEY
   ```
5. Save & Deploy

---

### **STEP 5: Connect Domain** (5 min)

1. In Cloudflare Pages → Custom domains
2. Add `zipp.sg` and `www.zipp.sg`
3. DNS auto-configured ✅
4. SSL auto-provisioned ✅

**Done!** Visit https://zipp.sg

---

## ✅ **POST-DEPLOYMENT**

### **Update Supabase Auth URLs:**

Visit: https://supabase.com/dashboard/project/yvryxnbeeskuwuikzcgn/auth/url-configuration

**Site URL:** `https://zipp.sg`

**Redirect URLs:**
```
https://zipp.sg/verify-email
https://zipp.sg/auth/callback
https://zipp.sg/*
```

---

## 🧪 **QUICK TESTS**

```bash
# Test homepage
curl -I https://zipp.sg

# Test search
open https://zipp.sg/search

# Test admin
open https://zipp.sg/admin/dashboard
```

---

## 🚨 **TROUBLESHOOTING**

**Build fails?**
- Check Cloudflare build logs
- Verify environment variables set for "Production"
- Retry deployment

**500 errors?**
- Check Supabase credentials
- Verify RLS policies enabled
- Check browser console

**Images not loading?**
- Create 'uploads' bucket (public)
- Add storage policies
- Verify URLs in database

---

## 📊 **MONITORING**

**Cloudflare:** https://dash.cloudflare.com/ → Analytics

**Supabase:** https://supabase.com/dashboard/project/yvryxnbeeskuwuikzcgn

---

## 🎉 **SUCCESS = https://zipp.sg LIVE!**

**Full guide:** CLOUDFLARE-DEPLOYMENT-GUIDE.md
