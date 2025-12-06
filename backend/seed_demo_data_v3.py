#!/usr/bin/env python3
"""
ChainTrack Demo Data Seed Script v3
====================================
Comprehensive seed script for investor demos covering:
- Supply Chain: Products, Transfers, Blockchain verification
- Shipment Tracking: Various status scenarios  
- Courier Portal: Authorized couriers, checkpoints
- User Stories: All role types

Usage:
    python seed_demo_data_v3.py [--reset] [--section=all|users|products|shipments|couriers]

Author: ChainTrack Team
Version: 3.0
"""

import sys
import os
import argparse
from datetime import datetime, timedelta
import random
import hashlib

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import (
    User, UserRole,
    Product,
    Transfer, TransferType,
    Shipment, ShipmentStatus, ShipmentCheckpoint, CheckpointAction, DeliveryProof,
    CourierAuthorization
)
from app.models.courier_profile import CourierProfile
from app.services.qr_service import generate_qr_code

app = create_app('development')

# =============================================================================
# DEMO DATA CONFIGURATION
# =============================================================================

# Universal password for all demo accounts
DEMO_PASSWORD = "ChainTrack2025!"

# Demo Users Configuration
DEMO_USERS = [
    {
        "email": "manufacturer@chaintrack.io",
        "password": DEMO_PASSWORD,
        "name": "Alex Manufacturing",
        "role": UserRole.MANUFACTURER,
        "company_name": "ChainTrack Demo Manufacturing",
        "phone": "+41 22 123 4567"
    },
    {
        "email": "distributor@chaintrack.io",
        "password": DEMO_PASSWORD,
        "name": "Global Distribution Co",
        "role": UserRole.DISTRIBUTOR,
        "company_name": "ChainTrack Demo Distributors",
        "phone": "+1 212 555 0100"
    },
    {
        "email": "retailer@chaintrack.io",
        "password": DEMO_PASSWORD,
        "name": "Premium Retail Store",
        "role": UserRole.RETAILER,
        "company_name": "ChainTrack Demo Retail",
        "phone": "+234 801 234 5678"
    },
    {
        "email": "consumer@chaintrack.io",
        "password": DEMO_PASSWORD,
        "name": "John Customer",
        "role": UserRole.CONSUMER,
        "company_name": None,
        "phone": "+234 812 345 6789"
    },
    {
        "email": "admin@chaintrack.io",
        "password": DEMO_PASSWORD,
        "name": "System Administrator",
        "role": UserRole.ADMIN,
        "company_name": "ChainTrack",
        "phone": "+1 888 555 0000"
    }
]

# Courier Profiles (separate from regular users)
DEMO_COURIERS = [
    {
        "email": "courier.mike@chaintrack.io",
        "password": DEMO_PASSWORD,
        "name": "Mike Johnson",
        "company_name": "Express Logistics",
        "phone": "+234 803 111 2222",
        "vehicle_type": "motorcycle",
        "license_number": "LAG-2025-M1234"
    },
    {
        "email": "courier.sarah@chaintrack.io",
        "password": DEMO_PASSWORD,
        "name": "Sarah Okonkwo",
        "company_name": "Swift Deliveries",
        "phone": "+234 805 333 4444",
        "vehicle_type": "van",
        "license_number": "LAG-2025-V5678"
    },
    {
        "email": "courier.dhl@chaintrack.io",
        "password": DEMO_PASSWORD,
        "name": "DHL Express Nigeria",
        "company_name": "DHL",
        "phone": "+234 1 271 0020",
        "vehicle_type": "truck",
        "license_number": "DHL-NG-2025-001"
    }
]

# Demo Products for Supply Chain
DEMO_PRODUCTS = [
    {
        "name": "Premium Swiss Watch - Chronograph Edition",
        "description": "Handcrafted Swiss mechanical watch with sapphire crystal, genuine leather strap, and 50m water resistance. Serial: SWC-2025-001. Limited edition piece with certificate of authenticity.",
        "category": "Luxury Goods",
        "production_date": "2025-11-15",
        "batch_number": "SWISS-WATCH-2025-001",
        "manufacturing_location": "Geneva, Switzerland",
        "image_url": "/static/images/products/swiss-watch.jpg"
    },
    {
        "name": "Organic Extra Virgin Olive Oil",
        "description": "Cold-pressed organic olive oil from certified Italian farms. First harvest, unfiltered. 500ml dark glass bottle to preserve quality.",
        "category": "Food & Beverages",
        "production_date": "2025-10-20",
        "expiry_date": "2027-10-20",
        "batch_number": "EVOO-IT-2025-042",
        "manufacturing_location": "Tuscany, Italy",
        "image_url": "/static/images/products/olive-oil.jpg"
    },
    {
        "name": "Colombian Single Origin Coffee",
        "description": "Premium Arabica beans from the highlands of Huila, Colombia. Medium roast with notes of chocolate and citrus. 500g bag, whole beans.",
        "category": "Food & Beverages",
        "production_date": "2025-11-01",
        "expiry_date": "2026-05-01",
        "batch_number": "COL-COF-2025-187",
        "manufacturing_location": "Huila, Colombia",
        "image_url": "/static/images/products/coffee.jpg"
    },
    {
        "name": "Vintage Bordeaux Wine 2020",
        "description": "Grand Cru Classé from the legendary Saint-Émilion appellation. Full-bodied with complex tannins. 750ml, best consumed 2025-2045.",
        "category": "Wine & Spirits",
        "production_date": "2020-09-15",
        "expiry_date": "2045-09-15",
        "batch_number": "BDX-VIN-2020-342",
        "manufacturing_location": "Bordeaux, France",
        "image_url": "/static/images/products/wine.jpg"
    },
    {
        "name": "Pharmaceutical Grade Vitamin D3",
        "description": "High-potency Vitamin D3 supplement. 5000 IU per capsule, 120 count. GMP certified, third-party tested for purity.",
        "category": "Pharmaceuticals",
        "production_date": "2025-09-01",
        "expiry_date": "2027-09-01",
        "batch_number": "VITD3-PH-2025-089",
        "manufacturing_location": "Basel, Switzerland",
        "image_url": "/static/images/products/vitamins.jpg"
    },
    {
        "name": "Designer Leather Handbag - Milano Collection",
        "description": "Authentic Italian leather handbag from the Milano Spring 2025 collection. Hand-stitched, brass hardware, dust bag included.",
        "category": "Fashion",
        "production_date": "2025-10-05",
        "batch_number": "MIL-BAG-2025-127",
        "manufacturing_location": "Milan, Italy",
        "image_url": "/static/images/products/handbag.jpg"
    }
]

# Shipment Scenarios covering different use cases
DEMO_SHIPMENTS = [
    # Scenario 1: Complete journey - Delivered & Confirmed (Success Story)
    {
        "receiver_name": "John Customer",
        "receiver_email": "consumer@chaintrack.io",
        "receiver_phone": "+234 812 345 6789",
        "description": "Premium Swiss Watch - Chronograph Edition",
        "package_type": "Luxury Goods",
        "weight": "0.3kg",
        "dimensions": "15x15x10cm",
        "declared_value": 2500000.00,
        "pickup_address": "ChainTrack Demo Manufacturing, 123 Innovation Drive",
        "pickup_city": "Lagos",
        "delivery_address": "45 Crescent Street, Lekki Phase 1",
        "delivery_city": "Lagos",
        "special_instructions": "Handle with extreme care. Signature required. Insurance: ₦2.5M",
        "status": ShipmentStatus.CONFIRMED,
        "checkpoints": [
            {"action": CheckpointAction.CREATED, "location": "Lagos Factory", "handler": "Sender", "notes": "Package prepared for shipping", "hours_ago": 72},
            {"action": CheckpointAction.PICKED_UP, "location": "Ikeja Hub", "handler": "Mike Johnson", "notes": "Package collected, verified contents sealed", "hours_ago": 70},
            {"action": CheckpointAction.CHECKPOINT, "location": "Lagos Sorting Center", "handler": "Sorting Team", "notes": "Scanned and routed to Lekki hub", "hours_ago": 68},
            {"action": CheckpointAction.CHECKPOINT, "location": "Lekki Distribution Hub", "handler": "Hub Staff", "notes": "Package arrived, scheduled for delivery", "hours_ago": 48},
            {"action": CheckpointAction.OUT_FOR_DELIVERY, "location": "Lekki Phase 1", "handler": "Mike Johnson", "notes": "Out for final delivery", "hours_ago": 46},
            {"action": CheckpointAction.DELIVERED, "location": "45 Crescent Street", "handler": "Mike Johnson", "notes": "Delivered to recipient", "hours_ago": 45},
            {"action": CheckpointAction.CONFIRMED, "location": "Recipient Location", "handler": "John Customer", "notes": "Receipt confirmed with signature", "hours_ago": 44},
        ],
        "has_delivery_proof": True
    },
    
    # Scenario 2: Currently In Transit (Show live tracking)
    {
        "receiver_name": "Premium Retail Store",
        "receiver_email": "retailer@chaintrack.io",
        "receiver_phone": "+234 801 234 5678",
        "description": "Bulk Order - Colombian Coffee (20 bags)",
        "package_type": "Food & Beverages",
        "weight": "10kg",
        "dimensions": "60x40x30cm",
        "declared_value": 180000.00,
        "pickup_address": "Global Distribution Warehouse, Apapa",
        "pickup_city": "Lagos",
        "delivery_address": "Premium Retail, Victoria Island",
        "delivery_city": "Lagos",
        "special_instructions": "Keep dry. Fragile packaging.",
        "status": ShipmentStatus.IN_TRANSIT,
        "checkpoints": [
            {"action": CheckpointAction.CREATED, "location": "Apapa Warehouse", "handler": "Warehouse Staff", "notes": "Order packed and labeled", "hours_ago": 24},
            {"action": CheckpointAction.PICKED_UP, "location": "Apapa Hub", "handler": "DHL Express Nigeria", "notes": "Collected for delivery", "hours_ago": 22},
            {"action": CheckpointAction.CHECKPOINT, "location": "Lagos Mainland Hub", "handler": "DHL Sorting", "notes": "In transit to Island", "hours_ago": 18},
            {"action": CheckpointAction.CHECKPOINT, "location": "Third Mainland Bridge Checkpoint", "handler": "DHL Driver", "notes": "Crossed to Island, ETA 2 hours", "hours_ago": 2},
        ],
        "has_delivery_proof": False
    },
    
    # Scenario 3: Out for Delivery (Final Mile)
    {
        "receiver_name": "Ada Nwosu",
        "receiver_email": "ada.nwosu@email.com",
        "receiver_phone": "+234 815 678 9012",
        "description": "Designer Leather Handbag - Milano Collection",
        "package_type": "Fashion",
        "weight": "1.2kg",
        "dimensions": "35x25x15cm",
        "declared_value": 450000.00,
        "pickup_address": "Premium Retail, Victoria Island",
        "pickup_city": "Lagos",
        "delivery_address": "90 Residential Estate, Ikoyi",
        "delivery_city": "Lagos",
        "special_instructions": "Handle with care - designer item. Gift wrap included.",
        "status": ShipmentStatus.OUT_FOR_DELIVERY,
        "checkpoints": [
            {"action": CheckpointAction.CREATED, "location": "VI Store", "handler": "Store Staff", "notes": "Order prepared for dispatch", "hours_ago": 8},
            {"action": CheckpointAction.PICKED_UP, "location": "Victoria Island", "handler": "Sarah Okonkwo", "notes": "Package collected from store", "hours_ago": 6},
            {"action": CheckpointAction.OUT_FOR_DELIVERY, "location": "Ikoyi Area", "handler": "Sarah Okonkwo", "notes": "On route to delivery address", "hours_ago": 1},
        ],
        "has_delivery_proof": False
    },
    
    # Scenario 4: Delivered but Awaiting Confirmation
    {
        "receiver_name": "Emeka Obi",
        "receiver_email": "emeka.obi@example.com",
        "receiver_phone": "+234 809 012 3456",
        "description": "Pharmaceutical Grade Vitamin D3 (3 bottles)",
        "package_type": "Pharmaceuticals",
        "weight": "0.5kg",
        "dimensions": "20x15x10cm",
        "declared_value": 45000.00,
        "pickup_address": "MedSupply Pharmacy, Ikeja",
        "pickup_city": "Lagos",
        "delivery_address": "234 Unity Road, Festac",
        "delivery_city": "Lagos",
        "special_instructions": "Keep away from direct sunlight. Deliver within expiry window.",
        "status": ShipmentStatus.DELIVERED,
        "checkpoints": [
            {"action": CheckpointAction.CREATED, "location": "Ikeja Pharmacy", "handler": "Pharmacy Staff", "notes": "Order verified and packed", "hours_ago": 30},
            {"action": CheckpointAction.PICKED_UP, "location": "Ikeja", "handler": "Mike Johnson", "notes": "Collected with temperature check", "hours_ago": 28},
            {"action": CheckpointAction.CHECKPOINT, "location": "Oshodi Interchange", "handler": "Mike Johnson", "notes": "En route to Festac", "hours_ago": 26},
            {"action": CheckpointAction.DELIVERED, "location": "234 Unity Road", "handler": "Mike Johnson", "notes": "Delivered to gate. Security signed.", "hours_ago": 24},
        ],
        "has_delivery_proof": True
    },
    
    # Scenario 5: Just Created - Pending Pickup
    {
        "receiver_name": "Global Distribution Co",
        "receiver_email": "distributor@chaintrack.io",
        "receiver_phone": "+1 212 555 0100",
        "description": "Factory Order - Vintage Bordeaux Wine 2020 (Case of 12)",
        "package_type": "Wine & Spirits",
        "weight": "15kg",
        "dimensions": "50x35x30cm",
        "declared_value": 3600000.00,
        "pickup_address": "ChainTrack Demo Manufacturing, 123 Innovation Drive",
        "pickup_city": "Lagos",
        "delivery_address": "78 Warehouse Lane, Apapa",
        "delivery_city": "Lagos",
        "special_instructions": "FRAGILE - Wine. Keep upright. Temperature controlled required.",
        "status": ShipmentStatus.CREATED,
        "checkpoints": [
            {"action": CheckpointAction.CREATED, "location": "Lagos Factory", "handler": "Sender", "notes": "Awaiting courier pickup. Schedule: Tomorrow 9AM", "hours_ago": 2},
        ],
        "has_delivery_proof": False
    },
    
    # Scenario 6: International-style shipment with multiple handoffs
    {
        "receiver_name": "Luxury Boutique Paris",
        "receiver_email": "orders@luxuryboutique.fr",
        "receiver_phone": "+33 1 42 68 00 00",
        "description": "Premium Swiss Watch Collection (5 pieces)",
        "package_type": "Luxury Goods",
        "weight": "2kg",
        "dimensions": "40x30x20cm",
        "declared_value": 12500000.00,
        "pickup_address": "ChainTrack Demo Manufacturing, Geneva",
        "pickup_city": "Geneva",
        "delivery_address": "Avenue des Champs-Élysées, Paris",
        "delivery_city": "Paris",
        "special_instructions": "HIGH VALUE. Requires armed escort. Insurance: €75,000",
        "status": ShipmentStatus.IN_TRANSIT,
        "checkpoints": [
            {"action": CheckpointAction.CREATED, "location": "Geneva HQ", "handler": "Dispatch Team", "notes": "Collection prepared with security seal", "hours_ago": 96},
            {"action": CheckpointAction.PICKED_UP, "location": "Geneva Airport", "handler": "Swiss Secure Logistics", "notes": "Collected with armed guard", "hours_ago": 94},
            {"action": CheckpointAction.HANDED_OFF, "location": "Geneva Customs", "handler": "Customs Officer", "notes": "Export cleared, documentation verified", "hours_ago": 92},
            {"action": CheckpointAction.CHECKPOINT, "location": "Air France Cargo", "handler": "AF Cargo Handler", "notes": "Loaded on flight AF1234 to Paris", "hours_ago": 88},
            {"action": CheckpointAction.CHECKPOINT, "location": "Paris CDG Airport", "handler": "CDG Cargo", "notes": "Arrived Paris, awaiting customs", "hours_ago": 72},
            {"action": CheckpointAction.CHECKPOINT, "location": "Paris Customs", "handler": "French Customs", "notes": "Import duties paid, cleared for delivery", "hours_ago": 48},
        ],
        "has_delivery_proof": False
    },
    
    # Scenario 7: B2C E-commerce style
    {
        "receiver_name": "Chioma Eze",
        "receiver_email": "chioma.eze@gmail.com",
        "receiver_phone": "+234 802 555 7890",
        "description": "Organic Extra Virgin Olive Oil + Colombian Coffee Gift Set",
        "package_type": "Gift Set",
        "weight": "1.5kg",
        "dimensions": "30x25x15cm",
        "declared_value": 35000.00,
        "pickup_address": "Premium Retail, Victoria Island",
        "pickup_city": "Lagos",
        "delivery_address": "15 Palm Avenue, Magodo GRA",
        "delivery_city": "Lagos",
        "special_instructions": "Birthday gift - please include gift message card",
        "status": ShipmentStatus.PICKED_UP,
        "checkpoints": [
            {"action": CheckpointAction.CREATED, "location": "VI Store", "handler": "Store Staff", "notes": "Gift wrapped and ready", "hours_ago": 5},
            {"action": CheckpointAction.PICKED_UP, "location": "Victoria Island", "handler": "Sarah Okonkwo", "notes": "Collected from store. ETA: Today 4PM", "hours_ago": 3},
        ],
        "has_delivery_proof": False
    },
]

# Supply Chain Transfer Scenarios
TRANSFER_SCENARIOS = [
    # Swiss Watch: Full journey from Manufacturer -> Distributor -> Retailer -> Consumer
    {
        "product_index": 0,  # Swiss Watch
        "transfers": [
            {"to_role": UserRole.DISTRIBUTOR, "location": "Geneva Distribution Center", "notes": "Shipped via secure courier"},
            {"to_role": UserRole.RETAILER, "location": "Lagos Premium Retail", "notes": "Display unit for store"},
            {"to_role": UserRole.CONSUMER, "location": "Customer Purchase", "notes": "Sold to verified customer"},
        ]
    },
    # Coffee: Manufacturer -> Distributor -> Retailer
    {
        "product_index": 2,  # Colombian Coffee
        "transfers": [
            {"to_role": UserRole.DISTRIBUTOR, "location": "Import Warehouse Lagos", "notes": "Bulk shipment received"},
            {"to_role": UserRole.RETAILER, "location": "Premium Retail Store", "notes": "Retail distribution"},
        ]
    },
    # Wine: Manufacturer -> Distributor (in transit)
    {
        "product_index": 3,  # Bordeaux Wine
        "transfers": [
            {"to_role": UserRole.DISTRIBUTOR, "location": "Wine Cellar Storage", "notes": "Temperature controlled storage"},
        ]
    },
    # Vitamins: Manufacturer -> Retailer (direct)
    {
        "product_index": 4,  # Vitamins
        "transfers": [
            {"to_role": UserRole.RETAILER, "location": "MedSupply Pharmacy", "notes": "Direct pharmaceutical supply"},
        ]
    },
]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def generate_fake_tx_hash():
    """Generate a fake but realistic-looking Ethereum transaction hash"""
    return "0x" + hashlib.sha256(str(datetime.now().timestamp()).encode()).hexdigest()[:64]

def generate_fake_block_number():
    """Generate a realistic Sepolia block number"""
    return random.randint(7000000, 7500000)

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_success(message):
    print(f"  ✓ {message}")

def print_info(message):
    print(f"  ℹ {message}")

def print_error(message):
    print(f"  ✗ {message}")


# =============================================================================
# SEED FUNCTIONS
# =============================================================================

def clear_all_data():
    """Clear all existing demo data"""
    print_section("CLEARING EXISTING DATA")
    
    with app.app_context():
        # Order matters due to foreign keys
        DeliveryProof.query.delete()
        ShipmentCheckpoint.query.delete()
        CourierAuthorization.query.delete()
        Shipment.query.delete()
        Transfer.query.delete()
        Product.query.delete()
        CourierProfile.query.delete()
        User.query.delete()
        
        db.session.commit()
        print_success("All existing data cleared")


def seed_users():
    """Create demo users"""
    print_section("CREATING USERS")
    
    users = {}
    with app.app_context():
        for user_data in DEMO_USERS:
            existing = User.query.filter_by(email=user_data["email"]).first()
            if existing:
                print_info(f"User exists: {user_data['email']}")
                users[user_data["role"]] = existing
                continue
                
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                role=user_data["role"],
                company_name=user_data["company_name"],
                phone=user_data.get("phone"),
                is_verified=True,
                is_active=True
            )
            user.set_password(user_data["password"])
            db.session.add(user)
            print_success(f"Created: {user_data['email']} ({user_data['role'].value})")
            users[user_data["role"]] = user
        
        db.session.commit()
        
        # Reload users from DB
        for role in UserRole:
            user = User.query.filter_by(role=role).first()
            if user:
                users[role] = user
    
    return users


def seed_couriers():
    """Create demo courier accounts with profiles"""
    print_section("CREATING COURIERS")
    
    couriers = []
    with app.app_context():
        for courier_data in DEMO_COURIERS:
            # Check if courier profile exists by phone
            existing = CourierProfile.query.filter_by(phone=courier_data["phone"]).first()
            if existing:
                print_info(f"Courier exists: {courier_data['name']}")
                couriers.append(existing)
                continue
            
            # Create courier profile (phone-based auth, not user account)
            profile = CourierProfile(
                phone=courier_data["phone"],
                phone_verified=True,
                email=courier_data["email"],
                email_verified=True,
                display_name=courier_data["name"],
                company_name=courier_data["company_name"],
                vehicle_type=courier_data.get("vehicle_type", "motorcycle"),
                vehicle_plate=courier_data.get("license_number"),
                is_active=True,
                total_deliveries=random.randint(50, 200),
                successful_deliveries=random.randint(45, 195),
                average_rating=round(random.uniform(4.2, 4.9), 1),
                verified_since=datetime.utcnow() - timedelta(days=random.randint(30, 365))
            )
            db.session.add(profile)
            
            print_success(f"Created courier: {courier_data['name']} ({courier_data['company_name']})")
            couriers.append(profile)
        
        db.session.commit()
    
    return couriers


def seed_products(users):
    """Create demo products"""
    print_section("CREATING PRODUCTS")
    
    from app.services.qr_service import generate_qr_code
    
    products = []
    with app.app_context():
        manufacturer = User.query.filter_by(role=UserRole.MANUFACTURER).first()
        
        for product_data in DEMO_PRODUCTS:
            existing = Product.query.filter_by(batch_number=product_data["batch_number"]).first()
            if existing:
                # Generate QR code if missing
                if not existing.qr_code_url:
                    qr_url = f"http://localhost:5173/verify/{existing.product_id}"
                    existing.qr_code_url = generate_qr_code(existing.product_id, qr_url)
                    print_info(f"Generated QR for existing: {product_data['name'][:40]}...")
                else:
                    print_info(f"Product exists: {product_data['name'][:40]}...")
                products.append(existing)
                continue
            
            product = Product(
                product_id=Product.generate_product_id(product_data["name"], manufacturer.id),
                name=product_data["name"],
                description=product_data["description"],
                category=product_data.get("category"),
                batch_number=product_data["batch_number"],
                manufacturing_location=product_data.get("manufacturing_location", "Unknown"),
                production_date=datetime.strptime(product_data["production_date"], "%Y-%m-%d") if product_data.get("production_date") else datetime.now(),
                expiry_date=datetime.strptime(product_data["expiry_date"], "%Y-%m-%d") if product_data.get("expiry_date") else None,
                manufacturer_id=manufacturer.id,
                current_holder_id=manufacturer.id,
                blockchain_hash=generate_fake_tx_hash(),
                blockchain_block=generate_fake_block_number()
            )
            
            # Generate QR code for new product
            db.session.add(product)
            db.session.flush()  # Get ID before generating QR
            qr_url = f"http://localhost:5173/verify/{product.product_id}"
            product.qr_code_url = generate_qr_code(product.product_id, qr_url)
            
            print_success(f"Created: {product_data['name'][:50]}...")
            products.append(product)
        
        db.session.commit()
        
        # Reload from DB
        products = Product.query.all()
    
    return products


def seed_transfers(users, products):
    """Create demo transfers with blockchain records"""
    print_section("CREATING TRANSFERS")
    
    with app.app_context():
        manufacturer = User.query.filter_by(role=UserRole.MANUFACTURER).first()
        distributor = User.query.filter_by(role=UserRole.DISTRIBUTOR).first()
        retailer = User.query.filter_by(role=UserRole.RETAILER).first()
        consumer = User.query.filter_by(role=UserRole.CONSUMER).first()
        
        role_to_user = {
            UserRole.MANUFACTURER: manufacturer,
            UserRole.DISTRIBUTOR: distributor,
            UserRole.RETAILER: retailer,
            UserRole.CONSUMER: consumer,
        }
        
        products = Product.query.all()
        
        for scenario in TRANSFER_SCENARIOS:
            product = products[scenario["product_index"]]
            current_owner = manufacturer
            
            for i, transfer_data in enumerate(scenario["transfers"]):
                to_user = role_to_user[transfer_data["to_role"]]
                
                # Check if transfer already exists
                existing = Transfer.query.filter_by(
                    product_id=product.id,
                    from_user_id=current_owner.id,
                    to_user_id=to_user.id
                ).first()
                
                if existing:
                    print_info(f"Transfer exists: {product.name[:30]} -> {to_user.name}")
                    current_owner = to_user
                    continue
                
                transfer = Transfer(
                    product_id=product.id,
                    from_user_id=current_owner.id,
                    to_user_id=to_user.id,
                    transfer_type=TransferType.SHIPPED,
                    location=transfer_data.get("location", "Unknown"),
                    notes=transfer_data.get("notes"),
                    is_confirmed=True,
                    blockchain_hash=generate_fake_tx_hash(),
                    blockchain_block=generate_fake_block_number(),
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
                )
                db.session.add(transfer)
                
                # Update product holder
                product.current_holder_id = to_user.id
                
                print_success(f"Transfer: {product.name[:25]}... ({current_owner.name[:15]} → {to_user.name[:15]})")
                current_owner = to_user
        
        db.session.commit()


def seed_shipments(users, couriers):
    """Create demo shipments with various statuses"""
    print_section("CREATING SHIPMENTS")
    
    with app.app_context():
        manufacturer = User.query.filter_by(role=UserRole.MANUFACTURER).first()
        distributor = User.query.filter_by(role=UserRole.DISTRIBUTOR).first()
        retailer = User.query.filter_by(role=UserRole.RETAILER).first()
        
        # Map sender based on shipment scenario
        senders = [manufacturer, distributor, retailer, retailer, manufacturer, manufacturer, retailer]
        
        courier_profiles = CourierProfile.query.all()
        
        for i, shipment_data in enumerate(DEMO_SHIPMENTS):
            # Check if similar shipment exists
            existing = Shipment.query.filter_by(
                receiver_name=shipment_data["receiver_name"],
                description=shipment_data["description"]
            ).first()
            
            if existing:
                print_info(f"Shipment exists: {shipment_data['description'][:40]}...")
                continue
            
            sender = senders[i % len(senders)]
            
            shipment = Shipment(
                sender_id=sender.id,
                receiver_name=shipment_data["receiver_name"],
                receiver_email=shipment_data.get("receiver_email"),
                receiver_phone=shipment_data.get("receiver_phone"),
                description=shipment_data["description"],
                package_type=shipment_data.get("package_type"),
                weight=shipment_data.get("weight"),
                dimensions=shipment_data.get("dimensions"),
                declared_value=shipment_data.get("declared_value"),
                pickup_address=shipment_data["pickup_address"],
                pickup_city=shipment_data.get("pickup_city"),
                delivery_address=shipment_data["delivery_address"],
                delivery_city=shipment_data.get("delivery_city"),
                special_instructions=shipment_data.get("special_instructions"),
                status=shipment_data["status"],
                blockchain_hash=generate_fake_tx_hash(),
                blockchain_block=generate_fake_block_number(),
                created_at=datetime.utcnow() - timedelta(hours=shipment_data["checkpoints"][0]["hours_ago"] if shipment_data["checkpoints"] else 1)
            )
            db.session.add(shipment)
            db.session.flush()  # Get shipment ID
            
            # Create checkpoints
            for cp_data in shipment_data["checkpoints"]:
                checkpoint = ShipmentCheckpoint(
                    shipment_id=shipment.id,
                    action=cp_data["action"],
                    location=cp_data["location"],
                    handler_name=cp_data["handler"],
                    notes=cp_data.get("notes"),
                    blockchain_hash=generate_fake_tx_hash(),
                    timestamp=datetime.utcnow() - timedelta(hours=cp_data["hours_ago"])
                )
                db.session.add(checkpoint)
            
            # Create delivery proof if delivered
            if shipment_data.get("has_delivery_proof") and shipment_data["status"] in [ShipmentStatus.DELIVERED, ShipmentStatus.CONFIRMED]:
                proof = DeliveryProof(
                    shipment_id=shipment.id,
                    receiver_name=shipment_data["receiver_name"],
                    signature_data="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",  # Placeholder
                    photo_url="/static/images/delivery-proof-placeholder.jpg",
                    condition_notes="Package received in good condition",
                    confirmed_at=datetime.utcnow() - timedelta(hours=shipment_data["checkpoints"][-1]["hours_ago"] if shipment_data["checkpoints"] else 0)
                )
                db.session.add(proof)
            
            # Create courier authorization for active shipments
            if shipment_data["status"] not in [ShipmentStatus.CREATED, ShipmentStatus.CONFIRMED]:
                courier = random.choice(courier_profiles) if courier_profiles else None
                if courier:
                    auth = CourierAuthorization(
                        shipment_id=shipment.id,
                        authorized_by_id=sender.id,
                        courier_name=courier.display_name,
                        courier_phone=courier.phone,
                        can_pickup=True,
                        can_checkpoint=True,
                        can_deliver=True,
                        can_handoff=True,
                        is_active=True,
                        activated_at=datetime.utcnow() - timedelta(hours=shipment_data["checkpoints"][1]["hours_ago"] if len(shipment_data["checkpoints"]) > 1 else 1)
                    )
                    db.session.add(auth)
            
            print_success(f"Created: {shipment_data['description'][:45]}... [{shipment_data['status'].value}]")
        
        db.session.commit()


def print_demo_summary():
    """Print summary of created demo data"""
    print_section("DEMO DATA SUMMARY")
    
    with app.app_context():
        print(f"""
  Users:     {User.query.count()} accounts
  Couriers:  {CourierProfile.query.count()} profiles  
  Products:  {Product.query.count()} items
  Transfers: {Transfer.query.count()} records
  Shipments: {Shipment.query.count()} packages
  
  ─────────────────────────────────────────────────
  
  🔐 LOGIN CREDENTIALS (all use same password)
  
  Password: {DEMO_PASSWORD}
  
  Supply Chain Users:
    • manufacturer@chaintrack.io (Manufacturer)
    • distributor@chaintrack.io  (Distributor)
    • retailer@chaintrack.io     (Retailer)
    • consumer@chaintrack.io     (Consumer)
    • admin@chaintrack.io        (Admin)
  
  Courier Accounts:
    • courier.mike@chaintrack.io  (Express Logistics)
    • courier.sarah@chaintrack.io (Swift Deliveries)
    • courier.dhl@chaintrack.io   (DHL Express)
  
  ─────────────────────────────────────────────────
  
  📦 SHIPMENT SCENARIOS FOR DEMO:
  
  1. DELIVERED & CONFIRMED - Swiss Watch (complete journey)
  2. IN TRANSIT - Coffee bulk order (show live tracking)
  3. OUT FOR DELIVERY - Designer handbag (final mile)
  4. DELIVERED AWAITING CONFIRM - Vitamins
  5. PENDING PICKUP - Wine case (newly created)
  6. INTERNATIONAL - Watch collection (multiple handoffs)
  7. E-COMMERCE - Gift set (B2C flow)
  
  ─────────────────────────────────────────────────
        """)


# =============================================================================
# MAIN EXECUTION
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description='ChainTrack Demo Data Seeder v3')
    parser.add_argument('--reset', action='store_true', help='Clear all data before seeding')
    parser.add_argument('--section', choices=['all', 'users', 'products', 'shipments', 'couriers'], 
                       default='all', help='Section to seed')
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("  ChainTrack Demo Data Seeder v3.0")
    print("="*60)
    
    with app.app_context():
        if args.reset:
            clear_all_data()
        
        if args.section in ['all', 'users']:
            users = seed_users()
        else:
            users = {role: User.query.filter_by(role=role).first() for role in UserRole}
        
        if args.section in ['all', 'couriers']:
            couriers = seed_couriers()
        else:
            couriers = User.query.filter(User.email.like('courier.%')).all()
        
        if args.section in ['all', 'products']:
            products = seed_products(users)
            seed_transfers(users, products)
        
        if args.section in ['all', 'shipments']:
            seed_shipments(users, couriers)
        
        print_demo_summary()
    
    print("\n✅ Demo data seeding complete!\n")


if __name__ == "__main__":
    main()
