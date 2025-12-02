import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eraser, Check, RotateCcw, PenTool } from 'lucide-react';

/**
 * SignatureCapture - Canvas-based signature pad component
 * Allows users to draw their signature and export as base64 image
 */
export default function SignatureCapture({
  onSave,
  onClear,
  width = 400,
  height = 200,
  strokeColor = '#000000',
  strokeWidth = 2,
  backgroundColor = '#ffffff',
  className = '',
  disabled = false,
  placeholder = 'Sign here',
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [ctx, setCtx] = useState(null);

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    
    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(dpr, dpr);
    
    // Set drawing styles
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    
    // Fill background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);
    
    setCtx(context);
  }, [width, height, strokeColor, strokeWidth, backgroundColor]);

  // Get position from event (handles both mouse and touch)
  const getPosition = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e) => {
    if (disabled || !ctx) return;
    
    e.preventDefault();
    const { x, y } = getPosition(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  }, [ctx, disabled, getPosition]);

  // Continue drawing
  const draw = useCallback((e) => {
    if (!isDrawing || disabled || !ctx) return;
    
    e.preventDefault();
    const { x, y } = getPosition(e);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing, disabled, ctx, getPosition]);

  // Stop drawing
  const stopDrawing = useCallback((e) => {
    if (!isDrawing || !ctx) return;
    
    e.preventDefault();
    ctx.closePath();
    setIsDrawing(false);
  }, [isDrawing, ctx]);

  // Clear the canvas
  const clearCanvas = useCallback(() => {
    if (!ctx) return;
    
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    
    if (onClear) {
      onClear();
    }
  }, [ctx, backgroundColor, width, height, onClear]);

  // Get signature as base64 data URL
  const getSignatureData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    return canvas.toDataURL('image/png');
  }, []);

  // Get signature as blob
  const getSignatureBlob = useCallback(() => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(null);
        return;
      }
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (!hasSignature) return;
    
    const signatureData = getSignatureData();
    if (onSave && signatureData) {
      onSave(signatureData);
    }
  }, [hasSignature, getSignatureData, onSave]);

  // Touch event handlers for mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prevent scrolling while drawing
    const preventScroll = (e) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, [isDrawing]);

  return (
    <div className={`signature-capture ${className}`}>
      {/* Canvas container */}
      <div className="relative rounded-lg border-2 border-dashed border-gray-300 overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`touch-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'}`}
          style={{ display: 'block' }}
        />
        
        {/* Placeholder */}
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 text-gray-400">
              <PenTool className="w-5 h-5" />
              <span className="text-sm">{placeholder}</span>
            </div>
          </div>
        )}
        
        {/* Signature line */}
        <div className="absolute bottom-8 left-8 right-8 border-b border-gray-300 pointer-events-none">
          <span className="absolute -bottom-5 left-0 text-xs text-gray-400">Signature</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearCanvas}
          disabled={disabled || !hasSignature}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Clear
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={disabled || !hasSignature}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="w-4 h-4" />
          Confirm Signature
        </motion.button>
      </div>
    </div>
  );
}

/**
 * SignatureCaptureModal - Modal wrapper for signature capture
 */
export function SignatureCaptureModal({
  isOpen,
  onClose,
  onSave,
  title = 'Add Your Signature',
  description = 'Please sign in the box below to confirm',
}) {
  const [signatureData, setSignatureData] = useState(null);

  const handleSave = (data) => {
    setSignatureData(data);
  };

  const handleConfirm = () => {
    if (signatureData && onSave) {
      onSave(signatureData);
      onClose();
    }
  };

  const handleClear = () => {
    setSignatureData(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{description}</p>
        
        <SignatureCapture
          onSave={handleSave}
          onClear={handleClear}
          width={400}
          height={200}
        />
        
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!signatureData}
            className="px-6 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Signature
          </button>
        </div>
      </motion.div>
    </div>
  );
}
