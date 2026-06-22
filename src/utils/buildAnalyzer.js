// Simple Rules Engine to suggest situational items based on the enemy draft.

const SITUATIONAL_RULES = [
  {
    condition: (enemies) => enemies.some(h => ['Riki', 'Bounty Hunter', 'Weaver', 'Clinkz', 'Nyx Assassin', 'Treant Protector'].includes(h.localized_name)),
    suggestedItems: ['dust', 'ward_sentry', 'gem'],
    reason: "Enemy has invisibility. Prioritize detection."
  },
  {
    condition: (enemies) => enemies.some(h => ['Phantom Assassin', 'Windranger', 'Brewmaster', 'Troll Warlord', 'Huskar'].includes(h.localized_name)),
    suggestedItems: ['monkey_king_bar', 'bloodthorn'],
    reason: "Enemy has high evasion. MKB is highly recommended."
  },
  {
    condition: (enemies) => enemies.some(h => ['Phantom Lancer', 'Naga Siren', 'Chaos Knight', 'Terrorblade'].includes(h.localized_name)),
    suggestedItems: ['mjollnir', 'shivas_guard', 'bfury'],
    reason: "Enemy relies on illusions. Consider AoE clear items."
  },
  {
    condition: (enemies) => enemies.some(h => ['Zeus', 'Skywrath Mage', 'Pugna', 'Leshrac', 'Lion', 'Lina'].includes(h.localized_name)),
    suggestedItems: ['black_king_bar', 'pipe', 'glimmer_cape'],
    reason: "Heavy magical burst damage detected. BKB or Pipe are crucial."
  },
  {
    condition: (enemies) => enemies.some(h => ['Lifestealer', 'Juggernaut', 'Ursa', 'Slark', 'Troll Warlord'].includes(h.localized_name)),
    suggestedItems: ['ghost', 'heavens_halberd', 'force_staff'],
    reason: "Enemy has heavy physical burst/lockdown. Defensive positioning items are needed."
  },
  {
    condition: (enemies) => enemies.some(h => ['Slardar', 'Bounty Hunter', 'Templar Assassin'].includes(h.localized_name)),
    suggestedItems: ['manta', 'lotus_orb'],
    reason: "Enemy relies on tracking/armor-reduction debuffs. Dispels are highly effective."
  }
];

const TEAM_RULES = [
  {
    condition: (analyzedHero, teammates) => {
      // Aura conflict: If analyzing a natural aura carrier, check if another aura carrier exists
      const auraCarriers = ['Underlord', 'Tidehunter', 'Centaur Warrunner', 'Dark Seer', 'Abaddon', 'Beastmaster', 'Doom', 'Legion Commander', 'Dragon Knight', 'Bristleback', 'Axe', 'Sand King', 'Slardar', 'Magnus', 'Brewmaster', 'Enigma'];
      return auraCarriers.includes(analyzedHero.localized_name) && teammates.some(h => auraCarriers.includes(h.localized_name));
    },
    suggestedItems: ['pipe', 'crimson_guard', 'guardian_greaves'],
    reason: "Duplicate Aura Warning: Your team has multiple natural aura builders. Coordinate to avoid buying duplicate Pipes or Crimson Guards.",
    type: "warning"
  },
  {
    condition: (analyzedHero, teammates) => {
      // Magic Amp: 3+ magic nukers
      const magicNukers = ['Zeus', 'Skywrath Mage', 'Pugna', 'Leshrac', 'Lion', 'Lina', 'Queen of Pain', 'Storm Spirit', 'Puck', 'Earthshaker', 'Keeper of the Light', 'Crystal Maiden', 'Jakiro', 'Lich', 'Venomancer', 'Phoenix'];
      const magicCount = teammates.filter(h => magicNukers.includes(h.localized_name)).length;
      return magicCount >= 2 && !['Carry'].some(r => analyzedHero.roles.includes(r));
    },
    suggestedItems: ['veil_of_discord', 'shivas_guard'],
    reason: "Magic Synergy: Your team deals massive magic damage. Veil or Shiva's Guard will heavily amplify their burst.",
    type: "suggestion"
  },
  {
    condition: (analyzedHero, teammates) => {
      // Physical Amp: Minus armor heroes or heavy physical
      const physicalCarriers = ['Phantom Assassin', 'Slardar', 'Templar Assassin', 'Weaver', 'Drow Ranger', 'Sniper', 'Troll Warlord', 'Bloodseeker', "Nature's Prophet", 'Ursa', 'Juggernaut', 'Faceless Void', 'Sven', 'Wraith King', 'Monkey King', 'Bristleback'];
      const physCount = teammates.filter(h => physicalCarriers.includes(h.localized_name)).length;
      return physCount >= 2 && !['Carry'].some(r => analyzedHero.roles.includes(r));
    },
    suggestedItems: ['solar_crest', 'assault'],
    reason: "Physical Synergy: Your team relies on physical damage and armor reduction. Solar Crest or Assault Cuirass will secure kills.",
    type: "suggestion"
  },
  {
    condition: (analyzedHero, teammates) => {
      // Save needed: Hard carry without natural saves
      const hardCarries = ['Anti-Mage', 'Terrorblade', 'Phantom Lancer', 'Slark', 'Medusa', 'Spectre', 'Morphling', 'Bloodseeker', 'Juggernaut', 'Lifestealer', 'Faceless Void', 'Sven', 'Wraith King', 'Ursa', 'Monkey King', 'Luna', 'Gyrocopter'];
      const saves = ['Oracle', 'Dazzle', 'Shadow Demon', 'Winter Wyvern', 'Omniknight'];
      const hasCarry = teammates.some(h => hardCarries.includes(h.localized_name));
      const lacksSave = !teammates.some(h => saves.includes(h.localized_name));
      return hasCarry && lacksSave && analyzedHero.roles.includes('Support');
    },
    suggestedItems: ['force_staff', 'glimmer_cape', 'pavise'],
    reason: "Save Required: Your draft has a vulnerable hard carry and no natural defensive supports. Prioritize save items.",
    type: "suggestion"
  }
];

export const analyzeTeamBuild = (analyzedHero, radiantDraft) => {
  const teammates = radiantDraft.filter(Boolean).filter(h => h.id !== analyzedHero.id);
  const suggestions = [];

  for (const rule of TEAM_RULES) {
    if (rule.condition(analyzedHero, teammates)) {
      suggestions.push({
        items: rule.suggestedItems,
        reason: rule.reason,
        type: rule.type
      });
    }
  }

  return suggestions;
};

export const analyzeSituationalBuild = (direDraft) => {
  const enemies = direDraft.filter(Boolean);
  const suggestions = [];

  for (const rule of SITUATIONAL_RULES) {
    if (rule.condition(enemies)) {
      suggestions.push({
        items: rule.suggestedItems,
        reason: rule.reason
      });
    }
  }

  return suggestions;
};
