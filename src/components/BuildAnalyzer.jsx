import React, { useEffect, useState } from 'react';
import { getItemConstants, getHeroItemPopularity } from '../api/opendota';
import { analyzeSituationalBuild, analyzeTeamBuild } from '../utils/buildAnalyzer';
import { Settings, Shield, Zap, Info, Users } from 'lucide-react';
import './BuildAnalyzer.css';

const BuildAnalyzer = ({ analyzedHero, direDraft, radiantDraft }) => {
  const [popularItems, setPopularItems] = useState(null);
  const [itemConstants, setItemConstants] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!analyzedHero) return;

    const loadData = async () => {
      setLoading(true);
      const [itemsObj, popularityObj] = await Promise.all([
        getItemConstants(),
        getHeroItemPopularity(analyzedHero.id)
      ]);
      setItemConstants(itemsObj);
      setPopularItems(popularityObj);
      setLoading(false);
    };

    loadData();
  }, [analyzedHero]);

  if (!analyzedHero) {
    return (
      <div className="build-analyzer-empty">
        <Settings size={48} opacity={0.2} />
        <h3>No Hero Selected</h3>
        <p>Draft a hero on Radiant and click them to analyze their build against the Dire.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loader">Analyzing Build for {analyzedHero.localized_name}...</div>;
  }

  const situational = analyzeSituationalBuild(direDraft);
  const teamSynergy = analyzeTeamBuild(analyzedHero, radiantDraft);

  // Helper to render an item by key or ID
  const renderItem = (itemKeyOrId) => {
    if (!itemConstants) return null;
    
    let itemData = itemConstants[itemKeyOrId];
    // If not found by string key, try finding by numeric ID (used by itemPopularity API)
    if (!itemData && !isNaN(itemKeyOrId)) {
      itemData = Object.values(itemConstants).find(i => i.id == itemKeyOrId);
    }

    if (!itemData) return null;

    const imgSrc = `https://cdn.cloudflare.steamstatic.com${itemData.img}`;
    return (
      <div className="item-card" key={itemKeyOrId}>
        <img src={imgSrc} alt={itemData.dname} />
        <div className="item-tooltip">
          <strong>{itemData.dname}</strong>
          <span>{itemData.cost} Gold</span>
        </div>
      </div>
    );
  };

  // OpenDota item_popular has: start_game_items, early_game_items, mid_game_items, late_game_items
  const getTopItems = (stage, count = 6) => {
    if (!popularItems || !popularItems[stage]) return [];
    return Object.entries(popularItems[stage])
      .sort((a, b) => b[1] - a[1]) // Sort by frequency
      .slice(0, count)
      .map(entry => entry[0]);
  };

  return (
    <div className="build-analyzer">
      <div className="build-section">
        <h3><Users size={16} /> Team Synergy & Warnings (Radiant)</h3>
        {teamSynergy.length > 0 ? (
          <div className="situational-list">
            {teamSynergy.map((sit, i) => (
              <div key={i} className={`situational-rule ${sit.type === 'warning' ? 'warning-box' : ''}`}>
                <p className="rule-reason"><Info size={14} /> {sit.reason}</p>
                <div className="rule-items">
                  {sit.items.map(renderItem)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-text">No specific team-item combos detected for your Radiant draft.</p>
        )}
      </div>

      <div className="build-section">
        <h3><Shield size={16} /> Situational Counters (vs Dire)</h3>
        {situational.length > 0 ? (
          <div className="situational-list">
            {situational.map((sit, i) => (
              <div key={i} className="situational-rule">
                <p className="rule-reason"><Info size={14} /> {sit.reason}</p>
                <div className="rule-items">
                  {sit.items.map(renderItem)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-text">No specific hard counters required for this enemy draft.</p>
        )}
      </div>

      <div className="build-section">
        <h3>Early Game / Laning</h3>
        <div className="item-row">
          {getTopItems('early_game_items').map(renderItem)}
        </div>
      </div>

      <div className="build-section">
        <h3>Mid Game Core</h3>
        <div className="item-row">
          {getTopItems('mid_game_items', 8).map(renderItem)}
        </div>
      </div>
      
      <div className="build-section">
        <h3>Late Game / Luxury</h3>
        <div className="item-row">
          {getTopItems('late_game_items').map(renderItem)}
        </div>
      </div>

    </div>
  );
};

export default BuildAnalyzer;
