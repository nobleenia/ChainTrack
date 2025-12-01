#!/usr/bin/env python3
"""
Demo Data Seed Script
Creates sample users and products for investor demonstration
"""

import requests
import json
import time

API_URL = "http://127.0.0.1:5000/api"

# Demo Users
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
    }
]

# Demo Products (will be created by manufacturer)
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


def register_user(user_data):
    """Register a new user"""
    response = requests.post(f"{API_URL}/auth/register", json=user_data)
    if response.status_code == 201:
        print(f"✅ Registered user: {user_data['email']}")
        return response.json()
    elif response.status_code == 409:
        print(f"ℹ️  User already exists: {user_data['email']}")
        # Try to login instead
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


def create_product(token, product_data):
    """Create a new product"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{API_URL}/products", json=product_data, headers=headers)
    if response.status_code == 201:
        product = response.json()['product']
        print(f"✅ Created product: {product['name']}")
        print(f"   Product ID: {product['product_id']}")
        print(f"   Blockchain: {product['blockchain_hash'][:20]}...")
        return product
    else:
        print(f"❌ Failed to create product: {response.json()}")
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
        print(f"✅ Verified product: {product_id}")
        print(f"   Status: {'AUTHENTIC' if result['verified'] else 'NOT FOUND'}")
        print(f"   Manufacturer: {result['product']['manufacturer']['company']}")
        print(f"   Blockchain TX: {result['blockchain']['transaction_hash'][:20]}...")
        return result
    else:
        print(f"❌ Verification failed for {product_id}")
        return None


def main():
    print("=" * 60)
    print("🚀 ChainTrack Demo Data Seeder")
    print("=" * 60)
    print()

    # Register/login users
    print("📋 Setting up demo users...")
    print("-" * 40)
    
    tokens = {}
    for user in DEMO_USERS:
        result = register_user(user)
        if result:
            tokens[user['role']] = result.get('access_token')
    
    print()
    
    # Create products as manufacturer
    print("📦 Creating demo products...")
    print("-" * 40)
    
    if tokens.get('manufacturer'):
        created_products = []
        for product in DEMO_PRODUCTS:
            time.sleep(0.5)  # Small delay between blockchain transactions
            result = create_product(tokens['manufacturer'], product)
            if result:
                created_products.append(result)
        
        print()
        
        # Verify some products
        print("🔍 Verifying products...")
        print("-" * 40)
        
        for product in created_products[:3]:
            verify_product(product['product_id'])
            print()
    
    print("=" * 60)
    print("✅ Demo data seeding complete!")
    print()
    print("🔑 Demo Login Credentials:")
    print("-" * 40)
    print("Manufacturer: manufacturer@chaintrack.io / ChainTrack2025!")
    print("Distributor:  distributor@chaintrack.io / ChainTrack2025!")
    print("Retailer:     retailer@chaintrack.io / ChainTrack2025!")
    print()
    print("🌐 Access the app at: http://localhost:5174")
    print("=" * 60)


if __name__ == "__main__":
    main()
