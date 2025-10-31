import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  postalCode?: string;
  fullAddress?: string; // Complete detailed address for delivery
  timestamp: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

class LocationService {
  private static readonly LOCATION_CACHE_KEY = 'cached_location';
  private static readonly PERMISSION_STATUS_KEY = 'location_permission_status';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Request location permissions from the device
   */
  static async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      const permissionStatus: LocationPermissionStatus = {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status
      };

      // Cache permission status
      await AsyncStorage.setItem(
        this.PERMISSION_STATUS_KEY, 
        JSON.stringify(permissionStatus)
      );

      return permissionStatus;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: Location.PermissionStatus.UNDETERMINED
      };
    }
  }

  /**
   * Check current location permission status
   */
  static async checkLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status
      };
    } catch (error) {
      console.error('Error checking location permission:', error);
      return {
        granted: false,
        canAskAgain: true,
        status: Location.PermissionStatus.UNDETERMINED
      };
    }
  }

  /**
   * Get current device location
   */
  static async getCurrentLocation(useCache: boolean = true): Promise<LocationData | null> {
    try {
      // Check cached location first
      if (useCache) {
        const cachedLocation = await this.getCachedLocation();
        if (cachedLocation) {
          return cachedLocation;
        }
      }

      // Check permissions
      const permissionStatus = await this.checkLocationPermission();
      if (!permissionStatus.granted) {
        console.log('Location permission not granted');
        return null;
      }

      // Get current position with highest accuracy for delivery
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,
        distanceInterval: 50,
      });

      // Reverse geocode to get detailed address
      const address = await this.reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      );

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: address.address,
        city: address.city,
        postalCode: address.postalCode,
        fullAddress: address.fullAddress, // Complete address for delivery
        timestamp: Date.now(),
      };

      // Cache the location
      await this.cacheLocation(locationData);

      return locationData;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get detailed human-readable address
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<{
    address?: string;
    city?: string;
    postalCode?: string;
    fullAddress?: string;
  }> {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result && result.length > 0) {
        const location = result[0];
        
        // Build complete address components
        const streetNumber = location.streetNumber || '';
        const street = location.street || '';
        const district = location.district || '';
        const subregion = location.subregion || '';
        const city = location.city || location.region || '';
        const postalCode = location.postalCode || '';
        const country = location.country || '';
        
        // Format street address
        const addressParts = [streetNumber, street].filter(Boolean);
        const streetAddress = addressParts.length > 0 
          ? addressParts.join(' ') 
          : district || subregion;

        // Build complete detailed address for delivery
        const fullAddressParts = [
          streetAddress,
          district && district !== streetAddress ? district : null,
          city,
          postalCode,
          country
        ].filter(Boolean);

        const fullAddress = fullAddressParts.join(', ');

        return {
          address: streetAddress,
          city: city,
          postalCode: postalCode,
          fullAddress: fullAddress,
        };
      }

      return {};
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return {};
    }
  }

  /**
   * Cache location data
   */
  private static async cacheLocation(locationData: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.LOCATION_CACHE_KEY,
        JSON.stringify(locationData)
      );
    } catch (error) {
      console.error('Error caching location:', error);
    }
  }

  /**
   * Get cached location if still valid
   */
  private static async getCachedLocation(): Promise<LocationData | null> {
    try {
      const cachedData = await AsyncStorage.getItem(this.LOCATION_CACHE_KEY);
      if (!cachedData) return null;

      const locationData: LocationData = JSON.parse(cachedData);
      
      // Check if cache is still valid
      const now = Date.now();
      if (now - locationData.timestamp < this.CACHE_DURATION) {
        return locationData;
      }

      // Cache expired, remove it
      await AsyncStorage.removeItem(this.LOCATION_CACHE_KEY);
      return null;
    } catch (error) {
      console.error('Error getting cached location:', error);
      return null;
    }
  }

  /**
   * Clear location cache
   */
  static async clearLocationCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.LOCATION_CACHE_KEY);
    } catch (error) {
      console.error('Error clearing location cache:', error);
    }
  }

  /**
   * Format location for display (simple street view like Foodpanda)
   */
  static formatLocationForDisplay(locationData: LocationData): string {
    // Simple street address display
    if (locationData.address && locationData.city) {
      return `${locationData.address}, ${locationData.city}`;
    } else if (locationData.address) {
      return locationData.address;
    } else if (locationData.city) {
      return locationData.city;
    } else {
      return 'Location found';
    }
  }

  /**
   * Format location for delivery (complete address)
   */
  static formatLocationForDelivery(locationData: LocationData): string {
    if (locationData.fullAddress) {
      return locationData.fullAddress;
    }
    return this.formatLocationForDisplay(locationData);
  }
}

export default LocationService;
