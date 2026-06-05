# 🚀 Complete Deployment Guide

## **Recommended Deployment Stack**

| Component | Platform | Reason |
|-----------|----------|--------|
| **Web-Admin (React)** | **Vercel** | Built for React, free tier, instant deploys |
| **Backend (Express)** | **Railway** | Better for Node.js, easy database setup, reasonable free tier |
| **Mobile App** | **Expo** | Native app distribution |

---

## 📊 Architecture

```
┌─────────────────────────────────────────────┐
│         VERCEL (Frontend)                   │
│  attendance-web.vercel.app                  │
│  (React Web Admin)                          │
└────────────────┬────────────────────────────┘
                 │ API Calls
                 ▼
┌─────────────────────────────────────────────┐
│         RAILWAY (Backend)                   │
│  attendance-api.railway.app                 │
│  (Express.js Server)                        │
└────────────────┬────────────────────────────┘
                 │ Database Queries
                 ▼
┌─────────────────────────────────────────────┐
│      RAILWAY MYSQL DATABASE                 │
│  (Cloud Hosted MySQL)                       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         EXPO (Mobile)                       │
│  Attendance Mobile Employee App             │
└─────────────────────────────────────────────┘
```

---

## Step 1️⃣: Deploy Web-Admin to Vercel

### Option A: Via Dashboard (Easiest - 2 mins)

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/attendance-system.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Visit https://vercel.com
   - Click "Sign Up" → Choose "Continue with GitHub"
   - Select your repository
   - Configure:
     - **Root Directory:** `web-admin`
     - Leave other settings as default
   - Click "Deploy"
   - ✅ Done! Your app will be live in 1-2 minutes

### Option B: Via CLI

```bash
npm install -g vercel
cd c:\Users\hp\OneDrive\Desktop\ak\Ak\attendance-system-full\web-admin
vercel login
vercel --prod
```

---

## Step 2️⃣: Deploy Backend to Railway

### Setup Database on Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Click "Start Project"
   - Sign in with GitHub

2. **Create MySQL Database**
   - Click "Create New"
   - Select "MySQL"
   - Railway auto-creates credentials
   - Copy connection info (you'll need this)

3. **Initialize Database**
   ```bash
   # SSH into Railway MySQL and run:
   # Copy contents of backend/src/sql/init.sql and paste
   ```

### Deploy Backend

1. **Create New Project in Railway**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose your attendance-system repo
   - Set Root Directory to `backend`

2. **Configure Environment Variables**
   
   In Railway Dashboard → Variables tab, add:
   
   ```
   MYSQL_HOST=your_railway_mysql_host
   MYSQL_USER=railway_user
   MYSQL_PASSWORD=your_password
   MYSQL_DB=attendance_db
   JWT_SECRET=your_super_secret_jwt_key_12345
   PORT=5000
   NODE_ENV=production
   CORS_ORIGIN=https://your-vercel-domain.vercel.app
   ```

3. **Deploy**
   - Railway auto-deploys on every push
   - You'll get a URL like: `https://attendance-backend.railway.app`
   - ✅ Backend live!

---

## Step 3️⃣: Connect Frontend to Backend

### Update Web-Admin API URL

1. **Create `.env.production` in web-admin:**
   ```
   REACT_APP_API_URL=https://attendance-backend.railway.app/api
   ```

2. **Or set in Vercel Dashboard:**
   - Go to Vercel Project Settings
   - Environment Variables
   - Add `REACT_APP_API_URL`

3. **Redeploy web-admin:**
   ```bash
   git add .
   git commit -m "Update API URL"
   git push
   ```

### Update Mobile App API URL

Edit `mobile-employee/App.js` and update API base URL:
```javascript
const API_URL = 'https://attendance-backend.railway.app';
```

---

## 🎯 Final URLs After Deployment

| Service | URL |
|---------|-----|
| **Web Admin** | `https://your-app.vercel.app` |
| **API** | `https://attendance-backend.railway.app` |
| **Mobile App** | Scan QR in Expo Go app |

---

## 🧪 Test Your Deployment

### 1. Test Backend
```bash
curl https://attendance-backend.railway.app/
# Should return: "Attendance API running"
```

### 2. Test Login (Web)
- Go to https://your-app.vercel.app
- Login with your credentials
- Check OT Settings tab loads correctly

### 3. Test API with Postman
```
POST https://attendance-backend.railway.app/auth/login
Body: {
  "email": "yourxyz@gmail.com",
  "password": "yourpassword"
}
```

---

## 🔐 Production Security Checklist

- ✅ Change `JWT_SECRET` to random value
- ✅ Use strong database password
- ✅ Enable HTTPS (both platforms do this automatically)
- ✅ Setup CORS properly (only allow your Vercel domain)
- ✅ Hide `.env` files (gitignore)
- ✅ Use environment variables for all secrets
- ✅ Enable database backups on Railway

---

## 📈 Monitor Your Apps

### Vercel Dashboard
- View deployments
- Check logs
- Monitor performance
- Setup custom domain

### Railway Dashboard
- Check server logs
- Monitor database
- View resource usage
- Setup alerts

---

## 💰 Cost Estimate (Free Tier)

| Service | Free Tier | Limit |
|---------|-----------|-------|
| Vercel | ✅ Yes | Unlimited bandwidth |
| Railway | ✅ $5/month free credit | ~100k API calls |
| Firebase/Expo | ✅ Yes | Standard limits |

> Most small apps run completely free!

---

## 🆘 Troubleshooting

### "CORS Error" on Web
- Update `CORS_ORIGIN` in backend env variables
- Redeploy backend

### "Database Connection Failed"
- Check MySQL credentials in Railway
- Verify database is running
- Check firewall settings

### "Build Failed on Vercel"
- Check `npm run build` locally
- Ensure all dependencies installed
- Check Node version compatibility

### "Mobile App Can't Connect"
- Verify API URL in App.js
- Check backend is running
- Test API with curl/Postman

---

## 📝 Summary

✅ **5 Steps to Production:**
1. Push code to GitHub
2. Connect web-admin to Vercel (auto-deploys)
3. Connect backend to Railway (auto-deploys)
4. Add environment variables
5. Update API URLs in frontend

**Time to live:** ~10 minutes with zero downtime! 🚀
