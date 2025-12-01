# ChainTrack Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              ChainTrack                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐ │
│  │   Frontend   │────▶│   Backend    │────▶│      Ethereum Chain      │ │
│  │  React/Vite  │◀────│  Flask API   │◀────│  Smart Contracts         │ │
│  └──────────────┘     └──────────────┘     └──────────────────────────┘ │
│         │                    │                                          │
│         │                    ▼                                          │
│         │             ┌──────────────┐                                  │
│         │             │  PostgreSQL  │                                  │
│         │             │   Database   │                                  │
│         │             └──────────────┘                                  │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────┐                                                       │
│  │   MetaMask   │                                                       │
│  │   Wallet     │                                                       │
│  └──────────────┘                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### Frontend (React + Vite)

**Technology Stack:**
- React 18 with hooks
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- ethers.js for Web3 integration
- Zustand for state management
- Shepherd.js for guided tours

**Key Modules:**
```
frontend/src/
├── components/          # Reusable UI components
│   ├── common/         # Buttons, inputs, cards
│   ├── layout/         # Navigation, sidebar, footer
│   └── features/       # Domain-specific components
├── pages/              # Route pages
├── hooks/              # Custom React hooks
├── store/              # Zustand stores
├── services/           # API client, blockchain
└── utils/              # Helper functions
```

### Backend (Flask)

**Technology Stack:**
- Flask 3.0 with blueprints
- SQLAlchemy ORM
- Flask-JWT-Extended for auth
- Web3.py for Ethereum
- Flask-Migrate for migrations

**Key Modules:**
```
backend/app/
├── models/             # Database models
├── routes/             # API endpoints
├── services/           # Business logic
│   ├── blockchain.py   # Ethereum interactions
│   └── qr_service.py   # QR code generation
└── utils/              # Helpers, decorators
```

### Smart Contracts (Solidity)

**Technology Stack:**
- Solidity 0.8.24
- Hardhat development framework
- OpenZeppelin contracts
- Ethers.js for deployment

**Contracts:**
```
contracts/contracts/
└── ProductRegistry.sol    # Main registry contract
```

---

## Data Flow

### Product Registration Flow

```
┌────────┐    ┌─────────┐    ┌──────────────┐    ┌───────────┐
│  User  │───▶│ Frontend│───▶│   Backend    │───▶│ Ethereum  │
└────────┘    └─────────┘    └──────────────┘    └───────────┘
                                    │                  │
                                    ▼                  ▼
                             Save to DB        Emit Event
                             Generate QR       Return TxHash
                                    │                  │
                                    └────────┬─────────┘
                                             ▼
                                    Return to Frontend
                                    Display QR Code
```

### Verification Flow

```
┌──────────┐    ┌─────────┐    ┌──────────────┐    ┌───────────┐
│ Consumer │───▶│Scan QR  │───▶│   Backend    │───▶│ Ethereum  │
└──────────┘    └─────────┘    └──────────────┘    └───────────┘
                                    │                  │
                                    ▼                  ▼
                             Fetch from DB     Verify on-chain
                             Get journey       Check integrity
                                    │                  │
                                    └────────┬─────────┘
                                             ▼
                                    Return verified data
                                    Show product journey
```

---

## Database Schema

### Core Tables

```sql
-- Users table
users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(120) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    company         VARCHAR(100),
    role            VARCHAR(20) NOT NULL,  -- manufacturer, distributor, retailer, consumer
    wallet_address  VARCHAR(42),
    created_at      TIMESTAMP DEFAULT NOW()
)

-- Products table
products (
    id              SERIAL PRIMARY KEY,
    product_id      VARCHAR(50) UNIQUE NOT NULL,  -- PRD-XXXXX
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    category        VARCHAR(50),
    origin          VARCHAR(100),
    blockchain_hash VARCHAR(66),
    qr_code         TEXT,
    status          VARCHAR(20) DEFAULT 'active',
    manufacturer_id INTEGER REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT NOW()
)

-- Transfers table
transfers (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER REFERENCES products(id),
    from_user_id    INTEGER REFERENCES users(id),
    to_user_id      INTEGER REFERENCES users(id),
    location        VARCHAR(200),
    blockchain_hash VARCHAR(66),
    status          VARCHAR(20) DEFAULT 'pending',
    created_at      TIMESTAMP DEFAULT NOW()
)
```

---

## Security

### Authentication
- JWT tokens with short expiry (15 minutes)
- Refresh tokens for session extension
- Password hashing with bcrypt

### Authorization
- Role-based access control (RBAC)
- Resource ownership validation
- Rate limiting on all endpoints

### Blockchain
- Private key stored in environment variables
- Transaction signing on backend only
- Events for audit trail

---

## Deployment

### Development
- Docker Compose for local setup
- Hot reload enabled
- SQLite for quick testing

### Production
- Railway/Heroku for backend
- Vercel for frontend
- PostgreSQL managed database
- Sepolia testnet (mainnet for production)

---

## Performance

### Caching Strategy
- Redis for session storage
- API response caching
- Static asset CDN

### Optimization
- Database query optimization
- Lazy loading for frontend
- Code splitting with Vite
