import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { 
  ArrowLeft,
  Book,
  Rocket,
  Package,
  QrCode,
  ArrowRightLeft,
  Truck,
  Gift,
  Shield,
  Users,
  Code,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Search,
  ExternalLink,
  Copy,
  Check,
  Wallet,
  Star,
  Zap,
  Globe,
  Lock,
  FileText,
  Bell,
  Settings,
  UserPlus,
  Box,
  Scan,
  Send,
  MapPin,
  Award,
  Coins,
  Link as LinkIcon,
  Database,
  Key,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'

// Documentation sections data
const documentationSections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket,
    description: 'Quick start guides for new users',
    articles: [
      {
        id: 'introduction',
        title: 'Introduction to ChainTrack',
        content: `
## What is ChainTrack?

ChainTrack is a blockchain-powered supply chain transparency platform that enables businesses and consumers to track, verify, and trust products throughout their entire journey.

### Key Benefits

- **Transparency**: Every product movement is recorded on the Ethereum blockchain
- **Authenticity**: Consumers can verify product authenticity instantly
- **Trust**: Immutable records prevent tampering and fraud
- **Efficiency**: Streamlined supply chain management with real-time tracking

### Who Uses ChainTrack?

| Role | Description |
|------|-------------|
| **Manufacturers** | Register products and initiate the supply chain |
| **Distributors** | Receive and transfer products to retailers |
| **Retailers** | Receive products and sell to consumers |
| **Consumers** | Verify product authenticity before purchase |
| **Couriers** | Handle P2P deliveries with checkpoint tracking |

### How It Works

1. **Register** - Manufacturers register products on the blockchain
2. **Transfer** - Products move through the supply chain with recorded transfers
3. **Track** - Real-time visibility of product location and history
4. **Verify** - Anyone can scan a QR code to verify authenticity
        `
      },
      {
        id: 'create-account',
        title: 'Creating Your Account',
        content: `
## Creating Your ChainTrack Account

Getting started with ChainTrack is simple and takes just a few minutes.

### Step 1: Choose Your Role

When registering, select the role that best describes your business:

- **Manufacturer**: You produce goods and want to register them on the blockchain
- **Distributor**: You handle logistics and product distribution
- **Retailer**: You sell products to end consumers
- **Consumer**: You want to verify products and participate in rewards

### Step 2: Fill Your Details

Provide the following information:
- Full name
- Email address
- Secure password (minimum 8 characters)
- Company name (for business accounts)
- Phone number (optional)

### Step 3: Referral Code (Optional)

Have a referral code? Enter it during registration to:
- Support the person who referred you
- Both earn bonus points when you verify your first product

### Step 4: Accept Terms

Review and accept our Terms of Service and Privacy Policy.

### Step 5: Start Using ChainTrack

Once registered, you'll be taken to your dashboard where you can:
- Register your first product (Manufacturers)
- View incoming transfers (Distributors/Retailers)
- Verify products (All users)
- Track your rewards
        `
      },
      {
        id: 'dashboard-overview',
        title: 'Dashboard Overview',
        content: `
## Your Dashboard

The dashboard is your central hub for all ChainTrack activities.

### Dashboard Sections

#### Quick Stats
At the top, you'll see key metrics:
- Total products registered/received
- Pending transfers
- Verification count
- Current reward points

#### Recent Activity
A timeline of your recent actions:
- Product registrations
- Transfers sent/received
- Verifications performed

#### Quick Actions
Common tasks accessible with one click:
- Register new product
- Create shipment
- Verify product
- View rewards

### Navigation Menu

| Menu Item | Description |
|-----------|-------------|
| Dashboard | Overview and quick stats |
| Products | Manage your registered products |
| Transfers | View and manage product transfers |
| Shipments | P2P delivery management |
| Verify | Scan and verify products |
| Rewards | View points and tier status |
| Settings | Account and preferences |

### Dark Mode

Toggle dark mode using the sun/moon icon in the navigation bar for comfortable viewing in any lighting condition.
        `
      },
      {
        id: 'wallet-setup',
        title: 'Connecting Your Wallet',
        content: `
## Wallet Connection (Optional)

Connecting a cryptocurrency wallet enables advanced blockchain features.

### Why Connect a Wallet?

- **Direct blockchain interaction**: Register products directly on Ethereum
- **Token rewards**: Receive CTK tokens for your activities
- **Full transparency**: View your transactions on the blockchain explorer

### Supported Wallets

- **MetaMask** (Recommended)
- **WalletConnect** compatible wallets
- **Coinbase Wallet**

### How to Connect

1. Click **"Connect Wallet"** in the navigation bar
2. Select your wallet provider
3. Approve the connection request in your wallet
4. Your wallet address will appear in the header

### Network Configuration

ChainTrack operates on:
- **Ethereum Mainnet** (Production)
- **Sepolia Testnet** (Testing)

Make sure your wallet is connected to the correct network.

### Security Tips

- Never share your private keys or seed phrase
- Always verify you're on the official ChainTrack website
- Review transaction details before signing
- Use a hardware wallet for large holdings
        `
      }
    ]
  },
  {
    id: 'products',
    title: 'Product Management',
    icon: Package,
    description: 'Register and manage products',
    articles: [
      {
        id: 'register-product',
        title: 'Registering Products',
        content: `
## Registering Products on the Blockchain

Product registration creates an immutable record on the Ethereum blockchain.

### Required Information

| Field | Description | Example |
|-------|-------------|---------|
| Product Name | Official product name | "Organic Coffee Beans" |
| Description | Detailed product description | "Single-origin Arabica..." |
| Batch Number | Manufacturing batch ID | "BATCH-2025-001" |
| Manufacturing Date | When the product was made | "2025-01-15" |
| Origin | Country/region of origin | "Colombia" |
| Category | Product category | "Food & Beverage" |

### Registration Process

1. Navigate to **Products > Register New**
2. Fill in all required product details
3. Upload product images (optional but recommended)
4. Review the information
5. Click **"Register on Blockchain"**
6. Confirm the transaction (if wallet connected)

### What Happens Next?

- A unique **Product ID** is generated
- A **QR Code** is created for the product
- The registration is recorded on the blockchain
- You receive reward points for registration

### QR Code Generation

Each registered product gets a unique QR code that:
- Links to the product's verification page
- Contains the blockchain product ID
- Can be printed and attached to physical products

### Best Practices

- Use accurate, detailed descriptions
- Include batch numbers for traceability
- Upload clear product images
- Register products before shipping
        `
      },
      {
        id: 'product-details',
        title: 'Viewing Product Details',
        content: `
## Product Details Page

Each product has a detailed page showing its complete history.

### Product Information

- **Basic Details**: Name, description, category
- **Manufacturing Info**: Batch number, date, origin
- **Blockchain Data**: Product ID, registration transaction
- **Current Status**: Location in supply chain

### Supply Chain History

A complete timeline showing:
- Initial registration
- Each transfer between parties
- Current holder
- Verification events

### QR Code Access

From the product details page, you can:
- View the QR code
- Download as PNG/PDF
- Print directly
- Share via link

### Product Actions

Depending on your role, you can:
- **Transfer**: Send to another party
- **Create Shipment**: Arrange delivery
- **Edit**: Update non-blockchain details
- **Archive**: Hide from active list
        `
      },
      {
        id: 'batch-registration',
        title: 'Batch Registration',
        content: `
## Registering Multiple Products

For manufacturers with large inventories, batch registration saves time.

### CSV Upload

1. Download our CSV template
2. Fill in product details (one row per product)
3. Upload the completed CSV
4. Review the preview
5. Confirm batch registration

### CSV Template Format

\`\`\`csv
name,description,batch_number,manufacturing_date,origin,category
Product 1,Description 1,BATCH-001,2025-01-01,Country,Category
Product 2,Description 2,BATCH-002,2025-01-02,Country,Category
\`\`\`

### Batch Limits

- Maximum 100 products per batch
- All products must have complete information
- Processing time: ~2-5 minutes for large batches

### Batch Status

Track your batch registration:
- **Pending**: Processing started
- **In Progress**: Being registered
- **Completed**: All products registered
- **Partial**: Some products failed (review errors)
        `
      }
    ]
  },
  {
    id: 'verification',
    title: 'Product Verification',
    icon: QrCode,
    description: 'Verify product authenticity',
    articles: [
      {
        id: 'how-to-verify',
        title: 'How to Verify Products',
        content: `
## Verifying Product Authenticity

Verification is ChainTrack's core feature - anyone can verify a product's authenticity.

### Method 1: QR Code Scan

1. Open ChainTrack on your mobile device
2. Navigate to **Verify Product**
3. Click **"Scan QR Code"**
4. Point your camera at the product's QR code
5. View the verification results instantly

### Method 2: Manual Entry

1. Navigate to **Verify Product**
2. Enter the Product ID manually
3. Click **"Verify"**

### Method 3: Direct Link

Scan any ChainTrack QR code with your phone's camera to open the verification page directly.

### Understanding Results

#### ✅ Verified - Authentic
- Product found on blockchain
- Complete supply chain history available
- Safe to purchase

#### ⚠️ Verification Warning
- Product found but with anomalies
- May require additional verification
- Check supply chain history

#### ❌ Not Found
- Product not in our system
- May be counterfeit
- Do not purchase without verification

### Verification Rewards

Each verification earns you reward points:
- First verification: 100 points (bonus)
- Regular verification: 10 points
- Daily login bonus: 5 points
        `
      },
      {
        id: 'verification-details',
        title: 'Reading Verification Results',
        content: `
## Understanding Verification Results

When you verify a product, you receive comprehensive information.

### Product Information

- **Name & Description**: What the product is
- **Manufacturer**: Who made it
- **Manufacturing Date**: When it was made
- **Origin**: Where it came from
- **Batch Number**: Production batch ID

### Blockchain Verification

- **Product ID**: Unique blockchain identifier
- **Registration Date**: When added to blockchain
- **Transaction Hash**: Blockchain proof (click to view on explorer)
- **Smart Contract**: Contract address

### Supply Chain Journey

A visual timeline showing:
1. **Registered** by Manufacturer
2. **Transferred** to Distributor
3. **Transferred** to Retailer
4. **Current Location**: Where product is now

### Verification Certificate

For verified products, you can:
- View digital certificate
- Download PDF certificate
- Share verification link
        `
      }
    ]
  },
  {
    id: 'transfers',
    title: 'Supply Chain Transfers',
    icon: ArrowRightLeft,
    description: 'Transfer product ownership',
    articles: [
      {
        id: 'initiate-transfer',
        title: 'Initiating Transfers',
        content: `
## Transferring Products

Transfers record ownership changes on the blockchain.

### Starting a Transfer

1. Go to **Products** and select the product
2. Click **"Transfer"**
3. Enter recipient's email or wallet address
4. Add transfer notes (optional)
5. Confirm the transfer

### Transfer Types

| Type | Description |
|------|-------------|
| **Direct Transfer** | Immediate ownership change |
| **Pending Transfer** | Requires recipient acceptance |

### Required Information

- **Recipient**: Email or wallet address
- **Products**: One or multiple products
- **Notes**: Shipping info, special instructions

### Transfer Confirmation

- Sender receives confirmation email
- Recipient receives notification
- Blockchain record is created
- Both parties can view transaction hash
        `
      },
      {
        id: 'receive-transfer',
        title: 'Receiving Transfers',
        content: `
## Accepting Incoming Transfers

When someone transfers products to you, you'll be notified.

### Notification

You'll receive:
- Email notification
- In-app notification
- Dashboard alert

### Reviewing Transfers

1. Go to **Transfers** tab
2. View **Incoming** transfers
3. Click on a transfer to see details

### Transfer Details

- Sender information
- Product list
- Transfer date
- Blockchain transaction

### Accepting or Rejecting

- **Accept**: Products added to your inventory
- **Reject**: Products returned to sender

### After Acceptance

- Products appear in your Products list
- You become the current holder
- Supply chain history is updated
- You can now transfer or sell these products
        `
      }
    ]
  },
  {
    id: 'shipments',
    title: 'Shipment & Delivery',
    icon: Truck,
    description: 'P2P delivery management',
    articles: [
      {
        id: 'create-shipment',
        title: 'Creating Shipments',
        content: `
## P2P Shipment System

ChainTrack's shipment system enables tracked deliveries with courier integration.

### Creating a Shipment

1. Navigate to **Shipments > Create New**
2. Enter shipment details:
   - Recipient name and email
   - Pickup address
   - Delivery address
   - Package description
   - Delivery notes

### Shipment Options

| Option | Description |
|--------|-------------|
| **Priority** | Normal, Express, Same-day |
| **Insurance** | Optional package insurance |
| **Signature** | Require signature on delivery |

### Tracking Code

Each shipment receives a unique tracking code:
- Format: \`CTK-XXXXXX\`
- Shareable with recipient
- Used by couriers for updates

### Shipment Status

- **Created**: Shipment registered
- **Courier Assigned**: Courier accepted
- **Picked Up**: Package collected
- **In Transit**: On the way
- **Delivered**: Successfully delivered
        `
      },
      {
        id: 'track-shipment',
        title: 'Tracking Shipments',
        content: `
## Real-Time Shipment Tracking

Both senders and recipients can track shipments in real-time.

### For Senders

1. Go to **Shipments**
2. View all your created shipments
3. Click on a shipment for details
4. See current status and location

### For Recipients

1. Use the tracking link sent via email
2. Or go to **Track** page
3. Enter the tracking code
4. View shipment progress

### Tracking Information

- Current status
- Courier details
- Checkpoint updates with timestamps
- Estimated delivery time
- Proof of delivery (when complete)

### Notifications

Receive updates via:
- Email notifications
- In-app alerts
- SMS (if enabled)
        `
      },
      {
        id: 'courier-deliveries',
        title: 'Courier Guide',
        content: `
## Courier Portal

Independent couriers can register and complete deliveries.

### Becoming a Courier

1. Visit **Courier Portal**
2. Click **"Register as Courier"**
3. Provide required information:
   - Personal details
   - ID verification
   - Vehicle information
   - Service area

### Finding Deliveries

1. Log into Courier Dashboard
2. Browse available shipments
3. Filter by area, distance, priority
4. Accept shipments you can fulfill

### Completing Deliveries

1. **Accept**: Confirm you'll handle the delivery
2. **Pickup**: Scan QR at pickup, mark as collected
3. **Checkpoints**: Update location during transit
4. **Deliver**: Get recipient signature/photo
5. **Complete**: Mark as delivered

### Courier Ratings

- Recipients rate courier performance
- Maintain high ratings for more deliveries
- Ratings affect visibility in courier selection

### Earnings

- Set your delivery rates
- Receive payment after delivery confirmation
- Track earnings in Courier Dashboard
        `
      }
    ]
  },
  {
    id: 'rewards',
    title: 'Rewards Program',
    icon: Gift,
    description: 'Earn points and rewards',
    articles: [
      {
        id: 'earning-points',
        title: 'Earning Points',
        content: `
## ChainTrack Rewards Program

Earn points for every meaningful action on the platform.

### Point-Earning Actions

| Action | Points | Limit |
|--------|--------|-------|
| First product verification | 100 | Once |
| Product verification | 10 | Unlimited |
| Daily login | 5 | Once/day |
| Register product | 25 | Unlimited |
| Complete transfer | 15 | Unlimited |
| Referral (when they verify) | 200 | Unlimited |

### Bonus Points

- **Streak Bonus**: Login 7 days in a row for 50 bonus points
- **Verification Milestone**: Every 10 verifications = 100 bonus
- **Early Adopter**: Special bonuses for early users

### Checking Your Points

1. Go to **Rewards** page
2. View current balance
3. See points history
4. Track progress to next tier
        `
      },
      {
        id: 'reward-tiers',
        title: 'Reward Tiers',
        content: `
## Tier Levels

Progress through tiers to unlock benefits.

### Tier Structure

| Tier | Points Required | Benefits |
|------|-----------------|----------|
| 🥉 **Bronze** | 0 | Basic access |
| 🥈 **Silver** | 500 | 1.5x point multiplier |
| 🥇 **Gold** | 2,000 | 2x multiplier, priority support |
| 💎 **Platinum** | 5,000 | 2.5x multiplier, exclusive features |
| 👑 **Diamond** | 10,000 | 3x multiplier, VIP access |

### Tier Benefits

#### Bronze (Starting Tier)
- Access to all basic features
- Standard point earning rates

#### Silver
- 1.5x points on all actions
- Silver badge on profile

#### Gold
- 2x points on all actions
- Priority customer support
- Gold badge on profile

#### Platinum
- 2.5x points on all actions
- Early access to new features
- Platinum badge on profile

#### Diamond
- 3x points on all actions
- Direct line to support team
- Exclusive Diamond events
- Diamond badge on profile
        `
      },
      {
        id: 'referral-program',
        title: 'Referral Program',
        content: `
## Refer Friends, Earn Rewards

Share ChainTrack and earn points when friends join.

### Your Referral Code

Find your unique code in:
- **Rewards** page
- **Settings** > **Referral**

Code format: \`CTK\` + User ID + Random characters
Example: \`CTK8A1B2C3\`

### How It Works

1. **Share** your referral code with friends
2. **They register** using your code
3. **They verify** their first product
4. **You both earn** 200 bonus points!

### Sharing Options

- Copy code to clipboard
- Share via email
- Share on social media
- Generate QR code for your referral link

### Tracking Referrals

View in Rewards page:
- Total referrals
- Pending referrals (registered but not yet verified)
- Completed referrals (verified first product)
- Points earned from referrals

### Tips for Success

- Share with businesses who ship products
- Explain the benefits of verification
- Help new users complete their first verification
        `
      },
      {
        id: 'ctk-tokens',
        title: 'CTK Tokens',
        content: `
## CTK Token Conversion

Convert your points to CTK utility tokens.

### What are CTK Tokens?

CTK (ChainTrack Token) is a utility token that can be used:
- For premium features
- Reduced transaction fees
- Governance voting (future)
- Partner discounts

### Conversion Rate

Current rate: **100 points = 1 CTK**

*Rate may vary based on market conditions*

### How to Convert

1. Go to **Rewards** page
2. Click **"Convert to CTK"**
3. Enter amount to convert
4. Connect wallet (if not connected)
5. Confirm conversion
6. CTK tokens sent to your wallet

### Minimum Conversion

- Minimum: 1,000 points (10 CTK)
- No maximum limit

### Important Notes

- Conversion is one-way (CTK cannot become points)
- CTK is a utility token, not a security
- Wallet required for CTK storage
- Gas fees apply for token transfers
        `
      }
    ]
  },
  {
    id: 'blockchain',
    title: 'Blockchain & Security',
    icon: Shield,
    description: 'Understanding the technology',
    articles: [
      {
        id: 'blockchain-basics',
        title: 'Blockchain Fundamentals',
        content: `
## How Blockchain Powers ChainTrack

ChainTrack uses Ethereum blockchain for immutable record-keeping.

### What is Blockchain?

A blockchain is a distributed, immutable ledger that records transactions across many computers. Once data is recorded, it cannot be altered.

### Why Blockchain for Supply Chain?

| Benefit | Description |
|---------|-------------|
| **Immutability** | Records cannot be changed or deleted |
| **Transparency** | Anyone can verify the data |
| **Decentralization** | No single point of failure |
| **Trust** | Cryptographic proof of authenticity |

### ChainTrack's Smart Contracts

We use two main smart contracts:

1. **ProductRegistry**: Stores product registrations
2. **ShipmentRegistry**: Records supply chain movements

### On-Chain vs Off-Chain Data

**Stored on Blockchain:**
- Product ID and core metadata
- Transfer records
- Timestamps
- Verification proofs

**Stored Off-Chain (Our Servers):**
- User accounts and passwords
- Product images
- Detailed descriptions
- Analytics data
        `
      },
      {
        id: 'transaction-explorer',
        title: 'Viewing Transactions',
        content: `
## Blockchain Explorer

Every ChainTrack transaction can be verified on the public blockchain.

### Transaction Hash

Each blockchain operation produces a unique transaction hash:
\`0x123abc...789xyz\`

This hash is your proof of the transaction.

### Viewing on Etherscan

1. Click any transaction hash in ChainTrack
2. Opens Etherscan (blockchain explorer)
3. View complete transaction details:
   - Block number
   - Timestamp
   - Gas used
   - Contract interaction

### What You Can Verify

- Product registration date and details
- Transfer history
- Ownership changes
- Smart contract code

### Network Information

- **Mainnet**: etherscan.io
- **Sepolia Testnet**: sepolia.etherscan.io
        `
      },
      {
        id: 'security-practices',
        title: 'Security Best Practices',
        content: `
## Keeping Your Account Secure

Follow these practices to protect your ChainTrack account.

### Password Security

- Use a strong, unique password (12+ characters)
- Include uppercase, lowercase, numbers, symbols
- Never reuse passwords across sites
- Consider using a password manager

### Wallet Security

- Never share your seed phrase
- Use a hardware wallet for large holdings
- Verify website URL before connecting
- Review all transaction details before signing

### Account Protection

- Enable two-factor authentication (coming soon)
- Log out when using shared devices
- Monitor your account activity
- Report suspicious activity immediately

### Phishing Awareness

Watch out for:
- Emails asking for your password
- Fake websites mimicking ChainTrack
- Unexpected wallet connection requests
- Too-good-to-be-true offers

### Official ChainTrack Domains

Only trust:
- chaintrack.io
- app.chaintrack.io
- Support emails from @chaintrack.io
        `
      },
      {
        id: 'data-privacy',
        title: 'Data & Privacy',
        content: `
## Your Data on ChainTrack

Understanding what data we collect and how it's protected.

### Data We Collect

- Account information (name, email)
- Product data you register
- Transaction history
- Usage analytics

### Data Protection

- Encryption in transit (TLS/SSL)
- Encryption at rest
- Secure password hashing
- Regular security audits

### Blockchain Data

**Important**: Data written to the blockchain is:
- **Public**: Anyone can view it
- **Permanent**: Cannot be deleted
- **Immutable**: Cannot be modified

Only register information you're comfortable being public.

### Your Rights

- Access your data
- Request data export
- Request account deletion
- Opt out of marketing

See our [Privacy Policy](/privacy) for complete details.
        `
      }
    ]
  },
  {
    id: 'api',
    title: 'API Reference',
    icon: Code,
    description: 'Developer documentation',
    articles: [
      {
        id: 'api-overview',
        title: 'API Overview',
        content: `
## ChainTrack API

Integrate ChainTrack into your existing systems.

### Base URL

\`\`\`
https://api.chaintrack.io/v1
\`\`\`

### Authentication

All API requests require authentication via JWT token.

\`\`\`bash
Authorization: Bearer YOUR_JWT_TOKEN
\`\`\`

### Getting Your API Token

1. Log into ChainTrack
2. Go to **Settings** > **API Access**
3. Generate new API token
4. Store securely (shown only once)

### Rate Limits

| Plan | Requests/Hour |
|------|---------------|
| Free | 100 |
| Pro | 1,000 |
| Enterprise | Unlimited |

### Response Format

All responses are JSON:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
\`\`\`
        `
      },
      {
        id: 'api-endpoints',
        title: 'API Endpoints',
        content: `
## Core Endpoints

### Products

\`\`\`
GET    /products              # List your products
POST   /products              # Register new product
GET    /products/:id          # Get product details
PUT    /products/:id          # Update product
DELETE /products/:id          # Archive product
\`\`\`

### Verification

\`\`\`
GET    /verify/:productId     # Verify a product
POST   /verify                # Verify with additional data
\`\`\`

### Transfers

\`\`\`
GET    /transfers             # List transfers
POST   /transfers             # Initiate transfer
GET    /transfers/:id         # Transfer details
PUT    /transfers/:id/accept  # Accept transfer
PUT    /transfers/:id/reject  # Reject transfer
\`\`\`

### Shipments

\`\`\`
GET    /shipments             # List shipments
POST   /shipments             # Create shipment
GET    /shipments/:id         # Shipment details
PUT    /shipments/:id/status  # Update status
\`\`\`

### User

\`\`\`
GET    /user/profile          # Get profile
PUT    /user/profile          # Update profile
GET    /user/rewards          # Get rewards info
\`\`\`
        `
      },
      {
        id: 'webhooks',
        title: 'Webhooks',
        content: `
## Webhook Integration

Receive real-time notifications for events.

### Setting Up Webhooks

1. Go to **Settings** > **Webhooks**
2. Add webhook URL
3. Select events to subscribe to
4. Save configuration

### Available Events

| Event | Description |
|-------|-------------|
| \`product.registered\` | New product registered |
| \`product.transferred\` | Product ownership changed |
| \`product.verified\` | Product was verified |
| \`shipment.created\` | New shipment created |
| \`shipment.updated\` | Shipment status changed |
| \`shipment.delivered\` | Shipment completed |

### Webhook Payload

\`\`\`json
{
  "event": "product.verified",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "product_id": "PROD-123",
    "verified_by": "user@example.com",
    "verification_result": "authentic"
  }
}
\`\`\`

### Security

- Webhooks include signature header
- Verify signature before processing
- Use HTTPS endpoints only
        `
      }
    ]
  },
  {
    id: 'faq',
    title: 'FAQ & Troubleshooting',
    icon: HelpCircle,
    description: 'Common questions answered',
    articles: [
      {
        id: 'general-faq',
        title: 'General FAQ',
        content: `
## Frequently Asked Questions

### Account & Access

**Q: Is ChainTrack free to use?**
A: Yes! Basic features are free. Premium features may require a subscription or CTK tokens.

**Q: Can I change my account role?**
A: Contact support to request a role change. Some transitions may require verification.

**Q: How do I delete my account?**
A: Go to Settings > Account > Delete Account. Note: Blockchain data cannot be deleted.

### Products & Verification

**Q: Can anyone verify my products?**
A: Yes, that's the point! Anyone with the QR code or product ID can verify authenticity.

**Q: What if verification shows "Not Found"?**
A: The product may not be registered on ChainTrack. Be cautious about authenticity.

**Q: Can I edit a registered product?**
A: Off-chain data (images, descriptions) can be edited. Blockchain data is permanent.

### Blockchain & Wallet

**Q: Do I need a crypto wallet?**
A: No, a wallet is optional. Basic features work without one.

**Q: What are gas fees?**
A: Gas fees are Ethereum network costs for blockchain transactions. They vary based on network congestion.

**Q: Is my data really permanent?**
A: Yes, blockchain data cannot be modified or deleted. Only register information you want public permanently.
        `
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        content: `
## Common Issues & Solutions

### Login Problems

**Can't log in:**
- Check email/password spelling
- Clear browser cache and cookies
- Try password reset
- Check if account is verified

**Session expired:**
- Log in again
- Enable "Remember me" for longer sessions

### Wallet Issues

**Wallet won't connect:**
- Ensure MetaMask/wallet is installed
- Check you're on correct network
- Try refreshing the page
- Disable other wallet extensions

**Transaction failing:**
- Check you have enough ETH for gas
- Try increasing gas limit
- Wait for network congestion to reduce

### Verification Problems

**QR code won't scan:**
- Ensure good lighting
- Hold camera steady
- Try cleaning the QR code
- Use manual Product ID entry

**Verification fails:**
- Product may not be registered
- Check internet connection
- Try again in a few moments

### Performance Issues

**Page loading slowly:**
- Check internet connection
- Clear browser cache
- Try different browser
- Disable browser extensions

### Still Need Help?

Contact us:
- Email: support@chaintrack.io
- Contact form: [Contact Page](/contact)
- Response time: 24-48 hours
        `
      }
    ]
  }
]

// Utility component for rendering markdown-like content
function RenderContent({ content }) {
  const [copiedCode, setCopiedCode] = useState(null)

  const copyToClipboard = (code, index) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(index)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Parse and render content
  const renderContent = () => {
    const lines = content.trim().split('\n')
    const elements = []
    let i = 0
    let tableData = null
    let codeBlock = null
    let listItems = []

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 text-gray-600 dark:text-gray-300">
            {listItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )
        listItems = []
      }
    }

    while (i < lines.length) {
      const line = lines[i]

      // Code block
      if (line.startsWith('```')) {
        if (codeBlock === null) {
          codeBlock = { lang: line.slice(3), code: [] }
        } else {
          flushList()
          const codeContent = codeBlock.code.join('\n')
          const codeIndex = elements.length
          elements.push(
            <div key={`code-${codeIndex}`} className="relative mb-4">
              <div className="flex justify-between items-center bg-gray-800 text-gray-300 px-4 py-2 rounded-t-lg text-xs">
                <span>{codeBlock.lang || 'code'}</span>
                <button
                  onClick={() => copyToClipboard(codeContent, codeIndex)}
                  className="flex items-center space-x-1 hover:text-white transition"
                >
                  {copiedCode === codeIndex ? (
                    <>
                      <Check size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm">
                <code>{codeContent}</code>
              </pre>
            </div>
          )
          codeBlock = null
        }
        i++
        continue
      }

      if (codeBlock !== null) {
        codeBlock.code.push(line)
        i++
        continue
      }

      // Table
      if (line.startsWith('|')) {
        if (tableData === null) {
          tableData = { headers: [], rows: [] }
          const headers = line.split('|').filter(cell => cell.trim())
          tableData.headers = headers.map(h => h.trim())
        } else if (line.includes('---')) {
          // Separator line, skip
        } else {
          const cells = line.split('|').filter(cell => cell.trim())
          tableData.rows.push(cells.map(c => c.trim()))
        }
        
        // Check if next line is not a table
        if (!lines[i + 1]?.startsWith('|')) {
          flushList()
          elements.push(
            <div key={`table-${elements.length}`} className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {tableData.headers.map((header, idx) => (
                      <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {header.replace(/\*\*/g, '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tableData.rows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                          {cell.replace(/\*\*/g, '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          tableData = null
        }
        i++
        continue
      }

      // Headers
      if (line.startsWith('## ')) {
        flushList()
        elements.push(
          <h2 key={`h2-${i}`} className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
            {line.slice(3)}
          </h2>
        )
        i++
        continue
      }

      if (line.startsWith('### ')) {
        flushList()
        elements.push(
          <h3 key={`h3-${i}`} className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
            {line.slice(4)}
          </h3>
        )
        i++
        continue
      }

      if (line.startsWith('#### ')) {
        flushList()
        elements.push(
          <h4 key={`h4-${i}`} className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-4 mb-2">
            {line.slice(5)}
          </h4>
        )
        i++
        continue
      }

      // List items
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const text = line.slice(2)
        // Parse bold text
        const parts = text.split(/\*\*/).map((part, idx) => 
          idx % 2 === 1 ? <strong key={idx} className="text-gray-900 dark:text-white">{part}</strong> : part
        )
        listItems.push(parts)
        i++
        continue
      }

      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        flushList()
        const text = line.replace(/^\d+\.\s/, '')
        const parts = text.split(/\*\*/).map((part, idx) => 
          idx % 2 === 1 ? <strong key={idx} className="text-gray-900 dark:text-white">{part}</strong> : part
        )
        elements.push(
          <p key={`num-${i}`} className="text-gray-600 dark:text-gray-300 mb-2 ml-4">
            {line.match(/^\d+/)[0]}. {parts}
          </p>
        )
        i++
        continue
      }

      // Paragraph
      if (line.trim()) {
        flushList()
        // Parse bold, italic, code, and links
        let text = line
        const parts = []
        let lastIndex = 0
        
        // Simple parsing for **bold**, `code`, and [links](url)
        const regex = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g
        let match
        
        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index))
          }
          
          if (match[1]) {
            // Bold
            parts.push(<strong key={match.index} className="text-gray-900 dark:text-white">{match[1]}</strong>)
          } else if (match[2]) {
            // Code
            parts.push(<code key={match.index} className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm text-primary-600 dark:text-primary-400">{match[2]}</code>)
          } else if (match[3] && match[4]) {
            // Link
            parts.push(
              <Link key={match.index} to={match[4]} className="text-primary-600 dark:text-primary-400 hover:underline">
                {match[3]}
              </Link>
            )
          }
          
          lastIndex = match.index + match[0].length
        }
        
        if (lastIndex < text.length) {
          parts.push(text.slice(lastIndex))
        }
        
        elements.push(
          <p key={`p-${i}`} className="text-gray-600 dark:text-gray-300 mb-4">
            {parts.length > 0 ? parts : text}
          </p>
        )
      }

      i++
    }

    flushList()
    return elements
  }

  return <div className="prose-custom">{renderContent()}</div>
}

export default function DocumentationPage() {
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState(['getting-started'])
  const [activeArticle, setActiveArticle] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Find article from URL hash
  useEffect(() => {
    const hash = location.hash.slice(1)
    if (hash) {
      for (const section of documentationSections) {
        const article = section.articles.find(a => a.id === hash)
        if (article) {
          setActiveArticle({ section, article })
          if (!expandedSections.includes(section.id)) {
            setExpandedSections(prev => [...prev, section.id])
          }
          break
        }
      }
    } else {
      // Default to first article
      setActiveArticle({
        section: documentationSections[0],
        article: documentationSections[0].articles[0]
      })
    }
  }, [location.hash])

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const selectArticle = (section, article) => {
    setActiveArticle({ section, article })
    window.history.pushState(null, '', `#${article.id}`)
  }

  // Filter articles based on search
  const filteredSections = searchQuery
    ? documentationSections.map(section => ({
        ...section,
        articles: section.articles.filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(section => section.articles.length > 0)
    : documentationSections

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary-100 hover:text-white mb-4 transition"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <Book size={36} />
              <h1 className="text-3xl font-bold">Documentation</h1>
            </div>
            <p className="text-primary-100 max-w-2xl">
              Everything you need to know about using ChainTrack for supply chain transparency.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`w-72 flex-shrink-0 ${isSidebarOpen ? '' : 'hidden lg:block'}`}
          >
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {filteredSections.map((section) => (
                <div key={section.id} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center space-x-3">
                      <section.icon className="text-primary-600 dark:text-primary-400" size={20} />
                      <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {section.title}
                      </span>
                    </div>
                    {expandedSections.includes(section.id) ? (
                      <ChevronDown size={18} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.includes(section.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100 dark:border-gray-700"
                      >
                        {section.articles.map((article) => (
                          <button
                            key={article.id}
                            onClick={() => selectArticle(section, article)}
                            className={`w-full text-left px-4 py-2 text-sm transition ${
                              activeArticle?.article.id === article.id
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border-l-2 border-primary-500'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {article.title}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Quick Links */}
            <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/verify" className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  <QrCode size={16} className="mr-2" />
                  Verify a Product
                </Link>
                <Link to="/contact" className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  <HelpCircle size={16} className="mr-2" />
                  Contact Support
                </Link>
                <Link to="/register" className="flex items-center text-sm text-primary-600 dark:text-primary-400 hover:underline">
                  <UserPlus size={16} className="mr-2" />
                  Create Account
                </Link>
              </div>
            </div>
          </motion.aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {activeArticle ? (
              <motion.article
                key={activeArticle.article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sm:p-8"
              >
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <Link to="/docs" className="hover:text-primary-600 dark:hover:text-primary-400">
                    Docs
                  </Link>
                  <ChevronRight size={16} className="mx-2" />
                  <span>{activeArticle.section.title}</span>
                  <ChevronRight size={16} className="mx-2" />
                  <span className="text-gray-900 dark:text-white">{activeArticle.article.title}</span>
                </div>

                {/* Article Title */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  {activeArticle.article.title}
                </h1>

                {/* Article Content */}
                <RenderContent content={activeArticle.article.content} />

                {/* Article Navigation */}
                <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    {/* Previous Article */}
                    {(() => {
                      const allArticles = documentationSections.flatMap(s => 
                        s.articles.map(a => ({ section: s, article: a }))
                      )
                      const currentIndex = allArticles.findIndex(
                        a => a.article.id === activeArticle.article.id
                      )
                      const prev = currentIndex > 0 ? allArticles[currentIndex - 1] : null
                      
                      return prev ? (
                        <button
                          onClick={() => selectArticle(prev.section, prev.article)}
                          className="flex items-center text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          <ArrowLeft size={18} className="mr-2" />
                          <div className="text-left">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Previous</div>
                            <div>{prev.article.title}</div>
                          </div>
                        </button>
                      ) : <div />
                    })()}

                    {/* Next Article */}
                    {(() => {
                      const allArticles = documentationSections.flatMap(s => 
                        s.articles.map(a => ({ section: s, article: a }))
                      )
                      const currentIndex = allArticles.findIndex(
                        a => a.article.id === activeArticle.article.id
                      )
                      const next = currentIndex < allArticles.length - 1 ? allArticles[currentIndex + 1] : null
                      
                      return next ? (
                        <button
                          onClick={() => selectArticle(next.section, next.article)}
                          className="flex items-center text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          <div className="text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Next</div>
                            <div>{next.article.title}</div>
                          </div>
                          <ChevronRight size={18} className="ml-2" />
                        </button>
                      ) : <div />
                    })()}
                  </div>
                </div>

                {/* Feedback */}
                <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Was this article helpful?
                  </p>
                  <div className="flex space-x-2">
                    <button className="px-4 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition">
                      👍 Yes
                    </button>
                    <button className="px-4 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition">
                      👎 No
                    </button>
                    <Link
                      to="/contact"
                      className="px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
                    >
                      <HelpCircle size={16} className="mr-1" />
                      Need more help?
                    </Link>
                  </div>
                </div>
              </motion.article>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                <Book size={48} className="mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Select an article
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a topic from the sidebar to get started.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
