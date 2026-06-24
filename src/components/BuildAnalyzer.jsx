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

const BuildAnalyzer = ({ analyzedHero, teamDraft, direDraft }) => {
  const [analysis, setAnalysis] = useState(null);
  const [situational, setSituational] = useState([]);

  useEffect(() => {
    if (analyzedHero && teamDraft) {
      const result = analyzeTeamBuild(analyzedHero, teamDraft);
      setAnalysis(result);
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

      <div className="p-4 border border-gray-800 bg-[#161616]">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
          <Swords size={14} /> Suggested Items for {analyzedHero.localized_name}
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
                      {sit.items.map(item => (
                        <div key={item} className="flex items-center gap-1.5 bg-[#252525] border border-gray-700 rounded px-1.5 py-1">
                          <img 
                            src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${item}.png`} 
                            alt={item} 
                            className="w-7 h-5 object-cover rounded shadow-sm border border-gray-900"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <span className="font-bold text-dire text-[10px] uppercase tracking-wider">
                            {item.split('_').join(' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{sit.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No specific items suggested for {analyzedHero.localized_name} in this matchup.</p>
        )}
      </div>
    </div>
  );
};

export default BuildAnalyzer;
