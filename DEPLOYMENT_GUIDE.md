# Deployment Guide

This guide will help you deploy your Smart India Project to various platforms.

## Prerequisites

1. **MongoDB Database**:
   - Set up MongoDB Atlas (free tier available) at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Or use any MongoDB hosting service
   - Get your MongoDB connection string

2. **Environment Variables**:
   - `MONGODB_URI` - Your MongoDB connection string
   - `SESSION_SECRET` - A random secret key for JWT tokens (generate with: `openssl rand -base64 32`)
   - `PORT` - Server port (usually auto-set by hosting platform)

3. **Optional (for Email/SMS)**:
   - `SMTP_USER` - Email service username
   - `SMTP_PASS` - Email service password
   - `TWILIO_ACCOUNT_SID` - Twilio account SID
   - `TWILIO_AUTH_TOKEN` - Twilio auth token

## Deployment Options

### Option 1: Railway (Recommended - Easy & Free)

1. **Sign up** at [railway.app](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo" (connect your GitHub)
   - Or "Deploy from local directory"

3. **Configure Environment Variables**:
   - Go to your project → Variables
   - Add:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart_india_project
     SESSION_SECRET=your-secret-key-here
     NODE_ENV=production
     PORT=5000
     ```

4. **Deploy**:
   - Railway will auto-detect Node.js
   - It will run `npm install` and `npm run build`
   - Then start with `npm start`

5. **Get Your URL**:
   - Railway provides a public URL automatically
   - You can add a custom domain if needed

### Option 2: Render

1. **Sign up** at [render.com](https://render.com)

2. **Create New Web Service**:
   - Connect your GitHub repository
   - Select your repository

3. **Configure**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

4. **Add Environment Variables**:
   - Go to Environment section
   - Add all required variables (same as Railway)

5. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy automatically

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

**Note**: Vercel is serverless, so you'll need to deploy backend separately.

1. **Backend**: Deploy to Railway or Render (follow steps above)

2. **Frontend**: 
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel`
   - Update API URLs in frontend code to point to your backend

### Option 4: Heroku

1. **Install Heroku CLI**: [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)

2. **Login**:
   ```bash
   heroku login
   ```

3. **Create App**:
   ```bash
   heroku create your-app-name
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set MONGODB_URI="your-mongodb-uri"
   heroku config:set SESSION_SECRET="your-secret-key"
   heroku config:set NODE_ENV="production"
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

### Option 5: DigitalOcean App Platform

1. **Sign up** at [digitalocean.com](https://www.digitalocean.com)

2. **Create App**:
   - Connect GitHub repository
   - Select Node.js

3. **Configure**:
   - Build command: `npm run build`
   - Run command: `npm start`

4. **Add Environment Variables** (same as above)

5. **Deploy**

## Build & Test Locally First

Before deploying, test the production build locally:

```bash
# Build the application
npm run build

# Start production server
npm start
```

Visit `http://localhost:5000` to verify everything works.

## Environment Variables Checklist

Create a `.env` file (or set in your hosting platform):

```env
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart_india_project
SESSION_SECRET=your-random-secret-key-here
NODE_ENV=production
PORT=5000

# Optional - Email Service
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional - SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

## Generate SESSION_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Post-Deployment Checklist

- [ ] MongoDB connection is working
- [ ] Environment variables are set correctly
- [ ] Application builds successfully
- [ ] Server starts without errors
- [ ] Can access the website via public URL
- [ ] Can register new users
- [ ] Can login
- [ ] Can submit applications
- [ ] Database collections are created

## Troubleshooting

### Build Fails

- Check Node.js version (should be 18+)
- Ensure all dependencies are in `package.json`
- Check build logs for specific errors

### Database Connection Error

- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (allow all IPs: `0.0.0.0/0`)
- Verify database user has correct permissions

### Application Won't Start

- Check `PORT` environment variable
- Verify `SESSION_SECRET` is set
- Check server logs for errors

### 404 Errors on Routes

- Ensure static files are being served correctly
- Check that `dist/public` directory exists after build
- Verify routing configuration

## Custom Domain Setup

Most platforms allow custom domains:

1. **Railway**: Project → Settings → Domains
2. **Render**: Service → Settings → Custom Domain
3. **Heroku**: App → Settings → Domains

Add your domain and follow the DNS configuration instructions.

## Monitoring & Logs

- **Railway**: View logs in project dashboard
- **Render**: Logs tab in service dashboard
- **Heroku**: `heroku logs --tail`

## Backup Strategy

1. **MongoDB Atlas**: Automatic backups available
2. **Manual Backup**: Export data regularly
3. **Version Control**: Keep code in Git

## Security Checklist

- [ ] Use strong `SESSION_SECRET`
- [ ] MongoDB connection uses authentication
- [ ] Environment variables are not committed to Git
- [ ] HTTPS is enabled (most platforms do this automatically)
- [ ] CORS is configured if needed

## Support

If you encounter issues:
1. Check the deployment platform's logs
2. Verify all environment variables
3. Test locally first
4. Check MongoDB connection
5. Review error messages carefully

