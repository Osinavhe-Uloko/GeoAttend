import { useState, useEffect, useCallback } from 'react';

interface GPSCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GPSState {
  coordinates: GPSCoordinates | null;
  error: string | null;
  isLoading: boolean;
}

export const useGPS = () => {
  const [state, setState] = useState<GPSState>({
    coordinates: null,
    error: null,
    isLoading: false,
  });

  const getCoordinates = useCallback(async (): Promise<GPSCoordinates> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by your browser';
        setState(prev => ({ ...prev, isLoading: false, error }));
        reject(new Error(error));
        return;
      }

      let bestReading: GPSCoordinates | null = null;
      let watchId: number;
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        if (timeoutId) clearTimeout(timeoutId);
      };

      const handleSuccess = (position: GeolocationPosition) => {
        const result = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        
        if (!bestReading || result.accuracy < bestReading.accuracy) {
          bestReading = result;
        }

        // If accuracy is good enough (<= 15 meters), resolve immediately
        if (result.accuracy <= 15) {
          cleanup();
          setState({ coordinates: result, isLoading: false, error: null });
          resolve(result);
        }
      };

      const handleError = (error: GeolocationPositionError) => {
        // Only reject if we don't have a best reading yet
        if (!bestReading) {
          cleanup();
          let errorMessage = 'An unknown error occurred';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please allow location access to mark attendance.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              errorMessage = 'The request to get user location timed out.';
              break;
          }
          setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
          reject(new Error(errorMessage));
        }
      };

      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      // Wait up to 5 seconds to get the best possible accuracy
      timeoutId = setTimeout(() => {
        cleanup();
        if (bestReading) {
          setState({ coordinates: bestReading, isLoading: false, error: null });
          resolve(bestReading);
        } else {
          const error = 'GPS request timed out. Please ensure you have a clear view of the sky.';
          setState(prev => ({ ...prev, isLoading: false, error }));
          reject(new Error(error));
        }
      }, 5000); // 5 seconds max wait for best accuracy
    });
  }, []);

  return { ...state, getCoordinates };
};
