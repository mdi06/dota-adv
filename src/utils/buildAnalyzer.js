// Simple Rules Engine to suggest situational items based on the enemy draft.

const SITUATIONAL_RULES = [
  {
    condition: (enemies) => enemies.some(h => ['Riki', 'Bounty Hunter', 'Weaver', 'Clinkz', 'Nyx Assassin', 'Treant Protector'].includes(h.localized_name)),
    suggestedItems: ['dust', 'ward_sentry', 'gem'],
    reason: "Enemy has invisibility. Prioritize detection.",
    targetRoles: ['Support', 'Hard Support'] // Only tell supports to buy wards
  },
  {
    condition: (enemies) => enemies.some(h => ['Phantom Assassin', 'Windranger', 'Brewmaster', 'Troll Warlord', 'Huskar'].includes(h.localized_name)),
    suggestedItems: ['monkey_king_bar', 'bloodthorn'],
    reason: "Enemy has high evasion. MKB or Bloodthorn is highly recommended.",
    targetRoles: ['Safe Lane', 'Mid Lane'] // Cores buy MKB
  },
  {
    condition: (enemies) => enemies.some(h => ['Phantom Assassin', 'Windranger', 'Brewmaster', 'Troll Warlord', 'Huskar'].includes(h.localized_name)),
    suggestedItems: ['solar_crest', 'ghost'],
    reason: "Enemy has high physical burst and evasion. Defensive items needed.",
    targetRoles: ['Support', 'Hard Support', 'Offlane'] // Supports buy Solar Crest/Ghost
  },
  {
    condition: (enemies) => enemies.some(h => ['Phantom Lancer', 'Naga Siren', 'Chaos Knight', 'Terrorblade'].includes(h.localized_name)),
    suggestedItems: ['mjollnir', 'bfury'],
    reason: "Enemy relies on illusions. Consider AoE clear items.",
    targetRoles: ['Safe Lane', 'Mid Lane'] // Cores buy Mjollnir/Bfury
  },
  {
    condition: (enemies) => enemies.some(h => ['Phantom Lancer', 'Naga Siren', 'Chaos Knight', 'Terrorblade'].includes(h.localized_name)),
    suggestedItems: ['shivas_guard', 'crimson_guard'],
    reason: "Enemy relies on physical illusions. Aura defense is crucial.",
    targetRoles: ['Offlane'] // Offlane buys Shivas/Crimson
  },
  {
    condition: (enemies) => enemies.some(h => ['Zeus', 'Skywrath Mage', 'Pugna', 'Leshrac', 'Lion', 'Lina'].includes(h.localized_name)),
    suggestedItems: ['black_king_bar', 'mage_slayer'],
    reason: "Heavy magical burst damage detected.",
    targetRoles: ['Safe Lane', 'Mid Lane'] // Cores buy BKB/Mage Slayer
  },
  {
    condition: (enemies) => enemies.some(h => ['Zeus', 'Skywrath Mage', 'Pugna', 'Leshrac', 'Lion', 'Lina'].includes(h.localized_name)),
    suggestedItems: ['pipe', 'glimmer_cape', 'force_staff'],
    reason: "Heavy magical burst damage detected. Defensive items are crucial.",
    targetRoles: ['Support', 'Hard Support', 'Offlane'] // Supports/Offlane buy Pipe/Glimmer
  },
  {
    condition: (enemies) => enemies.some(h => ['Lifestealer', 'Juggernaut', 'Ursa', 'Slark', 'Troll Warlord'].includes(h.localized_name)),
    suggestedItems: ['ghost', 'heavens_halberd', 'force_staff'],
    reason: "Enemy has heavy physical burst/lockdown. Defensive positioning items are needed.",
    targetRoles: ['Support', 'Hard Support', 'Offlane']
  },
  {
    condition: (enemies) => enemies.some(h => ['Slardar', 'Bounty Hunter', 'Templar Assassin'].includes(h.localized_name)),
    suggestedItems: ['manta', 'black_king_bar'],
    reason: "Enemy relies on tracking/armor-reduction debuffs. Dispels are highly effective.",
    targetRoles: ['Safe Lane', 'Mid Lane']
  },
  {
    condition: (enemies) => enemies.some(h => ['Slardar', 'Bounty Hunter', 'Templar Assassin'].includes(h.localized_name)),
    suggestedItems: ['lotus_orb', 'euls'],
    reason: "Enemy relies on tracking/armor-reduction debuffs. Dispels are highly effective.",
    targetRoles: ['Offlane', 'Support', 'Hard Support']
  }
];

import { heroHasRole } from './heroPositions';

export const analyzeTeamBuild = (analyzedHero, radiantDraft) => {
  const teammates = radiantDraft.filter(Boolean);
  
  const result = {
    aura: { score: 0, sources: [] },
    magic: { score: 0, sources: [] },
    physical: { score: 0, sources: [] },
    save: { score: 0, sources: [] },
    recommendations: []
  };

  const auraCarriers = ['Underlord', 'Tidehunter', 'Centaur Warrunner', 'Dark Seer', 'Abaddon', 'Beastmaster', 'Doom', 'Legion Commander', 'Dragon Knight', 'Bristleback', 'Axe', 'Sand King', 'Slardar', 'Magnus', 'Brewmaster', 'Enigma'];
  const magicNukers = ['Zeus', 'Skywrath Mage', 'Pugna', 'Leshrac', 'Lion', 'Lina', 'Queen of Pain', 'Storm Spirit', 'Puck', 'Earthshaker', 'Keeper of the Light', 'Crystal Maiden', 'Jakiro', 'Lich', 'Venomancer', 'Phoenix'];
  const physicalCarriers = ['Phantom Assassin', 'Slardar', 'Templar Assassin', 'Weaver', 'Drow Ranger', 'Sniper', 'Troll Warlord', 'Bloodseeker', "Nature's Prophet", 'Ursa', 'Juggernaut', 'Faceless Void', 'Sven', 'Wraith King', 'Monkey King', 'Bristleback'];
  const saves = ['Oracle', 'Dazzle', 'Shadow Demon', 'Winter Wyvern', 'Omniknight', 'Abaddon'];

  teammates.forEach(h => {
    if (auraCarriers.includes(h.localized_name)) {
      result.aura.score += 1;
      result.aura.sources.push(h.localized_name);
    }
    if (magicNukers.includes(h.localized_name)) {
      result.magic.score += 1;
      result.magic.sources.push(h.localized_name);
    }
    if (physicalCarriers.includes(h.localized_name)) {
      result.physical.score += 1;
      result.physical.sources.push(h.localized_name);
    }
    if (saves.includes(h.localized_name)) {
      result.save.score += 1;
      result.save.sources.push(h.localized_name);
    }
  });

  // Deduplicate sources
  result.aura.sources = [...new Set(result.aura.sources)];
  result.magic.sources = [...new Set(result.magic.sources)];
  result.physical.sources = [...new Set(result.physical.sources)];
  result.save.sources = [...new Set(result.save.sources)];

  // Recommendations logic
  const isCarry = analyzedHero.roles.includes('Carry');
  const isSupport = analyzedHero.roles.includes('Support');

  if (result.aura.score >= 2 && auraCarriers.includes(analyzedHero.localized_name)) {
    result.recommendations.push("Duplicate Aura Warning: Coordinate to avoid buying duplicate Pipes or Crimson Guards.");
  } else if (result.aura.score === 0 && !isCarry) {
    result.recommendations.push("Consider building auras (Mekansm, Pipe) as your team lacks natural carriers.");
  }

  if (result.magic.score >= 2 && !isCarry) {
    result.recommendations.push("Magic Synergy: Veil or Shiva's Guard will heavily amplify your team's burst.");
  }
  
  if (result.physical.score >= 2 && !isCarry) {
    result.recommendations.push("Physical Synergy: Solar Crest or Assault Cuirass will amplify your heavy physical lineup.");
  }

  const hardCarries = ['Anti-Mage', 'Terrorblade', 'Phantom Lancer', 'Slark', 'Medusa', 'Spectre', 'Morphling', 'Luna'];
  const hasCarry = teammates.some(h => hardCarries.includes(h.localized_name));
  
  if (hasCarry && result.save.score === 0 && isSupport) {
    result.recommendations.push("Save Required: Your draft has a vulnerable carry and no natural saves. Prioritize Force Staff or Glimmer Cape.");
  }
  
  // Add some generic role-based recommendations so it's never empty
  if (result.recommendations.length === 0) {
    if (isCarry) {
      result.recommendations.push("Focus on your core farming items first to hit your power spikes.");
    } else if (isSupport) {
      result.recommendations.push("Prioritize vision (Wards/Smoke) and positioning items (Blink/Force Staff).");
    } else {
      result.recommendations.push("Adapt your build to be the frontline or initiator your team needs.");
    }
  }

  return result;
};

export const analyzeSituationalBuild = (direDraft, analyzedHero) => {
  const enemies = direDraft.filter(Boolean);
  const suggestions = [];

  if (!analyzedHero || !analyzedHero.roles) return suggestions;

  for (const rule of SITUATIONAL_RULES) {
    if (rule.condition(enemies)) {
      // Check if the hero matches ANY of the targetRoles for this rule
      const matchesRole = rule.targetRoles.some(targetRole => 
        heroHasRole(analyzedHero.localized_name, targetRole, analyzedHero.roles || [])
      );
      
      if (matchesRole) {
        suggestions.push({
          items: rule.suggestedItems,
          reason: rule.reason
        });
      }
    }
  }

  return suggestions;
};

export const generateItemRoadmap = (analyzedHero) => {
  if (!analyzedHero) return null;

  const isCarry = analyzedHero.roles.includes('Carry');
  const isSupport = analyzedHero.roles.includes('Support');
  const isOfflane = analyzedHero.roles.includes('Offlane') || analyzedHero.roles.includes('Initiator') || analyzedHero.roles.includes('Durable');
  
  const attr = analyzedHero.primary_attr; // 'agi', 'str', 'int', 'all'

  // Default fallback
  let early = ['magic_wand', 'boots', 'tpscroll'];
  let core = ['black_king_bar', 'blink'];
  let late = ['sphere', 'overwhelming_blink'];

  if (isSupport) {
    if (attr === 'int') {
      early = ['tranquil_boots', 'magic_wand', 'wind_lace'];
      core = ['force_staff', 'glimmer_cape', 'aether_lens'];
      late = ['sheepstick', 'aeon_disk', 'octarine_core'];
    } else {
      early = ['tranquil_boots', 'magic_wand', 'bracer'];
      core = ['pavise', 'force_staff', 'solar_crest'];
      late = ['lotus_orb', 'aeon_disk', 'crimson_guard'];
    }
  } else if (isCarry) {
    if (attr === 'agi') {
      early = ['wraith_band', 'power_treads', 'magic_wand'];
      core = ['manta', 'black_king_bar', 'skadi'];
      late = ['butterfly', 'satanic', 'abyssal_blade'];
    } else if (attr === 'str') {
      early = ['bracer', 'phase_boots', 'magic_wand'];
      core = ['armlet', 'black_king_bar', 'heavens_halberd'];
      late = ['heart', 'assault', 'overwhelming_blink'];
    } else {
      early = ['null_talisman', 'power_treads', 'magic_wand'];
      core = ['witch_blade', 'black_king_bar', 'shivas_guard'];
      late = ['sheepstick', 'bloodthorn', 'refresher'];
    }
  } else if (isOfflane) {
    early = ['bracer', 'phase_boots', 'magic_wand'];
    core = ['blink', 'vanguard', 'pipe'];
    late = ['shivas_guard', 'overwhelming_blink', 'assault'];
  } else {
    early = ['bottle', 'power_treads', 'magic_wand'];
    core = ['blink', 'black_king_bar', 'witch_blade'];
    late = ['sheepstick', 'octarine_core', 'shivas_guard'];
  }

  return { early, core, late };
};

export const analyzeLiveSynergy = (analyzedHero, teamDraft, matchupsData) => {
  if (!matchupsData || !analyzedHero) return null;

  const teammates = teamDraft.filter(h => h && h.id !== analyzedHero.id);
  
  const synergyData = teammates.map(teammate => {
    const matchup = matchupsData.find(m => m.vsHeroId === teammate.id);
    return {
      hero: teammate,
      synergy: matchup ? matchup.synergy : 0
    };
  });

  const totalSynergy = synergyData.reduce((sum, data) => sum + data.synergy, 0);
  const avgSynergy = teammates.length > 0 ? (totalSynergy / teammates.length).toFixed(2) : 0;

  return {
    score: avgSynergy,
    details: synergyData
  };
};

export const analyzeLiveCounters = (analyzedHero, direDraft, matchupsData) => {
  if (!matchupsData || !analyzedHero) return [];

  const enemies = direDraft.filter(Boolean);
  
  const counterData = enemies.map(enemy => {
    const matchup = matchupsData.find(m => m.vsHeroId === enemy.id);
    if (!matchup) return null;
    
    // winRate is analyzedHero's win rate against the enemy
    const advantage = matchup.winRate - 50; 
    
    return {
      hero: enemy,
      winRate: matchup.winRate,
      advantage: advantage.toFixed(2),
      matchCount: matchup.matchCount
    };
  }).filter(Boolean);

  // Sort by biggest advantage for analyzed hero
  return counterData.sort((a, b) => b.advantage - a.advantage);
};
