# 🚀 Hazara Kabab ERP System - Complete Setup Guide

## 📋 Overview

This is a **Role-Based Access Control (RBAC)** system with 4 different interfaces:
- **Admin Panel** (`/admin`) - Full control, analytics, staff management
- **Cashier Station** (`/cashier`) - Order processing, payments
- **Waiter Pad** (`/waiter`) - Mobile interface for waiters
- **Kitchen Display** (`/kitchen`) - Order queue for kitchen staff

## 🔐 Step 1: Create Your First Admin User

**IMPORTANT**: Since the system requires authentication, you need to create the first admin user directly in Supabase.

### Option A: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project**: `Mat3am`
3. **Go to Authentication → Users**
4. **Click "Add User" → "Create New User"**
5. **Fill in:**
   - Email: `admin@hazarakabab.com` (or your email)
   - Password: `YourSecurePassword123!`
   - Auto Confirm User: ✅ (check this)
6. **Click "Create User"**
7. **Copy the User ID** (UUID) that appears

8. **Go to SQL Editor** in Supabase Dashboard
9. **Run this SQL** (replace `USER_ID_HERE` with the UUID you copied):

```sql
-- Insert admin profile
INSERT INTO profiles (id, full_name, role, is_active, pin_code)
VALUES (
  'USER_ID_HERE',  -- Replace with the UUID from step 7
  'Owner Admin',
  'admin',
  true,
  1234  -- Optional: PIN code for quick login
);
```

### Option B: Via Supabase SQL Editor (Direct)

Run this SQL in Supabase SQL Editor:

```sql
-- Create auth user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@hazarakabab.com',  -- Change this email
  crypt('YourSecurePassword123!', gen_salt('bf')),  -- Change this password
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Owner Admin"}',
  false,
  '',
  '',
  '',
  ''
) RETURNING id;

-- Then use the returned ID to create profile:
-- INSERT INTO profiles (id, full_name, role, is_active, pin_code)
-- VALUES ('RETURNED_ID_HERE', 'Owner Admin', 'admin', true, 1234);
```

**Easier Method**: Use Option A (Dashboard) - it's simpler!

## 🎯 Step 2: Login to the System

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Go to**: http://localhost:3000/login

3. **Login with:**
   - **Email**: `admin@hazarakabab.com` (or the email you used)
   - **Password**: `YourSecurePassword123!`
   - **OR use PIN Code**: `1234` (if you set one)

4. **You'll be redirected to** `/admin` dashboard

## 📱 Step 3: Accessing Different Interfaces

### Admin Panel (`/admin`)
- **URL**: http://localhost:3000/admin
- **Access**: Admin role only
- **Features**:
  - Dashboard with metrics
  - Staff Management
  - Menu CMS
  - Analytics & Reports
  - Audit Logs
  - QR Code Generator

### Cashier Station (`/cashier`)
- **URL**: http://localhost:3000/cashier
- **Access**: Admin or Cashier role
- **Features**:
  - Take orders
  - Process payments
  - View all orders
  - Floor map (coming soon)

### Waiter Pad (`/waiter`)
- **URL**: http://localhost:3000/waiter
- **Access**: Admin or Waiter role
- **Features**:
  - View assigned tables only
  - Take orders at tables
  - Mobile-optimized

### Kitchen Display (`/kitchen`)
- **URL**: http://localhost:3000/kitchen
- **Access**: Admin or Kitchen role
- **Features**:
  - View order queue
  - Mark orders as cooking/ready
  - Sound alerts

## 👥 Step 4: Create Staff Accounts

Once logged in as admin:

1. **Go to**: `/admin/staff`
2. **Click**: "Add Staff Member"
3. **Fill in:**
   - Full Name
   - Email
   - Password
   - Role (Cashier, Waiter, Kitchen, or Admin)
   - PIN Code (optional, for quick login)
4. **Click**: "Create"

**Note**: The system will automatically create both:
- Auth user (for login)
- Profile (for role/permissions)

## 🍽️ Step 5: Set Up Menu Items

1. **Go to**: `/admin/menu`
2. **Click**: "Add Item"
3. **Fill in:**
   - Name
   - Description (optional)
   - Price
   - Category
   - Upload Image (optional)
   - Toggle Availability
4. **Click**: "Create"

**Current Status**: You have 9 menu items already in the database!

## 🪑 Step 6: Assign Tables to Waiters

1. **Go to**: `/admin/staff`
2. **Find a waiter** in the list
3. **Assign tables** (you'll need to add this feature or use SQL):

```sql
-- Assign waiter to tables
INSERT INTO waiter_assignments (waiter_id, table_id)
VALUES (
  'WAITER_USER_ID',  -- Get from profiles table
  1  -- Table number
);

-- Assign multiple tables
INSERT INTO waiter_assignments (waiter_id, table_id)
VALUES 
  ('WAITER_USER_ID', 1),
  ('WAITER_USER_ID', 2),
  ('WAITER_USER_ID', 3);
```

## 🔍 Why Are Screens Empty?

### Cashier Screen Shows "No Items"
- **Reason**: Menu items might be marked as `is_available = false`
- **Fix**: Go to `/admin/menu` and toggle items to "Available"

### Waiter Screen Shows "No Tables"
- **Reason**: Waiter hasn't been assigned to any tables
- **Fix**: Assign tables to the waiter (see Step 6)

### Kitchen Screen Shows "No Orders"
- **Reason**: No orders with status "pending" or "cooking"
- **Fix**: Create an order first (via cashier or waiter)

### Admin Dashboard Shows Zero Revenue
- **Reason**: No orders have been marked as "paid" yet
- **Fix**: Process some orders and mark them as paid

## 🎬 Quick Start Workflow

1. **Create Admin User** (Step 1)
2. **Login** (Step 2)
3. **Add Menu Items** (Step 5) - if needed
4. **Create Staff Accounts** (Step 4)
5. **Assign Tables to Waiters** (Step 6)
6. **Test Order Flow**:
   - Cashier creates order → Kitchen sees it → Kitchen marks ready → Cashier marks paid

## 🔑 Role Permissions Summary

| Action | Admin | Cashier | Waiter | Kitchen |
|--------|-------|---------|--------|---------|
| View All Orders | ✅ | ✅ | ❌ (assigned only) | ❌ (pending/cooking only) |
| Create Orders | ✅ | ✅ | ✅ (assigned tables) | ❌ |
| Mark as Paid | ✅ | ✅ | ❌ | ❌ |
| Void Items | ✅ | ✅ (before cooking) | ❌ | ❌ |
| Update Menu | ✅ | ❌ | ❌ | ❌ |
| Manage Staff | ✅ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |

## 🐛 Troubleshooting

### "Access Denied" Error
- **Cause**: Wrong role trying to access restricted area
- **Fix**: Login with correct role or ask admin to change your role

### "Account is inactive"
- **Cause**: Profile has `is_active = false`
- **Fix**: Admin needs to activate your account in `/admin/staff`

### Can't Create Staff
- **Cause**: Missing `SUPABASE_SERVICE_ROLE_KEY` environment variable
- **Fix**: Add it to `.env.local`:
  ```env
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```
  Get it from: Supabase Dashboard → Settings → API → Service Role Key

### PIN Login Not Working
- **Cause**: PIN login requires service role or special setup
- **Fix**: Use email/password login for now, or implement proper PIN auth

## 📞 Need Help?

- Check Supabase Dashboard for data
- Check browser console for errors
- Verify environment variables are set
- Ensure RLS policies allow your role

## 🎉 You're Ready!

Once you've completed these steps, your ERP system is fully operational!

**Next Steps**:
- Generate QR codes: `/admin/qr-code`
- View analytics: `/admin/analytics`
- Check audit logs: `/admin/audit`
- Start taking orders! 🍽️
