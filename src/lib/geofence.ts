/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export async function getCurrentGPSPosition(): Promise<GPSPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = 'Failed to acquire GPS location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied. Please enable GPS permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            msg = 'The location request timed out.';
            break;
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

export interface GeofenceValidationResult {
  isValid: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  accuracyMeters: number;
  requiredAccuracyMeters: number;
  message: string;
}

export function validateGeofence(
  currentPos: GPSPosition,
  officeLat: number,
  officeLng: number,
  allowedRadiusMeters: number,
  requiredAccuracyMeters: number = 100
): GeofenceValidationResult {
  const distance = calculateDistanceMeters(
    currentPos.latitude,
    currentPos.longitude,
    officeLat,
    officeLng
  );

  const isWithinRadius = distance <= allowedRadiusMeters;
  const isAccuracyAcceptable = currentPos.accuracy <= requiredAccuracyMeters * 2; // allowance for high-rise / indoors

  let message = '';
  if (!isWithinRadius) {
    message = `You are ${distance}m away from the office geofence center (Max allowed: ${allowedRadiusMeters}m).`;
  } else if (!isAccuracyAcceptable) {
    message = `GPS accuracy is too low (${Math.round(currentPos.accuracy)}m vs max ${requiredAccuracyMeters * 2}m). Please move outdoors for a better signal.`;
  } else {
    message = `Successfully verified within geofence radius (${distance}m from center).`;
  }

  return {
    isValid: isWithinRadius && isAccuracyAcceptable,
    distanceMeters: distance,
    allowedRadiusMeters,
    accuracyMeters: Math.round(currentPos.accuracy),
    requiredAccuracyMeters,
    message,
  };
}
