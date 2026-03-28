import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface LocationError {
  code: string;
  message: string;
}

class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationData | null = null;
  private watchSubscription: Location.LocationSubscription | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web geolocation permission is handled by the browser
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve(false);
            return;
          }
          
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          );
        });
      } else {
        // Mobile permission handling
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const locationData: LocationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              };
              this.currentLocation = locationData;
              resolve(locationData);
            },
            (error) => {
              reject(new Error(`Geolocation error: ${error.message}`));
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes
            }
          );
        });
      } else {
        // Mobile location handling
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        });

        let locationData: LocationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || undefined,
        };

        // Try to get reverse geocoding for mobile
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          if (reverseGeocode.length > 0) {
            const address = reverseGeocode[0];
            locationData = {
              ...locationData,
              address: `${address.street || ''} ${address.name || ''}`.trim(),
              city: address.city || address.subregion || undefined,
              country: address.country || undefined,
            };
          }
        } catch (geocodeError) {
          console.log('Reverse geocoding failed:', geocodeError);
        }

        this.currentLocation = locationData;
        return locationData;
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  async watchLocation(
    callback: (location: LocationData) => void,
    errorCallback?: (error: LocationError) => void
  ): Promise<void> {
    if (Platform.OS === 'web') {
      // Web doesn't support continuous watching in the same way
      // We'll just get the current location periodically
      const watchId = setInterval(async () => {
        try {
          const location = await this.getCurrentLocation();
          callback(location);
        } catch (error) {
          errorCallback?.({
            code: 'LOCATION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown location error'
          });
        }
      }, 30000); // Update every 30 seconds

      // Store the interval ID for cleanup
      (this as any).webWatchId = watchId;
      return;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        errorCallback?.({
          code: 'PERMISSION_DENIED',
          message: 'Location permission denied'
        });
        return;
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 50, // 50 meters
        },
        async (location) => {
          try {
            let locationData: LocationData = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy || undefined,
            };

            // Try reverse geocoding
            try {
              const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });

              if (reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                locationData = {
                  ...locationData,
                  address: `${address.street || ''} ${address.name || ''}`.trim(),
                  city: address.city || address.subregion || undefined,
                  country: address.country || undefined,
                };
              }
            } catch (geocodeError) {
              console.log('Reverse geocoding failed:', geocodeError);
            }

            this.currentLocation = locationData;
            callback(locationData);
          } catch (error) {
            errorCallback?.({
              code: 'LOCATION_ERROR',
              message: error instanceof Error ? error.message : 'Unknown location error'
            });
          }
        }
      );
    } catch (error) {
      errorCallback?.({
        code: 'WATCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to watch location'
      });
    }
  }

  stopWatchingLocation(): void {
    if (Platform.OS === 'web') {
      if ((this as any).webWatchId) {
        clearInterval((this as any).webWatchId);
        (this as any).webWatchId = null;
      }
    } else {
      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
      }
    }
  }

  getCachedLocation(): LocationData | null {
    return this.currentLocation;
  }

  // Utility functions
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const dLon = this.toRadians(lon2 - lon1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

    let bearing = Math.atan2(y, x);
    bearing = this.toDegrees(bearing);
    return (bearing + 360) % 360;
  }

  static formatCoordinates(lat: number, lon: number): string {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lon).toFixed(4)}°${lonDir}`;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}

// Convenience functions for easy import
export const getLocation = async (): Promise<LocationData> => {
  const service = LocationService.getInstance();
  return service.getCurrentLocation();
};

export const calculateQiblaDirection = (latitude: number, longitude: number) => {
  // Precise Kaaba coordinates in Mecca, Saudi Arabia
  const kaabaLat = 21.422487;
  const kaabaLon = 39.826206;
  
  const direction = LocationService.calculateBearing(latitude, longitude, kaabaLat, kaabaLon);
  const distance = LocationService.calculateDistance(latitude, longitude, kaabaLat, kaabaLon);
  
  return {
    direction: Math.round(direction * 100) / 100, // Round to 2 decimal places
    distance: Math.round(distance * 100) / 100    // Round to 2 decimal places
  };
};

export const watchLocation = async (
  callback: (location: LocationData) => void,
  errorCallback?: (error: LocationError) => void
): Promise<void> => {
  const service = LocationService.getInstance();
  return service.watchLocation(callback, errorCallback);
};

export const stopWatchingLocation = (): void => {
  const service = LocationService.getInstance();
  service.stopWatchingLocation();
};

export const getCachedLocation = (): LocationData | null => {
  const service = LocationService.getInstance();
  return service.getCachedLocation();
};

export default LocationService;