import React from 'react';
import { RefreshCw, Play } from 'lucide-react';

const ControlPanel = ({ onRefresh, onAnalyze, loading }) => {
  return (
    <div className="control-panel">
      <div className="control-buttons">
        <button 
          className="btn btn-primary" 
          onClick={onAnalyze}
          disabled={loading}
        >
          <Play size={18} className={loading ? 'spin' : ''} />
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
