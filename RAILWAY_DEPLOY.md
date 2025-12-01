# 🚀 Railway Deployment - Step by Step Guide

Railway is the **BEST** choice for deploying this app - it's free, easy, and works perfectly with MongoDB!

## ✅ Pre-Deployment Checklist

- [x] MongoDB setup ready
- [x] Code is ready
- [ ] Git repository connected
- [ ] Railway account created

## 📋 Step 1: Prepare Your Code

First, commit all your changes:

```bash
git add .
git commit -m "Add MongoDB integration and deployment config"
git push origin feat/otp-two-step
```

## 📋 Step 2: Set Up MongoDB Atlas (Free)

1. **Go to** [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Sign up** for free account
3. **Create a Free Cluster**:
   - Choose "Free" tier (M0)
   - Select a region close to you
   - Click "Create Cluster"
4. **Create Database User**:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Username: `smartindia` (or your choice)
   - Password: Generate secure password (save it!)
   - Database User Privileges: "Atlas admin"
5. **Whitelist IP Address**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
6. **Get Connection String**:
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Example: `mongodb+srv://smartindia:YourPassword@cluster0.xxxxx.mongodb.net/smart_india_project?retryWrites=true&w=majority`

## 📋 Step 3: Deploy to Railway

### 3.1 Create Railway Account

1. **Go to** [railway.app](https://railway.app)
2. **Sign up** with GitHub (easiest way)
3. **Verify your email**

### 3.2 Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. **Authorize Railway** to access your GitHub
4. **Select your repository**: `Smart_india_Project`
5. Railway will automatically detect it's a Node.js project

### 3.3 Configure Environment Variables

1. In your Railway project, click on your service
2. Go to **"Variables"** tab
3. Click **"New Variable"** and add these:

```
MONGODB_URI = mongodb+srv://smartindia:YourPassword@cluster0.xxxxx.mongodb.net/smart_india_project?retryWrites=true&w=majority
```

```
SESSION_SECRET = [Generate using PowerShell command below]
```

```
NODE_ENV = production
```

**Generate SESSION_SECRET** (run in PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output and use it as your `SESSION_SECRET`.

### 3.4 Configure Build Settings

Railway should auto-detect, but verify:

1. Go to **"Settings"** tab
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Root Directory**: `/` (root)

### 3.5 Deploy!

1. Railway will automatically start deploying
2. Watch the **"Deployments"** tab for progress
3. Wait for build to complete (usually 2-3 minutes)
4. Once deployed, Railway will give you a URL like: `https://your-app-name.up.railway.app`

## 📋 Step 4: Test Your Deployment

1. **Visit your Railway URL**
2. **Test Registration**: Create a new account
3. **Test Login**: Login with your account
4. **Test Application Submission**: Submit a test application
5. **Check MongoDB**: Verify data is being saved in MongoDB Atlas

## 🎉 You're Live!

Your application is now deployed and accessible worldwide!

## 🔧 Troubleshooting

### Build Fails
- Check Railway logs in "Deployments" tab
- Verify all environment variables are set
- Ensure MongoDB URI is correct

### Database Connection Error
- Verify MongoDB Atlas IP whitelist includes all IPs (0.0.0.0/0)
- Check database username and password
- Verify connection string format

### Application Won't Start
- Check `SESSION_SECRET` is set
- Verify `NODE_ENV=production`
- Check Railway logs for errors

## 📊 Monitoring

- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Check CPU/Memory usage
- **Deployments**: See deployment history

## 🔄 Updating Your App

Just push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push
```

Railway will automatically redeploy!

## 💰 Railway Free Tier

- **$5 free credit** per month
- **500 hours** of usage
- Perfect for small to medium apps
- Upgrade if you need more

## 🎯 Next Steps

1. ✅ Deploy to Railway
2. ✅ Test all features
3. ✅ Set up custom domain (optional)
4. ✅ Monitor usage
5. ✅ Enjoy your live app!

---

**Need Help?** Check Railway docs: [docs.railway.app](https://docs.railway.app)

