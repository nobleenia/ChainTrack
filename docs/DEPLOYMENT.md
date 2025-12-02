# 🚀 ChainTrack Deployment Guide

This guide covers deploying ChainTrack to production using popular hosting platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Option 1: Railway (Recommended)](#option-1-railway-recommended)
- [Option 2: Render](#option-2-render)
- [Option 3: Vercel + Railway](#option-3-vercel--railway)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Repository** - Code pushed to GitHub
2. **Ethereum Wallet** - MetaMask with Sepolia ETH for contract deployment
3. **API Keys** (get these first):
   - [Infura](https://infura.io) or [Alchemy](https://alchemy.com) - Ethereum RPC
   - [Pinata](https://pinata.cloud) - IPFS for photos (optional)
   - [SendGrid](https://sendgrid.com) - Email notifications (optional)
   - [Twilio](https://twilio.com) - SMS notifications (optional)

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│   PostgreSQL    │
│  (Vercel/CDN)   │     │ (Railway/Render)│     │    (Managed)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │    Ethereum     │
                        │    (Sepolia)    │
                        └─────────────────┘
```

---

## Option 1: Railway (Recommended)

Railway offers the simplest full-stack deployment with automatic PostgreSQL.

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### Step 2: Deploy Database

1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Wait for provisioning
3. Click the database → **"Variables"** tab → Copy `DATABASE_URL`

### Step 3: Deploy Backend

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your ChainTrack repository
3. Railway will detect the Flask app in `/backend`
4. Set the **Root Directory** to `backend`
5. Add environment variables (Settings → Variables):

```env
# Required
DATABASE_URL=<paste from Step 2>
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
JWT_SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
FLASK_ENV=production
CORS_ORIGINS=https://your-frontend-domain.vercel.app

# Blockchain
ETHEREUM_NETWORK=sepolia
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
CONTRACT_ADDRESS=<after contract deployment>
DEPLOYER_PRIVATE_KEY=<your deployer wallet key>

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.vercel.app
QR_CODE_BASE_URL=https://your-frontend-domain.vercel.app/verify

# Optional - Notifications
PINATA_API_KEY=
PINATA_API_SECRET=
SENDGRID_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

6. Deploy will start automatically

### Step 4: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
5. Deploy!

### Step 5: Update CORS

After frontend deploys, update backend's `CORS_ORIGINS` with the Vercel URL.

---

## Option 2: Render

Render offers free tier hosting with managed PostgreSQL.

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create PostgreSQL Database

1. Dashboard → **"New +"** → **"PostgreSQL"**
2. Choose Free tier (90-day limit) or paid
3. Copy the **Internal Database URL** after creation

### Step 3: Create Web Service (Backend)

1. **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Configure:
   - **Name**: chaintrack-backend
   - **Root Directory**: backend
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn run:app`
4. Add environment variables (same as Railway)
5. Deploy!

### Step 4: Create Static Site (Frontend)

1. **"New +"** → **"Static Site"**
2. Connect your GitHub repo
3. Configure:
   - **Name**: chaintrack-frontend
   - **Root Directory**: frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://chaintrack-backend.onrender.com/api
   ```
5. Deploy!

---

## Option 3: Vercel + Railway

Best for frontend performance with separate backend.

- **Frontend**: Vercel (optimized for React/Next.js)
- **Backend**: Railway (with PostgreSQL)

Follow Railway steps for backend, then:

### Vercel Frontend Setup

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Select repository, set Root Directory to `frontend`
3. Framework: Vite
4. Environment Variables:
   ```
   VITE_API_URL=https://your-backend.railway.app/api
   ```
5. Deploy!

---

## Smart Contract Deployment

Deploy contracts to Sepolia testnet before or after hosting setup.

### Step 1: Get Sepolia ETH

1. Go to [sepoliafaucet.com](https://sepoliafaucet.com) or [alchemy.com/faucets/ethereum-sepolia](https://www.alchemy.com/faucets/ethereum-sepolia)
2. Enter your wallet address
3. Receive free test ETH

### Step 2: Configure Environment

```bash
cd contracts
cp .env.example .env
```

Edit `.env`:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
DEPLOYER_PRIVATE_KEY=your_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Step 3: Deploy Contracts

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

### Step 4: Update Backend

Copy the deployed contract addresses to your backend environment:
```env
CONTRACT_ADDRESS=0x...  # ProductRegistry address
SHIPMENT_REGISTRY_ADDRESS=0x...  # ShipmentRegistry address
```

---

## Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend/api/health`
- [ ] Frontend loads correctly
- [ ] Demo login works (Try Demo button)
- [ ] Database seeded with demo data
- [ ] CORS configured (no browser errors)
- [ ] Contract addresses set
- [ ] QR code verification works
- [ ] MetaMask connects on Sepolia

### Seed Demo Data

Run on backend (Railway shell or local):
```bash
flask seed-demo
```

---

## Troubleshooting

### "CORS Error"
- Verify `CORS_ORIGINS` includes your frontend URL
- Ensure no trailing slash in URLs

### "Database Connection Failed"
- Check `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- For SSL: add `?sslmode=require` to URL

### "Contract Call Failed"
- Verify `ETHEREUM_RPC_URL` is correct
- Check `CONTRACT_ADDRESS` is set
- Ensure deployer wallet has ETH for gas

### "Frontend Shows API Error"
- Check browser console for actual error
- Verify `VITE_API_URL` points to backend
- Ensure backend is running and healthy

---

## Security Reminders

⚠️ **Before going live:**

1. **Generate unique secrets**: Never use example values
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

2. **Use environment variables**: Never hardcode secrets in code

3. **Dedicated deployer wallet**: Create a new wallet for deployment with minimal funds

4. **Enable HTTPS**: Both platforms provide free SSL

5. **Set up monitoring**: Use Railway/Render metrics or add Sentry

---

## Cost Estimates

| Platform | Free Tier | Paid (Hobby) |
|----------|-----------|--------------|
| **Railway** | $5 credit/month | ~$5-10/month |
| **Render** | 90-day free DB | ~$7/month |
| **Vercel** | Unlimited static | Free for hobby |
| **Infura** | 100k requests/day | Free |

**Total for demo**: ~$0-15/month depending on usage

---

Need help? Open an issue on [GitHub](https://github.com/nobleenia/ChainTrack/issues).
