/**
 * Upload Service for ChainTrack
 * Handles file uploads to IPFS via Pinata through the backend API
 */

import api from './api';

class UploadService {
  /**
   * Check if upload service is available
   * @returns {Promise<{configured: boolean, authenticated: boolean, message: string}>}
   */
  async checkStatus() {
    try {
      const response = await api.get('/api/uploads/status');
      return response.data;
    } catch (error) {
      return {
        configured: false,
        authenticated: false,
        message: error.response?.data?.message || 'Upload service unavailable'
      };
    }
  }

  /**
   * Upload an image file to IPFS
   * @param {File} file - The file to upload
   * @param {Object} options - Upload options
   * @param {string} options.name - Optional name for the pin
   * @param {string} options.purpose - Purpose of the upload (e.g., 'delivery_proof', 'checkpoint')
   * @param {string} options.shipmentId - Associated shipment ID
   * @param {string} options.checkpointType - Type of checkpoint
   * @param {function} options.onProgress - Progress callback (not supported by Pinata, but kept for future)
   * @returns {Promise<{success: boolean, url?: string, ipfsHash?: string, error?: string}>}
   */
  async uploadImage(file, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (options.name) formData.append('name', options.name);
      if (options.purpose) formData.append('purpose', options.purpose);
      if (options.shipmentId) formData.append('shipment_id', options.shipmentId);
      if (options.checkpointType) formData.append('checkpoint_type', options.checkpointType);

      const response = await api.post('/api/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        url: response.data.url,
        ipfsHash: response.data.ipfs_hash,
        filename: response.data.filename,
        size: response.data.size
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Upload failed'
      };
    }
  }

  /**
   * Upload a base64 image to IPFS
   * @param {string} base64Data - Base64-encoded image data (with or without data URI prefix)
   * @param {Object} options - Upload options
   * @returns {Promise<{success: boolean, url?: string, ipfsHash?: string, error?: string}>}
   */
  async uploadBase64Image(base64Data, options = {}) {
    try {
      const response = await api.post('/api/uploads/image', {
        image: base64Data,
        filename: options.filename || 'image.png',
        name: options.name,
        purpose: options.purpose || 'general',
        shipment_id: options.shipmentId,
        checkpoint_type: options.checkpointType
      });

      return {
        success: true,
        url: response.data.url,
        ipfsHash: response.data.ipfs_hash,
        filename: response.data.filename
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Upload failed'
      };
    }
  }

  /**
   * Upload a signature (canvas capture) to IPFS
   * @param {string} signatureData - Base64-encoded signature image
   * @param {string} shipmentId - Associated shipment ID
   * @returns {Promise<{success: boolean, url?: string, ipfsHash?: string, error?: string}>}
   */
  async uploadSignature(signatureData, shipmentId) {
    try {
      const response = await api.post('/api/uploads/signature', {
        signature: signatureData,
        shipment_id: shipmentId
      });

      return {
        success: true,
        url: response.data.url,
        ipfsHash: response.data.ipfs_hash,
        filename: response.data.filename
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Signature upload failed'
      };
    }
  }

  /**
   * Upload delivery proof (photo + optional signature) to IPFS
   * @param {Object} proofData - Delivery proof data
   * @param {File} proofData.photo - Photo file
   * @param {string} proofData.signature - Optional base64 signature
   * @param {string} proofData.shipmentId - Shipment ID
   * @param {string} proofData.recipientName - Recipient name
   * @returns {Promise<{success: boolean, photoUrl?: string, signatureUrl?: string, error?: string}>}
   */
  async uploadDeliveryProof(proofData) {
    try {
      const formData = new FormData();
      formData.append('photo', proofData.photo);
      formData.append('shipment_id', proofData.shipmentId);
      formData.append('recipient_name', proofData.recipientName);
      
      if (proofData.signature) {
        formData.append('signature', proofData.signature);
      }

      const response = await api.post('/api/uploads/delivery-proof', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: true,
        photoUrl: response.data.photo_url,
        photoIpfsHash: response.data.photo_ipfs_hash,
        signatureUrl: response.data.signature_url,
        signatureIpfsHash: response.data.signature_ipfs_hash
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Delivery proof upload failed'
      };
    }
  }

  /**
   * Upload JSON data to IPFS
   * @param {Object} data - JSON data to upload
   * @param {string} name - Name for the pin
   * @param {string} purpose - Purpose of the data
   * @returns {Promise<{success: boolean, url?: string, ipfsHash?: string, error?: string}>}
   */
  async uploadJson(data, name, purpose = 'data_record') {
    try {
      const response = await api.post('/api/uploads/json', {
        data,
        name,
        purpose
      });

      return {
        success: true,
        url: response.data.url,
        ipfsHash: response.data.ipfs_hash
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'JSON upload failed'
      };
    }
  }

  /**
   * Convert a file to base64
   * @param {File} file - File to convert
   * @returns {Promise<string>} Base64-encoded string with data URI prefix
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Compress an image before upload
   * @param {File} file - Image file to compress
   * @param {Object} options - Compression options
   * @param {number} options.maxWidth - Maximum width (default: 1920)
   * @param {number} options.maxHeight - Maximum height (default: 1080)
   * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
   * @returns {Promise<Blob>} Compressed image blob
   */
  async compressImage(file, options = {}) {
    const maxWidth = options.maxWidth || 1920;
    const maxHeight = options.maxHeight || 1080;
    const quality = options.quality || 0.8;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  }
}

// Export singleton instance
export const uploadService = new UploadService();
export default uploadService;
