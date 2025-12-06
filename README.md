# 🔗 ChainTrack v2.0

<div align="center">
  <img src="docs/assets/logo.png" alt="ChainTrack Logo" width="200" />
  
  **Blockchain-Powered Supply Chain Transparency Platform**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-purple.svg)](https://sepolia.etherscan.io/)
  [![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
  [![Flask](https://img.shields.io/badge/Flask-3.0-000000.svg)](https://flask.palletsprojects.com/)
  [![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow.svg)](https://hardhat.org/)
  
  [Live Demo](https://chaintrack.vercel.app) · [API Docs](docs/API.md) · [Report Bug](https://github.com/nobleenia/ChainTrack/issues)
</div>

---

## 🌟 Overview

ChainTrack is a full-stack supply chain transparency platform that leverages Ethereum blockchain to provide immutable product tracking from manufacture to consumer. Every product registration, custody transfer, and shipment event is recorded on-chain, enabling instant verification and complete traceability.

### ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Immutable Records** | Product data stored permanently on Ethereum blockchain |
| 📱 **QR Code Verification** | Instant product authenticity check via mobile scanning |
| 🔄 **Real-Time Tracking** | Monitor products as they move through the supply chain |
| 📦 **P2P Delivery System** | Peer-to-peer shipment tracking with multi-carrier support |
| 🔒 **Two-Factor Authentication** | Email-based OTP for enhanced account security |
| 🗂️ **IPFS Document Storage** | Decentralized storage for product documentation via Pinata |
| 📧 **Smart Notifications** | Email alerts for product events, shipments, and 2FA |
| 👥 **Role-Based Access** | Separate dashboards for manufacturers, distributors, retailers, and consumers |
| 📊 **Analytics Dashboard** | Visualize supply chain performance and verification metrics |
| 🌙 **Dark Mode** | Beautiful dark theme with smooth transitions |
| 🦊 **MetaMask Integration** | Connect your wallet to interact with smart contracts |
| 🎯 **Interactive Demo** | One-click demo mode to explore all features |

### 🎬 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Manufacturer | manufacturer@chaintrack.io | ChainTrack2025! |
| Distributor | distributor@chaintrack.io | ChainTrack2025! |
| Retailer | retailer@chaintrack.io | ChainTrack2025! |
| Consumer | consumer@chaintrack.io | ChainTrack2025! |
| Admin | admin@chaintrack.io | ChainTrack2025! |

---

## 🏗️ Architecture

```
ChainTrack/
├── frontend/          # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API & blockchain services
│   │   ├── store/         # Zustand state management
│   │   └── context/       # React contexts (Theme, etc.)
├── backend/           # Flask REST API + SQLAlchemy
│   ├── app/
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic (blockchain, notifications, 2FA)
│   │   └── utils/         # Helpers and utilities
├── contracts/         # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── ProductRegistry.sol    # Product registration & verification
│   │   ├── ShipmentRegistry.sol   # P2P shipment tracking
│   │   └── ChainTrackToken.sol    # Reward token (ERC-20)
│   └── test/          # Contract unit tests
└── docs/              # Documentation
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Framer Motion, Zustand, ethers.js |
| **Backend** | Flask 3, SQLAlchemy 2, Flask-JWT-Extended, Web3.py, Gunicorn |
| **Blockchain** | Solidity 0.8.24, Hardhat, OpenZeppelin, Ethereum Sepolia |
| **Database** | PostgreSQL (production), SQLite (development) |
| **Storage** | Pinata/IPFS for documents |
| **Notifications** | Brevo (email), Twilio (WhatsApp) |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended) OR
- Node.js 18+ and Python 3.10+
- Git

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/nobleenia/ChainTrack.git
cd ChainTrack

# 2. Create environment file
cp .env.example .env

# 3. Generate secure keys and update .env
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
# Copy output to .env file

# 4. Update .env with your settings:
#    - DB_PASSWORD (change from default)
#    - BREVO_API_KEY (for email notifications)
#    - ETHEREUM_RPC_URL (from Infura/Alchemy)

# 5. Start all services
docker compose up -d

# 6. Seed demo data (optional)
docker compose exec backend python seed_demo_data_v3.py

# 7. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000/api
```

### Option 2: Manual Setup (Development)

<details>
<summary>Click to expand manual setup instructions</summary>

#### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Initialize database
flask db upgrade

# Seed demo data (optional)
python seed_demo_data_v3.py

# Run development server
python run.py
# Backend runs on http://localhost:5001
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file (optional - defaults work for local dev)
echo "VITE_API_URL=http://localhost:5001/api" > .env

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

#### Smart Contracts (Optional)

```bash
cd contracts

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Add your DEPLOYER_PRIVATE_KEY and ETHEREUM_RPC_URL

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy-all.js --network sepolia
```

</details>
npm run dev
```

#### Smart Contracts

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Sepolia (requires .env configuration)
npm run deploy:sepolia
```

---

## 📚 Smart Contracts

Deployed on Ethereum Sepolia Testnet:

| Contract | Address | Purpose |
|----------|---------|---------|
| ProductRegistry | `0xB3f85efF20DCA5cae0a67c4092E5092309C7e69d` | Product registration & verification |
| ShipmentRegistry | `0x7dBC3BCb4173F8EB1cb813Fb2B9F6b90F7E5baBe` | P2P shipment tracking |
| ChainTrackToken | `0x1eD9C16BaA65F32EEF00639b112B792be498b43a` | Reward token (ERC-20) |

### Contract Features

**ProductRegistry.sol**
- Register products with unique IDs and metadata
- Record ownership transfers on-chain
- Verify product authenticity
- Query complete product history

**ShipmentRegistry.sol**
- Create P2P shipments between parties
- Track shipment status updates
- Record delivery confirmations
- Link shipments to product transfers

**ChainTrackToken.sol**
- ERC-20 reward token
- Mint tokens for verified actions
- Incentivize supply chain participation

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_USER` | Yes | PostgreSQL username |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `SECRET_KEY` | Yes | Flask secret key (64 hex chars) |
| `JWT_SECRET_KEY` | Yes | JWT signing key (64 hex chars) |
| `BREVO_API_KEY` | Yes* | Email service API key |
| `ETHEREUM_RPC_URL` | No | Infura/Alchemy RPC URL |
| `TWILIO_*` | No | WhatsApp notifications |
| `PINATA_*` | No | IPFS document storage |

*Required for 2FA and email notifications

---

## 🧪 Testing

```bash
# Backend tests
cd backend
source venv/bin/activate
pytest

# Smart contract tests
cd contracts
npm test

# Frontend tests
cd frontend
npm test
```

---

## 🚢 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend-url.com/api`
5. Deploy

### Backend (Railway/Render)

1. Create new project on [Railway](https://railway.app) or [Render](https://render.com)
2. Connect GitHub repository
3. Set root directory to `backend`
4. Add environment variables from `.env.example`
5. Deploy

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

---

## 🔄 CI/CD

This project uses GitHub Actions for CI/CD. See `.github/workflows/` for:

- **Backend Tests**: Run pytest on push
- **Frontend Build**: Build and lint check
- **Contract Tests**: Run Hardhat tests
- **Auto Deploy**: Deploy to Vercel/Railway on merge to main

---

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [VC Demo Script](docs/VC_DEMO_SCRIPT.md)

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🗺️ Roadmap

- [x] Core product registration & tracking
- [x] QR code verification system
- [x] Role-based dashboards
- [x] P2P delivery system
- [x] IPFS document storage
- [x] Email notifications (Brevo)
- [x] Two-Factor Authentication
- [x] Dark mode support
- [x] MetaMask integration
- [x] Docker Compose deployment
- [ ] Mobile app (React Native)
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] IoT sensor integration
- [ ] AI-powered anomaly detection

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/nobleenia">Noble Elluwah</a>
  
  ⭐ Star this repo if you find it useful!
</div>