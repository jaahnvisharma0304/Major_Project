import React, { useState } from 'react';
import { MessageSquare, AlertCircle, MapPin } from 'lucide-react';

const TweetPanel = ({ posts }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="panel tweet-panel empty">
        <MessageSquare className="empty-icon" />
        <p>No reports available.</p>
      </div>
    );
  }

  const getBadgeClass = (level) => {
    switch (level) {
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      case 'low': return 'badge-low';
      default: return 'badge-low';
    }
  };

  return (
    <div className="panel tweet-panel">
      <div className="panel-header sticky-header">
        <MessageSquare className="icon text-purple" />
        <h2>Live Reports (Tweets)</h2>
        <span className="tweet-count">{posts.length}</span>
      </div>
      
      <div className="tweet-list" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {posts.map(post => {
          let glowColor = 'rgba(255, 255, 255, 0.1)';
          let borderColor = 'rgba(255, 255, 255, 0.05)';
          
          if (post.urgency_level === 'high') {
            glowColor = 'rgba(239, 68, 68, 0.2)';
            borderColor = 'rgba(239, 68, 68, 0.3)';
          } else if (post.urgency_level === 'medium') {
            glowColor = 'rgba(234, 179, 8, 0.15)';
            borderColor = 'rgba(234, 179, 8, 0.2)';
          }

          return (
            <div 
              key={post.id} 
              className="tweet-card"
              style={{
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                boxShadow: `0 4px 20px ${glowColor.replace(/[\d.]+\)$/g, '0.05)')}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 12px 28px ${glowColor}`;
                e.currentTarget.style.borderColor = glowColor.replace(/[\d.]+\)$/g, '0.5)');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 20px ${glowColor.replace(/[\d.]+\)$/g, '0.05)')}`;
                e.currentTarget.style.borderColor = borderColor;
              }}
            >
              <div className="tweet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`urgency-badge ${getBadgeClass(post.urgency_level)}`} style={{ padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.05em' }}>
                  <AlertCircle size={14} />
                  {post.urgency_level.toUpperCase()}
                </span>
                <span className="urgency-score" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                  {(post.urgency_score * 100).toFixed(1)}% Confidence
                </span>
              </div>
              
              <p className="tweet-text" style={{ fontSize: '1rem', lineHeight: '1.6', color: '#e2e8f0', fontStyle: 'italic' }}>
                "{post.text}"
              </p>
              
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TweetPanel;
