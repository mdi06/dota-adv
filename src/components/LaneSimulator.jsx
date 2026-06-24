import React from 'react';
import { simulateLane } from '../utils/laneSimulator';
import { Swords, ShieldAlert } from 'lucide-react';

const LaneSimulator = ({ radiantDraft, direDraft, matchupsData }) => {
  if (!matchupsData || Object.keys(matchupsData).length === 0) {
    return <div className="p-4 border border-gray-800 bg-[#161616] text-gray-500 text-sm text-center">Loading lane matchup data...</div>;
  }

  // Find Safe Lane / Offlane duos
  const radiantSafe = [radiantDraft[0], radiantDraft[4]].filter(Boolean);
  const direOfflane = [direDraft[2], direDraft[3]].filter(Boolean);

  const radiantOfflane = [radiantDraft[2], radiantDraft[3]].filter(Boolean);
  const direSafe = [direDraft[0], direDraft[4]].filter(Boolean);

  const topLaneSimulation = simulateLane(radiantSafe, direOfflane, matchupsData);
  const botLaneSimulation = simulateLane(radiantOfflane, direSafe, matchupsData);

  return (
    <div className="mt-6 border border-gray-800 bg-[#111111] p-5">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-800">
        <Swords size={18} className="text-gray-400" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Laning Phase Simulator (First 10 Mins)</h3>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <LaneResult title="Top Lane (Radiant Safe vs Dire Offlane)" sim={topLaneSimulation} />
        <LaneResult title="Bottom Lane (Radiant Offlane vs Dire Safe)" sim={botLaneSimulation} />
      </div>
    </div>
  );
};

const LaneResult = ({ title, sim }) => {
  if (!sim) {
    return (
      <div className="p-4 border border-dashed border-gray-700 bg-[#161616] text-gray-500 text-xs text-center flex flex-col items-center justify-center gap-2 h-full min-h-[120px]">
        <span>Draft full duo to simulate.</span>
      </div>
    );
  }

  const isWin = sim.score > 0;
  const isStomp = Math.abs(sim.score) >= 5;
  const scoreColor = isWin ? 'text-radiant' : 'text-dire';

  return (
    <div className={`p-4 border ${isWin ? 'border-radiant/30 bg-radiant/5' : 'border-dire/30 bg-dire/5'}`}>
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{title}</h4>
      
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800/50">
        <span className="text-xs uppercase font-bold text-gray-500">Predicted Outcome</span>
        <span className={`text-sm font-bold ${scoreColor}`}>
          {isWin ? 'Radiant Advantage' : 'Dire Advantage'}
        </span>
      </div>

      {isStomp && (
        <div className="flex items-start gap-2 mb-3 p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
          <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
          <p>STOMP WARNING: The losing duo will likely be crushed and forced out of lane.</p>
        </div>
      )}

      {sim.details && sim.details.length > 0 && (
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 block">Key Interactions:</span>
          <ul className="list-disc list-inside text-xs text-gray-300 space-y-1">
            {sim.details.map((detail, idx) => (
              <li key={idx} className={detail.includes('Radiant') ? 'text-radiant/80' : 'text-dire/80'}>{detail}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LaneSimulator;
