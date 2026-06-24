import React, { useState, useEffect, useMemo } from 'react';
import { Search, ShieldAlert, ShieldCheck, Swords, X, TrendingUp, Zap, Target } from 'lucide-react';
import { getHeroMatchups } from './api/stratz';
import BuildAnalyzer from './components/BuildAnalyzer';
import LaneSimulator from './components/LaneSimulator';
import VoiceDrafting from './components/VoiceDrafting';
import DraftDiagnostics from './components/DraftDiagnostics';
import { heroHasRole, HERO_ROLES } from './utils/heroPositions';
import { calculateSynergyBonus } from './utils/synergyEngine';
import { analyzeDraft } from './utils/draftAnalyzer';

const OPENDOTA_HEROES_API = 'https://raw.githubusercontent.com/odota/dotaconstants/master/build/heroes.json';

function App() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('recs');
  const [analyzedHero, setAnalyzedHero] = useState(null);
  
  const [radiantDraft, setRadiantDraft] = useState([null, null, null, null, null]);
  const [direDraft, setDireDraft] = useState([null, null, null, null, null]);
  
  const [activeSlot, setActiveSlot] = useState({ team: 'radiant', index: 0 });
  const [matchupsData, setMatchupsData] = useState({});
  const [recommendations, setRecommendations] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    fetch(OPENDOTA_HEROES_API)
      .then(res => res.json())
      .then(data => {
        const heroesArray = Object.values(data);
        const sorted = heroesArray.sort((a, b) => a.localized_name.localeCompare(b.localized_name));
        setHeroes(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load heroes:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const calculateRecommendations = async () => {
      if (direDraft.every(h => h === null)) {
        setRecommendations([]);
        return;
      }

      setCalculating(true);
      setApiError(null);

      try {
        const candidateStats = {};
        const newMatchupsData = {};

        const enemies = direDraft.filter(Boolean);

        for (const enemy of enemies) {
          let matchups;
          try {
            matchups = await getHeroMatchups(enemy.id);
          } catch (e) {
            setApiError(e.message);
            setRecommendations([]);
            setCalculating(false);
            return;
          }
          if (!matchups) continue;

          newMatchupsData[enemy.id] = {};

          matchups.forEach(matchup => {
            const candidateId = matchup.vsHeroId;
            const games = matchup.matchCount;
            
            let enemyWins = 0;
            let enemyWinRateDec = 0;

            if (matchup.winCount !== undefined) {
              enemyWins = matchup.winCount;
              enemyWinRateDec = games > 0 ? enemyWins / games : 0;
            } else {
              enemyWinRateDec = matchup.winRate > 1 ? matchup.winRate / 100 : (matchup.winRate || 0);
              enemyWins = enemyWinRateDec * games;
            }
            
            newMatchupsData[enemy.id][candidateId] = (1 - enemyWinRateDec) - 0.5;

            if (!candidateStats[candidateId]) {
              candidateStats[candidateId] = { id: candidateId, totalGames: 0, enemyTotalWins: 0 };
            }
            candidateStats[candidateId].totalGames += games;
            candidateStats[candidateId].enemyTotalWins += enemyWins;
          });
        }
        
        setMatchupsData(newMatchupsData);

        const results = [];
        const draftedIds = new Set([
          ...radiantDraft.filter(Boolean).map(h => h.id),
          ...direDraft.filter(Boolean).map(h => h.id)
        ]);

        for (const [idStr, stats] of Object.entries(candidateStats)) {
          const id = parseInt(idStr, 10);
          if (draftedIds.has(id)) continue;

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

  const getSmartSlotIndex = (hero, currentDraft) => {
    const roles = HERO_ROLES[hero.localized_name] || [];
    for (const role of roles) {
      let targetIdx = -1;
      if (role === 'Safe Lane') targetIdx = 0;
      else if (role === 'Mid Lane') targetIdx = 1;
      else if (role === 'Offlane') targetIdx = 2;
      else if (role === 'Support') targetIdx = 3;
      else if (role === 'Hard Support') targetIdx = 4;

      if (targetIdx !== -1 && currentDraft[targetIdx] === null) {
        return targetIdx;
      }
    }
    return currentDraft.findIndex(h => h === null);
  };

  const handleVoiceDraft = (team, hero) => {
    if (team === 'radiant') {
      const newDraft = [...radiantDraft];
      const emptyIdx = getSmartSlotIndex(hero, newDraft);
      if (emptyIdx !== -1) {
        newDraft[emptyIdx] = hero;
        setRadiantDraft(newDraft);
      }
    } else {
      const newDraft = [...direDraft];
      const emptyIdx = getSmartSlotIndex(hero, newDraft);
      if (emptyIdx !== -1) {
        newDraft[emptyIdx] = hero;
        setDireDraft(newDraft);
      }
    }
  };

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
    <div className="min-h-screen bg-[#111111] text-gray-200 font-sans p-6">
      <header className="mb-6 pb-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-gray-100">Dota 2 Draft Assistant</h1>
          <div className="text-xs text-gray-500 font-mono mt-1">REAL-TIME META RECOMMENDATIONS VIA STRATZ API</div>
        </div>
        <VoiceDrafting heroes={heroes} onCommandParsed={handleVoiceDraft} />
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="border border-gray-800 bg-[#161616] p-5">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-800">Current Draft</h2>
            
            <div className="mb-8">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-radiant mb-3">
                <ShieldCheck size={18} /> Radiant (Your Team)
              </div>
              <div className="flex flex-col gap-2">
                {radiantDraft.map((hero, idx) => (
                  <div 
                    key={`rad-${idx}`} 
                    className={`relative flex items-center h-14 border cursor-pointer transition-colors ${activeSlot?.team === 'radiant' && activeSlot?.index === idx ? 'border-radiant bg-radiant/10' : 'border-gray-800 bg-[#1a1a1a] hover:border-gray-600'}`}
                    onClick={() => {
                      setActiveSlot({ team: 'radiant', index: idx });
                      if (hero) {
                        setAnalyzedHero(hero);
                        setActiveTab('build');
                      }
                    }}
                  >
                    <div className="absolute -left-[1px] top-0 bottom-0 w-1 bg-radiant opacity-50"></div>
                    <div className="w-6 shrink-0 h-full flex items-center justify-center border-r border-gray-800/50 bg-[#111] text-[10px] font-bold text-gray-600 leading-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      {['SAFE', 'MID', 'OFF', 'SUPP', 'HARD'][idx]}
                    </div>
                    {hero ? (
                      <div className="flex items-center w-full h-full pr-2">
                        <img className="h-full w-20 object-cover border-r border-gray-800" src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${hero.name.replace('npc_dota_hero_', '')}.png`} alt={hero.localized_name} />
                        <div className="flex flex-col justify-center px-3 overflow-hidden whitespace-nowrap">
                          <span className="font-bold text-sm text-gray-200 truncate">{hero.localized_name}</span>
                          <span className="text-[10px] text-gray-500 uppercase font-mono">{hero.roles?.slice(0, 2).join(', ')}</span>
                        </div>
                        <button className="ml-auto text-gray-500 hover:text-red-400 p-1" onClick={(e) => removeHero('radiant', idx, e)}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-gray-600 px-4 uppercase tracking-wider">Select Hero...</span>
                    )}
                  </div>
                ))}
              </div>
              
              {draftWarnings.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  {draftWarnings.map((warning, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2 text-xs font-semibold border ${warning.type === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                      <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                      <span>{warning.text}</span>
                    </div>
                  ))}
                </div>
              )}

              <DraftDiagnostics radiantDraft={radiantDraft} />
            </div>

            <div>
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-dire mb-3">
                <ShieldAlert size={18} /> Dire (Enemy Team)
              </div>
              <div className="flex flex-col gap-2">
                {direDraft.map((hero, idx) => (
                  <div 
                    key={`dire-${idx}`} 
                    className={`relative flex items-center h-14 border cursor-pointer transition-colors ${activeSlot?.team === 'dire' && activeSlot?.index === idx ? 'border-dire bg-dire/10' : 'border-gray-800 bg-[#1a1a1a] hover:border-gray-600'}`}
                    onClick={() => setActiveSlot({ team: 'dire', index: idx })}
                  >
                    <div className="absolute -left-[1px] top-0 bottom-0 w-1 bg-dire opacity-50"></div>
                    <div className="w-6 shrink-0 h-full flex items-center justify-center border-r border-gray-800/50 bg-[#111] text-[10px] font-bold text-gray-600 leading-none" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      {['SAFE', 'MID', 'OFF', 'SUPP', 'HARD'][idx]}
                    </div>
                    {hero ? (
                      <div className="flex items-center w-full h-full pr-2">
                        <img className="h-full w-20 object-cover border-r border-gray-800" src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${hero.name.replace('npc_dota_hero_', '')}.png`} alt={hero.localized_name} />
                        <div className="flex flex-col justify-center px-3 overflow-hidden whitespace-nowrap">
                          <span className="font-bold text-sm text-gray-200 truncate">{hero.localized_name}</span>
                          <span className="text-[10px] text-gray-500 uppercase font-mono">{hero.roles?.slice(0, 2).join(', ')}</span>
                        </div>
                        <button className="ml-auto text-gray-500 hover:text-red-400 p-1" onClick={(e) => removeHero('dire', idx, e)}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-mono text-gray-600 px-4 uppercase tracking-wider">Select Hero...</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <button className="mt-6 w-full py-2 border border-gray-700 bg-[#111] text-xs font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-800 hover:text-white transition-colors" onClick={handleClear}>
              Clear Draft
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col gap-6">
          <div className="border border-gray-800 bg-[#161616] p-5">
            <div className="flex items-center gap-3 border border-gray-700 bg-[#111] px-3 py-2 mb-5">
              <Search className="text-gray-500" size={18} />
              <input 
                type="text" 
                className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder-gray-600 font-mono"
                placeholder="SEARCH HEROES..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm font-mono text-gray-500">LOADING HERO DATA...</div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-2">
                {filteredHeroes.map(hero => (
                  !hero.isHidden && (
                    <div 
                      key={hero.id} 
                      className={`relative aspect-[4/3] border cursor-pointer group overflow-hidden ${hero.isDrafted ? 'border-gray-800 opacity-20 grayscale' : 'border-gray-700 hover:border-gray-300'}`}
                      onClick={() => !hero.isDrafted && handleHeroSelect(hero)}
                    >
                      <img 
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${hero.name.replace('npc_dota_hero_', '')}.png`} 
                        alt={hero.localized_name} 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-white leading-tight">{hero.localized_name}</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          <div className="border border-gray-800 bg-[#161616]">
            <div className="flex gap-4 border-b border-gray-800 mb-6 px-6 pt-6">
              <button
                onClick={() => setActiveTab('recs')}
                className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'recs' ? 'text-radiant border-b-2 border-radiant' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Swords size={16} /> Draft Recs
              </button>
              <button
                onClick={() => setActiveTab('lanes')}
                className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'lanes' ? 'text-radiant border-b-2 border-radiant' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Target size={16} /> Lane Sim
              </button>
              <button
                onClick={() => {
                  setActiveTab('build');
                  if (!analyzedHero) {
                    const firstHero = radiantDraft.find(h => h !== null);
                    if (firstHero) setAnalyzedHero(firstHero);
                  }
                }}
                className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'build' ? 'text-radiant border-b-2 border-radiant' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Zap size={16} /> Build Analyzer
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'recs' ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">
                      Top Counters Against Dire {calculating && <span className="text-radiant ml-2 text-[10px] animate-pulse">UPDATING...</span>}
                    </h3>
                    <select 
                      value={roleFilter} 
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="bg-[#161616] border border-gray-800 text-gray-400 text-xs px-3 py-1 uppercase font-mono cursor-pointer outline-none hover:border-gray-600 transition-colors"
                    >
                      {['All', 'Safe Lane', 'Mid Lane', 'Offlane', 'Support', 'Hard Support'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 transition-opacity ${calculating ? 'opacity-50' : 'opacity-100'}`}>
                    {apiError ? (
                       <div className="col-span-full p-8 border border-red-500/50 bg-red-500/10 font-mono text-sm text-red-400 break-words">
                          <p className="font-bold mb-2 uppercase">STRATZ API ERROR DETECTED:</p>
                          <p>{apiError}</p>
                          <p className="mt-4 text-xs text-red-400/80">Please send a screenshot of this box so I can fix the GraphQL query.</p>
                       </div>
                    ) : calculating && recommendations.length === 0 ? (
                       <div className="col-span-full p-8 text-center border border-gray-800 font-mono text-sm text-gray-500">
                          FETCHING STRATZ DATA...
                       </div>
                    ) : recommendations.length > 0 ? (
                      recommendations.filter(rec => heroHasRole(rec.hero.localized_name, roleFilter, rec.hero.roles || []))
                      .slice(0, 12)
                      .map((rec, i) => (
                        <div key={rec.hero.id} className="flex border border-gray-800 bg-[#111] hover:border-gray-600 transition-colors cursor-pointer" onClick={() => handleHeroSelect(rec.hero)}>
                          <img 
                            className="w-16 h-12 object-cover border-r border-gray-800"
                            src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${rec.hero.name.replace('npc_dota_hero_', '')}.png`} 
                            alt={rec.hero.localized_name} 
                          />
                          <div className="flex flex-col justify-center px-3 py-1 overflow-hidden">
                            <span className="font-bold text-xs text-gray-200 truncate uppercase tracking-wider">#{i + 1} {rec.hero.localized_name}</span>
                            <span className="flex items-center gap-1 text-[10px] font-mono mt-0.5 text-gray-400">
                              <TrendingUp size={10} className="text-gray-500" /> {rec.winRate.toFixed(1)}% WR
                              {rec.synergyBonus > 0 && <span className="text-radiant ml-1">(+{rec.synergyBonus}%)</span>}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : direDraft.some(Boolean) ? (
                       <div className="col-span-full p-8 text-center border border-gray-800 font-mono text-sm text-gray-500">NO MATCHUP DATA AVAILABLE.</div>
                    ) : (
                       <div className="col-span-full p-8 text-center border border-gray-800 font-mono text-sm text-gray-500">AWAITING ENEMY DRAFT INPUTS...</div>
                    )}
                  </div>
                </>
              ) : activeTab === 'lanes' ? (
                <LaneSimulator radiantDraft={radiantDraft} direDraft={direDraft} matchupsData={matchupsData} />
              ) : (
                <BuildAnalyzer analyzedHero={analyzedHero} teamDraft={radiantDraft} direDraft={direDraft} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
