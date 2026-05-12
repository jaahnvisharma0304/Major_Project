import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDisasterData } from './hooks/useDisasterData';
import NavBar from './components/NavBar';
import DashboardPage from './pages/DashboardPage';
import SummaryPage from './pages/SummaryPage';
import TweetsPage from './pages/TweetsPage';

function App() {
  const { satelliteRegions, tweetPosts, tweetInsights, aiSummary, loading, error, refetch } = useDisasterData();

  if (error) {
    return (
      <div className="app-container">
        <NavBar />
        <main className="page-container">
          <div className="panel" style={{ padding: '2rem', textAlign: 'center' }}>
            <p className="text-red" style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
              <strong>Error Loading Data:</strong> {error}
            </p>
            <button className="btn btn-secondary" onClick={refetch} style={{ margin: '0 auto' }}>Retry</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <NavBar />
        
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route 
              path="/" 
              element={
                <DashboardPage 
                  satelliteRegions={satelliteRegions} 
                  loading={loading} 
                  refetch={refetch} 
                />
              } 
            />
            <Route 
              path="/summary" 
              element={
                <SummaryPage 
                  satelliteRegions={satelliteRegions} 
                  tweetPosts={tweetPosts} 
                  aiSummary={aiSummary}
                  loading={loading} 
                  refetch={refetch} 
                />
              } 
            />
            <Route 
              path="/tweets" 
              element={
                <TweetsPage 
                  tweetPosts={tweetPosts} 
                  tweetInsights={tweetInsights}
                  loading={loading} 
                  refetch={refetch} 
                />
              } 
            />
          </Routes>
        </main>
      </div>
  );
}

export default App;
