const STRATZ_API_URL = 'https://api.stratz.com/graphql';
const OPENDOTA_API_URL = 'https://api.opendota.com/api';

// Cache to prevent rate-limiting from OpenDota (60 req/min limit)
const matchupCache = {};

export const fetchStratzGraphQL = async (query, variables = {}) => {
  const apiKey = import.meta.env.VITE_STRATZ_API_KEY;
  
  if (!apiKey || apiKey === 'PASTE_YOUR_KEY_HERE') {
    throw new Error('Missing STRATZ API Key! Please add it to your .env file.');
  }

  const response = await fetch(STRATZ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'DotaDraftApp/1.0'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`STRATZ API Error: ${response.status}`);
  }

  const result = await response.json();
  if (result.errors) {
    throw new Error('GraphQL query returned errors.');
  }

  return result.data;
};

// Fetch matchup data for a given hero against all other heroes
export const getHeroMatchups = (heroId) => {
  if (matchupCache[heroId]) {
    return matchupCache[heroId];
  }

  const fetchMatchups = async () => {
    const query = `
      query GetMatchup($heroId: Short!) {
        heroStats {
          heroVsHeroMatchup(heroId: $heroId) {
            advantage
            winRate
            vsHeroId
            matchCount
          }
        }
      }
    `;
    const variables = { heroId: parseInt(heroId, 10) };
    
    try {
      const data = await fetchStratzGraphQL(query, variables);
      return data.heroStats.heroVsHeroMatchup;
    } catch (err) {
      console.warn("STRATZ API failed or returned 400. Falling back to OpenDota API...", err);
      
      try {
        // OpenDota Fallback
        const res = await fetch(`${OPENDOTA_API_URL}/heroes/${heroId}/matchups`);
        if (!res.ok) throw new Error("OpenDota also failed");
        const openDotaData = await res.json();
        
        // Map OpenDota data to match the expected STRATZ format for App.jsx
        return openDotaData.map(matchup => ({
          vsHeroId: matchup.hero_id,
          matchCount: matchup.games_played,
          winRate: matchup.games_played > 0 ? (matchup.wins / matchup.games_played) * 100 : 0
        }));
      } catch (odErr) {
        console.error("Both APIs failed to load matchups:", odErr);
        return null;
      }
    }
  };

  matchupCache[heroId] = fetchMatchups();
  return matchupCache[heroId];
};
