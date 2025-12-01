"""
QR Code Service
Generate and manage QR codes for products
"""

import os
import qrcode
from io import BytesIO
import base64


def generate_qr_code(product_id: str, verification_url: str) -> str:
    """
    Generate a QR code for a product
    
    Args:
        product_id: Unique product identifier
        verification_url: URL that the QR code should link to
    
    Returns:
        Base64 encoded PNG image string
    """
    # Create QR code instance
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    
    # Add data
    qr.add_data(verification_url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{img_base64}"


def generate_qr_code_file(product_id: str, verification_url: str, output_dir: str) -> str:
    """
    Generate a QR code and save to file
    
    Args:
        product_id: Unique product identifier
        verification_url: URL that the QR code should link to
        output_dir: Directory to save the QR code image
    
    Returns:
        Path to the saved QR code image
    """
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Create QR code instance
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    
    # Add data
    qr.add_data(verification_url)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to file
    filename = f"{product_id}_qr.png"
    filepath = os.path.join(output_dir, filename)
    img.save(filepath)
    
    return filepath
