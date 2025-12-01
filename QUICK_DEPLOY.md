# ⚡ Quick Deploy - 5 Minutes to Live!

## 🎯 Railway Deployment (Recommended - FREE & EASY)

### Step 1: Commit Your Code (2 min)
```bash
git commit -m "Ready for deployment with MongoDB"
git push origin feat/otp-two-step
```

### Step 2: Get MongoDB Connection String (3 min)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up → Create Free Cluster → Create Database User
3. Network Access → Allow from anywhere (0.0.0.0/0)
4. Copy connection string (replace `<password>`)

### Step 3: Deploy to Railway (2 min)
1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. New Project → Deploy from GitHub → Select your repo
3. Add Variables:
   - `MONGODB_URI` = your MongoDB connection string
   - `SESSION_SECRET` = run: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`
   - `NODE_ENV` = `production`
4. Railway auto-deploys! 🚀

### Step 4: Get Your URL
Railway gives you: `https://your-app.up.railway.app`

## ✅ Done! Your app is live!

**Full guide**: See `RAILWAY_DEPLOY.md` for detailed steps.

