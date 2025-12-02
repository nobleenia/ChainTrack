"""
Pinata/IPFS Service for ChainTrack
Handles file uploads to IPFS via Pinata API for delivery proofs and shipment photos
"""

import os
import requests
import json
import hashlib
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from werkzeug.datastructures import FileStorage
import base64


class PinataService:
    """Service for interacting with Pinata IPFS API"""
    
    PINATA_API_URL = "https://api.pinata.cloud"
    PINATA_GATEWAY_URL = "https://gateway.pinata.cloud/ipfs"
    
    # Supported image types
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    def __init__(self):
        self.api_key = os.environ.get('PINATA_API_KEY')
        self.api_secret = os.environ.get('PINATA_API_SECRET')
        self.jwt = os.environ.get('PINATA_JWT')
        self.gateway_url = os.environ.get('PINATA_GATEWAY_URL', self.PINATA_GATEWAY_URL)
        
    @property
    def is_configured(self) -> bool:
        """Check if Pinata credentials are configured"""
        return bool(self.jwt) or (bool(self.api_key) and bool(self.api_secret))
    
    def _get_headers(self) -> Dict[str, str]:
        """Get authentication headers for Pinata API"""
        if self.jwt:
            return {
                "Authorization": f"Bearer {self.jwt}"
            }
        return {
            "pinata_api_key": self.api_key,
            "pinata_secret_api_key": self.api_secret
        }
    
    def _allowed_file(self, filename: str) -> bool:
        """Check if file extension is allowed"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS
    
    def _generate_filename(self, original_filename: str, prefix: str = "chaintrack") -> str:
        """Generate a unique filename for upload"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        ext = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else 'jpg'
        hash_suffix = hashlib.md5(f"{timestamp}{original_filename}".encode()).hexdigest()[:8]
        return f"{prefix}_{timestamp}_{hash_suffix}.{ext}"
    
    def test_authentication(self) -> Tuple[bool, str]:
        """Test if Pinata credentials are valid"""
        if not self.is_configured:
            return False, "Pinata credentials not configured"
        
        try:
            response = requests.get(
                f"{self.PINATA_API_URL}/data/testAuthentication",
                headers=self._get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                return True, "Authentication successful"
            else:
                return False, f"Authentication failed: {response.text}"
        except requests.RequestException as e:
            return False, f"Connection error: {str(e)}"
    
    def upload_file(
        self,
        file: FileStorage,
        name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Upload a file to IPFS via Pinata
        
        Args:
            file: The file to upload (werkzeug FileStorage object)
            name: Optional name for the pin
            metadata: Optional metadata to attach to the pin
            
        Returns:
            Tuple of (success: bool, result: dict with ipfs_hash, url, or error)
        """
        if not self.is_configured:
            return False, {"error": "Pinata service not configured"}
        
        # Validate file
        if not file or not file.filename:
            return False, {"error": "No file provided"}
        
        if not self._allowed_file(file.filename):
            return False, {"error": f"File type not allowed. Allowed types: {', '.join(self.ALLOWED_EXTENSIONS)}"}
        
        # Check file size
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Seek back to start
        
        if file_size > self.MAX_FILE_SIZE:
            return False, {"error": f"File too large. Maximum size: {self.MAX_FILE_SIZE / (1024*1024)}MB"}
        
        try:
            # Prepare filename
            filename = self._generate_filename(file.filename)
            
            # Prepare pinata options
            pinata_options = {
                "cidVersion": 1
            }
            
            # Prepare pinata metadata
            pinata_metadata = {
                "name": name or filename,
                "keyvalues": metadata or {}
            }
            
            # Add standard metadata
            pinata_metadata["keyvalues"]["uploaded_at"] = datetime.utcnow().isoformat()
            pinata_metadata["keyvalues"]["original_filename"] = file.filename
            pinata_metadata["keyvalues"]["app"] = "ChainTrack"
            
            # Prepare multipart form data
            files = {
                'file': (filename, file.stream, file.content_type or 'application/octet-stream')
            }
            
            data = {
                'pinataOptions': json.dumps(pinata_options),
                'pinataMetadata': json.dumps(pinata_metadata)
            }
            
            # Upload to Pinata
            response = requests.post(
                f"{self.PINATA_API_URL}/pinning/pinFileToIPFS",
                headers=self._get_headers(),
                files=files,
                data=data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                ipfs_hash = result.get('IpfsHash')
                
                return True, {
                    "ipfs_hash": ipfs_hash,
                    "url": f"{self.gateway_url}/{ipfs_hash}",
                    "size": result.get('PinSize'),
                    "timestamp": result.get('Timestamp'),
                    "filename": filename
                }
            else:
                return False, {"error": f"Upload failed: {response.text}"}
                
        except requests.RequestException as e:
            return False, {"error": f"Connection error: {str(e)}"}
        except Exception as e:
            return False, {"error": f"Upload error: {str(e)}"}
    
    def upload_base64(
        self,
        base64_data: str,
        filename: str = "image.png",
        name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Upload a base64-encoded image to IPFS via Pinata
        
        Args:
            base64_data: Base64-encoded image data (with or without data URI prefix)
            filename: Filename for the uploaded file
            name: Optional name for the pin
            metadata: Optional metadata to attach to the pin
            
        Returns:
            Tuple of (success: bool, result: dict with ipfs_hash, url, or error)
        """
        if not self.is_configured:
            return False, {"error": "Pinata service not configured"}
        
        try:
            # Remove data URI prefix if present
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]
            
            # Decode base64 data
            file_data = base64.b64decode(base64_data)
            
            if len(file_data) > self.MAX_FILE_SIZE:
                return False, {"error": f"File too large. Maximum size: {self.MAX_FILE_SIZE / (1024*1024)}MB"}
            
            # Determine content type from filename
            ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'png'
            content_type = {
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'gif': 'image/gif',
                'webp': 'image/webp'
            }.get(ext, 'image/png')
            
            # Prepare filename
            unique_filename = self._generate_filename(filename)
            
            # Prepare pinata options
            pinata_options = {
                "cidVersion": 1
            }
            
            # Prepare pinata metadata
            pinata_metadata = {
                "name": name or unique_filename,
                "keyvalues": metadata or {}
            }
            
            # Add standard metadata
            pinata_metadata["keyvalues"]["uploaded_at"] = datetime.utcnow().isoformat()
            pinata_metadata["keyvalues"]["app"] = "ChainTrack"
            pinata_metadata["keyvalues"]["type"] = "base64_upload"
            
            # Prepare multipart form data
            files = {
                'file': (unique_filename, file_data, content_type)
            }
            
            data = {
                'pinataOptions': json.dumps(pinata_options),
                'pinataMetadata': json.dumps(pinata_metadata)
            }
            
            # Upload to Pinata
            response = requests.post(
                f"{self.PINATA_API_URL}/pinning/pinFileToIPFS",
                headers=self._get_headers(),
                files=files,
                data=data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                ipfs_hash = result.get('IpfsHash')
                
                return True, {
                    "ipfs_hash": ipfs_hash,
                    "url": f"{self.gateway_url}/{ipfs_hash}",
                    "size": result.get('PinSize'),
                    "timestamp": result.get('Timestamp'),
                    "filename": unique_filename
                }
            else:
                return False, {"error": f"Upload failed: {response.text}"}
                
        except base64.binascii.Error:
            return False, {"error": "Invalid base64 data"}
        except requests.RequestException as e:
            return False, {"error": f"Connection error: {str(e)}"}
        except Exception as e:
            return False, {"error": f"Upload error: {str(e)}"}
    
    def upload_json(
        self,
        data: Dict[str, Any],
        name: str = "chaintrack_data",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Upload JSON data to IPFS via Pinata
        
        Args:
            data: Dictionary to upload as JSON
            name: Name for the pin
            metadata: Optional metadata to attach to the pin
            
        Returns:
            Tuple of (success: bool, result: dict with ipfs_hash, url, or error)
        """
        if not self.is_configured:
            return False, {"error": "Pinata service not configured"}
        
        try:
            # Prepare pinata metadata
            pinata_metadata = {
                "name": name,
                "keyvalues": metadata or {}
            }
            
            # Add standard metadata
            pinata_metadata["keyvalues"]["uploaded_at"] = datetime.utcnow().isoformat()
            pinata_metadata["keyvalues"]["app"] = "ChainTrack"
            pinata_metadata["keyvalues"]["type"] = "json_data"
            
            payload = {
                "pinataContent": data,
                "pinataMetadata": pinata_metadata,
                "pinataOptions": {
                    "cidVersion": 1
                }
            }
            
            headers = self._get_headers()
            headers["Content-Type"] = "application/json"
            
            response = requests.post(
                f"{self.PINATA_API_URL}/pinning/pinJSONToIPFS",
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                ipfs_hash = result.get('IpfsHash')
                
                return True, {
                    "ipfs_hash": ipfs_hash,
                    "url": f"{self.gateway_url}/{ipfs_hash}",
                    "size": result.get('PinSize'),
                    "timestamp": result.get('Timestamp')
                }
            else:
                return False, {"error": f"Upload failed: {response.text}"}
                
        except requests.RequestException as e:
            return False, {"error": f"Connection error: {str(e)}"}
        except Exception as e:
            return False, {"error": f"Upload error: {str(e)}"}
    
    def get_pin(self, ipfs_hash: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Get information about a pinned file
        
        Args:
            ipfs_hash: The IPFS hash (CID) of the pinned file
            
        Returns:
            Tuple of (success: bool, result: dict with pin info or error)
        """
        if not self.is_configured:
            return False, {"error": "Pinata service not configured"}
        
        try:
            response = requests.get(
                f"{self.PINATA_API_URL}/data/pinList?hashContains={ipfs_hash}",
                headers=self._get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                rows = result.get('rows', [])
                
                if rows:
                    pin = rows[0]
                    return True, {
                        "ipfs_hash": pin.get('ipfs_pin_hash'),
                        "url": f"{self.gateway_url}/{pin.get('ipfs_pin_hash')}",
                        "size": pin.get('size'),
                        "date_pinned": pin.get('date_pinned'),
                        "metadata": pin.get('metadata', {})
                    }
                else:
                    return False, {"error": "Pin not found"}
            else:
                return False, {"error": f"Failed to get pin: {response.text}"}
                
        except requests.RequestException as e:
            return False, {"error": f"Connection error: {str(e)}"}
    
    def unpin(self, ipfs_hash: str) -> Tuple[bool, str]:
        """
        Unpin a file from Pinata (remove from IPFS)
        
        Args:
            ipfs_hash: The IPFS hash (CID) to unpin
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        if not self.is_configured:
            return False, "Pinata service not configured"
        
        try:
            response = requests.delete(
                f"{self.PINATA_API_URL}/pinning/unpin/{ipfs_hash}",
                headers=self._get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                return True, "Successfully unpinned"
            else:
                return False, f"Failed to unpin: {response.text}"
                
        except requests.RequestException as e:
            return False, f"Connection error: {str(e)}"
    
    def get_gateway_url(self, ipfs_hash: str) -> str:
        """Get the public gateway URL for an IPFS hash"""
        return f"{self.gateway_url}/{ipfs_hash}"


# Singleton instance
pinata_service = PinataService()
