# 🚀 Quick Start: Creating a New Restaurant from Template

## Method 1: Clone and Create New Branch (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/yousseftameryty/Mat3am.git new-restaurant-name
cd new-restaurant-name/restaurant-system

# 2. Create a new branch from template
git checkout -b restaurant/new-restaurant-name template/base

# 3. Install dependencies
npm install

# 4. Set up environment variables
# Copy .env.local.example to .env.local and add your new Supabase credentials

# 5. Start developing!
npm run dev
```

## Method 2: Use Template Tag

```bash
# Clone and checkout specific template version
git clone https://github.com/yousseftameryty/Mat3am.git new-restaurant-name
cd new-restaurant-name/restaurant-system
git checkout -b restaurant/new-restaurant-name v1.0-template
```

## Method 3: GitHub Template Repository (Future)

1. Go to repository settings
2. Enable "Template repository"
3. Use "Use this template" button on GitHub

## 📋 Setup Checklist

- [ ] Create new Supabase project
- [ ] Update `.env.local` with new credentials
- [ ] Run database migrations (if any)
- [ ] Update branding/colors
- [ ] Add menu items
- [ ] Configure tables
- [ ] Deploy to Vercel
- [ ] Generate QR codes

## 🔗 Useful Links

- **Template Branch**: `template/base`
- **Template Tag**: `v1.0-template`
- **Full Documentation**: See [TEMPLATE.md](./TEMPLATE.md)


