import React, { useState } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { DEFAULT_MAP_CENTER } from '../utils/mapUtils';
import Legend from './Legend';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '600px',
  borderRadius: '0.75rem',
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#d59563" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ], // Dark mode map styles
};

const MapComponent = ({ regions }) => {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const getColorForLevel = (level) => {
    if (level === 'high') return '#ff4d4f'; // Neon Red
    if (level === 'medium') return '#faad14'; // Neon Yellow
    if (level === 'low') return '#52c41a'; // Neon Green
    return '#52c41a';
  };

  if (loadError) {
    return (
      <div className="map-fallback">
        <p>⚠️ Error loading Google Maps.</p>
        <p className="fallback-sub">Please check your API key and network connection.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="spinner"></div>
        <p>Loading Map...</p>
      </div>
    );
  }

  return (
    <div className="map-wrapper">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={8}
        center={DEFAULT_MAP_CENTER}
        options={mapOptions}
      >
        {regions.map((region, index) => (
          <Marker
            key={`${region.id}-${index}`}
            position={{ lat: region.latitude, lng: region.longitude }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: getColorForLevel(region.damage_level),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            onMouseOver={() => setHoveredRegion(region)}
            onMouseOut={() => setHoveredRegion(null)}
          />
        ))}

        {hoveredRegion && hoveredRegion.overlay_image_url && (
          <InfoWindow
            position={{ lat: hoveredRegion.latitude, lng: hoveredRegion.longitude }}
            options={{ pixelOffset: new window.google.maps.Size(0, -10) }}
            onCloseClick={() => setHoveredRegion(null)}
          >
            <div style={{ 
              width: '240px', 
              padding: '4px',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1f2937' }}>Analyzed Region</span>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: '700', 
                  textTransform: 'uppercase',
                  padding: '4px 10px', 
                  borderRadius: '12px',
                  backgroundColor: hoveredRegion.damage_level === 'high' ? '#fee2e2' : hoveredRegion.damage_level === 'medium' ? '#fef3c7' : '#dcfce7',
                  color: hoveredRegion.damage_level === 'high' ? '#991b1b' : hoveredRegion.damage_level === 'medium' ? '#b45309' : '#166534',
                  letterSpacing: '0.5px'
                }}>
                  {hoveredRegion.damage_level}
                </span>
              </div>
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                <img 
                  src={hoveredRegion.overlay_image_url} 
                  alt="Damage Overlay" 
                  style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} 
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                  padding: '20px 10px 8px',
                  color: 'white',
                  fontSize: '13px',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ opacity: 0.9 }}>Damage Score:</span>
                  <strong>{(hoveredRegion.damage_score * 100).toFixed(0)}%</strong>
                </div>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      <Legend />
    </div>
  );
};

export default MapComponent;
