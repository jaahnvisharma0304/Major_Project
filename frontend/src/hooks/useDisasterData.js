import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for data management.
 * 
 * - Loads satellite JSON and tweet JSON.
 * - Stores both in state.
 * - Provides loading state.
 * - Provides error state.
 * - Provides a refetch function.
 * 
 * Currently uses local sample data. Code is ready for API integration later.
 */
export const useDisasterData = () => {
  const [satelliteRegions, setSatelliteRegions] = useState([]);
  const [tweetPosts, setTweetPosts] = useState([]);
  const [tweetInsights, setTweetInsights] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate network delay for realism
      await new Promise(resolve => setTimeout(resolve, 800));

      // Fetch Satellite Data from Backend
      const satelliteRes = await fetch("http://localhost:8000/satellite-data", { cache: "no-store" });
      if (!satelliteRes.ok) throw new Error("Failed to fetch satellite data");
      const satelliteJson = await satelliteRes.json();
      
      // Extract regions from the new array structure
      let allRegions = [];
      if (Array.isArray(satelliteJson)) {
        satelliteJson.forEach(item => {
          if (item.regions) {
            const mappedRegions = item.regions.map(r => ({
              ...r,
              overlay_image_url: item.overlay_image_url
            }));
            allRegions = [...allRegions, ...mappedRegions];
          }
        });
      } else {
        allRegions = satelliteJson.regions || [];
      }
      setSatelliteRegions(allRegions);

      // Fetch AI Summary from jaahnvi_model
      try {
        const summaryRes = await fetch("http://localhost:8001/generate-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(allRegions)
        });
        if (summaryRes.ok) {
          const summaryJson = await summaryRes.json();
          setAiSummary(summaryJson.summary);
          
          if (summaryJson.region_names) {
            setSatelliteRegions(prev => prev.map(r => ({
              ...r,
              location_name: summaryJson.region_names[r.id]
            })));
          }
        }
      } catch (e) {
        console.error("Failed to fetch AI summary:", e);
      }

      // Fetch Tweets from ananya_model
      let processedTweets = [];
      try {
        const tweetRes = await fetch("http://localhost:8002/latest-tweets");
        if (tweetRes.ok) {
          const tweetJson = await tweetRes.json();
          const results = tweetJson.results || [];
          
          processedTweets = results
            .filter(post => post.prediction === 'informative')
            .map((post, index) => {
              const score = post.confidence || 0.5;
              let level = 'low';
              if (score > 0.8) level = 'high';
              else if (score > 0.5) level = 'medium';
              
              return {
                id: `t${index}`,
                text: post.text,
                urgency_score: score,
                urgency_level: level
              };
            });
          setTweetPosts(processedTweets);
        } else {
          console.warn("Failed to fetch tweet data from ananya_model, falling back to mock");
          setTweetPosts(tweetDataMock.posts);
          processedTweets = tweetDataMock.posts;
        }
      } catch (e) {
        console.error("Error fetching from ananya_model:", e);
        setTweetPosts(tweetDataMock.posts);
        processedTweets = tweetDataMock.posts;
      }

      // Fetch Tweet Insights from jaahnvi_model
      if (processedTweets.length > 0) {
        try {
          const insightRes = await fetch("http://localhost:8001/generate-tweet-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(processedTweets)
          });
          if (insightRes.ok) {
            const insightJson = await insightRes.json();
            setTweetInsights(insightJson.summary);
          }
        } catch (e) {
          console.error("Failed to fetch tweet insights:", e);
        }
      }

    } catch (err) {
      setError(err.message || "An unexpected error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();

    // OPTIONAL SIMULATION OF LIVE REFRESH
    // Uncomment the following lines to enable auto-refresh every 60 seconds
    /*
    const intervalId = setInterval(() => {
      fetchData();
    }, 60000);
    return () => clearInterval(intervalId);
    */
  }, [fetchData]);

  return {
    satelliteRegions,
    tweetPosts,
    tweetInsights,
    aiSummary,
    loading,
    error,
    refetch: fetchData
  };
};
