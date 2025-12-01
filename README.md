# 🔗 ChainTrack v2.0

<div align="center">
  <img src="docs/assets/logo.png" alt="ChainTrack Logo" width="200" />
  
  **Blockchain-Powered Supply Chain Transparency Platform**
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-purple.svg)](https://sepolia.etherscan.io/)
  [![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org/)
  [![Flask](https://img.shields.io/badge/Flask-3.0-000000.svg)](https://flask.palletsprojects.com/)
  
  [Live Demo](https://chaintrack.vercel.app) · [API Docs](docs/API.md) · [Report Bug](https://github.com/nobleenia/ChainTrack/issues)
</div>

---

## 🌟 Overview

ChainTrack is a full-stack supply chain transparency platform that leverages Ethereum blockchain to provide immutable product tracking from manufacture to consumer. Every product registration and custody transfer is recorded on-chain, enabling instant verification and complete traceability.

### ✨ Key Features

- **🔐 Immutable Records** - Product data stored permanently on Ethereum blockchain
- **📱 QR Code Verification** - Instant product authenticity check via mobile scanning
- **🔄 Real-Time Tracking** - Monitor products as they move through the supply chain
- **👥 Role-Based Access** - Separate dashboards for manufacturers, distributors, retailers, and consumers
- **📊 Analytics Dashboard** - Visualize supply chain performance and verification metrics
- **🎯 Guided Tour** - Interactive onboarding for new users

---

## 🏗️ Architecture

```
ChainTrack/
├── frontend/          # React + Vite + Tailwind CSS
├── backend/           # Flask REST API + SQLAlchemy
├── contracts/         # Solidity smart contracts (Hardhat)
└── docs/              # Documentation
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, ethers.js |
| **Backend** | Flask, SQLAlchemy, Flask-JWT-Extended, Web3.py |
| **Blockchain** | Solidity, Hardhat, Ethereum Sepolia Testnet |
| **Database** | PostgreSQL (production), SQLite (development) |

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

# Frontend tests
cd frontend
npm run test
```

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

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/nobleenia">Noble Enia</a>
</div>