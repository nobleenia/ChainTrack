import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  MapPin,
  CheckCircle,
  CheckCircle2,
  Truck,
  Clock,
  AlertTriangle,
  Package,
  User,
  Calendar,
  ShieldCheck,
  Image
} from 'lucide-react';
import api from '../services/api';

const statusConfig = {
  created: { 
    label: 'Created', 
    color: 'bg-gray-100 text-gray-800',
    icon: Package,
    description: 'Shipment has been created and is awaiting pickup'
  },
  picked_up: { 
    label: 'Picked Up', 
    color: 'bg-blue-100 text-blue-800',
    icon: Truck,
    description: 'Package has been picked up by courier'
  },
  in_transit: { 
    label: 'In Transit', 
    color: 'bg-primary-100 text-primary-800',
    icon: Truck,
    description: 'Package is on its way to destination'
  },
  delivered: { 
    label: 'Delivered', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Package has been delivered'
  },
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-green-100 text-green-800',
    icon: ShieldCheck,
    description: 'Delivery has been confirmed by recipient'
  }
};

const statusOrder = ['created', 'picked_up', 'in_transit', 'delivered', 'confirmed'];

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState('');
  const [pin, setPin] = useState('');
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingId.trim() || !pin.trim()) {
      setError('Please enter both tracking ID and PIN');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const response = await api.get(`/api/shipments/track/${trackingId.trim()}?pin=${pin.trim()}`);
      setShipment(response.data);
    } catch (err) {
      setShipment(null);
      if (err.response?.status === 404) {
        setError('Shipment not found. Please check your tracking ID.');
      } else if (err.response?.status === 403) {
        setError('Invalid PIN. Please check and try again.');
      } else {
        setError('Failed to fetch shipment details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStatusIndex = () => {
    if (!shipment) return -1;
    return statusOrder.indexOf(shipment.status);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Track Your Shipment
            </h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Enter your tracking ID and PIN to see real-time updates on your package delivery
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Section */}
      <section className="relative -mt-8 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8"
          >
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tracking ID
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                      placeholder="SHP-XXXXXX"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PIN Code
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit PIN"
                      maxLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Track Shipment
                  </>
                )}
              </button>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl flex items-center gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {shipment && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="pb-16"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Status Overview Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-primary-200 text-sm font-medium">Tracking ID</p>
                      <p className="text-2xl font-bold">{shipment.tracking_id}</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig[shipment.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                      {(() => {
                        const StatusIcon = statusConfig[shipment.status]?.icon || Package;
                        return <StatusIcon className="w-5 h-5" />;
                      })()}
                      <span className="font-semibold">{statusConfig[shipment.status]?.label || shipment.status}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-8 overflow-x-auto">
                    {statusOrder.map((status, index) => {
                      const isCompleted = index <= getCurrentStatusIndex();
                      const isCurrent = index === getCurrentStatusIndex();
                      const StatusIcon = statusConfig[status].icon;
                      
                      return (
                        <div key={status} className="flex flex-col items-center min-w-[80px]">
                          <div className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                            isCompleted 
                              ? 'bg-primary-600 text-white' 
                              : 'bg-gray-100 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-primary-200' : ''}`}>
                            {isCompleted && index < getCurrentStatusIndex() ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              <StatusIcon className="w-6 h-6" />
                            )}
                          </div>
                          <p className={`mt-2 text-xs font-medium text-center ${
                            isCompleted ? 'text-primary-600' : 'text-gray-400'
                          }`}>
                            {statusConfig[status].label}
                          </p>
                          {index < statusOrder.length - 1 && (
                            <div className={`hidden md:block absolute h-1 w-[calc(100%-80px)] top-6 left-[60px] ${
                              index < getCurrentStatusIndex() ? 'bg-primary-600' : 'bg-gray-200'
                            }`} style={{ transform: 'translateX(40px)' }}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg py-3 px-4">
                    {statusConfig[shipment.status]?.description}
                  </p>
                </div>
              </div>

              {/* Shipment Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Package Info */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    Package Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                      <span className="text-gray-600 dark:text-gray-400">Description</span>
                      <span className="font-medium text-gray-900 dark:text-white">{shipment.description || 'N/A'}</span>
                    </div>
                    {shipment.weight && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Weight</span>
                        <span className="font-medium text-gray-900 dark:text-white">{shipment.weight} kg</span>
                      </div>
                    )}
                    {shipment.dimensions && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Dimensions</span>
                        <span className="font-medium text-gray-900 dark:text-white">{shipment.dimensions}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 dark:text-gray-400">Created</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatDate(shipment.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Location Info */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    Locations
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 bg-primary-600 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Origin</p>
                        <p className="font-medium text-gray-900 dark:text-white">{shipment.origin_address || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="ml-1.5 w-0.5 h-8 bg-gray-200 dark:bg-gray-600"></div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Destination</p>
                        <p className="font-medium text-gray-900 dark:text-white">{shipment.destination_address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkpoints Timeline */}
              {shipment.checkpoints && shipment.checkpoints.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    Tracking History
                  </h3>
                  <div className="space-y-0">
                    {shipment.checkpoints.slice().reverse().map((checkpoint, index) => (
                      <div key={checkpoint.id} className="relative flex gap-4">
                        {/* Timeline line */}
                        {index < shipment.checkpoints.length - 1 && (
                          <div className="absolute left-[11px] top-8 w-0.5 h-full bg-gray-200 dark:bg-gray-600"></div>
                        )}
                        
                        {/* Timeline dot */}
                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          index === 0 ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="pb-8 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <p className="font-medium text-gray-900 dark:text-white">{checkpoint.status_update}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(checkpoint.created_at)}</p>
                          </div>
                          {checkpoint.location && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-4 h-4" />
                              {checkpoint.location}
                            </p>
                          )}
                          {checkpoint.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{checkpoint.notes}</p>
                          )}
                          {checkpoint.photo_url && (
                            <div className="mt-2">
                              <a 
                                href={checkpoint.photo_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                              >
                                <Image className="w-4 h-4" />
                                View Photo
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Proof */}
              {shipment.delivery_proof && (
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Delivery Proof
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>Received by:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{shipment.delivery_proof.recipient_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Delivered:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatDate(shipment.delivery_proof.delivered_at)}</span>
                      </div>
                    </div>
                    {shipment.delivery_proof.photo_url && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Delivery Photo</p>
                        <a 
                          href={shipment.delivery_proof.photo_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Image className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">View Photo</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {searched && !shipment && !loading && !error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No shipment found with the provided details</p>
        </motion.div>
      )}
    </div>
  );
}
