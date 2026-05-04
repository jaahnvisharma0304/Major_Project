import React from 'react';

const Legend = () => {
  return (
    <div className="legend-container">
      <h4>Damage Level</h4>
      <div className="legend-items">
        <div className="legend-item">
          <span className="color-box high"></span>
          <span>High</span>
        </div>
        <div className="legend-item">
          <span className="color-box medium"></span>
          <span>Medium</span>
        </div>
        <div className="legend-item">
          <span className="color-box low"></span>
          <span>Low</span>
        </div>
      </div>
    </div>
  );
};

export default Legend;
