# ⚡ Quick Start - Hazara Kabab ERP

## 🚨 FIRST TIME SETUP (5 Minutes)

### 1. Create Admin User in Supabase

**Go to**: https://app.supabase.com → Your Project → Authentication → Users → Add User

**Create user with:**
- Email: `admin@hazarakabab.com`
- Password: `Admin123!`
- ✅ Auto Confirm User

**Then run this SQL** (replace `USER_ID` with the UUID from above):

```sql
INSERT INTO profiles (id, full_name, role, is_active, pin_code)
VALUES (
  'USER_ID',  -- Paste UUID here
  'Owner Admin',
  'admin',
  true,
  1234
);
```

### 2. Login

1. Go to: http://localhost:3000/login
2. Login with email/password OR PIN: `1234`
3. You'll be redirected to `/admin`

## 🎯 Accessing Different Screens

| Screen | URL | Who Can Access |
|--------|-----|----------------|
| **Admin** | `/admin` | Admin only |
| **Cashier** | `/cashier` | Admin + Cashier |
| **Waiter** | `/waiter` | Admin + Waiter |
| **Kitchen** | `/kitchen` | Admin + Kitchen |

## 🔍 Why Screens Are Empty?

### Cashier Shows "No Items"
✅ **You have 9 menu items** - they should show up!
- Check: Items might be filtered by category
- Check: Search bar might be filtering
- **Fix**: Clear search, select "All Items" category

### Waiter Shows "No Tables"
- **Reason**: Waiter not assigned to tables
- **Fix**: Assign tables via SQL or admin panel

### Kitchen Shows "No Orders"
- **Reason**: No orders with status "pending" or "cooking"
- **Fix**: Create an order first!

## 📝 Quick Commands

```bash
# Start development server
npm run dev

# Access locally
http://localhost:3000/login
```

## 🎬 Test Order Flow

1. **Login as Cashier** (create cashier account first)
2. **Go to** `/cashier`
3. **Select Table** (e.g., Table 1)
4. **Add Items** to cart
5. **Click** "Send to Table"
6. **Go to** `/kitchen` - you'll see the order!
7. **Mark as** "Cooking" → "Ready"
8. **Go back to** `/cashier` → Mark as "Paid"

## 💡 Pro Tips

- **PIN Login**: Faster for shared iPads (4-6 digits)
- **Audit Logs**: Every action is logged in `/admin/audit`
- **Analytics**: View performance in `/admin/analytics`
- **QR Codes**: Generate table QR codes in `/admin/qr-code`

## 🆘 Common Issues

**"Access Denied"** → Wrong role, login with admin
**"Empty Screen"** → Check filters/search, verify data exists
**"Can't Create Staff"** → Need `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

---

**Full Guide**: See `SETUP_GUIDE.md` for detailed instructions
