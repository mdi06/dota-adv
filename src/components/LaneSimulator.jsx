import React from 'react';
import { simulateLane } from '../utils/laneSimulator';
import { AlertTriangle, Swords } from 'lucide-react';
import './LaneSimulator.css';

const LaneSimulator = ({ radiantDraft, direDraft, matchupsData }) => {
  // Radiant Safe (0, 4) vs Dire Offlane (2, 3)
  const botLane = simulateLane(
    [radiantDraft[0], radiantDraft[4]], 
    [direDraft[2], direDraft[3]], 
    matchupsData
  );

  // Radiant Mid (1) vs Dire Mid (1)
  const midLane = simulateLane(
    [radiantDraft[1]], 
    [direDraft[1]], 
    matchupsData
  );

  // Radiant Offlane (2, 3) vs Dire Safe (0, 4)
  const topLane = simulateLane(
    [radiantDraft[2], radiantDraft[3]], 
    [direDraft[0], direDraft[4]], 
    matchupsData
  );

  const renderHeroAvatars = (heroes) => (
    <div className="lane-avatars">
      {heroes.map((h, i) => h ? (
        <img 
          key={i} 
          src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${h.name.replace('npc_dota_hero_', '')}.png`} 
          alt={h.localized_name} 
          title={h.localized_name}
          className="lane-hero-img"
        />
      ) : (
        <div key={i} className="empty-avatar">?</div>
      ))}
    </div>
  );

  const renderLane = (name, radHeroes, direHeroes, sim) => {
    // If no heroes are drafted on either side of the lane, hide it
    const hasRad = radHeroes.some(Boolean);
    const hasDire = direHeroes.some(Boolean);

    if (!hasRad && !hasDire) return null;

    return (
      <div className="lane-card">
        <div className="lane-header">
          <h4>{name}</h4>
          <span className={`lane-status ${sim.winner.toLowerCase().replace(' ', '-')}`}>{sim.winner}</span>
        </div>
        
        <div className="lane-matchup">
          <div className="lane-side radiant-side">
            {renderHeroAvatars(radHeroes)}
          </div>
          
          <div className="lane-vs"><Swords size={20} /></div>

          <div className="lane-side dire-side">
            {renderHeroAvatars(direHeroes)}
          </div>
        </div>

        <div className="tug-of-war-container">
          <div className="tug-of-war-bar radiant-bar" style={{ width: `${sim.score}%` }}></div>
          <div className="tug-of-war-bar dire-bar" style={{ width: `${100 - sim.score}%` }}></div>
          <div className="tug-of-war-center-marker"></div>
        </div>

        {sim.warning && (
          <div className="lane-warning">
            <AlertTriangle size={14} /> {sim.warning}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lane-simulator">
      <div className="simulator-intro">
        <p>Predicting the first 10 minutes of the game based on 2v2 and 1v1 hero matchups.</p>
      </div>

      <div className="lanes-container">
        {renderLane('Top Lane (Radiant Offlane vs Dire Safe)', [radiantDraft[2], radiantDraft[3]], [direDraft[0], direDraft[4]], topLane)}
        {renderLane('Mid Lane (1v1)', [radiantDraft[1]], [direDraft[1]], midLane)}
        {renderLane('Bottom Lane (Radiant Safe vs Dire Offlane)', [radiantDraft[0], radiantDraft[4]], [direDraft[2], direDraft[3]], botLane)}
      </div>
    </div>
  );
};

export default LaneSimulator;
