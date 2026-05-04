import React, { useState, useMemo } from 'react';
import TweetPanel from '../components/TweetPanel';
import ControlPanel from '../components/ControlPanel';

const TweetsPage = ({ tweetPosts, loading, refetch }) => {
  // State holds multiple active filters
  const [filters, setFilters] = useState({
    high: true,
    medium: true,
    low: true,
  });

  const toggleFilter = (level) => {
    setFilters(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const allActive = filters.high && filters.medium && filters.low;
  
  const toggleAll = () => {
    // If all are active, turn them all off. Otherwise, turn them all on.
    const newState = !allActive;
    setFilters({ high: newState, medium: newState, low: newState });
  };

  const filteredPosts = useMemo(() => {
    return tweetPosts.filter(post => filters[post.urgency_level]);
  }, [tweetPosts, filters]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Live Urgent Reports</h2>
        <ControlPanel onRefresh={refetch} onAnalyze={refetch} loading={loading} />
      </div>

      <div className="filter-bar">
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Filter by Urgency:</span>
        <div className="filter-buttons">
          <button 
            className={`btn-filter ${allActive ? 'active' : ''}`} 
            onClick={toggleAll}
          >
            All
          </button>
          <button 
            className={`btn-filter ${filters.high ? 'active high' : ''}`} 
            onClick={() => toggleFilter('high')}
          >
            High
          </button>
          <button 
            className={`btn-filter ${filters.medium ? 'active medium' : ''}`} 
            onClick={() => toggleFilter('medium')}
          >
            Medium
          </button>
          <button 
            className={`btn-filter ${filters.low ? 'active low' : ''}`} 
            onClick={() => toggleFilter('low')}
          >
            Low
          </button>
        </div>
      </div>

      {loading ? (
        <div className="panel" style={{ padding: '4rem', alignItems: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Fetching live reports...</p>
        </div>
      ) : (
        <TweetPanel posts={filteredPosts} />
      )}
    </div>
  );
};

export default TweetsPage;
