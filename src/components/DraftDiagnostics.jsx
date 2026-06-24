import React from 'react';
import { calculateDraftScores } from '../utils/draftAnalyzer';
import { Crosshair } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

const DraftDiagnostics = ({ radiantDraft }) => {
  const draftedCount = radiantDraft.filter(Boolean).length;
  if (draftedCount === 0) return null;

  const scores = calculateDraftScores(radiantDraft);

  const totalDmg = Math.max(1, scores.magicDmg + scores.physicalDmg);
  const physicalPct = Math.round((scores.physicalDmg / totalDmg) * 100);
  const magicPct = 100 - physicalPct;

  const chartData = [
    { subject: 'Control', value: scores.control },
    { subject: 'Push', value: scores.push },
    { subject: 'Sustain', value: scores.sustain },
    { subject: 'Damage', value: Math.min(100, scores.magicDmg + scores.physicalDmg) },
    { subject: 'Frontline', value: scores.frontline }
  ];

  return (
    <div className="mt-6 p-4 border border-gray-800 bg-[#161616]">
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">Draft Balance</h3>
      
      <div className="w-full h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 9, fontWeight: 700 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Draft" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="pt-3 border-t border-gray-800 border-dashed">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <Crosshair size={14} /> Damage Split
        </div>
        <div className="flex w-full h-3 bg-gray-800 overflow-hidden text-[9px] font-bold uppercase leading-3 text-center text-gray-900 rounded-sm">
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
