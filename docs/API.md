# ChainTrack API Documentation

## Base URL

```
Development: http://localhost:5000/api
Production:  https://api.chaintrack.app/api
```

## Authentication

ChainTrack uses JWT (JSON Web Tokens) for authentication.

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Endpoints

### Authentication

#### Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "company": "Acme Corp",
  "role": "manufacturer"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "manufacturer"
  }
}
```

#### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "manufacturer"
  }
}
```

#### Refresh Token

```http
POST /auth/refresh
```

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Products

#### List Products

```http
GET /products
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number (default: 1) |
| per_page | int | Items per page (default: 20) |
| status | string | Filter by status (active/in_transit/delivered) |

**Response (200):**
```json
{
  "products": [
    {
      "id": "PRD-001",
      "name": "Organic Coffee Beans",
      "category": "food",
      "origin": "Colombia",
      "status": "active",
      "blockchain_hash": "0x...",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

#### Create Product

```http
POST /products
```

**Request Body:**
```json
{
  "name": "Organic Coffee Beans",
  "description": "Premium Arabica beans from Colombian highlands",
  "category": "food",
  "origin": "Colombia",
  "batch_number": "BATCH-2024-001",
  "manufacturing_date": "2024-01-10",
  "expiry_date": "2025-01-10",
  "metadata": {
    "weight": "1kg",
    "certification": "USDA Organic"
  }
}
```

**Response (201):**
```json
{
  "product": {
    "id": "PRD-001",
    "name": "Organic Coffee Beans",
    "blockchain_hash": "0x...",
    "qr_code": "base64_encoded_image",
    "verification_url": "https://chaintrack.app/verify/PRD-001"
  },
  "message": "Product registered on blockchain"
}
```

#### Get Product

```http
GET /products/:id
```

**Response (200):**
```json
{
  "product": {
    "id": "PRD-001",
    "name": "Organic Coffee Beans",
    "description": "Premium Arabica beans",
    "status": "in_transit",
    "blockchain_hash": "0x...",
    "journey": [
      {
        "location": "Bogotá, Colombia",
        "timestamp": "2024-01-15T10:00:00Z",
        "action": "manufactured",
        "handler": "Colombian Coffee Co."
      },
      {
        "location": "Miami, USA",
        "timestamp": "2024-01-20T14:30:00Z",
        "action": "transferred",
        "handler": "Global Distributors"
      }
    ]
  }
}
```

---

### Transfers

#### Create Transfer

```http
POST /transfers
```

**Request Body:**
```json
{
  "product_id": "PRD-001",
  "to_user_id": 5,
  "location": "Miami, USA",
  "notes": "Transferred to regional distributor"
}
```

**Response (201):**
```json
{
  "transfer": {
    "id": 42,
    "product_id": "PRD-001",
    "from_user": "Colombian Coffee Co.",
    "to_user": "Global Distributors",
    "blockchain_hash": "0x...",
    "status": "pending"
  }
}
```

#### Confirm Transfer

```http
POST /transfers/:id/confirm
```

**Response (200):**
```json
{
  "transfer": {
    "id": 42,
    "status": "confirmed",
    "confirmed_at": "2024-01-20T14:30:00Z"
  }
}
```

---

### Verification

#### Public Verify (No Auth Required)

```http
GET /verify/:product_id
```

**Response (200):**
```json
{
  "verified": true,
  "product": {
    "name": "Organic Coffee Beans",
    "manufacturer": "Colombian Coffee Co.",
    "origin": "Colombia",
    "manufacturing_date": "2024-01-10"
  },
  "blockchain": {
    "verified": true,
    "hash": "0x...",
    "network": "Ethereum Sepolia"
  },
  "journey": [...]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Invalid email format"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid input data |
| BLOCKCHAIN_ERROR | 500 | Blockchain transaction failed |

---

## Rate Limiting

- 100 requests per minute for authenticated users
- 20 requests per minute for public endpoints

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699999999
```
