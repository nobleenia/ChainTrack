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
| 🗂️ **IPFS Document Storage** | Decentralized storage for product documentation via Pinata |
| 📧 **Smart Notifications** | Email & SMS alerts for product events and shipment updates |
| 👥 **Role-Based Access** | Separate dashboards for manufacturers, distributors, retailers, and consumers |
| 📊 **Analytics Dashboard** | Visualize supply chain performance and verification metrics |
| 🌙 **Dark Mode** | Beautiful dark theme with smooth transitions |
| 🦊 **MetaMask Integration** | Connect your wallet to interact with smart contracts |
| 🎯 **Interactive Demo** | One-click demo mode to explore all features |
| 🎓 **Guided Tour** | Step-by-step onboarding for new users |

### 🎬 Try It Now

Click **"Try Demo"** on the landing page to instantly access the platform as different supply chain participants:

| Role | Email | Password |
|------|-------|----------|
| Manufacturer | manufacturer@demo.com | demo1234 |
| Distributor | distributor@demo.com | demo1234 |
| Retailer | retailer@demo.com | demo1234 |
| Consumer | consumer@demo.com | demo1234 |

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
│   │   ├── services/      # Business logic (blockchain, notifications)
│   │   └── utils/         # Helpers and utilities
├── contracts/         # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── ProductRegistry.sol    # Product registration & verification
│   │   └── ShipmentRegistry.sol   # P2P shipment tracking
│   └── test/          # Contract unit tests
└── docs/              # Documentation
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Framer Motion, Zustand, ethers.js |
| **Backend** | Flask 3, SQLAlchemy 2, Flask-JWT-Extended, Web3.py, Celery |
| **Blockchain** | Solidity 0.8.24, Hardhat, Ethereum Sepolia Testnet |
| **Storage** | PostgreSQL (production), SQLite (development), Pinata/IPFS |
| **Notifications** | Twilio (SMS), SMTP (Email) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Docker & Docker Compose (optional)
- MetaMask wallet (for blockchain features)

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/nobleenia/ChainTrack.git
cd ChainTrack

# Copy environment file and configure
cp .env.example .env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5173
# Backend:  http://localhost:5000
```

### Option 2: Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Initialize database
flask db upgrade
flask seed-demo  # Optional: Add demo data

# Run the server
flask run
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
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

ChainTrack uses two main smart contracts deployed on Ethereum Sepolia:

### ProductRegistry.sol
- Register products with unique IDs and metadata
- Record ownership transfers on-chain
- Verify product authenticity
- Query complete product history

### ShipmentRegistry.sol
- Create P2P shipments between parties
- Track shipment status updates
- Record delivery confirmations
- Link shipments to product transfers

---

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Smart Contract Reference](docs/CONTRACTS.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

---

## 🔧 Configuration

### Environment Variables

See [`.env.example`](.env.example) for all configuration options.

Key variables:
- `ETHEREUM_RPC_URL` - Infura/Alchemy endpoint for Sepolia
- `CONTRACT_ADDRESS` - Deployed ProductRegistry address
- `DATABASE_URL` - PostgreSQL connection string

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Smart contract tests
cd contracts
npm run test

# Frontend tests (coming soon)
cd frontend
npm run test
```

---

## 🎨 Screenshots

<details>
<summary>📸 Click to expand screenshots</summary>

### Landing Page
![Landing Page](docs/assets/screenshots/landing.png)

### Dashboard
![Dashboard](docs/assets/screenshots/dashboard.png)

### Product Tracking
![Product Tracking](docs/assets/screenshots/tracking.png)

### Verification
![Verification](docs/assets/screenshots/verification.png)

### Dark Mode
![Dark Mode](docs/assets/screenshots/dark-mode.png)

</details>

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

## 🙏 Acknowledgements

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Shepherd.js](https://shepherdjs.dev/) for the guided tour functionality
- [Pinata](https://pinata.cloud/) for IPFS pinning service
- [Twilio](https://twilio.com/) for SMS notifications
- [Framer Motion](https://www.framer.com/motion/) for smooth animations

---

## 🗺️ Roadmap

- [x] Core product registration & tracking
- [x] QR code verification system
- [x] Role-based dashboards
- [x] P2P delivery system
- [x] IPFS document storage
- [x] Email & SMS notifications
- [x] Dark mode support
- [x] MetaMask integration
- [x] Interactive demo mode
- [ ] Mobile app (React Native)
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] IoT sensor integration
- [ ] AI-powered anomaly detection

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/nobleenia">Noble Enia</a>
  
  <br/><br/>
  
  ⭐ Star this repo if you find it useful!
</div>