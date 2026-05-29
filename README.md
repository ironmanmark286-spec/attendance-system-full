# Attendance System Full Starter

This package contains 3 apps:
- backend (Node + Express + MySQL)
- web-admin (React web)
- mobile-employee (React Native Expo)

## Quick start (Windows)
1. Open terminal in project root (`attendance-system-full`)
2. Run:
   - `setup-software.cmd`
   - `run-software.cmd`
3. Open `http://localhost:3000`

## 1) Database setup
- Create database using `backend/src/sql/init.sql`
- `init.sql` also seeds a default admin account:
  - Username: `admin`
  - Password: `Admin@123`

## 2) Backend setup
1. Open terminal in `backend`
2. Copy `.env.example` to `.env`
3. Update `.env` DB credentials
4. Run:
   - npm install
   - npm run dev

Backend URL: http://localhost:5000

## 3) Web admin setup
1. Open terminal in `web-admin`
2. Run:
   - npm install
   - npm start

Web URL: http://localhost:3000

## 4) Mobile employee setup (Android)
1. Open terminal in `mobile-employee`
2. Run:
   - npm install
   - npx expo start
3. In `App.js`, replace `YOUR_PC_LOCAL_IP` with your laptop LAN IP
   Example: http://192.168.1.20:5000
4. Use Expo Go app on Android to scan QR

## Notes
- Use employee code/password for mobile login
- Use admin account for web admin login

## Default web login
| Field | Value |
|-------|--------|
| Company Code | `CMP-01` |
| Username | `admin` |
| Password | `Admin@123` |

Reset admin: `cd backend && node seed-admin.js`

---

## GitHub upload (first time)

```bash
cd attendance-system-full
git add .
git commit -m "Initial commit: PulseHR attendance system"
```

Create a new repo on https://github.com/new (empty, no README), then:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Deploy web admin on Vercel

1. Import your GitHub repo in [vercel.com](https://vercel.com) → **Add New Project**
2. **Root Directory:** `web-admin`
3. **Framework:** Create React App (auto-detected)
4. **Environment variable:**
   - `REACT_APP_API_URL` = your backend URL (e.g. `https://your-api.onrender.com`)
5. Deploy

> **Important:** Vercel hosts only the React frontend. Deploy `backend/` separately (Render, Railway, Fly.io, etc.) with MySQL, then set `REACT_APP_API_URL` to that API URL.

### Backend env (production)
Copy `backend/.env.example` → set `DB_*`, `JWT_SECRET`, `PORT`.
