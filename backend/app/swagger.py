"""
ChainTrack API - OpenAPI/Swagger Documentation
Provides interactive API documentation at /api/docs
"""

from flask import Blueprint, jsonify

swagger_bp = Blueprint('swagger', __name__)

# OpenAPI 3.0 Specification
OPENAPI_SPEC = {
    "openapi": "3.0.3",
    "info": {
        "title": "ChainTrack API",
        "description": """
## 🔗 Blockchain-Powered Supply Chain Transparency API

ChainTrack provides a comprehensive REST API for managing products, transfers, 
shipments, and verifications on the Ethereum blockchain.

### Features
- **Product Registration** - Register products with unique IDs on Ethereum
- **Transfer Management** - Track custody transfers through the supply chain
- **P2P Shipments** - Peer-to-peer delivery tracking with real-time updates
- **Verification** - Instant product authenticity verification via QR codes
- **Rewards** - Consumer rewards for product verifications

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

### Rate Limits
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
        """,
        "version": "2.0.0",
        "contact": {
            "name": "ChainTrack Support",
            "email": "support@chaintrack.io",
            "url": "https://github.com/nobleenia/ChainTrack"
        },
        "license": {
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT"
        }
    },
    "servers": [
        {
            "url": "http://localhost:5000/api",
            "description": "Development server"
        },
        {
            "url": "https://chaintrack-api.railway.app/api",
            "description": "Production server"
        }
    ],
    "tags": [
        {"name": "Auth", "description": "Authentication & user management"},
        {"name": "Products", "description": "Product registration & management"},
        {"name": "Transfers", "description": "Custody transfer operations"},
        {"name": "Shipments", "description": "P2P delivery tracking"},
        {"name": "Verification", "description": "Product authenticity verification"},
        {"name": "Rewards", "description": "Consumer rewards system"},
        {"name": "Health", "description": "API health checks"}
    ],
    "paths": {
        "/health": {
            "get": {
                "tags": ["Health"],
                "summary": "Health check",
                "description": "Check if the API is running",
                "responses": {
                    "200": {
                        "description": "API is healthy",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "status": {"type": "string", "example": "healthy"},
                                        "service": {"type": "string", "example": "chaintrack-api"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/auth/register": {
            "post": {
                "tags": ["Auth"],
                "summary": "Register new user",
                "description": "Create a new user account with role-based access",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/UserRegister"},
                            "example": {
                                "email": "user@example.com",
                                "password": "securePassword123",
                                "name": "John Doe",
                                "company": "Acme Corp",
                                "role": "manufacturer"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "User created successfully",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/AuthResponse"}
                            }
                        }
                    },
                    "400": {"description": "Invalid input or email already exists"}
                }
            }
        },
        "/auth/login": {
            "post": {
                "tags": ["Auth"],
                "summary": "User login",
                "description": "Authenticate and receive JWT tokens",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/UserLogin"},
                            "example": {
                                "email": "manufacturer@demo.com",
                                "password": "demo1234"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Login successful",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/AuthResponse"}
                            }
                        }
                    },
                    "401": {"description": "Invalid credentials"}
                }
            }
        },
        "/auth/refresh": {
            "post": {
                "tags": ["Auth"],
                "summary": "Refresh access token",
                "description": "Get new access token using refresh token",
                "security": [{"bearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Token refreshed",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "access_token": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/products": {
            "get": {
                "tags": ["Products"],
                "summary": "List products",
                "description": "Get paginated list of products with optional filters",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {"name": "page", "in": "query", "schema": {"type": "integer", "default": 1}},
                    {"name": "per_page", "in": "query", "schema": {"type": "integer", "default": 10}},
                    {"name": "status", "in": "query", "schema": {"type": "string", "enum": ["registered", "in_transit", "delivered", "verified"]}},
                    {"name": "category", "in": "query", "schema": {"type": "string"}},
                    {"name": "search", "in": "query", "schema": {"type": "string"}}
                ],
                "responses": {
                    "200": {
                        "description": "List of products",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "products": {
                                            "type": "array",
                                            "items": {"$ref": "#/components/schemas/Product"}
                                        },
                                        "total": {"type": "integer"},
                                        "page": {"type": "integer"},
                                        "per_page": {"type": "integer"}
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": ["Products"],
                "summary": "Register new product",
                "description": "Register a new product on the blockchain",
                "security": [{"bearerAuth": []}],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ProductCreate"},
                            "example": {
                                "name": "Premium Coffee Beans",
                                "description": "Single-origin Arabica from Ethiopia",
                                "category": "Food & Beverage",
                                "sku": "COF-ETH-001",
                                "batch_number": "BATCH-2024-001",
                                "manufacture_date": "2024-01-15",
                                "expiry_date": "2025-01-15"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Product registered",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/Product"}
                            }
                        }
                    }
                }
            }
        },
        "/products/{product_id}": {
            "get": {
                "tags": ["Products"],
                "summary": "Get product details",
                "description": "Get full product details including blockchain data",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {"name": "product_id", "in": "path", "required": True, "schema": {"type": "string"}}
                ],
                "responses": {
                    "200": {
                        "description": "Product details",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ProductDetail"}
                            }
                        }
                    },
                    "404": {"description": "Product not found"}
                }
            }
        },
        "/products/{product_id}/qr": {
            "get": {
                "tags": ["Products"],
                "summary": "Get product QR code",
                "description": "Generate QR code for product verification",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {"name": "product_id", "in": "path", "required": True, "schema": {"type": "string"}}
                ],
                "responses": {
                    "200": {
                        "description": "QR code image",
                        "content": {
                            "image/png": {
                                "schema": {"type": "string", "format": "binary"}
                            }
                        }
                    }
                }
            }
        },
        "/transfers": {
            "get": {
                "tags": ["Transfers"],
                "summary": "List transfers",
                "description": "Get custody transfers for current user",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {"name": "page", "in": "query", "schema": {"type": "integer", "default": 1}},
                    {"name": "is_confirmed", "in": "query", "schema": {"type": "boolean"}}
                ],
                "responses": {
                    "200": {
                        "description": "List of transfers",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "transfers": {
                                            "type": "array",
                                            "items": {"$ref": "#/components/schemas/Transfer"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": ["Transfers"],
                "summary": "Create transfer",
                "description": "Initiate custody transfer to another user",
                "security": [{"bearerAuth": []}],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/TransferCreate"}
                        }
                    }
                },
                "responses": {
                    "201": {"description": "Transfer created"}
                }
            }
        },
        "/transfers/{transfer_id}/confirm": {
            "post": {
                "tags": ["Transfers"],
                "summary": "Confirm transfer",
                "description": "Recipient confirms custody transfer",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {"name": "transfer_id", "in": "path", "required": True, "schema": {"type": "integer"}}
                ],
                "responses": {
                    "200": {"description": "Transfer confirmed"}
                }
            }
        },
        "/shipments": {
            "get": {
                "tags": ["Shipments"],
                "summary": "List shipments",
                "description": "Get P2P shipments for current user",
                "security": [{"bearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "List of shipments",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "shipments": {
                                            "type": "array",
                                            "items": {"$ref": "#/components/schemas/Shipment"}
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "post": {
                "tags": ["Shipments"],
                "summary": "Create shipment",
                "description": "Create new P2P shipment with delivery PIN",
                "security": [{"bearerAuth": []}],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/ShipmentCreate"}
                        }
                    }
                },
                "responses": {
                    "201": {"description": "Shipment created with PIN"}
                }
            }
        },
        "/shipments/{shipment_id}/checkpoint": {
            "post": {
                "tags": ["Shipments"],
                "summary": "Add checkpoint",
                "description": "Add tracking checkpoint with optional photo proof",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {"name": "shipment_id", "in": "path", "required": True, "schema": {"type": "string"}}
                ],
                "requestBody": {
                    "content": {
                        "multipart/form-data": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "action": {"type": "string", "enum": ["picked_up", "checkpoint", "out_for_delivery", "delivered"]},
                                    "location": {"type": "string"},
                                    "notes": {"type": "string"},
                                    "photo": {"type": "string", "format": "binary"}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "201": {"description": "Checkpoint added"}
                }
            }
        },
        "/shipments/{shipment_id}/confirm": {
            "post": {
                "tags": ["Shipments"],
                "summary": "Confirm delivery",
                "description": "Recipient confirms delivery with PIN",
                "security": [{"bearerAuth": []}],
                "parameters": [
                    {"name": "shipment_id", "in": "path", "required": True, "schema": {"type": "string"}}
                ],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "pin": {"type": "string", "example": "123456"}
                                },
                                "required": ["pin"]
                            }
                        }
                    }
                },
                "responses": {
                    "200": {"description": "Delivery confirmed"}
                }
            }
        },
        "/verify/{product_id}": {
            "get": {
                "tags": ["Verification"],
                "summary": "Verify product",
                "description": "Verify product authenticity - works with or without authentication",
                "parameters": [
                    {"name": "product_id", "in": "path", "required": True, "schema": {"type": "string"}}
                ],
                "responses": {
                    "200": {
                        "description": "Verification result",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/VerificationResult"}
                            }
                        }
                    },
                    "404": {"description": "Product not found"}
                }
            }
        },
        "/rewards/balance": {
            "get": {
                "tags": ["Rewards"],
                "summary": "Get rewards balance",
                "description": "Get current user's points and tier status",
                "security": [{"bearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Rewards balance",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/RewardsBalance"}
                            }
                        }
                    }
                }
            }
        }
    },
    "components": {
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "JWT token from /auth/login"
            }
        },
        "schemas": {
            "UserRegister": {
                "type": "object",
                "required": ["email", "password", "name", "role"],
                "properties": {
                    "email": {"type": "string", "format": "email"},
                    "password": {"type": "string", "minLength": 8},
                    "name": {"type": "string"},
                    "company": {"type": "string"},
                    "role": {"type": "string", "enum": ["manufacturer", "distributor", "retailer", "consumer"]}
                }
            },
            "UserLogin": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                    "email": {"type": "string", "format": "email"},
                    "password": {"type": "string"}
                }
            },
            "AuthResponse": {
                "type": "object",
                "properties": {
                    "access_token": {"type": "string"},
                    "refresh_token": {"type": "string"},
                    "user": {"$ref": "#/components/schemas/User"}
                }
            },
            "User": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "email": {"type": "string"},
                    "name": {"type": "string"},
                    "company": {"type": "string"},
                    "role": {"type": "string"},
                    "wallet_address": {"type": "string"}
                }
            },
            "Product": {
                "type": "object",
                "properties": {
                    "id": {"type": "string", "description": "Unique product ID (PRD-XXXX)"},
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "category": {"type": "string"},
                    "sku": {"type": "string"},
                    "batch_number": {"type": "string"},
                    "status": {"type": "string", "enum": ["registered", "in_transit", "delivered", "verified"]},
                    "blockchain_tx": {"type": "string", "description": "Ethereum transaction hash"},
                    "created_at": {"type": "string", "format": "date-time"}
                }
            },
            "ProductCreate": {
                "type": "object",
                "required": ["name", "category"],
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"},
                    "category": {"type": "string"},
                    "sku": {"type": "string"},
                    "batch_number": {"type": "string"},
                    "manufacture_date": {"type": "string", "format": "date"},
                    "expiry_date": {"type": "string", "format": "date"}
                }
            },
            "ProductDetail": {
                "allOf": [
                    {"$ref": "#/components/schemas/Product"},
                    {
                        "type": "object",
                        "properties": {
                            "journey": {
                                "type": "array",
                                "items": {"$ref": "#/components/schemas/JourneyEvent"}
                            },
                            "qr_code_url": {"type": "string"}
                        }
                    }
                ]
            },
            "JourneyEvent": {
                "type": "object",
                "properties": {
                    "event": {"type": "string"},
                    "from_user": {"type": "string"},
                    "to_user": {"type": "string"},
                    "location": {"type": "string"},
                    "timestamp": {"type": "string", "format": "date-time"},
                    "blockchain_tx": {"type": "string"}
                }
            },
            "Transfer": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "product_id": {"type": "string"},
                    "from_user": {"$ref": "#/components/schemas/User"},
                    "to_user": {"$ref": "#/components/schemas/User"},
                    "transfer_type": {"type": "string"},
                    "is_confirmed": {"type": "boolean"},
                    "blockchain_tx": {"type": "string"},
                    "created_at": {"type": "string", "format": "date-time"}
                }
            },
            "TransferCreate": {
                "type": "object",
                "required": ["product_id", "to_user_email", "transfer_type"],
                "properties": {
                    "product_id": {"type": "string"},
                    "to_user_email": {"type": "string", "format": "email"},
                    "transfer_type": {"type": "string", "enum": ["manufacturer_to_distributor", "distributor_to_retailer", "retailer_to_consumer"]},
                    "notes": {"type": "string"}
                }
            },
            "Shipment": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "transfer_id": {"type": "integer"},
                    "status": {"type": "string", "enum": ["created", "picked_up", "in_transit", "out_for_delivery", "delivered", "confirmed"]},
                    "sender": {"$ref": "#/components/schemas/User"},
                    "recipient": {"$ref": "#/components/schemas/User"},
                    "courier": {"$ref": "#/components/schemas/User"},
                    "pickup_address": {"type": "string"},
                    "delivery_address": {"type": "string"},
                    "checkpoints": {"type": "array", "items": {"$ref": "#/components/schemas/Checkpoint"}},
                    "created_at": {"type": "string", "format": "date-time"}
                }
            },
            "ShipmentCreate": {
                "type": "object",
                "required": ["transfer_id", "pickup_address", "delivery_address"],
                "properties": {
                    "transfer_id": {"type": "integer"},
                    "courier_email": {"type": "string", "format": "email"},
                    "pickup_address": {"type": "string"},
                    "delivery_address": {"type": "string"},
                    "pickup_instructions": {"type": "string"},
                    "delivery_instructions": {"type": "string"}
                }
            },
            "Checkpoint": {
                "type": "object",
                "properties": {
                    "action": {"type": "string"},
                    "location": {"type": "string"},
                    "notes": {"type": "string"},
                    "photo_url": {"type": "string"},
                    "timestamp": {"type": "string", "format": "date-time"}
                }
            },
            "VerificationResult": {
                "type": "object",
                "properties": {
                    "is_authentic": {"type": "boolean"},
                    "product": {"$ref": "#/components/schemas/Product"},
                    "blockchain_verified": {"type": "boolean"},
                    "journey": {"type": "array", "items": {"$ref": "#/components/schemas/JourneyEvent"}},
                    "verification_count": {"type": "integer"}
                }
            },
            "RewardsBalance": {
                "type": "object",
                "properties": {
                    "points": {"type": "integer"},
                    "tokens": {"type": "number"},
                    "tier": {"type": "string", "enum": ["bronze", "silver", "gold", "platinum"]},
                    "verifications_count": {"type": "integer"},
                    "next_tier_points": {"type": "integer"}
                }
            }
        }
    }
}


@swagger_bp.route('/openapi.json')
def get_openapi_spec():
    """Return OpenAPI specification as JSON"""
    return jsonify(OPENAPI_SPEC)


def init_swagger(app):
    """Initialize Swagger UI with the Flask app"""
    from flask_swagger_ui import get_swaggerui_blueprint
    
    SWAGGER_URL = '/api/docs'
    API_URL = '/api/openapi.json'
    
    swaggerui_blueprint = get_swaggerui_blueprint(
        SWAGGER_URL,
        API_URL,
        config={
            'app_name': "ChainTrack API",
            'layout': "BaseLayout",
            'deepLinking': True,
            'displayRequestDuration': True,
            'filter': True,
            'showExtensions': True,
            'showCommonExtensions': True,
            'supportedSubmitMethods': ['get', 'post', 'put', 'delete', 'patch'],
            'validatorUrl': None,
            'docExpansion': 'list',
            'defaultModelsExpandDepth': 2,
            'defaultModelExpandDepth': 2,
        }
    )
    
    app.register_blueprint(swagger_bp, url_prefix='/api')
    app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)
