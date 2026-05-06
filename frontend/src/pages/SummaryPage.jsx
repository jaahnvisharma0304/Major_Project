import React from 'react';
import SummaryPanel from '../components/SummaryPanel';
import ControlPanel from '../components/ControlPanel';

const SummaryPage = ({ satelliteRegions, tweetPosts, aiSummary, loading, refetch }) => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Satellite Analysis Summary</h2>
        <ControlPanel onRefresh={refetch} onAnalyze={refetch} loading={loading} />
      </div>

      {loading ? (
        <div className="panel" style={{ padding: '4rem', alignItems: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Analyzing latest satellite imagery...</p>
        </div>
      ) : (
        <SummaryPanel satelliteRegions={satelliteRegions} tweetPosts={tweetPosts} aiSummary={aiSummary} />
      )}
    </div>
  );
};

export default SummaryPage;
