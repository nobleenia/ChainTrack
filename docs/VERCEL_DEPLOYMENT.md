# 🚀 ChainTrack Vercel + Railway Deployment Guide

A step-by-step guide to deploy ChainTrack frontend to **Vercel** and backend to **Railway**.

---

## 📋 Before You Start

Make sure you have:
- [x] GitHub account with ChainTrack repository
- [x] Brevo account for emails (free 300/day): https://www.brevo.com/
- [x] Infura/Alchemy account for blockchain RPC: https://infura.io/

---

## Part 1: Backend Deployment (Railway)

### Step 1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Sign in with **GitHub**
4. Authorize Railway to access your repositories

### Step 2: Create PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Wait for it to provision (1-2 minutes)
4. Click the PostgreSQL service → **"Variables"** tab
5. Copy the **`DATABASE_URL`** value (you'll need this)

### Step 3: Deploy Backend

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your **ChainTrack** repository
3. Railway will detect multiple services. Choose **backend** or set:
   - **Root Directory**: `backend`
4. Go to **Settings** → **Variables** and add:

```bash
# App Configuration
FLASK_ENV=production
SECRET_KEY=<generate a 64-char random string>
JWT_SECRET_KEY=<generate another 64-char random string>

# Database (paste from Step 2)
DATABASE_URL=<your PostgreSQL URL from Railway>

# Frontend (update after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app

# Blockchain (Sepolia Testnet)
WEB3_PROVIDER_URI=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRODUCT_REGISTRY_ADDRESS=0x141878E69201172C2aeeC39C4882b61089f64177
SHIPMENT_REGISTRY_ADDRESS=0xd0Db8e81115297194659543c47BFda3b061B059b
TOKEN_ADDRESS=0x1eD9C16BaA65F32EEF00639b112B792be498b43a

# Email (Brevo - free 300/day)
BREVO_API_KEY=your-brevo-api-key
NOTIFICATION_FROM_EMAIL=noreply@yourdomain.com
NOTIFICATION_FROM_NAME=ChainTrack
```

> 💡 **Generate secrets with:** `python -c "import secrets; print(secrets.token_hex(32))"`

5. Railway will auto-deploy. Wait for green checkmark ✅
6. Click **"Settings"** → **"Domains"** → **"Generate Domain"**
7. Copy your backend URL: `https://chaintrack-backend-xxxx.railway.app`

### Step 4: Initialize Database

1. In Railway, click your backend service
2. Go to **"Variables"** and temporarily add:
   ```
   FLASK_APP=app:create_app
   ```
3. Click **"Deploy"** tab → **"3 dots menu"** → **"Open Shell"**
4. Run migrations:
   ```bash
   flask db upgrade
   flask seed-demo  # Optional: adds demo data
   ```

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Sign Up for Vercel

1. Go to **https://vercel.com**
2. Click **"Sign Up"** with GitHub
3. Authorize Vercel to access your repositories

### Step 2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Find **ChainTrack** repository and click **"Import"**

### Step 3: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.railway.app/api` |
| `VITE_CHAIN_ID` | `11155111` |
| `VITE_PRODUCT_REGISTRY_ADDRESS` | `0x141878E69201172C2aeeC39C4882b61089f64177` |
| `VITE_SHIPMENT_REGISTRY_ADDRESS` | `0xd0Db8e81115297194659543c47BFda3b061B059b` |
| `VITE_TOKEN_ADDRESS` | `0x1eD9C16BaA65F32EEF00639b112B792be498b43a` |

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Your frontend is live at: `https://chaintrack-xxxx.vercel.app`

### Step 6: Update Backend CORS

Go back to Railway and update these variables:
```bash
FRONTEND_URL=https://chaintrack-xxxx.vercel.app
CORS_ORIGINS=https://chaintrack-xxxx.vercel.app
```

---

## Part 3: Enable Automatic Deployments

### Railway Auto-Deploy

Railway automatically deploys when you push to your connected branch:

1. Go to Railway project → Backend service → **Settings**
2. Under **"Source"**, set **Branch** to `main`
3. ✅ Auto-deploy is enabled by default

### Vercel Auto-Deploy

Vercel automatically deploys on every push:

1. **Production**: Deploys from `main` branch
2. **Preview**: Creates preview URLs for pull requests

Configure in **Settings** → **Git**:
- Production Branch: `main`
- Preview Deployments: Enabled

---

## Part 4: Custom Domain (Optional)

### Add Domain to Vercel

1. Go to Vercel dashboard → Your project → **Domains**
2. Add your domain: `chaintrack.yourdomain.com`
3. Add DNS records as instructed
4. SSL is automatic

### Add Domain to Railway

1. Go to Railway → Backend service → **Settings** → **Domains**
2. Add custom domain: `api.chaintrack.yourdomain.com`
3. Add CNAME record to your DNS
4. SSL is automatic

### Update Environment Variables

After adding custom domains, update:

**Railway (Backend):**
```bash
FRONTEND_URL=https://chaintrack.yourdomain.com
CORS_ORIGINS=https://chaintrack.yourdomain.com
```

**Vercel (Frontend):**
```bash
VITE_API_URL=https://api.chaintrack.yourdomain.com/api
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Generated unique `SECRET_KEY` (64+ characters)
- [ ] Generated unique `JWT_SECRET_KEY` (64+ characters)
- [ ] `CORS_ORIGINS` only includes your frontend domain
- [ ] `FLASK_ENV=production` is set
- [ ] No hardcoded API keys in code
- [ ] Created dedicated deployer wallet (not your main wallet)
- [ ] Blockchain private key only has minimal ETH

---

## 📊 Monitoring

### Railway Metrics

- CPU/Memory usage: Railway Dashboard → Metrics
- Logs: Railway Dashboard → Logs

### Vercel Analytics

Enable in **Settings** → **Analytics** (free tier available)

### Health Checks

- Backend: `https://your-backend.railway.app/health`
- API Status: `https://your-backend.railway.app/api/health/ready`

---

## 🔧 Troubleshooting

### "CORS Error" in Browser

```
Access to fetch blocked by CORS policy
```

**Fix:** Update `CORS_ORIGINS` in Railway to include your Vercel URL (no trailing slash).

### "502 Bad Gateway"

**Fix:** Check Railway logs for startup errors. Common causes:
- Missing environment variables
- Database connection failed
- Port binding issues

### "Build Failed" on Vercel

**Fix:** Check Vercel build logs. Common causes:
- Missing `package-lock.json` (run `npm install` locally and commit)
- Wrong root directory
- Build command errors

### Database Not Connecting

**Fix:** Ensure `DATABASE_URL` is correct PostgreSQL format:
```
postgresql://user:password@host:port/database
```

---

## 💰 Cost Summary

| Service | Free Tier | Estimated Monthly |
|---------|-----------|-------------------|
| Vercel (Frontend) | 100GB bandwidth | $0 |
| Railway (Backend) | $5 credit | $0-5 |
| Railway (PostgreSQL) | Included | $0-5 |
| Brevo (Email) | 300/day | $0 |
| Infura (RPC) | 100k/day | $0 |

**Total: $0-10/month** for hobby/demo usage

---

## 🎉 You're Live!

Test your deployment:

1. ✅ Visit your Vercel URL
2. ✅ Click "Try Demo" to login
3. ✅ Connect MetaMask (Sepolia network)
4. ✅ Create a product
5. ✅ Scan QR code to verify

**Demo Credentials:**
- Email: `manufacturer@chaintrack.io`
- Password: `ChainTrack2025!`

---

Need help? Open an issue: https://github.com/nobleenia/ChainTrack/issues
