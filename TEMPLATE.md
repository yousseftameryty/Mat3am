# Restaurant Billing System - Base Template

This is the **base template** for the restaurant billing system. Use this as a starting point for creating new restaurant instances.

## 🎯 What This Template Includes

- ✅ Cashier dashboard with order management
- ✅ Customer-facing QR code table system
- ✅ Real-time order status updates
- ✅ Menu management
- ✅ Table management
- ✅ Payment flow (served → waiting_payment → paid)
- ✅ Security features (device fingerprinting, table access validation)
- ✅ Supabase backend integration
- ✅ Beautiful, animated UI with Framer Motion

## 🚀 How to Create a New Restaurant from This Template

### Option 1: Using Git Branch (Recommended)

```bash
# 1. Clone the repository
git clone <your-repo-url> new-restaurant-name
cd new-restaurant-name

# 2. Create a new branch from template
git checkout -b restaurant/new-restaurant-name template/base

# 3. Or use the template tag
git checkout -b restaurant/new-restaurant-name v1.0-template

# 4. Update configuration
# - Update .env.local with new Supabase project credentials
# - Update restaurant name/branding in components
# - Update README.md with new restaurant details
```

### Option 2: Using GitHub Template Repository

1. Go to your GitHub repository
2. Click "Settings" → "Template repository"
3. Enable "Template repository"
4. Now others can use "Use this template" button

### Option 3: Manual Copy

```bash
# Copy the entire restaurant-system folder
cp -r restaurant-system new-restaurant-name
cd new-restaurant-name

# Initialize new git repo (optional)
rm -rf .git
git init
git add .
git commit -m "Initial commit from template"
```

## 📋 Setup Checklist for New Restaurant

When creating a new restaurant instance, update:

- [ ] **Supabase Project**: Create new project and update `.env.local`
  ```env
  NEXT_PUBLIC_SUPABASE_URL=your-new-project-url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
  ```

- [ ] **Database Schema**: Run migrations in new Supabase project
  - The schema should be identical, but verify all tables exist

- [ ] **Branding**: Update restaurant name, colors, logo
  - Check `app/page.tsx` for homepage
  - Update any hardcoded restaurant names

- [ ] **QR Codes**: Generate new QR codes for tables
  - Visit `/admin/qr-code` after deployment
  - Update BASE_URL if needed

- [ ] **Menu Items**: Add restaurant-specific menu items
  - Use Supabase dashboard or create admin interface

- [ ] **Tables**: Configure table numbers
  - Update `restaurant_tables` in Supabase

- [ ] **Domain/Deployment**: Deploy to new Vercel project
  - Update `vercel.json` if needed
  - Set environment variables in Vercel dashboard

## 🔄 Updating the Template

If you improve the template and want to update it:

```bash
# 1. Switch to template branch
git checkout template/base

# 2. Merge improvements from main (or specific branch)
git merge main

# 3. Update version tag
git tag -a v1.1-template -m "Updated template with new features"

# 4. Push template branch and tags
git push origin template/base
git push origin --tags
```

## 📁 Template Structure

```
restaurant-system/
├── app/
│   ├── admin/          # QR code generation
│   ├── cashier/        # Cashier dashboard
│   ├── table/[id]/     # Customer table view
│   └── actions.ts      # Server actions
├── utils/
│   └── deviceFingerprint.ts  # Security utilities
├── supabase/           # Database migrations (if any)
└── ...config files
```

## 🎨 Customization Points

Key files to customize for each restaurant:

1. **`app/page.tsx`** - Homepage branding
2. **`app/global.css`** - Colors, fonts, theme
3. **Supabase `menu_items` table** - Menu content
4. **`app/cashier/page.tsx`** - Cashier UI colors/branding
5. **`app/table/[id]/page.tsx`** - Customer UI colors/branding

## 🔐 Security Notes

The template includes:
- Device fingerprinting for table access
- Time-based validation (10-minute window)
- Silent redirects for table manipulation attempts
- Table occupancy checks

**Important**: Review and adjust security settings based on your restaurant's needs.

## 📝 Version History

- **v1.0-template** (Current) - Initial template with full billing system

## 🤝 Contributing to Template

If you add features that should be in the template:

1. Test thoroughly
2. Update this TEMPLATE.md if needed
3. Merge to `template/base` branch
4. Create new version tag

---

**Note**: This template is designed to be cloned and customized. Each restaurant instance should have its own Supabase project and deployment.

