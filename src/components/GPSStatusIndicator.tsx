import React from 'react';
import { MapPin } from 'lucide-react';

interface GPSStatusIndicatorProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
}

export const GPSStatusIndicator: React.FC<GPSStatusIndicatorProps> = ({ status, message }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'text-yellow-500 bg-yellow-100';
      case 'success': return 'text-green-500 bg-green-100';
      case 'error': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'loading': return 'bg-yellow-500 animate-pulse';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg ${getStatusColor()}`}>
      <div className="relative flex h-3 w-3">
        {status === 'loading' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${getDotColor()}`}></span>
      </div>
      <MapPin className="w-5 h-5" />
      <span className="text-sm font-medium">
        {status === 'idle' && 'GPS Ready'}
        {status === 'loading' && 'Acquiring GPS Fix...'}
        {status === 'success' && 'GPS Fix Acquired'}
        {status === 'error' && (message || 'GPS Error')}
      </span>
    </div>
  );
};
