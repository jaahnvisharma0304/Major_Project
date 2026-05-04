import React, { useMemo } from 'react';
import { summarizeDisaster } from '../utils/summarizeDisaster';
import { AlertTriangle, Activity, MapPin, BrainCircuit } from 'lucide-react';
import { Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import ReactMarkdown from 'react-markdown';

const SummaryPanel = ({ satelliteRegions, tweetPosts, aiSummary }) => {
  const summary = useMemo(
    () => summarizeDisaster(satelliteRegions, tweetPosts),
    [satelliteRegions, tweetPosts]
  );

  const chartData = useMemo(() => {
    let high = 0, medium = 0, low = 0;
    satelliteRegions.forEach(r => {
      if (r.damage_level === 'high') high++;
      else if (r.damage_level === 'medium') medium++;
      else low++;
    });
    return [
      { name: 'High', value: high, color: '#ff4d4f' }, // Vibrant Neon Red
      { name: 'Medium', value: medium, color: '#faad14' }, // Vibrant Neon Yellow
      { name: 'Low', value: low, color: '#52c41a' } // Vibrant Neon Green
    ];
  }, [satelliteRegions]);

  const criticalZones = useMemo(() => {
    return satelliteRegions
      .filter(r => r.damage_level === 'high')
      .sort((a, b) => b.damage_score - a.damage_score)
      .slice(0, 4); // Show top 4
  }, [satelliteRegions]);

  if (!summary) return null;

  return (
    <div className="panel summary-panel" style={{ padding: '2rem' }}>
      <div className="panel-header" style={{ marginBottom: '2rem' }}>
        <Activity className="icon text-blue" />
        <h2>Situation Summary</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        <div style={{ 
          background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))', 
          backdropFilter: 'blur(10px)', 
          border: '1px solid rgba(255, 255, 255, 0.05)', 
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          padding: '2rem', 
          borderRadius: '16px' 
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f8fafc', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            <BrainCircuit className="text-purple" size={24} /> AI Urgency Report
          </h3>
          <div className="markdown-body" style={{ color: '#cbd5e1', lineHeight: '1.7', fontSize: '15px' }}>
            {aiSummary ? (
              <ReactMarkdown>{aiSummary}</ReactMarkdown>
            ) : (
              "Waiting for Gemini Analysis..."
            )}
          </div>
        </div>

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
          <h3 style={{ color: '#f8fafc', marginBottom: '1.5rem', fontSize: '1.25rem' }}>Damage Distribution</h3>
          <div style={{ height: '240px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} 
                  itemStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', paddingBottom: '4px' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h3 style={{ color: '#f8fafc', marginBottom: '1.5rem', marginTop: '2rem', paddingBottom: '0.5rem', fontSize: '1.25rem' }}>
        Critical Zones (Urgent Action Required)
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {criticalZones.length > 0 ? criticalZones.map((zone, idx) => (
          <div key={`${zone.id}-${idx}`} style={{ 
            background: 'rgba(30, 41, 59, 0.6)', 
            backdropFilter: 'blur(10px)',
            borderRadius: '16px', 
            overflow: 'hidden', 
            border: '1px solid rgba(255, 77, 79, 0.3)',
            boxShadow: '0 4px 20px rgba(255, 77, 79, 0.1)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 77, 79, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 77, 79, 0.1)';
          }}>
            {zone.overlay_image_url ? (
              <img src={zone.overlay_image_url} alt="Critical Zone" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '160px', backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#94a3b8' }}>No Image Available</span>
              </div>
            )}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '1.1rem' }}>{zone.location_name || `Region ${zone.id}`}</span>
                <span style={{ backgroundColor: 'rgba(255, 77, 79, 0.1)', color: '#ff4d4f', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', border: '1px solid rgba(255, 77, 79, 0.2)' }}>HIGH PRIORITY</span>
              </div>
              <div style={{ fontSize: '14px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Damage Score:</span> 
                  <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{(zone.damage_score * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Coordinates:</span> 
                  <span style={{ color: '#e2e8f0' }}>{zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <p style={{ color: '#9ca3af' }}>No high damage zones detected.</p>
        )}
      </div>

    </div>
  );
};

export default SummaryPanel;
