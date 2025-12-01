# 🔧 Fix Render Build Error

## Problem:
```
sh: 1: vite: not found
==> Build failed 😞
```

## Solution:

The issue is that `vite` is in `devDependencies`, but Render needs to install dev dependencies for the build.

### Fix in Render Dashboard:

1. Go to your Render service
2. Click **"Settings"** tab
3. Scroll to **"Build Command"**
4. Change it to:
   ```
   npm ci && npm run build
   ```
   
   **OR** if that doesn't work:
   ```
   npm install --include=dev && npm run build
   ```

5. Click **"Save Changes"**
6. Render will automatically redeploy

### Alternative: Use npm install (without --production flag)

Change build command to:
```
npm install && npm run build
```

This will install both dependencies and devDependencies.

## Why This Happens:

- Render by default runs `npm install --production` which skips devDependencies
- But `vite` and `esbuild` (needed for build) are in devDependencies
- We need to install devDependencies for the build step

## After Fixing:

1. Save the new build command
2. Render will automatically trigger a new deployment
3. Watch the build logs - it should work now!
4. Your app will be live once build completes

---

**Quick Fix**: Just change build command to `npm ci && npm run build` in Render settings!

