# Deployment Guide - Vercel + Railway

## 🌐 Web Admin (React) - Deploy to Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/attendance-system.git
git push -u origin main
```

### Step 2: Deploy Web-Admin
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository
4. Select `web-admin` as root directory
5. Click Deploy

**Environment Variables (if needed):**
- `REACT_APP_API_URL=https://your-backend-url.com`

### Result
Your web dashboard will get a URL like: `https://attendance-web.vercel.app`

---

## 🔧 Backend (Express) - Deploy to Railway

Vercel has limitations for Express apps. Railway is better for Node.js/Express.

### Step 1: Sign Up on Railway
1. Go to [railway.app](https://railway.app)
2. Sign with GitHub
3. Allow access to your repository

### Step 2: Create Database
1. In Railway dashboard, click `+ Create New`
2. Select `MySQL`
3. Copy the connection details

### Step 3: Deploy Backend
1. Click `+ New Project`
2. Select `Deploy from GitHub repo`
3. Choose your attendance-system repository
4. Set Root Directory: `backend`
5. Add Environment Variables:
   ```
   MYSQL_HOST=your-mysql-host
   MYSQL_USER=your-mysql-user
   MYSQL_PASSWORD=your-mysql-password
   MYSQL_DB=attendance_db
   JWT_SECRET=your-secret-key-here
   PORT=5000
   ```

### Step 4: Configure Startup
Railway will auto-detect `npm start` from package.json

### Result
Your backend will get a URL like: `https://attendance-backend-prod.up.railway.app`

---

## 📱 Mobile App

### Option 1: Deploy to Expo
```bash
cd mobile-employee
npx expo publish
```
Users can scan QR code to access your app.

### Option 2: Web Version
```bash
npm run web
# Then deploy the build to Vercel
```

---

## 🔗 Connect Everything

Update `web-admin/src/api.js`:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://attendance-backend-prod.up.railway.app';
```

Update `mobile-employee/App.js`:
```javascript
const API_URL = 'https://attendance-backend-prod.up.railway.app';
```

---

## ✅ Deployment Checklist

- [ ] Database initialized with exported SQL
- [ ] All environment variables set
- [ ] API URL configured in frontend
- [ ] CORS enabled in backend
- [ ] JWT tokens working
- [ ] File uploads configured
- [ ] Email notifications setup (if needed)

---

## 🚀 Quick Deploy Commands

### Local Testing Before Deploy
```bash
# Backend
cd backend && npm run dev

# Web-Admin
cd web-admin && npm start

# Mobile
cd mobile-employee && npm start
```

### Deploy Web-Admin to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Deploy Backend to Railway
```bash
# Use Railway CLI if installed
railway up
```
