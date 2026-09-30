export type LatLon = { lat: number; lon: number };

/** Browser geolocation → { lat, lon }. Rejects on deny/unavailable. */
export function getCurrentPosition(): Promise<LatLon> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('geolocation-unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err.code === err.PERMISSION_DENIED ? 'location-permission-denied' : 'location-unavailable')),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  });
}
