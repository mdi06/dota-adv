// Simple Rules Engine to suggest situational items based on the enemy draft.

const SITUATIONAL_RULES = [
  {
    condition: (enemies) => enemies.some(h => ['Riki', 'Bounty Hunter', 'Weaver', 'Clinkz', 'Nyx Assassin', 'Treant Protector'].includes(h.localized_name)),
    suggestedItems: ['dust', 'ward_sentry', 'gem'],
    reason: "Enemy has invisibility. Prioritize detection.",
    targetRoles: ['Support', 'Nuker', 'Disabler', 'Initiator']
  },
  {
    condition: (enemies) => enemies.some(h => ['Phantom Assassin', 'Windranger', 'Brewmaster', 'Troll Warlord', 'Huskar'].includes(h.localized_name)),
    suggestedItems: ['monkey_king_bar', 'bloodthorn'],
    reason: "Enemy has high evasion. MKB is highly recommended.",
    targetRoles: ['Carry', 'Escape', 'Pusher']
  },
  {
    condition: (enemies) => enemies.some(h => ['Phantom Lancer', 'Naga Siren', 'Chaos Knight', 'Terrorblade'].includes(h.localized_name)),
    suggestedItems: ['mjollnir', 'shivas_guard', 'bfury'],
    reason: "Enemy relies on illusions. Consider AoE clear items.",
    targetRoles: ['Carry', 'Initiator', 'Durable', 'Pusher']
  },
  {
    condition: (enemies) => enemies.some(h => ['Zeus', 'Skywrath Mage', 'Pugna', 'Leshrac', 'Lion', 'Lina'].includes(h.localized_name)),
    suggestedItems: ['black_king_bar', 'pipe', 'glimmer_cape'],
    reason: "Heavy magical burst damage detected. Defensive items are crucial.",
    targetRoles: ['Carry', 'Support', 'Initiator', 'Durable', 'Escape', 'Nuker', 'Disabler', 'Pusher']
  },
  {
    condition: (enemies) => enemies.some(h => ['Lifestealer', 'Juggernaut', 'Ursa', 'Slark', 'Troll Warlord'].includes(h.localized_name)),
    suggestedItems: ['ghost', 'heavens_halberd', 'force_staff'],
    reason: "Enemy has heavy physical burst/lockdown. Defensive positioning items are needed.",
    targetRoles: ['Support', 'Nuker', 'Disabler', 'Initiator']
  },
  {
    condition: (enemies) => enemies.some(h => ['Slardar', 'Bounty Hunter', 'Templar Assassin'].includes(h.localized_name)),
    suggestedItems: ['manta', 'lotus_orb'],
    reason: "Enemy relies on tracking/armor-reduction debuffs. Dispels are highly effective.",
    targetRoles: ['Carry', 'Support', 'Escape', 'Durable', 'Initiator']
  }
];

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
      // Only suggest if the hero's roles intersect with the rule's target roles
      const matchesRole = analyzedHero.roles.some(role => rule.targetRoles.includes(role));
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
