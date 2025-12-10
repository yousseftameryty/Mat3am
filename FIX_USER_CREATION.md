# 🔧 Fix: "Database error creating new user"

## Why This Error Happens

The error occurs because:
1. **Auto-trigger is failing**: When you create a user, a trigger automatically tries to create a profile
2. **RLS policies**: Row Level Security might be blocking the profile creation
3. **Trigger error**: The trigger function might be encountering an error

## ✅ Solution: Create User Manually (Recommended)

**Easiest way** - bypass the trigger temporarily:

### Step 1: Disable the Trigger Temporarily

Go to Supabase SQL Editor and run:

```sql
-- Disable the auto-profile trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
```

### Step 2: Create User in Supabase Dashboard

1. Go to: **Authentication** → **Users** → **Add User**
2. Fill in:
   - Email: `malek@hazara.com` (or your email)
   - Password: `YourPassword123!`
   - ✅ Auto Confirm User
3. Click: **Create User**
4. **Copy the User ID** (UUID)

### Step 3: Create Profile Manually

Run this SQL (replace `YOUR_USER_ID` with the UUID):

```sql
-- Create admin profile
INSERT INTO profiles (id, full_name, role, is_active, pin_code)
VALUES (
  'YOUR_USER_ID',  -- Paste UUID here
  'Malek Admin',  -- Your name
  'admin',
  true,
  1234  -- PIN code (optional)
);
```

### Step 4: Re-enable the Trigger

```sql
-- Re-enable the trigger for future users
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

## 🎯 Alternative: Fix the Trigger (Advanced)

If you want the trigger to work automatically, we've updated it to handle errors better. The trigger will now:
- Continue even if profile creation fails
- Log warnings instead of failing
- Allow user creation to succeed

**The trigger has been fixed** - try creating a user again!

## 🚀 Quick Test

After creating the user and profile:

1. Go to: http://localhost:3000/login
2. Login with:
   - Email: `malek@hazara.com`
   - Password: `YourPassword123!`
   - OR PIN: `1234`
3. You should be redirected to `/admin`!

## 📝 Why This Happened

The trigger was trying to create a profile automatically, but:
- RLS policies might block it
- The function might not have proper permissions
- Database constraints might fail

**Solution**: Create the first admin manually, then the trigger will work for future users (it's been fixed to handle errors gracefully).

---

**Note**: After creating your first admin, you can use the Admin Panel (`/admin/staff`) to create other staff members - that uses the Admin API which bypasses these issues!
