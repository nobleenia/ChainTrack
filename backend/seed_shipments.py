"""
Seed Demo Shipments
Creates test shipments with various statuses for demo purposes
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import User, Shipment, ShipmentCheckpoint, DeliveryProof, ShipmentStatus, CheckpointAction
from app.services.shipment_service import ShipmentService
from datetime import datetime, timedelta
import random

app = create_app('development')

def seed_shipments():
    with app.app_context():
        # Get users
        manufacturer = User.query.filter_by(email='manufacturer@chaintrack.io').first()
        distributor = User.query.filter_by(email='distributor@chaintrack.io').first()
        retailer = User.query.filter_by(email='retailer@chaintrack.io').first()
        consumer = User.query.filter_by(email='consumer@chaintrack.io').first()
        
        if not all([manufacturer, distributor, retailer, consumer]):
            print("Error: Demo users not found. Run seed_demo_data.py first.")
            return
        
        # Check if shipments already exist
        existing = Shipment.query.count()
        if existing > 0:
            print(f"Found {existing} existing shipments. Skipping seed.")
            return
        
        print("Creating demo shipments...")
        
        shipments_data = [
            # Shipment 1: Manufacturer to Consumer - Delivered and Confirmed
            {
                'sender': manufacturer,
                'receiver_name': 'John Customer',
                'receiver_email': 'consumer@chaintrack.io',
                'receiver_phone': '+234 812 345 6789',
                'description': 'Electronics - Wireless Headphones',
                'pickup_address': '123 Factory Road, Ikeja Industrial',
                'pickup_city': 'Lagos',
                'delivery_address': '45 Crescent Street, Lekki Phase 1',
                'delivery_city': 'Lagos',
                'package_type': 'Electronics',
                'weight': '0.5',
                'declared_value': 25000.00,
                'status_flow': ['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'confirmed'],
                'checkpoints': [
                    {'action': 'picked_up', 'location': 'Ikeja Hub', 'handler_name': 'Courier Mike', 'notes': 'Package collected from sender'},
                    {'action': 'in_transit', 'location': 'Lagos Sorting Center', 'handler_name': 'Sorting Team', 'notes': 'Package sorted and dispatched'},
                    {'action': 'out_for_delivery', 'location': 'Lekki Delivery Hub', 'handler_name': 'Rider Tunde', 'notes': 'Out for final delivery'},
                ],
                'delivered': True,
                'confirmed': True
            },
            # Shipment 2: Distributor to Retailer - In Transit
            {
                'sender': distributor,
                'receiver_name': 'Sarah Retailer',
                'receiver_email': 'retailer@chaintrack.io',
                'receiver_phone': '+234 803 456 7890',
                'description': 'Bulk Order - Smartphone Cases (50 units)',
                'pickup_address': '78 Warehouse Lane, Apapa',
                'pickup_city': 'Lagos',
                'delivery_address': '12 Shop Plaza, Marina',
                'delivery_city': 'Lagos',
                'package_type': 'Retail Goods',
                'weight': '5.0',
                'declared_value': 150000.00,
                'status_flow': ['created', 'picked_up', 'in_transit'],
                'checkpoints': [
                    {'action': 'picked_up', 'location': 'Apapa Warehouse', 'handler_name': 'DHL Express', 'notes': 'Bulk shipment collected'},
                    {'action': 'in_transit', 'location': 'Mainland Hub', 'handler_name': 'Transit Team', 'notes': 'In transit to Island'},
                ],
                'delivered': False,
                'confirmed': False
            },
            # Shipment 3: Retailer to Consumer - Out for Delivery
            {
                'sender': retailer,
                'receiver_name': 'Ada Consumer',
                'receiver_email': '',
                'receiver_phone': '+234 815 678 9012',
                'description': 'Fashion Items - Designer Bag',
                'pickup_address': '12 Shop Plaza, Marina',
                'pickup_city': 'Lagos',
                'delivery_address': '90 Residential Estate, Victoria Island',
                'delivery_city': 'Lagos',
                'package_type': 'Fashion',
                'weight': '1.2',
                'declared_value': 85000.00,
                'fragile': True,
                'special_instructions': 'Handle with care - designer item',
                'status_flow': ['created', 'picked_up', 'out_for_delivery'],
                'checkpoints': [
                    {'action': 'picked_up', 'location': 'Marina Shop', 'handler_name': 'Gokada Rider', 'notes': 'Picked up from store'},
                    {'action': 'out_for_delivery', 'location': 'VI Area', 'handler_name': 'Gokada Rider', 'notes': 'Delivering now'},
                ],
                'delivered': False,
                'confirmed': False
            },
            # Shipment 4: Consumer to Consumer (P2P) - Delivered but not confirmed
            {
                'sender': consumer,
                'receiver_name': 'Emeka Friend',
                'receiver_email': 'emeka@example.com',
                'receiver_phone': '+234 809 012 3456',
                'description': 'Personal Item - Birthday Gift',
                'pickup_address': '45 Crescent Street, Lekki Phase 1',
                'pickup_city': 'Lagos',
                'delivery_address': '234 Unity Road, Festac',
                'delivery_city': 'Lagos',
                'package_type': 'Gift',
                'weight': '0.8',
                'declared_value': 15000.00,
                'special_instructions': 'Call before delivery',
                'status_flow': ['created', 'picked_up', 'in_transit', 'delivered'],
                'checkpoints': [
                    {'action': 'picked_up', 'location': 'Lekki', 'handler_name': 'Bolt Delivery', 'notes': 'Collected from sender'},
                    {'action': 'in_transit', 'location': 'Third Mainland Bridge', 'handler_name': 'Bolt Delivery', 'notes': 'On the way'},
                ],
                'delivered': True,
                'confirmed': False
            },
            # Shipment 5: Manufacturer to Distributor - Just Created
            {
                'sender': manufacturer,
                'receiver_name': 'Global Distributors Ltd',
                'receiver_email': 'distributor@chaintrack.io',
                'receiver_phone': '+234 801 234 5678',
                'description': 'Factory Order - Electronic Components',
                'pickup_address': '123 Factory Road, Ikeja Industrial',
                'pickup_city': 'Lagos',
                'delivery_address': '78 Warehouse Lane, Apapa',
                'delivery_city': 'Lagos',
                'package_type': 'Industrial',
                'weight': '25.0',
                'declared_value': 500000.00,
                'special_instructions': 'Requires forklift for unloading',
                'status_flow': ['created'],
                'checkpoints': [],
                'delivered': False,
                'confirmed': False
            },
            # Shipment 6: Inter-city - Abuja to Lagos - In Transit
            {
                'sender': distributor,
                'receiver_name': 'Lagos Branch',
                'receiver_email': 'lagos@chaintrack.io',
                'receiver_phone': '+234 802 345 6789',
                'description': 'Office Supplies Transfer',
                'pickup_address': '56 Central Business District',
                'pickup_city': 'Abuja',
                'delivery_address': '78 Warehouse Lane, Apapa',
                'delivery_city': 'Lagos',
                'package_type': 'Office Supplies',
                'weight': '15.0',
                'declared_value': 75000.00,
                'status_flow': ['created', 'picked_up', 'in_transit'],
                'checkpoints': [
                    {'action': 'picked_up', 'location': 'Abuja CBD', 'handler_name': 'ABC Transport', 'notes': 'Loaded on Lagos-bound truck'},
                    {'action': 'in_transit', 'location': 'Lokoja', 'handler_name': 'ABC Transport', 'notes': 'Checkpoint - continuing to Lagos'},
                ],
                'delivered': False,
                'confirmed': False
            },
        ]
        
        created_shipments = []
        
        for data in shipments_data:
            # Create shipment
            shipment = ShipmentService.create_shipment(
                sender_id=data['sender'].id,
                receiver_name=data['receiver_name'],
                receiver_email=data.get('receiver_email') or None,
                receiver_phone=data['receiver_phone'],
                description=data['description'],
                pickup_address=data['pickup_address'],
                pickup_city=data['pickup_city'],
                delivery_address=data['delivery_address'],
                delivery_city=data['delivery_city'],
                package_type=data.get('package_type'),
                weight=data.get('weight'),
                declared_value=data.get('declared_value'),
                special_instructions=data.get('special_instructions'),
                fragile=data.get('fragile', False)
            )
            
            print(f"  Created: {shipment.shipment_id} - {data['description'][:40]}...")
            print(f"    PIN: {shipment.tracking_pin}")
            
            # Add checkpoints
            for i, cp in enumerate(data['checkpoints']):
                checkpoint_time = datetime.utcnow() - timedelta(hours=len(data['checkpoints']) - i)
                checkpoint = ShipmentCheckpoint(
                    shipment_id=shipment.id,
                    action=CheckpointAction(cp['action']),
                    location=cp['location'],
                    handler_name=cp['handler_name'],
                    notes=cp.get('notes'),
                    created_at=checkpoint_time
                )
                db.session.add(checkpoint)
                
                # Update shipment status based on checkpoint
                shipment.status = ShipmentStatus(cp['action'])
            
            # Handle delivery
            if data['delivered']:
                delivery_proof = DeliveryProof(
                    shipment_id=shipment.id,
                    recipient_name=data['receiver_name'],
                    recipient_phone=data['receiver_phone'],
                    delivered_at=datetime.utcnow() - timedelta(hours=2),
                    delivery_notes='Package delivered successfully',
                    delivery_location=data['delivery_address']
                )
                db.session.add(delivery_proof)
                shipment.status = ShipmentStatus.delivered
                shipment.delivered_at = datetime.utcnow() - timedelta(hours=2)
                
                if data['confirmed']:
                    delivery_proof.confirmed_at = datetime.utcnow() - timedelta(hours=1)
                    delivery_proof.receiver_signature = 'data:image/png;base64,DEMO_SIGNATURE'
                    delivery_proof.confirmation_notes = 'Item received in good condition'
                    shipment.status = ShipmentStatus.confirmed
            
            db.session.commit()
            created_shipments.append({
                'id': shipment.shipment_id,
                'pin': shipment.tracking_pin,
                'status': shipment.status.value,
                'description': data['description'][:50]
            })
        
        print("\n" + "="*60)
        print("DEMO SHIPMENTS CREATED")
        print("="*60)
        print("\nUse these credentials to test:\n")
        print("Shipment ID          | PIN    | Status      | Description")
        print("-"*70)
        for s in created_shipments:
            print(f"{s['id']:20} | {s['pin']} | {s['status']:11} | {s['description']}")
        print("\n")
        print("Login as different users to see sent/received shipments:")
        print("  - manufacturer@chaintrack.io (sent 2 shipments)")
        print("  - distributor@chaintrack.io (sent 2 shipments)")
        print("  - retailer@chaintrack.io (sent 1 shipment)")
        print("  - consumer@chaintrack.io (sent 1 shipment)")
        print("\nPassword for all: ChainTrack2025!")


if __name__ == '__main__':
    seed_shipments()
