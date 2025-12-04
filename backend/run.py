"""
ChainTrack Backend Entry Point
Run the Flask application
"""

import os
from app import create_app, db

# Create application with environment config
config_name = os.environ.get('FLASK_ENV', 'development')
app = create_app(config_name)


@app.cli.command('init-db')
def init_db():
    """Initialize the database with tables"""
    db.create_all()
    print('Database initialized.')


@app.cli.command('seed-demo')
def seed_demo():
    """Seed the database with demo data"""
    from app.models import User, Product, UserRole, ProductStatus
    from datetime import date, timedelta
    
    # Create demo users
    users_data = [
        {
            'email': 'manufacturer@demo.com',
            'name': 'Acme Electronics',
            'role': UserRole.MANUFACTURER,
            'company_name': 'Acme Electronics Inc.',
            'password': 'demo1234'
        },
        {
            'email': 'distributor@demo.com',
            'name': 'Global Distribution Co.',
            'role': UserRole.DISTRIBUTOR,
            'company_name': 'Global Distribution Co.',
            'password': 'demo1234'
        },
        {
            'email': 'retailer@demo.com',
            'name': 'TechMart Retail',
            'role': UserRole.RETAILER,
            'company_name': 'TechMart Retail LLC',
            'password': 'demo1234'
        },
        {
            'email': 'consumer@demo.com',
            'name': 'John Consumer',
            'role': UserRole.CONSUMER,
            'password': 'demo1234'
        }
    ]
    
    created_users = []
    for user_data in users_data:
        existing = User.query.filter_by(email=user_data['email']).first()
        if not existing:
            user = User(
                email=user_data['email'],
                name=user_data['name'],
                role=user_data['role'],
                company_name=user_data.get('company_name'),
                is_verified=True
            )
            user.set_password(user_data['password'])
            db.session.add(user)
            created_users.append(user)
    
    db.session.commit()
    
    # Get manufacturer
    manufacturer = User.query.filter_by(email='manufacturer@demo.com').first()
    
    # Create demo products
    products_data = [
        {
            'name': 'Widget Pro X',
            'description': 'Premium electronic widget with advanced features',
            'category': 'Electronics',
            'production_date': date.today() - timedelta(days=30),
            'manufacturing_location': 'Shenzhen, China',
            'status': ProductStatus.VERIFIED
        },
        {
            'name': 'Gadget Ultra',
            'description': 'Next-generation smart gadget',
            'category': 'Electronics',
            'production_date': date.today() - timedelta(days=15),
            'manufacturing_location': 'Tokyo, Japan',
            'status': ProductStatus.IN_TRANSIT
        },
        {
            'name': 'Device Max',
            'description': 'Maximum performance device',
            'category': 'Electronics',
            'production_date': date.today() - timedelta(days=7),
            'manufacturing_location': 'Seoul, South Korea',
            'status': ProductStatus.REGISTERED
        }
    ]
    
    for product_data in products_data:
        product_id = Product.generate_product_id(product_data['name'], manufacturer.id)
        existing = Product.query.filter_by(product_id=product_id).first()
        if not existing:
            product = Product(
                product_id=product_id,
                name=product_data['name'],
                description=product_data['description'],
                category=product_data['category'],
                production_date=product_data['production_date'],
                manufacturing_location=product_data['manufacturing_location'],
                current_location=product_data['manufacturing_location'],
                manufacturer_id=manufacturer.id,
                current_holder_id=manufacturer.id,
                status=product_data['status'],
                blockchain_hash=f"0x{'a' * 64}",
                verification_count=5
            )
            db.session.add(product)
    
    db.session.commit()
    print('Demo data seeded successfully.')


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
