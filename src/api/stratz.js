const STRATZ_API_URL = '/api/stratz';
const OPENDOTA_API_URL = 'https://api.opendota.com/api';

// Cache to prevent rate-limiting from OpenDota (60 req/min limit)
const matchupCache = {};

export const fetchStratzGraphQL = async (query, variables = {}) => {
  const response = await fetch(STRATZ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
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
              vs
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
        
        return matchups.map(m => {
          // If vs is an array of matchup data objects, it will throw a GraphQL error first.
          // If vs is a Float, we use it directly as the advantage.
          let advantageVal = 0;
          if (Array.isArray(m.vs)) {
            // Unlikely if it's a Float, but just in case it returns an array of floats
            advantageVal = m.vs[0] || 0;
          } else if (typeof m.vs === 'number') {
            advantageVal = m.vs;
          } else if (m.vs && m.vs.synergy) {
             advantageVal = m.vs.synergy;
          }

          // Convert advantage decimal (e.g. 0.05) to percentage and add to 50%
          const advantagePercent = advantageVal > -1 && advantageVal < 1 ? advantageVal * 100 : advantageVal;

          return {
            vsHeroId: m.heroId,
            matchCount: m.matchCountVs || 0,
            winRate: 50 + advantagePercent
          };
        });
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
