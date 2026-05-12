import React, { useState, useMemo } from 'react';
import TweetPanel from '../components/TweetPanel';
import ControlPanel from '../components/ControlPanel';
import { Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { ClipboardList, BarChart2, PieChart as PieChartIcon, Search, ArrowUpDown } from 'lucide-react';

const TweetsPage = ({ tweetPosts, tweetInsights, loading, refetch }) => {
  // State holds multiple active filters
  const [filters, setFilters] = useState({
    high: true,
    medium: true,
    low: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'analysis'

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
    let result = tweetPosts.filter(post => {
      const matchesFilter = filters[post.urgency_level];
      const matchesSearch = post.text.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    result.sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.urgency_score - a.urgency_score 
        : a.urgency_score - b.urgency_score;
    });

    return result;
  }, [tweetPosts, filters, searchQuery, sortOrder]);

  const incidentsByType = useMemo(() => {
    const counts = {
      Fire: 0,
      Flood: 0,
      Earthquake: 0,
      Storm: 0,
      Other: 0
    };

    tweetPosts.forEach(post => {
      const text = post.text.toLowerCase();
      if (text.includes('fire') || text.includes('wildfire') || text.includes('blaze')) {
        counts.Fire++;
      } else if (text.includes('flood') || text.includes('tsunami') || text.includes('water')) {
        counts.Flood++;
      } else if (text.includes('earthquake') || text.includes('quake') || text.includes('shake') || text.includes('landslide')) {
        counts.Earthquake++;
      } else if (text.includes('hurricane') || text.includes('storm') || text.includes('tornado') || text.includes('wind') || text.includes('avalanche')) {
        counts.Storm++;
      } else {
        counts.Other++;
      }
    });

    return Object.keys(counts)
      .filter(key => counts[key] > 0)
      .map(key => ({
        name: key,
        count: counts[key]
      }))
      .sort((a, b) => {
        if (a.name === 'Other') return 1;
        if (b.name === 'Other') return -1;
        return b.count - a.count;
      });
  }, [tweetPosts]);

  const chartData = useMemo(() => {
    let high = 0, medium = 0, low = 0;
    tweetPosts.forEach(post => {
      if (post.urgency_level === 'high') high++;
      else if (post.urgency_level === 'medium') medium++;
      else low++;
    });
    return [
      { name: 'High', value: high, color: '#ff4d4f' },
      { name: 'Medium', value: medium, color: '#faad14' },
      { name: 'Low', value: low, color: '#52c41a' }
    ];
  }, [tweetPosts]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Live Urgent Reports</h2>
        <ControlPanel onRefresh={refetch} onAnalyze={refetch} loading={loading} />
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('feed')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: activeTab === 'feed' ? 'var(--accent-blue)' : 'var(--text-secondary)', 
            fontSize: '1rem', 
            fontWeight: 600, 
            cursor: 'pointer',
            borderBottom: activeTab === 'feed' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            paddingBottom: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          Live Feed
        </button>
        <button 
          onClick={() => setActiveTab('analysis')}
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: activeTab === 'analysis' ? 'var(--accent-blue)' : 'var(--text-secondary)', 
            fontSize: '1rem', 
            fontWeight: 600, 
            cursor: 'pointer',
            borderBottom: activeTab === 'analysis' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            paddingBottom: '0.5rem',
            transition: 'all 0.2s'
          }}
        >
          AI Analysis & Graphs
        </button>
      </div>

      {loading ? (
        <div className="panel" style={{ padding: '4rem', alignItems: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Fetching live reports...</p>
        </div>
      ) : (
        <>
          {activeTab === 'analysis' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Column 1: AI Insights Panel */}
              <div style={{ 
                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', 
                backdropFilter: 'blur(10px)', 
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                padding: '2rem', 
                borderRadius: '16px' 
              }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                  <ClipboardList className="text-purple" size={24} /> Live Feed Analysis
                </h3>
                <div className="markdown-body" style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '15px' }}>
                  {tweetInsights ? (
                    <ReactMarkdown>{tweetInsights}</ReactMarkdown>
                  ) : (
                    "Waiting for Gemini Analysis..."
                  )}
                </div>
              </div>

              {/* Column 2: Graphs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Recharts Panel - Donut Chart */}
                <div style={{ 
                  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', 
                  backdropFilter: 'blur(10px)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  padding: '2rem', 
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                    <PieChartIcon className="text-orange" size={24} /> Urgency Breakdown
                  </h3>
                  <div style={{ height: '220px', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                          itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center text for Donut */}
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc' }}>{tweetPosts.length}</span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total</span>
                    </div>
                  </div>
                </div>
                
                {/* Recharts Panel - Incidents by Type */}
                <div style={{ 
                  background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', 
                  backdropFilter: 'blur(10px)', 
                  border: '1px solid rgba(255, 255, 255, 0.05)', 
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                  padding: '2rem', 
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                    <BarChart2 className="text-blue" size={24} /> Incidents by Category
                  </h3>
                  <div style={{ height: '220px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incidentsByType} margin={{ top: 10, right: 10, left: -20, bottom: 5 }} barSize={32}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                          contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                          itemStyle={{ fontWeight: 'bold', color: '#3b82f6' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feed' && (
            <>
              <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', background: 'var(--surface-color)', padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>Filter by Urgency:</span>
                  <div className="filter-buttons">
                    <button className={`btn-filter ${allActive ? 'active' : ''}`} onClick={toggleAll}>All</button>
                    <button className={`btn-filter ${filters.high ? 'active high' : ''}`} onClick={() => toggleFilter('high')}>High</button>
                    <button className={`btn-filter ${filters.medium ? 'active medium' : ''}`} onClick={() => toggleFilter('medium')}>Medium</button>
                    <button className={`btn-filter ${filters.low ? 'active low' : ''}`} onClick={() => toggleFilter('low')}>Low</button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'flex-end' }}>
                  <div className="search-wrapper" style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                    <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text" 
                      placeholder="Search by location or keywords..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', outline: 'none' }}
                    />
                  </div>
                  
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    style={{ padding: '0.625rem 1rem' }}
                  >
                    <ArrowUpDown size={16} /> Sort ({sortOrder === 'desc' ? 'High to Low' : 'Low to High'})
                  </button>
                </div>
              </div>
              <TweetPanel posts={filteredPosts} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default TweetsPage;
