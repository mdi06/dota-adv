import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShieldAlert, ShieldCheck, Swords, X, TrendingUp, Zap } from 'lucide-react';
import { getHeroMatchups } from './api/stratz';
import BuildAnalyzer from './components/BuildAnalyzer';
import { heroHasRole } from './utils/heroPositions';
import { calculateSynergyBonus } from './utils/synergyEngine';
import { analyzeDraft } from './utils/draftAnalyzer';
import './App.css';

const OPENDOTA_API = 'https://api.opendota.com/api';

function App() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('recommendations'); // 'recommendations' or 'build'
  const [analyzedHero, setAnalyzedHero] = useState(null);
  
  const [radiantDraft, setRadiantDraft] = useState([null, null, null, null, null]);
  const [direDraft, setDireDraft] = useState([null, null, null, null, null]);
  
  const [activeSlot, setActiveSlot] = useState({ team: 'radiant', index: 0 });

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [calculating, setCalculating] = useState(false);

  // Load heroes on mount
  useEffect(() => {
    fetch(`${OPENDOTA_API}/heroes`)
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => a.localized_name.localeCompare(b.localized_name));
        setHeroes(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load heroes:", err);
        setLoading(false);
      });
  }, []);

  // Recalculate recommendations when Dire draft changes
  // In a real app, you'd calculate based on your team (radiant/dire), but let's assume we are Radiant picking against Dire.
  useEffect(() => {
    const calculateRecommendations = async () => {
      const enemies = direDraft.filter(Boolean);
      if (enemies.length === 0) {
        setRecommendations([]);
        return;
      }

      setCalculating(true);

      try {
        // Map to accumulate candidate hero stats
        // candidateStats[heroId] = { id, winsForEnemy, games, name }
        const candidateStats = {};

        // Fetch STRATZ data for each enemy
        for (const enemy of enemies) {
          const matchups = await getHeroMatchups(enemy.id);
          if (!matchups) continue;

          matchups.forEach(matchup => {
            const candidateId = matchup.vsHeroId;
            const games = matchup.matchCount;
            const enemyWins = matchup.winRate > 1 ? (matchup.winRate / 100) * games : matchup.winRate * games;

            if (!candidateStats[candidateId]) {
              candidateStats[candidateId] = { id: candidateId, totalGames: 0, enemyTotalWins: 0 };
            }
            candidateStats[candidateId].totalGames += games;
            candidateStats[candidateId].enemyTotalWins += enemyWins;
          });
        }

        // Calculate combined win rate for Candidates against the Enemy team
        const results = [];
        const draftedIds = new Set([
          ...radiantDraft.filter(Boolean).map(h => h.id),
          ...direDraft.filter(Boolean).map(h => h.id)
        ]);

        for (const [idStr, stats] of Object.entries(candidateStats)) {
          const id = parseInt(idStr, 10);
          if (draftedIds.has(id)) continue; // Don't recommend heroes already picked

          if (stats.totalGames < 50) continue;

          let candidateWinRate = (1 - (stats.enemyTotalWins / stats.totalGames)) * 100;
          const heroObj = heroes.find(h => h.id === id);
          
          if (heroObj) {
            const synergyBonus = calculateSynergyBonus(heroObj.localized_name, radiantDraft.filter(Boolean));
            results.push({
              hero: heroObj,
              winRate: candidateWinRate + synergyBonus,
              synergyBonus: synergyBonus,
              games: stats.totalGames
            });
          }
        }

        // Sort descending by candidate win rate
        results.sort((a, b) => b.winRate - a.winRate);
        setRecommendations(results);

      } catch (err) {
        console.error("Error calculating recommendations", err);
      } finally {
        setCalculating(false);
      }
    };

    calculateRecommendations();
  }, [direDraft, heroes, radiantDraft]);

  const handleHeroSelect = (hero) => {
    if (!activeSlot) return;

    if (activeSlot.team === 'radiant') {
      const newDraft = [...radiantDraft];
      newDraft[activeSlot.index] = hero;
      setRadiantDraft(newDraft);
      if (activeSlot.index < 4) setActiveSlot({ team: 'radiant', index: activeSlot.index + 1 });
      else setActiveSlot({ team: 'dire', index: 0 });
    } else {
      const newDraft = [...direDraft];
      newDraft[activeSlot.index] = hero;
      setDireDraft(newDraft);
      if (activeSlot.index < 4) setActiveSlot({ team: 'dire', index: activeSlot.index + 1 });
      else setActiveSlot(null);
    }
  };

  const removeHero = (team, index, e) => {
    e.stopPropagation();
    if (team === 'radiant') {
      const newDraft = [...radiantDraft];
      if (newDraft[index] && analyzedHero && newDraft[index].id === analyzedHero.id) {
        setAnalyzedHero(null);
      }
      newDraft[index] = null;
      setRadiantDraft(newDraft);
    } else {
      const newDraft = [...direDraft];
      newDraft[index] = null;
      setDireDraft(newDraft);
    }
    setActiveSlot({ team, index });
  };

  const handleClear = () => {
    setRadiantDraft([null, null, null, null, null]);
    setDireDraft([null, null, null, null, null]);
    setRecommendations([]);
    setSearchTerm('');
    setAnalyzedHero(null);
  };

  const draftWarnings = analyzeDraft(radiantDraft);

  const filteredHeroes = useMemo(() => {
    const draftedIds = new Set([
      ...radiantDraft.filter(Boolean).map(h => h.id),
      ...direDraft.filter(Boolean).map(h => h.id)
    ]);

    return heroes.map(hero => ({
      ...hero,
      isDrafted: draftedIds.has(hero.id),
      isHidden: searchTerm && !hero.localized_name.toLowerCase().includes(searchTerm.toLowerCase())
    }));
  }, [heroes, searchTerm, radiantDraft, direDraft]);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Dota 2 Draft Assistant</h1>
        <div className="subtitle">Real-time meta recommendations via STRATZ API</div>
      </header>

      <div className="main-content">
        <aside className="glass-panel draft-tracker">
          <h2>Current Draft</h2>
          
          <div className="team-section">
            <div className="team-title radiant-title">
              <ShieldCheck size={20} /> Radiant (Your Team)
            </div>
            <div className="slots-container">
              {radiantDraft.map((hero, idx) => (
                <div 
                  key={`rad-${idx}`} 
                  className={`draft-slot radiant ${activeSlot?.team === 'radiant' && activeSlot?.index === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSlot({ team: 'radiant', index: idx });
                    if (hero) {
                      setAnalyzedHero(hero);
                      setActiveTab('build');
                    }
                  }}
                >
                  <div className="slot-position-badge">{['Safe Lane', 'Mid Lane', 'Offlane', 'Support', 'Hard Support'][idx]}</div>
                  {hero ? (
                    <div className="slot-hero">
                      <img src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${hero.name.replace('npc_dota_hero_', '')}.png`} alt={hero.localized_name} />
                      <div className="slot-hero-info">
                        <span className="hero-name">{hero.localized_name}</span>
                        <span className="hero-roles">{hero.roles?.slice(0, 2).join(', ')}</span>
                      </div>
                      {hero && (
                        <button className="remove-hero-btn" onClick={(e) => removeHero('radiant', idx, e)}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="slot-placeholder">Select Hero...</span>
                  )}
                </div>
              ))}
            </div>
            {draftWarnings.length > 0 && (
              <div className="draft-warnings">
                {draftWarnings.map((warning, i) => (
                  <div key={i} className={`warning-item ${warning.type}`}>
                    <ShieldAlert size={14} />
                    <span>{warning.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="team-section">
            <h3 style={{ color: 'var(--dire-color)' }}><ShieldAlert size={16} /> DIRE (ENEMY TEAM)</h3>
            <div className="slots-container">
              {direDraft.map((hero, idx) => (
                <div 
                  key={`dire-${idx}`} 
                  className={`draft-slot dire ${activeSlot?.team === 'dire' && activeSlot?.index === idx ? 'active' : ''}`}
                  onClick={() => setActiveSlot({ team: 'dire', index: idx })}
                >
                  <div className="slot-position-badge">{['Safe Lane', 'Mid Lane', 'Offlane', 'Support', 'Hard Support'][idx]}</div>
                  {hero ? (
                    <div className="slot-hero">
                      <img src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${hero.name.replace('npc_dota_hero_', '')}.png`} alt={hero.localized_name} />
                      <div className="slot-hero-info">
                        <span className="hero-name">{hero.localized_name}</span>
                        <span className="hero-roles">{hero.roles?.slice(0, 2).join(', ')}</span>
                      </div>
                      <button className="remove-btn" onClick={(e) => removeHero('dire', idx, e)}><X size={16} /></button>
                    </div>
                  ) : (
                    <span className="slot-placeholder">Select Hero...</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="hero-grid-section">
          <div className="glass-panel">
            <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                placeholder="Search heroes to draft..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="loader">Loading hero data...</div>
            ) : (
              <div className="grid-container">
                {filteredHeroes.map(hero => (
                  !hero.isHidden && (
                    <div 
                      key={hero.id} 
                      className={`hero-card ${hero.isDrafted ? 'disabled' : ''}`}
                      onClick={() => !hero.isDrafted && handleHeroSelect(hero)}
                    >
                      <img 
                        src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${hero.name.replace('npc_dota_hero_', '')}.png`} 
                        alt={hero.localized_name} 
                        loading="lazy"
                      />
                      <div className="hero-name-tooltip">{hero.localized_name}</div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel recommendations-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="tabs-header">
              <button 
                className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommendations')}
              >
                <Swords size={18} /> Draft Recommendations
              </button>
              <button 
                className={`tab-btn ${activeTab === 'build' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('build');
                  if (!analyzedHero) {
                    const firstHero = radiantDraft.find(h => h !== null);
                    if (firstHero) setAnalyzedHero(firstHero);
                  }
                }}
              >
                <Zap size={18} /> Build Analyzer
              </button>
            </div>

            {activeTab === 'recommendations' ? (
              <div className="tab-content" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>
                    Top Counters against Dire 
                    {calculating && <span style={{ fontSize: '0.8rem', marginLeft: '1rem', color: 'var(--accent-primary)', opacity: 0.8 }}>Updating...</span>}
                  </h2>
                  <select 
                    value={roleFilter} 
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--border-color)', outline: 'none' }}
                  >
                    {['All', 'Safe Lane', 'Mid Lane', 'Offlane', 'Support', 'Hard Support'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Select heroes for the Dire team to see real-time meta recommendations. Filter by role to find the perfect fit.
                </p>
                
                <div className="rec-list" style={{ opacity: calculating ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                  {calculating && recommendations.length === 0 ? (
                     <div className="loader" style={{ height: 'auto', padding: '2rem', width: '100%', gridColumn: '1 / -1' }}>
                        Fetching data & running algorithm...
                     </div>
                  ) : recommendations.length > 0 ? (
                    recommendations.filter(rec => heroHasRole(rec.hero.localized_name, roleFilter, rec.hero.roles || []))
                    .slice(0, 10)
                    .map((rec, i) => (
                      <div key={rec.hero.id} className="rec-card">
                        <img 
                          className="rec-img"
                          src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${rec.hero.name.replace('npc_dota_hero_', '')}.png`} 
                          alt={rec.hero.localized_name} 
                        />
                        <div className="rec-info">
                          <span className="rec-name">#{i + 1} {rec.hero.localized_name}</span>
                          <span className="rec-score" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <TrendingUp size={14} /> {rec.winRate.toFixed(1)}% Win Rate
                            {rec.synergyBonus > 0 && <span style={{ color: '#00ff88', marginLeft: '4px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>(+{rec.synergyBonus}% Synergy)</span>}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : direDraft.some(Boolean) ? (
                     <div className="loader" style={{ height: 'auto', padding: '1rem' }}>No data available or error fetching. Check console.</div>
                  ) : (
                     <div className="rec-card" style={{ opacity: 0.5 }}>
                       <div style={{ padding: '1rem' }}>Awaiting Dire inputs...</div>
                     </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="tab-content" style={{ padding: '1.5rem' }}>
                <BuildAnalyzer analyzedHero={analyzedHero} direDraft={direDraft} radiantDraft={radiantDraft} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
