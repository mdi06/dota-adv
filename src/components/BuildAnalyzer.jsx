import React, { useState, useEffect } from 'react';
import { analyzeTeamBuild } from '../utils/buildAnalyzer';
import { Shield, Zap, Crosshair, Heart, Swords, Activity } from 'lucide-react';

const SynergyCard = ({ title, type, analysis, icon }) => {
  if (!analysis) return null;

  const scoreColor = analysis.score > 2 ? 'text-radiant' : analysis.score > 0 ? 'text-amber-400' : 'text-gray-500';

  return (
    <div className="p-3 border border-gray-800 bg-[#161616]">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-800">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
          <span className={scoreColor}>{icon}</span> {title}
        </h4>
        <span className={`text-sm font-bold ${scoreColor}`}>Level {analysis.score}</span>
      </div>
      <div className="text-xs text-gray-500 leading-relaxed">
        {analysis.sources.length > 0 ? (
          <span>Sources: <span className="text-gray-300">{analysis.sources.join(', ')}</span></span>
        ) : (
          <span className="italic">No significant sources drafted.</span>
        )}
      </div>
    </div>
  );
};

const ItemPill = ({ item }) => (
  <div className="flex items-center gap-1.5 bg-[#252525] border border-gray-700 rounded px-1.5 py-1">
    <img 
      src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${item}.png`} 
      alt={item} 
      className="w-7 h-5 object-cover rounded shadow-sm border border-gray-900"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
    <span className="font-bold text-gray-200 text-[10px] uppercase tracking-wider">
      {item.split('_').join(' ')}
    </span>
  </div>
);

const BuildAnalyzer = ({ analyzedHero, teamDraft, direDraft }) => {
  const [analysis, setAnalysis] = useState(null);
  const [situational, setSituational] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [loadingBuild, setLoadingBuild] = useState(false);
  const [liveSynergy, setLiveSynergy] = useState(null);
  const [liveCounters, setLiveCounters] = useState([]);

  useEffect(() => {
    if (analyzedHero && teamDraft) {
      import('../utils/buildAnalyzer').then(({ analyzeTeamBuild }) => {
        setAnalysis(analyzeTeamBuild(analyzedHero, teamDraft));
      });

      setLoadingBuild(true);
      Promise.all([
        import('../api/stratz').then(m => m.getHeroItemBuilds(analyzedHero.id)),
        import('../api/stratz').then(m => m.getHeroMatchups(analyzedHero.id)),
        import('../utils/itemDictionary').then(m => m.fetchItemDictionary()),
        import('../utils/buildAnalyzer').then(m => m.generateItemRoadmap(analyzedHero))
      ]).then(([buildItemIds, matchups, dict, fallbackRoadmap]) => {
        
        // Compute Live Synergy and Counters
        import('../utils/buildAnalyzer').then(({ analyzeLiveSynergy, analyzeLiveCounters }) => {
          setLiveSynergy(analyzeLiveSynergy(analyzedHero, teamDraft, matchups));
          setLiveCounters(analyzeLiveCounters(analyzedHero, direDraft, matchups));
        });

        if (buildItemIds && buildItemIds.length > 0) {
          import('../utils/itemDictionary').then(({ getItemNameById }) => {
            const stringItems = buildItemIds.map(id => getItemNameById(id)).filter(Boolean);
            setRoadmap({ live: stringItems });
            setLoadingBuild(false);
          });
        } else {
          setRoadmap({ heuristic: fallbackRoadmap });
          setLoadingBuild(false);
        }
      }).catch(err => {
        console.error(err);
        import('../utils/buildAnalyzer').then(({ generateItemRoadmap }) => {
           setRoadmap({ heuristic: generateItemRoadmap(analyzedHero) });
           setLoadingBuild(false);
        });
      });
    }

    if (direDraft) {
      import('../utils/buildAnalyzer').then(({ analyzeSituationalBuild }) => {
        setSituational(analyzeSituationalBuild(direDraft, analyzedHero));
      });
    }
  }, [analyzedHero, teamDraft, direDraft]);

  if (!analysis) return null;

  const hasAnySuggestions = analysis.recommendations.length > 0 || situational.length > 0;

  return (
    <div className="mt-6 border border-gray-800 bg-[#111111] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-radiant" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Draft Synergy Analysis</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SynergyCard title="Auras & Teamfight" type="aura" analysis={analysis.aura} icon={<Shield size={16} />} />
        <SynergyCard title="Magic Output" type="magic" analysis={analysis.magic} icon={<Zap size={16} />} />
        <SynergyCard title="Physical Damage" type="physical" analysis={analysis.physical} icon={<Crosshair size={16} />} />
        <SynergyCard title="Sustain & Saves" type="save" analysis={analysis.save} icon={<Heart size={16} />} />
      </div>

      {liveSynergy && liveSynergy.details.length > 0 && (
        <div className="mb-6 p-4 border border-radiant/30 bg-radiant/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-radiant" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">True Synergy Score (Live Data)</span>
          </div>
          <span className={`text-lg font-bold ${liveSynergy.score > 0 ? 'text-radiant' : 'text-red-400'}`}>
            {liveSynergy.score > 0 ? '+' : ''}{liveSynergy.score}%
          </span>
        </div>
      )}

      {liveCounters && liveCounters.length > 0 && (
        <div className="mb-6 p-4 border border-gray-800 bg-[#161616]">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 pb-2 border-b border-gray-800/50">
            <Activity size={14} /> Hero Matchups vs Dire (Live Data)
          </h4>
          <div className="flex flex-col gap-2">
            {liveCounters.map(c => (
              <div key={c.hero.id} className="flex justify-between items-center text-xs text-gray-300 bg-[#111] p-2 border border-gray-800">
                <span className="flex items-center gap-2">
                  <img src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${c.hero.name.replace('npc_dota_hero_', '')}.png`} className="w-8 h-5 object-cover border border-gray-800" />
                  {c.hero.localized_name}
                </span>
                <span className={`font-bold ${c.advantage > 0 ? 'text-radiant' : 'text-dire'}`}>
                  {c.advantage > 0 ? '+' : ''}{c.advantage}% Advantage
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loadingBuild ? (
        <div className="mb-6 p-4 border border-gray-800 bg-[#161616] flex items-center justify-center min-h-[100px]">
           <div className="text-xs text-gray-400 animate-pulse">Loading live meta build from Stratz...</div>
        </div>
      ) : roadmap && roadmap.live && roadmap.live.length > 0 ? (
        <div className="mb-6 p-4 border border-gray-800 bg-[#161616]">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 pb-2 border-b border-gray-800/50">
            <Activity size={14} /> Most Popular Live Build (Stratz)
          </h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {roadmap.live.map((item, idx) => <ItemPill key={`roadmap-live-${idx}-${item}`} item={item} />)}
          </div>
        </div>
      ) : roadmap && roadmap.heuristic ? (
        <div className="mb-6 p-4 border border-gray-800 bg-[#161616]">
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 pb-2 border-b border-gray-800/50">
            <Activity size={14} /> Core Item Roadmap (Heuristic Fallback)
          </h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="w-12 text-[9px] font-bold text-gray-500 uppercase tracking-widest text-right">Early</span>
              <div className="flex flex-wrap gap-2">
                {roadmap.heuristic.early.map(item => <ItemPill key={`early-${item}`} item={item} />)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 text-[9px] font-bold text-radiant uppercase tracking-widest text-right">Core</span>
              <div className="flex flex-wrap gap-2">
                {roadmap.heuristic.core.map(item => <ItemPill key={`core-${item}`} item={item} />)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-12 text-[9px] font-bold text-amber-500 uppercase tracking-widest text-right">Late</span>
              <div className="flex flex-wrap gap-2">
                {roadmap.heuristic.late.map(item => <ItemPill key={`late-${item}`} item={item} />)}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="p-4 border border-gray-800 bg-[#161616]">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
          <Swords size={14} /> Situational Counters
        </h4>
        {hasAnySuggestions ? (
          <div className="space-y-4">
            {analysis.recommendations.length > 0 && (
              <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
                {analysis.recommendations.map((rec, i) => (
                  <li key={`rec-${i}`}>{rec}</li>
                ))}
              </ul>
            )}
            
            {situational.length > 0 && (
              <div className="space-y-3">
                {situational.map((sit, i) => (
                  <div key={`sit-${i}`} className="flex flex-col gap-1.5 p-2 bg-[#1a1a1a] border border-gray-800 rounded">
                    <div className="flex flex-wrap gap-2">
                      {sit.items.map(item => <ItemPill key={`sit-${i}-${item}`} item={item} />)}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{sit.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No specific situational items suggested.</p>
        )}
      </div>
    </div>
  );
};

export default BuildAnalyzer;
