import React from 'react';
import { calculateDraftScores } from '../utils/draftAnalyzer';
import { Shield, Zap, Target, Heart, Crosshair } from 'lucide-react';

const ProgressBar = ({ label, icon, value, colorClass, criticalThreshold = 25 }) => {
  const isCritical = value < criticalThreshold;
  const barColor = isCritical ? 'bg-red-500' : colorClass;
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <span className="flex items-center gap-2">
          {icon} {label}
        </span>
        <span className={`${isCritical ? 'text-red-500 animate-pulse' : 'text-gray-300'}`}>
          {value}%
        </span>
      </div>
      <div className={`w-full h-1.5 rounded-none overflow-hidden ${isCritical ? 'bg-red-500/20' : 'bg-gray-800'}`}>
        <div 
          className={`h-full transition-all duration-500 ${barColor}`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

const DraftDiagnostics = ({ radiantDraft }) => {
  const draftedCount = radiantDraft.filter(Boolean).length;
  if (draftedCount === 0) return null;

  const scores = calculateDraftScores(radiantDraft);

  const totalDmg = Math.max(1, scores.magicDmg + scores.physicalDmg);
  const physicalPct = Math.round((scores.physicalDmg / totalDmg) * 100);
  const magicPct = 100 - physicalPct;

  return (
    <div className="mt-6 p-4 border border-gray-800 bg-[#161616]">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">Draft Health</h3>
      
      <ProgressBar label="Control & Stuns" icon={<Target size={14} />} value={scores.control} colorClass="bg-cyan-400" criticalThreshold={draftedCount >= 3 ? 35 : 0} />
      <ProgressBar label="Tower Push" icon={<Zap size={14} />} value={scores.push} colorClass="bg-amber-400" criticalThreshold={draftedCount >= 4 ? 35 : 0} />
      <ProgressBar label="Frontline" icon={<Shield size={14} />} value={scores.frontline} colorClass="bg-green-400" criticalThreshold={draftedCount >= 3 ? 35 : 0} />
      <ProgressBar label="Sustain & Saves" icon={<Heart size={14} />} value={scores.sustain} colorClass="bg-pink-400" criticalThreshold={0} />
      
      <div className="mt-4 pt-4 border-t border-gray-800 border-dashed">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <Crosshair size={14} /> Damage Split
        </div>
        <div className="flex w-full h-3 bg-gray-800 overflow-hidden text-[9px] font-bold uppercase leading-3 text-center text-gray-900">
          <div className="bg-red-500 transition-all duration-500 overflow-hidden" style={{ width: `${physicalPct}%` }}>
            {physicalPct > 15 ? 'Phys' : ''}
          </div>
          <div className="bg-cyan-400 transition-all duration-500 overflow-hidden" style={{ width: `${magicPct}%` }}>
            {magicPct > 15 ? 'Magic' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraftDiagnostics;
