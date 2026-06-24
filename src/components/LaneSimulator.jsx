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

  const radiantMid = [radiantDraft[1]].filter(Boolean);
  const direMid = [direDraft[1]].filter(Boolean);

  const radiantOfflane = [radiantDraft[2], radiantDraft[3]].filter(Boolean);
  const direSafe = [direDraft[0], direDraft[4]].filter(Boolean);

  const topLaneSimulation = simulateLane(radiantOfflane, direSafe, matchupsData);
  const midLaneSimulation = simulateLane(radiantMid, direMid, matchupsData);
  const botLaneSimulation = simulateLane(radiantSafe, direOfflane, matchupsData);

  return (
    <div className="mt-6 border border-gray-800 bg-[#111111] p-5">
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-800">
        <Swords size={18} className="text-gray-400" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-300">Advanced Lane Prediction (First 10 Mins)</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LaneResult title="Top Lane (Rad Off vs Dire Safe)" sim={topLaneSimulation} isSolo={false} />
        <LaneResult title="Mid Lane (Rad Mid vs Dire Mid)" sim={midLaneSimulation} isSolo={true} />
        <LaneResult title="Bot Lane (Rad Safe vs Dire Off)" sim={botLaneSimulation} isSolo={false} />
      </div>
    </div>
  );
};

const LaneResult = ({ title, sim, isSolo }) => {
  if (!sim) {
    return (
      <div className="p-4 border border-dashed border-gray-700 bg-[#161616] text-gray-500 text-xs text-center flex flex-col items-center justify-center gap-2 h-full min-h-[120px]">
        <span>Draft full {isSolo ? 'hero' : 'duo'} to simulate.</span>
      </div>
    );
  }

  const isWin = sim.score > 50;
  const isStomp = Math.abs(sim.score - 50) >= 5;
  const scoreColor = isWin ? 'text-radiant' : (sim.score === 50 ? 'text-gray-400' : 'text-dire');

  return (
    <div className={`p-4 border h-full ${sim.score === 50 ? 'border-gray-800 bg-[#161616]' : (isWin ? 'border-radiant/30 bg-radiant/5' : 'border-dire/30 bg-dire/5')}`}>
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</h4>
      
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800/50">
        <span className="text-[10px] uppercase font-bold text-gray-500">Predicted Outcome</span>
        <span className={`text-xs font-bold ${scoreColor}`}>
          {sim.winner}
        </span>
      </div>

      {isStomp && sim.score !== 50 && (
        <div className="flex items-start gap-2 mb-3 p-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-semibold leading-relaxed">
          <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
          <p>STOMP WARNING: The losing side will likely be crushed and forced out of lane early.</p>
        </div>
      )}

      {sim.details && sim.details.length > 0 && sim.score !== 50 && (
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Matchup Analysis:</span>
          <ul className="list-disc list-inside text-[10px] text-gray-300 space-y-1.5 leading-relaxed">
            {sim.details.map((detail, idx) => (
              <li key={idx} className={detail.includes('Radiant') ? 'text-radiant/80' : (detail.includes('Dire') ? 'text-dire/80' : 'text-gray-400')}>{detail}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LaneSimulator;
