/**
 * Local helper function to summarize disaster data.
 * Counts how many satellite regions are high/medium/low damage
 * Counts how many tweets are high/medium/low urgency.
 * Builds a readable summary.
 */
export const summarizeDisaster = (satelliteRegions, tweetPosts) => {
  // If no data, return default
  if (!satelliteRegions || !tweetPosts) return null;

  // Calculate damage levels
  let highDamage = 0;
  let mediumDamage = 0;
  let lowDamage = 0;

  satelliteRegions.forEach(region => {
    if (region.damage_level === 'high') highDamage++;
    else if (region.damage_level === 'medium') mediumDamage++;
    else if (region.damage_level === 'low') lowDamage++;
  });

  // Calculate urgency levels
  let highUrgency = 0;
  let mediumUrgency = 0;
  let lowUrgency = 0;

  tweetPosts.forEach(post => {
    if (post.urgency_level === 'high') highUrgency++;
    else if (post.urgency_level === 'medium') mediumUrgency++;
    else if (post.urgency_level === 'low') lowUrgency++;
  });

  // Determine severity
  let severity = 'Controlled';
  if (highDamage > 2 || highUrgency > 2) {
    severity = 'Severe';
  } else if (mediumDamage > 2 || mediumUrgency > 2) {
    severity = 'Moderate';
  }

  // Generate a summary paragraph
  const summaryText = `Based on the latest data, the overall situation is ${severity}. ` +
    `There are ${highDamage} regions with high damage, and ${highUrgency} urgent distress reports. ` +
    (severity === 'Severe' ? 'Immediate rescue response is highly recommended in critical areas.' : 'Continue monitoring the situation.');

  // Note for backend LangChain integration:
  // Once the backend is ready, this function will be replaced by a call to FastAPI.
  // The structure expected from the backend will look something like this:
  /*
  // const summaryRes = await fetch("http://localhost:8000/summary");
  // const summaryJson = await summaryRes.json();
  // return {
  //   severity: summaryJson.severity,
  //   text: summaryJson.text,
  //   highDamageCount: summaryJson.affected_regions.high,
  //   highUrgencyCount: summaryJson.urgent_needs.count,
  // };
  */

  return {
    severity,
    text: summaryText,
    stats: {
      highDamage,
      mediumDamage,
      lowDamage,
      highUrgency,
      mediumUrgency,
      lowUrgency,
    }
  };
};
