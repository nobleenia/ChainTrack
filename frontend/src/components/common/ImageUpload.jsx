import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  X, 
  Image as ImageIcon, 
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';
import uploadService from '../../services/uploadService';

/**
 * ImageUpload - Component for uploading images to IPFS
 * Supports file selection, camera capture, and drag & drop
 */
export default function ImageUpload({
  onUploadComplete,
  onError,
  shipmentId,
  purpose = 'general',
  checkpointType,
  maxSize = 10, // MB
  accept = 'image/*',
  className = '',
  showPreview = true,
  compress = true,
  label = 'Upload Photo',
  placeholder = 'Click to upload or drag and drop',
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFile) => {
    setError(null);
    setUploadResult(null);
    
    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      const errMsg = 'Please select an image file';
      setError(errMsg);
      if (onError) onError(errMsg);
      return;
    }
    
    // Validate file size
    const sizeMB = selectedFile.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      const errMsg = `File too large. Maximum size: ${maxSize}MB`;
      setError(errMsg);
      if (onError) onError(errMsg);
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
    
    // Optionally compress the image
    let fileToUpload = selectedFile;
    if (compress && sizeMB > 1) {
      try {
        const compressedBlob = await uploadService.compressImage(selectedFile);
        fileToUpload = new File([compressedBlob], selectedFile.name, {
          type: 'image/jpeg'
        });
      } catch (err) {
        console.warn('Image compression failed, using original:', err);
      }
    }
    
    setFile(fileToUpload);
  }, [maxSize, compress, onError]);

  // Handle file input change
  const handleInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  // Handle drag & drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  // Upload the file
  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    try {
      const result = await uploadService.uploadImage(file, {
        purpose,
        shipmentId,
        checkpointType,
      });
      
      if (result.success) {
        setUploadResult(result);
        if (onUploadComplete) {
          onUploadComplete({
            url: result.url,
            ipfsHash: result.ipfsHash,
            filename: result.filename,
          });
        }
      } else {
        const errMsg = result.error || 'Upload failed';
        setError(errMsg);
        if (onError) onError(errMsg);
      }
    } catch (err) {
      const errMsg = 'Upload failed. Please try again.';
      setError(errMsg);
      if (onError) onError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  // Clear the current selection
  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className={`image-upload ${className}`}>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload area or preview */}
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="upload-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                isDragging ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
                <Upload className={`w-8 h-8 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-500 mt-1">{placeholder}</p>
                <p className="text-xs text-gray-400 mt-1">Max size: {maxSize}MB</p>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  Browse Files
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Camera
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            {/* Image preview */}
            {showPreview && (
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
                
                {/* Upload status overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex flex-col items-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-sm mt-2">Uploading to IPFS...</span>
                    </div>
                  </div>
                )}
                
                {uploadResult && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">Uploaded</span>
                    </div>
                  </div>
                )}
                
                {/* Clear button */}
                {!uploading && (
                  <button
                    onClick={handleClear}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            
            {/* File info */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ImageIcon className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{file?.name}</span>
                <span className="text-gray-400">
                  ({(file?.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              
              {!uploadResult && !uploading && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </motion.button>
              )}
            </div>
            
            {/* IPFS Hash display */}
            {uploadResult && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800 font-medium mb-1">Stored on IPFS</p>
                <p className="text-xs text-green-600 font-mono break-all">
                  {uploadResult.ipfsHash}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}
    </div>
  );
}

/**
 * CameraCapture - Simple camera capture component
 * Opens camera and captures a single photo
 */
export function CameraCapture({
  onCapture,
  onError,
  className = '',
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setStream(mediaStream);
      setIsActive(true);
      setError(null);
    } catch (err) {
      const errMsg = 'Failed to access camera. Please check permissions.';
      setError(errMsg);
      if (onError) onError(errMsg);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    stopCamera();
    
    if (onCapture) {
      onCapture(dataUrl);
    }
  };

  return (
    <div className={`camera-capture ${className}`}>
      {!isActive ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startCamera}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Open Camera
        </motion.button>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg"
          />
          
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={capturePhoto}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg"
            >
              <div className="w-12 h-12 bg-primary-600 rounded-full" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopCamera}
              className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
