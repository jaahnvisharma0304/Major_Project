// Map utility functions and constants

// Default center (India roughly)
export const DEFAULT_MAP_CENTER = {
  lat: 22.9734,
  lng: 78.6569,
};

// Colors for heatmap gradients
export const HEATMAP_GRADIENT = [
  "rgba(0, 255, 0, 0)",
  "rgba(0, 255, 0, 1)",
  "rgba(127, 255, 0, 1)",
  "rgba(191, 255, 0, 1)",
  "rgba(255, 255, 0, 1)",
  "rgba(255, 191, 0, 1)",
  "rgba(255, 127, 0, 1)",
  "rgba(255, 63, 0, 1)",
  "rgba(255, 0, 0, 1)",
];

/**
 * Convert regions data to Google Maps Heatmap layer format
 * @param {Array} regions - The regions array from satellite data
 * @param {object} window - The global window object (to access google.maps)
 * @returns {Array} - Array of google.maps.LatLng or weighted objects
 */
export const getHeatmapData = (regions) => {
  if (!window.google || !window.google.maps) return [];

  return regions.map((region) => {
    return {
      location: new window.google.maps.LatLng(region.latitude, region.longitude),
      weight: region.damage_score * 10, // Scale the score up for better visualization
    };
  });
};
