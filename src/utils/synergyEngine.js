const SYNERGIES = [
  {
    name: "AoE Wombo Combo",
    cores: ['Faceless Void', 'Enigma', 'Magnus', 'Tidehunter', 'Treant Protector', 'Dark Seer'],
    partners: ['Invoker', 'Lich', 'Phoenix', 'Snapfire', 'Witch Doctor', 'Earthshaker', 'Jakiro', 'Crystal Maiden', 'Leshrac', 'Luna', 'Gyrocopter'],
    bonus: 3.0
  },
  {
    name: "Minus Armor Assassination",
    cores: ['Slardar', 'Templar Assassin', 'Weaver', 'Bounty Hunter', 'Vengeful Spirit', 'Dazzle'],
    partners: ['Phantom Assassin', 'Drow Ranger', 'Slark', 'Troll Warlord', 'Monkey King', 'Wraith King', 'Sven', 'Alchemist', 'Bristleback'],
    bonus: 2.0
  },
  {
    name: "Global Catch & Gank",
    cores: ['Spectre', 'Zeus', "Nature's Prophet", 'Dawnbreaker', 'Invoker'],
    partners: ['Spirit Breaker', 'Batrider', 'Clockwerk', 'Legion Commander', 'Nyx Assassin', 'Bounty Hunter', 'Slardar', 'Bloodseeker'],
    bonus: 1.5
  },
  {
    name: "Save + Hypercarry",
    cores: ['Oracle', 'Dazzle', 'Shadow Demon', 'Winter Wyvern', 'Omniknight', 'Abaddon'],
    partners: ['Huskar', 'Terrorblade', 'Slark', 'Phantom Lancer', 'Troll Warlord', 'Anti-Mage', 'Medusa', 'Morphling'],
    bonus: 2.5
  },
  {
    name: "Zoo / Push Power",
    cores: ['Beastmaster', 'Lycan', 'Chen', 'Enchantress', 'Broodmother', 'Visage'],
    partners: ['Leshrac', 'Death Prophet', 'Pugna', 'Shadow Shaman', 'Luna', 'Troll Warlord', "Nature's Prophet", 'Jakiro'],
    bonus: 2.0
  }
];

export const calculateSynergyBonus = (potentialHeroName, radiantDraft) => {
  let totalBonus = 0;
  const triggeredCombos = [];
  const draftNames = radiantDraft.filter(Boolean).map(h => h.localized_name);
  
  if (draftNames.length === 0) return { totalBonus: 0, combos: [] };

  SYNERGIES.forEach(synergy => {
    // If the potential hero is a core for this synergy, check if a partner exists in the draft
    if (synergy.cores.includes(potentialHeroName)) {
      if (draftNames.some(name => synergy.partners.includes(name))) {
        totalBonus += synergy.bonus;
        triggeredCombos.push(synergy.name);
      }
    }
    // If the potential hero is a partner, check if a core exists in the draft
    if (synergy.partners.includes(potentialHeroName)) {
      if (draftNames.some(name => synergy.cores.includes(name))) {
        totalBonus += synergy.bonus;
        if (!triggeredCombos.includes(synergy.name)) {
          triggeredCombos.push(synergy.name);
        }
      }
    }
  });

  return { totalBonus, combos: triggeredCombos };
};
