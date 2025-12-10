# 📖 How to Use Hazara Kabab ERP System

## 🎯 The Problem: Why Screens Are Empty

**You're seeing empty screens because:**

1. **Authentication Required**: The system now requires login - you can't access `/cashier` without being logged in
2. **No Admin User**: You need to create the first admin user to access anything
3. **RLS Policies**: Row Level Security blocks unauthenticated access

## ✅ Solution: Step-by-Step

### STEP 1: Create First Admin User (REQUIRED)

**You MUST do this first!** Without an admin user, you can't access anything.

#### Method 1: Via Supabase Dashboard (Easiest)

1. Go to: https://app.supabase.com
2. Select project: **Mat3am**
3. Click: **Authentication** → **Users**
4. Click: **Add User** → **Create New User**
5. Fill in:
   ```
   Email: admin@hazarakabab.com
   Password: Admin123!
   ✅ Auto Confirm User (check this!)
   ```
6. Click: **Create User**
7. **Copy the User ID** (UUID) that appears

8. Go to: **SQL Editor** in Supabase
9. Run this SQL (replace `YOUR_USER_ID` with the UUID):

```sql
INSERT INTO profiles (id, full_name, role, is_active, pin_code)
VALUES (
  'YOUR_USER_ID',  -- Paste the UUID here
  'Owner Admin',
  'admin',
  true,
  1234  -- PIN code for quick login
);
```

### STEP 2: Login

1. Start server: `npm run dev`
2. Go to: http://localhost:3000/login
3. Login with:
   - **Email**: `admin@hazarakabab.com`
   - **Password**: `Admin123!`
   - **OR PIN**: `1234` (click PIN Code tab)

4. You'll be redirected to `/admin` dashboard

### STEP 3: Access Cashier Screen

**Option A: As Admin**
- Login as admin
- Go to: http://localhost:3000/cashier
- You'll see all menu items (you have 9 items!)

**Option B: Create Cashier Account**
1. Go to: `/admin/staff`
2. Click: "Add Staff Member"
3. Fill in:
   - Name: `Cashier 1`
   - Email: `cashier@hazarakabab.com`
   - Password: `Cashier123!`
   - Role: **Cashier**
   - PIN: `5678` (optional)
4. Click: "Create"
5. Logout and login as cashier
6. Go to: `/cashier`

## 🔍 Why Cashier Shows "No Items"?

**You have 9 menu items** - they should show! Check:

1. **Are you logged in?** → Must be logged in
2. **Check browser console** → Look for errors
3. **Check category filter** → Select "All Items"
4. **Check search bar** → Clear any search text
5. **RLS Policy** → Make sure you're logged in with correct role

**If still empty:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab - is the API call failing?

## 📱 Accessing All Interfaces

### Admin Panel
- **URL**: `/admin`
- **Login**: Admin account
- **What you see**: Dashboard, Staff, Menu, Analytics, Audit Logs

### Cashier Station  
- **URL**: `/cashier`
- **Login**: Admin OR Cashier account
- **What you see**: Menu items, Tables, Order cart, Payment options

### Waiter Pad
- **URL**: `/waiter`
- **Login**: Admin OR Waiter account
- **What you see**: Only tables assigned to you

### Kitchen Display
- **URL**: `/kitchen`
- **Login**: Admin OR Kitchen account
- **What you see**: Order queue (pending/cooking orders)

## 🎬 Complete Workflow Example

### 1. Setup (One Time)
```
Create Admin → Login → Add Staff → Add Menu Items → Assign Tables
```

### 2. Daily Operations
```
Waiter takes order → Kitchen receives → Kitchen marks ready → Cashier processes payment
```

### 3. Test It Now!

1. **Login as Admin** → `/login`
2. **Go to Cashier** → `/cashier`
3. **Select Table 1**
4. **Add items** (you have Cyber Fries, Quantum Coke, etc.)
5. **Click "Send to Table"**
6. **Open Kitchen** → `/kitchen` (in another tab/window)
7. **See the order appear!**
8. **Mark as "Cooking"** → **"Ready"**
9. **Go back to Cashier** → Mark as **"Paid"**

## 🛠️ Creating Staff Accounts

### Via Admin Panel (Recommended)

1. Login as admin
2. Go to: `/admin/staff`
3. Click: **"Add Staff Member"**
4. Fill form:
   ```
   Full Name: John Waiter
   Email: john@hazarakabab.com
   Password: Waiter123!
   Role: Waiter
   PIN Code: 1111 (optional)
   ```
5. Click: **"Create"**

**The system automatically:**
- Creates auth user
- Creates profile with role
- Sets as active

### Via SQL (Alternative)

```sql
-- 1. Create auth user first (via Supabase Dashboard)
-- 2. Then create profile:
INSERT INTO profiles (id, full_name, role, is_active, pin_code)
VALUES (
  'USER_ID_FROM_AUTH',
  'John Waiter',
  'waiter',
  true,
  1111
);
```

## 🪑 Assigning Tables to Waiters

**Currently via SQL** (we can add UI later):

```sql
-- Get waiter's user ID from profiles table
SELECT id, full_name FROM profiles WHERE role = 'waiter';

-- Assign tables (replace WAITER_ID with actual ID)
INSERT INTO waiter_assignments (waiter_id, table_id)
VALUES 
  ('WAITER_ID', 1),
  ('WAITER_ID', 2),
  ('WAITER_ID', 3);
```

## 📊 Understanding Empty Screens

| Screen | Why Empty? | How to Fix |
|--------|-----------|------------|
| **Cashier** | Not logged in OR RLS blocking | Login with admin/cashier account |
| **Waiter** | No tables assigned | Assign tables to waiter |
| **Kitchen** | No pending orders | Create an order first |
| **Admin Dashboard** | No paid orders today | Process some orders |

## 🔐 Authentication Methods

### Email/Password Login
- Standard login
- Works for all roles
- Requires email + password

### PIN Code Login
- Quick login for shared devices
- 4-6 digits
- Set in staff profile
- **Note**: Currently requires proper setup (use email/password for now)

## 🎯 Quick Checklist

- [ ] Created admin user in Supabase
- [ ] Created profile for admin user
- [ ] Logged in successfully
- [ ] Can access `/admin` dashboard
- [ ] Can access `/cashier` and see menu items
- [ ] Created staff accounts (optional)
- [ ] Assigned tables to waiters (optional)

## 🆘 Troubleshooting

### "Access Denied" Error
- **Cause**: Wrong role trying to access restricted area
- **Fix**: Login with correct role (admin can access everything)

### "Account is inactive"
- **Cause**: Profile has `is_active = false`
- **Fix**: Admin activates account in `/admin/staff`

### Cashier Shows Empty
- **Check**: Are you logged in?
- **Check**: Browser console for errors
- **Check**: Menu items exist (you have 9!)
- **Check**: RLS policies allow your role

### Can't Create Staff
- **Cause**: Missing `SUPABASE_SERVICE_ROLE_KEY`
- **Fix**: Add to `.env.local`:
  ```env
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
  ```
  Get it from: Supabase Dashboard → Settings → API → Service Role Key

## 📞 Next Steps

1. ✅ Create admin user (Step 1)
2. ✅ Login and test
3. ✅ Create staff accounts
4. ✅ Start taking orders!

**Full documentation**: See `SETUP_GUIDE.md` for detailed instructions.

---

**Remember**: The system is now **secure** - everything requires authentication and proper roles!
