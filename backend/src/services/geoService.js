const axios = require('axios');
const env = require('../config/env');

/**
 * Calculates Haversine distance in kilometers between two lat/lng points
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return 9999; // Default large distance if coordinates are missing
  }

  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // 2 decimal places
}

/**
 * Geocodes an address string to { lat, lng, displayName }
 * Tier 1: Google Maps Geocoding API (if configured)
 * Tier 2: OpenStreetMap Nominatim (free zero-cost fallback)
 */
async function geocodeAddress(address) {
  if (!address || typeof address !== 'string' || !address.trim()) {
    return { lat: 28.6139, lng: 77.2090, displayName: 'New Delhi, India' };
  }

  // Tier 1: Google Maps if key provided
  if (env.GOOGLE_MAPS_API_KEY) {
    try {
      const resp = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { address, key: env.GOOGLE_MAPS_API_KEY },
        timeout: 4000
      });
      if (resp.data && resp.data.results && resp.data.results.length > 0) {
        const loc = resp.data.results[0].geometry.location;
        return {
          lat: loc.lat,
          lng: loc.lng,
          displayName: resp.data.results[0].formatted_address
        };
      }
    } catch (err) {
      console.warn('[GeoService] Google Maps geocode failed, falling back to OSM Nominatim:', err.message);
    }
  }

  // Tier 2: OpenStreetMap Nominatim (Free)
  try {
    const resp = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: address, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'InstaCoServe-App/1.0 (smart-india-hackathon)' },
      timeout: 4000
    });
    if (resp.data && resp.data.length > 0) {
      return {
        lat: parseFloat(resp.data[0].lat),
        lng: parseFloat(resp.data[0].lon),
        displayName: resp.data[0].display_name
      };
    }
  } catch (err) {
    console.warn('[GeoService] OSM Nominatim geocode failed:', err.message);
  }

  // Fallback default coordinates (Central Delhi / Connaught Place)
  return {
    lat: 28.6315,
    lng: 77.2167,
    displayName: address
  };
}

/**
 * Reverse geocodes lat/lng into a human-readable address
 */
async function reverseGeocode(lat, lng) {
  if (lat == null || lng == null) {
    return 'Unknown Location';
  }

  if (env.GOOGLE_MAPS_API_KEY) {
    try {
      const resp = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: { latlng: `${lat},${lng}`, key: env.GOOGLE_MAPS_API_KEY },
        timeout: 4000
      });
      if (resp.data && resp.data.results && resp.data.results.length > 0) {
        return resp.data.results[0].formatted_address;
      }
    } catch (err) {
      console.warn('[GeoService] Google Maps reverse geocode failed:', err.message);
    }
  }

  try {
    const resp = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json' },
      headers: { 'User-Agent': 'InstaCoServe-App/1.0 (smart-india-hackathon)' },
      timeout: 4000
    });
    if (resp.data && resp.data.display_name) {
      return resp.data.display_name;
    }
  } catch (err) {
    console.warn('[GeoService] OSM Nominatim reverse geocode failed:', err.message);
  }

  return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
}

module.exports = {
  calculateHaversineDistance,
  geocodeAddress,
  reverseGeocode
};
