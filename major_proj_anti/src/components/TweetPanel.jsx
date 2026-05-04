import React from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';

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
      
      <div className="tweet-list">
        {posts.map(post => (
          <div key={post.id} className="tweet-card">
            <div className="tweet-header">
              <span className={`urgency-badge ${getBadgeClass(post.urgency_level)}`}>
                <AlertCircle size={14} />
                {post.urgency_level.toUpperCase()}
              </span>
              <span className="urgency-score">Score: {post.urgency_score.toFixed(2)}</span>
            </div>
            <p className="tweet-text">"{post.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TweetPanel;
