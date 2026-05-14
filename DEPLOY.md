# HisaabKitaab PWA — Deployment Guide

## Option 1: GitHub Pages (Easiest, Free, Instant)

1. Go to https://github.com/new and create a new repo called `hisaabkitaab`
2. Upload all 6 files from this folder to the repo:
   - index.html
   - app.js
   - sw.js
   - sw-register.js
   - manifest.json
   - icon.svg
3. Go to Settings → Pages → Source: "main branch" → Save
4. Wait 1-2 minutes, then visit: `https://YOURUSERNAME.github.io/hisaabkitaab`
5. Open on your phone's browser → tap "Add to Home Screen"

## Option 2: Netlify Drop (Drag & Drop)

1. Go to https://app.netlify.com/drop
2. Drag the entire folder onto the page
3. Instant URL — open on phone, tap "Add to Home Screen"

## Option 3: Local Testing

1. Install Node.js on Windows (https://nodejs.org)
2. Open PowerShell in this folder
3. Run: `npx serve .`
4. On your phone: go to `http://YOUR-PC-IP:3000` (same WiFi)

## How to Use the App

1. First launch → onboarding screen → tap "Get Started"
2. Mock data loads automatically (25+ transactions, budgets, loans)
3. Bottom tabs: Home | Txns | Analytics | Udhaar | Settings
4. Tap "Import" to add real CSV bank statements
5. All data stays on your phone (IndexedDB in browser)
6. Works 100% offline after first visit
