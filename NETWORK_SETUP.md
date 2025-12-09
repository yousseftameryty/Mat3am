# 🌐 Network Setup Guide

To make your restaurant system accessible on your local network (so phones/tablets can scan QR codes):

## Quick Setup

### 1. Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```
or
```bash
ip addr show
```

### 2. Start the Server on Network

The dev server is already configured to listen on all network interfaces (`0.0.0.0`).

Just run:
```bash
npm run dev
```

### 3. Access from Other Devices

Once running, access the app from other devices using:

**From your computer:**
- http://localhost:3000
- http://YOUR_IP:3000 (e.g., http://192.168.1.100:3000)

**From phones/tablets on same WiFi:**
- http://YOUR_IP:3000 (e.g., http://192.168.1.100:3000)

### 4. QR Codes Will Auto-Update

The QR codes on `/admin/qr-code` will automatically use whatever URL you accessed the page from. So:

1. Open http://192.168.8.106:3000/admin/qr-code on your computer
2. The QR codes will point to http://YOUR_IP:3000/table/1, etc.
3. Print or display these QR codes
4. Phones can scan and access the table pages!

## Troubleshooting

**Can't access from phone?**
- Make sure phone is on the same WiFi network
- Check Windows Firewall isn't blocking port 3000
- Try accessing http://YOUR_IP:3000 from your computer's browser first

**Firewall Fix (Windows):**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## Production Deployment

For production, deploy to:
- Vercel (recommended): `vercel deploy`
- Your own server
- Any hosting service

Then update the BASE_URL in the QR code page to your production domain.



