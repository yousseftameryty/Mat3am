# 🚀 Deployment Guide

## Deploy to Vercel (Recommended)

### Step 1: Prepare Your Code

Make sure your code is ready:
```bash
npm run build  # Test that it builds successfully
```

### Step 2: Push to GitHub

```bash
git init
git add .
git commit -m "Restaurant billing system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### Step 3: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign in** with your GitHub account
3. **Click "Add New Project"**
4. **Import your repository** from GitHub
5. **Configure Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anon key
6. **Click "Deploy"**

### Step 4: Update QR Codes

After deployment, you'll get a URL like:
- `https://restaurant-system-abc123.vercel.app`

The QR codes will **automatically** use this URL when accessed from Vercel!

### Step 5: Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain (e.g., `restaurant.yourdomain.com`)
4. Follow DNS setup instructions

---

## Why Vercel?

✅ **Free tier** - Perfect for small projects  
✅ **Automatic HTTPS** - Secure by default  
✅ **Global CDN** - Fast worldwide  
✅ **Auto-deployments** - Deploy on every git push  
✅ **Built for Next.js** - Made by the same team  
✅ **Easy environment variables** - Simple config  

---

## GitHub Pages (Not Recommended)

❌ **Doesn't support Next.js server features**  
❌ **No API routes or server actions**  
❌ **Static sites only**  
❌ **No real-time features**  

Your app uses server actions and real-time subscriptions, so GitHub Pages won't work.

---

## Troubleshooting

**Build fails?**
- Check that all environment variables are set in Vercel
- Make sure `npm run build` works locally first

**QR codes not working?**
- Make sure you're accessing the page from the Vercel URL (not localhost)
- Check that `NEXT_PUBLIC_SUPABASE_URL` is set correctly

**Slow loading?**
- Vercel uses global CDN, should be fast
- Check Supabase connection (might be region issue)

