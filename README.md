# 🍽️ Restaurant Billing System

A modern, real-time restaurant billing system with QR code table access, built with Next.js, Supabase, and Framer Motion.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Then fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get your Supabase credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the "Project URL" and "anon/public" key

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## 📱 Pages

- **`/cashier`** - Cashier dashboard for taking orders
- **`/table/[id]`** - Customer view for table (e.g., `/table/1`)
- **`/admin/qr-code`** - Generate and print QR codes for tables

## 🎯 Features

- ✅ Real-time order status updates
- ✅ Beautiful animations with Framer Motion
- ✅ QR code generation for tables
- ✅ Responsive design
- ✅ Live order tracking

## 🗄️ Database Schema

The system uses these Supabase tables:
- `menu_items` - Restaurant menu items
- `restaurant_tables` - Table information
- `orders` - Order records
- `order_items` - Individual items in orders

## 📦 Tech Stack

- **Next.js 16** - React framework
- **Supabase** - Backend & database
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## 🚀 Deployment to Vercel

### Quick Deploy

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - Click "Deploy"

3. **Update QR Codes:**
   - After deployment, you'll get a URL like `https://your-app.vercel.app`
   - Update the BASE_URL in `/admin/qr-code/page.tsx` or use environment variable
   - Or the QR codes will auto-detect the production URL!

### Why Vercel?

✅ **Perfect for Next.js** - Made by the same team  
✅ **Free tier** - Great for small projects  
✅ **Automatic HTTPS** - Secure by default  
✅ **Global CDN** - Fast worldwide  
✅ **Easy environment variables** - Simple config  
✅ **Auto-deployments** - Deploy on every push  

### Alternative: GitHub Pages

❌ **Not recommended** - GitHub Pages doesn't support Next.js server features  
❌ **No API routes** - Can't use server actions  
❌ **Static only** - No real-time features  

If you need static hosting, use Vercel's static export or Netlify instead.
