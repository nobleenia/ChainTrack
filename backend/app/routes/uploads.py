"""
Upload Routes for ChainTrack
Handles file uploads to IPFS via Pinata
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.pinata_service import pinata_service

uploads_bp = Blueprint('uploads', __name__)


@uploads_bp.route('/status', methods=['GET'])
def upload_status():
    """Check if upload service is available"""
    is_configured = pinata_service.is_configured
    
    if is_configured:
        success, message = pinata_service.test_authentication()
        return jsonify({
            "configured": True,
            "authenticated": success,
            "message": message
        }), 200 if success else 503
    
    return jsonify({
        "configured": False,
        "authenticated": False,
        "message": "Pinata credentials not configured. Photos will be stored locally."
    }), 200


@uploads_bp.route('/image', methods=['POST'])
@jwt_required()
def upload_image():
    """
    Upload an image to IPFS
    
    Accepts either:
    - multipart/form-data with 'file' field
    - JSON with 'image' field containing base64 data
    
    Returns:
        JSON with ipfs_hash and url on success
    """
    current_user_id = get_jwt_identity()
    
    # Check if service is configured
    if not pinata_service.is_configured:
        return jsonify({
            "error": "Upload service not configured",
            "message": "Please configure Pinata credentials"
        }), 503
    
    # Handle multipart file upload
    if 'file' in request.files:
        file = request.files['file']
        name = request.form.get('name', None)
        
        # Get optional metadata
        metadata = {
            "uploaded_by": str(current_user_id),
            "purpose": request.form.get('purpose', 'general')
        }
        
        if request.form.get('shipment_id'):
            metadata['shipment_id'] = request.form.get('shipment_id')
        if request.form.get('checkpoint_type'):
            metadata['checkpoint_type'] = request.form.get('checkpoint_type')
        
        success, result = pinata_service.upload_file(file, name=name, metadata=metadata)
        
        if success:
            return jsonify({
                "success": True,
                "ipfs_hash": result['ipfs_hash'],
                "url": result['url'],
                "filename": result['filename'],
                "size": result.get('size')
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": result.get('error', 'Upload failed')
            }), 400
    
    # Handle base64 upload
    data = request.get_json()
    if data and 'image' in data:
        base64_data = data['image']
        filename = data.get('filename', 'image.png')
        name = data.get('name', None)
        
        metadata = {
            "uploaded_by": str(current_user_id),
            "purpose": data.get('purpose', 'general')
        }
        
        if data.get('shipment_id'):
            metadata['shipment_id'] = data.get('shipment_id')
        if data.get('checkpoint_type'):
            metadata['checkpoint_type'] = data.get('checkpoint_type')
        
        success, result = pinata_service.upload_base64(
            base64_data,
            filename=filename,
            name=name,
            metadata=metadata
        )
        
        if success:
            return jsonify({
                "success": True,
                "ipfs_hash": result['ipfs_hash'],
                "url": result['url'],
                "filename": result['filename'],
                "size": result.get('size')
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": result.get('error', 'Upload failed')
            }), 400
    
    return jsonify({
        "error": "No file or image data provided",
        "message": "Send either a file via multipart/form-data or JSON with base64 'image' field"
    }), 400


@uploads_bp.route('/signature', methods=['POST'])
@jwt_required()
def upload_signature():
    """
    Upload a signature image (from canvas) to IPFS
    
    Expects JSON with:
    - signature: base64-encoded signature image
    - shipment_id: ID of the shipment this signature is for
    
    Returns:
        JSON with ipfs_hash and url on success
    """
    current_user_id = get_jwt_identity()
    
    if not pinata_service.is_configured:
        return jsonify({
            "error": "Upload service not configured"
        }), 503
    
    data = request.get_json()
    if not data or 'signature' not in data:
        return jsonify({
            "error": "No signature data provided"
        }), 400
    
    shipment_id = data.get('shipment_id', 'unknown')
    
    metadata = {
        "uploaded_by": str(current_user_id),
        "purpose": "delivery_signature",
        "shipment_id": str(shipment_id)
    }
    
    success, result = pinata_service.upload_base64(
        data['signature'],
        filename=f"signature_{shipment_id}.png",
        name=f"ChainTrack Signature - Shipment {shipment_id}",
        metadata=metadata
    )
    
    if success:
        return jsonify({
            "success": True,
            "ipfs_hash": result['ipfs_hash'],
            "url": result['url'],
            "filename": result['filename']
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": result.get('error', 'Upload failed')
        }), 400


@uploads_bp.route('/delivery-proof', methods=['POST'])
@jwt_required()
def upload_delivery_proof():
    """
    Upload delivery proof (photo + optional signature) to IPFS
    
    Expects multipart/form-data with:
    - photo: The delivery photo file
    - signature (optional): base64-encoded signature
    - shipment_id: ID of the shipment
    - recipient_name: Name of person receiving
    
    Returns:
        JSON with photo_url and optional signature_url
    """
    current_user_id = get_jwt_identity()
    
    if not pinata_service.is_configured:
        return jsonify({
            "error": "Upload service not configured"
        }), 503
    
    shipment_id = request.form.get('shipment_id', 'unknown')
    recipient_name = request.form.get('recipient_name', 'unknown')
    
    result = {
        "success": True,
        "photo_url": None,
        "photo_ipfs_hash": None,
        "signature_url": None,
        "signature_ipfs_hash": None
    }
    
    # Upload photo if provided
    if 'photo' in request.files:
        file = request.files['photo']
        metadata = {
            "uploaded_by": str(current_user_id),
            "purpose": "delivery_proof_photo",
            "shipment_id": str(shipment_id),
            "recipient_name": recipient_name
        }
        
        success, photo_result = pinata_service.upload_file(
            file,
            name=f"ChainTrack Delivery Photo - Shipment {shipment_id}",
            metadata=metadata
        )
        
        if success:
            result["photo_url"] = photo_result['url']
            result["photo_ipfs_hash"] = photo_result['ipfs_hash']
        else:
            return jsonify({
                "success": False,
                "error": f"Photo upload failed: {photo_result.get('error')}"
            }), 400
    
    # Upload signature if provided
    signature_data = request.form.get('signature')
    if signature_data:
        metadata = {
            "uploaded_by": str(current_user_id),
            "purpose": "delivery_signature",
            "shipment_id": str(shipment_id),
            "recipient_name": recipient_name
        }
        
        success, sig_result = pinata_service.upload_base64(
            signature_data,
            filename=f"signature_{shipment_id}.png",
            name=f"ChainTrack Signature - Shipment {shipment_id}",
            metadata=metadata
        )
        
        if success:
            result["signature_url"] = sig_result['url']
            result["signature_ipfs_hash"] = sig_result['ipfs_hash']
        else:
            # Don't fail if only signature fails
            current_app.logger.warning(f"Signature upload failed: {sig_result.get('error')}")
    
    return jsonify(result), 200


@uploads_bp.route('/json', methods=['POST'])
@jwt_required()
def upload_json():
    """
    Upload JSON data to IPFS (for shipment records, proofs, etc.)
    
    Expects JSON with:
    - data: The JSON object to upload
    - name: Name for the pin
    
    Returns:
        JSON with ipfs_hash and url on success
    """
    current_user_id = get_jwt_identity()
    
    if not pinata_service.is_configured:
        return jsonify({
            "error": "Upload service not configured"
        }), 503
    
    request_data = request.get_json()
    if not request_data or 'data' not in request_data:
        return jsonify({
            "error": "No data provided"
        }), 400
    
    json_data = request_data['data']
    name = request_data.get('name', 'chaintrack_data')
    
    metadata = {
        "uploaded_by": str(current_user_id),
        "purpose": request_data.get('purpose', 'data_record')
    }
    
    success, result = pinata_service.upload_json(json_data, name=name, metadata=metadata)
    
    if success:
        return jsonify({
            "success": True,
            "ipfs_hash": result['ipfs_hash'],
            "url": result['url']
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": result.get('error', 'Upload failed')
        }), 400
