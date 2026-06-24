const STRATZ_API_URL = 'https://api.stratz.com/graphql';
const OPENDOTA_API_URL = 'https://api.opendota.com/api';

// Cache to prevent rate-limiting from OpenDota (60 req/min limit)
const matchupCache = {};

export const fetchStratzGraphQL = async (query, variables = {}) => {
  const apiKey = import.meta.env.VITE_STRATZ_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_STRATZ_API_KEY in .env');
  }

  const response = await fetch(STRATZ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch (e) {}
    throw new Error(`STRATZ API Error: ${response.status} - ${errorBody}`);
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
      query GetMatchup {
        heroStats {
          heroVsHeroMatchup(heroId: ${parseInt(heroId, 10)}) {
            advantage {
              heroId
              matchCountVs
              vs {
                heroId2
                synergy
                winsAverage
              }
            }
          }
        }
      }
    `;
        try {
        const data = await fetchStratzGraphQL(query);
        
        const matchups = data?.heroStats?.heroVsHeroMatchup?.advantage;
        if (!matchups || matchups.length === 0) {
          throw new Error(`STRATZ returned empty data! Payload: ${JSON.stringify(data).substring(0, 150)}`);
        }
        
        // vs is an array of { heroId2, synergy, winsAverage } objects
        // We flatten it: for each entry in advantage, iterate over vs[]
        const result = [];
        for (const m of matchups) {
          if (!Array.isArray(m.vs)) continue;
          for (const v of m.vs) {
            result.push({
              vsHeroId: v.heroId2,
              matchCount: m.matchCountVs || 0,
              winRate: v.winsAverage ? v.winsAverage * 100 : 50,
              synergy: v.synergy || 0
            });
          }
        }
        return result;
      } catch (err) {
        try {
          const res = await fetch(`${OPENDOTA_API_URL}/heroes/${heroId}/matchups`);
          if (!res.ok) throw new Error("OpenDota also failed");
          const openDotaData = await res.json();
          
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

export const introspectSchema = async () => {
  const query = `
    query {
      __type(name: "HeroDryadType") {
        fields {
          name
        }
      }
    }
  `;
  const data = await fetchStratzGraphQL(query);
  return data;
};

export const getHeroItemBuilds = async (heroId) => {
  const query = `
    query {
      heroStats {
        itemFullPurchase(heroId: ${parseInt(heroId, 10)}) {
          itemId
          matchCount
          winCount
        }
      }
    }
  `;
  try {
    const data = await fetchStratzGraphQL(query);
    const items = data?.heroStats?.itemFullPurchase;
    if (!items || items.length === 0) return null;

    // Sort by matchCount descending and take the top 6 most purchased items
    // De-duplicate by itemId first (same item can appear multiple times)
    const byItem = {};
    for (const entry of items) {
      if (!byItem[entry.itemId]) {
        byItem[entry.itemId] = { itemId: entry.itemId, matchCount: 0, winCount: 0 };
      }
      byItem[entry.itemId].matchCount += entry.matchCount;
      byItem[entry.itemId].winCount += entry.winCount;
    }
    
    const sorted = Object.values(byItem)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 6);
    
    return sorted.map(i => i.itemId);
  } catch (err) {
    console.error("Failed to fetch hero item builds:", err);
    return null;
  }
};
