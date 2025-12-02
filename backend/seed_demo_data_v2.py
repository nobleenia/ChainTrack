#!/usr/bin/env python3
"""
Enhanced Demo Data Seed Script v2
Creates sample users, products with complete supply chain journey,
and transfers registered on the blockchain.
"""

import requests
import json
import time
from datetime import datetime, timedelta

API_URL = "http://127.0.0.1:5000/api"

# Demo Users (including consumer)
DEMO_USERS = [
    {
        "email": "manufacturer@chaintrack.io",
        "password": "ChainTrack2025!",
        "name": "Alex Manufacturing",
        "role": "manufacturer",
        "company_name": "ChainTrack Demo Manufacturing"
    },
    {
        "email": "distributor@chaintrack.io",
        "password": "ChainTrack2025!",
        "name": "Global Distribution Co",
        "role": "distributor",
        "company_name": "ChainTrack Demo Distributors"
    },
    {
        "email": "retailer@chaintrack.io",
        "password": "ChainTrack2025!",
        "name": "Premium Retail Store",
        "role": "retailer",
        "company_name": "ChainTrack Demo Retail"
    },
    {
        "email": "consumer@chaintrack.io",
        "password": "ChainTrack2025!",
        "name": "John Customer",
        "role": "consumer",
        "company_name": None
    }
]

# Products for complete supply chain demo
DEMO_PRODUCTS = [
    {
        "name": "Premium Swiss Watch - Chronograph Edition",
        "description": "Handcrafted Swiss mechanical watch with sapphire crystal and genuine leather strap. Serial: SWC-2025-001",
        "category": "Luxury Goods",
        "production_date": "2025-11-15",
        "batch_number": "SWISS-WATCH-2025-001",
        "manufacturing_location": "Geneva, Switzerland"
    },
    {
        "name": "Organic Extra Virgin Olive Oil",
        "description": "Cold-pressed organic olive oil from certified Italian farms. 500ml bottle.",
        "category": "Food & Beverages",
        "production_date": "2025-10-20",
        "expiry_date": "2027-10-20",
        "batch_number": "EVOO-IT-2025-042",
        "manufacturing_location": "Tuscany, Italy"
    },
    {
        "name": "Colombian Single Origin Coffee",
        "description": "Premium Arabica beans from the highlands of Colombia. Medium roast, 500g bag.",
        "category": "Food & Beverages",
        "production_date": "2025-11-01",
        "expiry_date": "2026-05-01",
        "batch_number": "COL-COF-2025-187",
        "manufacturing_location": "Huila, Colombia"
    },
    {
        "name": "Vintage Bordeaux Wine 2020",
        "description": "Grand Cru Classé from the legendary Saint-Émilion appellation. 750ml.",
        "category": "Food & Beverages",
        "production_date": "2020-09-15",
        "expiry_date": "2045-09-15",
        "batch_number": "BDX-VIN-2020-342",
        "manufacturing_location": "Bordeaux, France"
    },
    {
        "name": "Pharmaceutical Grade Vitamin D3",
        "description": "High-potency Vitamin D3 supplement. 5000 IU per capsule, 120 count.",
        "category": "Pharmaceuticals",
        "production_date": "2025-09-01",
        "expiry_date": "2027-09-01",
        "batch_number": "VITD3-PH-2025-089",
        "manufacturing_location": "Basel, Switzerland"
    }
]

# Transfer scenarios
TRANSFER_SCENARIOS = [
    {
        "product_index": 0,  # Swiss Watch
        "transfers": [
            {"to_role": "distributor", "type": "shipped", "location": "Zurich Distribution Center, Switzerland"},
            {"to_role": "retailer", "type": "shipped", "location": "Premium Watch Store, New York, USA"},
        ]
    },
    {
        "product_index": 1,  # Olive Oil
        "transfers": [
            {"to_role": "distributor", "type": "shipped", "location": "Mediterranean Foods Hub, Milan, Italy"},
            {"to_role": "retailer", "type": "delivered", "location": "Organic Grocers, London, UK"},
        ]
    },
    {
        "product_index": 2,  # Coffee
        "transfers": [
            {"to_role": "distributor", "type": "shipped", "location": "Global Coffee Distribution, Miami, USA"},
        ]
    }
]


def register_user(user_data):
    """Register a new user"""
    response = requests.post(f"{API_URL}/auth/register", json=user_data)
    if response.status_code == 201:
        print(f"✅ Registered user: {user_data['email']} ({user_data['role']})")
        return response.json()
    elif response.status_code == 409:
        print(f"ℹ️  User already exists: {user_data['email']}")
        return login_user(user_data['email'], user_data['password'])
    else:
        print(f"❌ Failed to register {user_data['email']}: {response.json()}")
        return None


def login_user(email, password):
    """Login and get token"""
    response = requests.post(f"{API_URL}/auth/login", json={
        "email": email,
        "password": password
    })
    if response.status_code == 200:
        print(f"✅ Logged in as: {email}")
        return response.json()
    else:
        print(f"❌ Failed to login {email}: {response.json()}")
        return None


def get_user_id(token):
    """Get user ID from token"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/auth/me", headers=headers)
    if response.status_code == 200:
        return response.json()['user']['id']
    return None


def create_product(token, product_data):
    """Create a new product"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{API_URL}/products", json=product_data, headers=headers)
    if response.status_code == 201:
        product = response.json()['product']
        print(f"✅ Created product: {product['name']}")
        print(f"   Product ID: {product['product_id']}")
        print(f"   Blockchain TX: {product['blockchain_hash'][:30]}...")
        return product
    else:
        print(f"❌ Failed to create product: {response.json()}")
        return None


def create_transfer(token, transfer_data):
    """Create a product transfer"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{API_URL}/transfers", json=transfer_data, headers=headers)
    if response.status_code == 201:
        transfer = response.json()['transfer']
        print(f"   ✅ Transfer created: {transfer['transfer_type']} → {transfer['location']}")
        print(f"      Blockchain TX: {transfer.get('blockchain_hash', 'N/A')[:30]}...")
        return transfer
    else:
        print(f"   ❌ Transfer failed: {response.json()}")
        return None


def get_products(token):
    """Get all products"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/products", headers=headers)
    if response.status_code == 200:
        return response.json()['products']
    return []


def verify_product(product_id):
    """Verify a product (public endpoint)"""
    response = requests.get(f"{API_URL}/verify/{product_id}")
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Verified: {product_id}")
        print(f"   Status: {'AUTHENTIC' if result['verified'] else 'NOT FOUND'}")
        print(f"   Journey: {len(result.get('journey', []))} events")
        return result
    else:
        print(f"❌ Verification failed for {product_id}")
        return None


def main():
    print("=" * 70)
    print("🚀 ChainTrack Demo Data Seeder v2 - Enhanced with Transfers")
    print("=" * 70)
    print()

    # Step 1: Register/login all users
    print("📋 Step 1: Setting up demo users...")
    print("-" * 50)
    
    user_data = {}
    for user in DEMO_USERS:
        result = register_user(user)
        if result:
            token = result.get('access_token')
            user_id = get_user_id(token) if token else None
            user_data[user['role']] = {
                'token': token,
                'id': user_id,
                'email': user['email']
            }
    
    print()
    
    # Step 2: Create products as manufacturer
    print("📦 Step 2: Creating demo products...")
    print("-" * 50)
    
    created_products = []
    if user_data.get('manufacturer', {}).get('token'):
        manufacturer_token = user_data['manufacturer']['token']
        for product in DEMO_PRODUCTS:
            time.sleep(0.5)  # Delay between blockchain transactions
            result = create_product(manufacturer_token, product)
            if result:
                created_products.append(result)
    
    print()
    
    # Step 3: Create transfers to simulate supply chain movement
    print("🔄 Step 3: Creating blockchain-registered transfers...")
    print("-" * 50)
    
    for scenario in TRANSFER_SCENARIOS:
        product_idx = scenario['product_index']
        if product_idx < len(created_products):
            product = created_products[product_idx]
            print(f"\n   📦 {product['name'][:40]}...")
            
            # Current holder starts as manufacturer
            current_holder_token = user_data['manufacturer']['token']
            
            for transfer in scenario['transfers']:
                to_role = transfer['to_role']
                to_user = user_data.get(to_role)
                
                if to_user and to_user.get('id'):
                    transfer_data = {
                        'product_id': product['product_id'],
                        'to_user_id': to_user['id'],
                        'transfer_type': transfer['type'],
                        'location': transfer['location'],
                        'notes': f"Demo transfer to {to_role}"
                    }
                    
                    result = create_transfer(current_holder_token, transfer_data)
                    if result:
                        # Update current holder for next transfer
                        current_holder_token = to_user['token']
                        time.sleep(0.5)
    
    print()
    
    # Step 4: Verify products to show complete journey
    print("🔍 Step 4: Verifying products (simulating consumer scan)...")
    print("-" * 50)
    
    product_ids_for_consumer = []
    for product in created_products[:3]:
        result = verify_product(product['product_id'])
        if result:
            product_ids_for_consumer.append(product['product_id'])
        print()
    
    # Print summary
    print("=" * 70)
    print("✅ Demo Data Seeding Complete!")
    print("=" * 70)
    print()
    print("🔑 Demo Login Credentials:")
    print("-" * 50)
    print("Manufacturer: manufacturer@chaintrack.io / ChainTrack2025!")
    print("Distributor:  distributor@chaintrack.io / ChainTrack2025!")
    print("Retailer:     retailer@chaintrack.io / ChainTrack2025!")
    print("Consumer:     consumer@chaintrack.io / ChainTrack2025!")
    print()
    print("📦 Products for Consumer Verification Testing:")
    print("-" * 50)
    for pid in product_ids_for_consumer:
        print(f"   • {pid}")
    print()
    print("💡 Consumer Demo Flow:")
    print("-" * 50)
    print("1. Login as consumer@chaintrack.io")
    print("2. Go to Verify page from navigation")
    print("3. Enter one of the product IDs above")
    print("4. View complete product journey with blockchain verification")
    print()
    print("🌐 Access the app at: http://localhost:5174")
    print("=" * 70)


if __name__ == "__main__":
    main()
