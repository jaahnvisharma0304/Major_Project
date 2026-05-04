import React from 'react';
import MapComponent from '../components/MapComponent';
import ControlPanel from '../components/ControlPanel';

const DashboardPage = ({ satelliteRegions, loading, refetch }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Disaster Heatmap</h2>
        <ControlPanel onRefresh={refetch} onAnalyze={refetch} loading={loading} />
      </div>

      <div className="map-page-card shadow-glass">
        {loading && <div className="loading-overlay"><div className="spinner"></div></div>}
        <MapComponent regions={satelliteRegions} />
      </div>
    </div>
  );
};

export default DashboardPage;
