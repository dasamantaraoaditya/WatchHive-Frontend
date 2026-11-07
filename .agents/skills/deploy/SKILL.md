---
name: deploy
description: Procedures for deploying the WatchHive Web PWA to Vercel staging and production, validating service worker assets, and verifying headers.
---

# Deploy Skill — WatchHive Frontend

## Deployment Target Topology
- **Platform**: Vercel (PWA Static Deployment + Edge Rewrites)
- **Production URL**: `https://watchershive.com` / `https://watchhive-web.vercel.app`
- **Staging URL**: `https://watchhive-staging.vercel.app`
- **Rewrites Config**: `vercel.json` (SPA routing to `/index.html`, CSP, and `.well-known` mobile association links)

## Pre-Deployment Verification Checklist
1. Build TypeScript and Vite bundle cleanly:
   ```bash
   npm run build
   ```
2. Verify ESLint passes with zero warnings:
   ```bash
   npm run lint
   ```
3. Test PWA manifest and service worker generation:
   - Ensure `dist/sw.js` and `dist/manifest.webmanifest` are generated in `dist/`.

## Post-Deployment Smoke Check
1. Open the preview URL or production URL in browser.
2. Check browser console for zero CORS errors or missing asset errors.
3. Verify service worker registration succeeded in Application tab.
