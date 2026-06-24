export const calculateDraftScores = (radiantDraft) => {
  const heroes = radiantDraft.filter(Boolean);
  
  // Base 0 for empty draft
  if (heroes.length === 0) {
    return { control: 0, push: 0, frontline: 0, sustain: 0, magicDmg: 0, physicalDmg: 0 };
  }

  let controlScore = 0;
  let pushScore = 0;
  let frontlineScore = 0;
  let sustainScore = 0;
  let magicDmg = 0;
  let physicalDmg = 0;

  heroes.forEach(h => {
    // Control / Stuns
    if (h.roles.includes('Disabler')) controlScore += 35;
    if (['Earthshaker', 'Lion', 'Shadow Shaman', 'Tidehunter', 'Enigma', 'Bane', 'Magnus', 'Faceless Void'].includes(h.localized_name)) controlScore += 20;

    // Tower Push
    if (h.roles.includes('Pusher')) pushScore += 35;
    if (['Leshrac', 'Luna', 'Tiny', 'Troll Warlord', 'Terrorblade', 'Sniper', "Nature's Prophet", 'Lycan', 'Broodmother', 'Lone Druid', 'Death Prophet'].includes(h.localized_name)) pushScore += 25;

    // Frontline
    if (h.roles.includes('Initiator') || h.roles.includes('Durable')) frontlineScore += 30;
    if (h.primary_attr === 'str') frontlineScore += 10;
    if (['Axe', 'Centaur Warrunner', 'Bristleback', 'Tidehunter', 'Underlord'].includes(h.localized_name)) frontlineScore += 20;

    // Sustain / Save
    if (['Dazzle', 'Oracle', 'Omniknight', 'Abaddon', 'Treant Protector', 'Winter Wyvern', 'Io', 'Chen', 'Enchantress', 'Warlock'].includes(h.localized_name)) sustainScore += 40;
    
    // Damage Types
    if (h.roles.includes('Nuker') || h.primary_attr === 'int') magicDmg += 25;
    if (h.roles.includes('Carry') && (h.primary_attr === 'agi' || h.primary_attr === 'str')) physicalDmg += 30;
  });

  return {
    control: Math.min(100, controlScore),
    push: Math.min(100, pushScore),
    frontline: Math.min(100, frontlineScore),
    sustain: Math.min(100, sustainScore),
    magicDmg: Math.min(100, magicDmg),
    physicalDmg: Math.min(100, physicalDmg)
  };
};

export const analyzeDraft = (radiantDraft) => {
  const heroes = radiantDraft.filter(Boolean);
  const warnings = [];

  if (heroes.length < 2) return warnings; // Don't warn until we have at least 2 heroes

  const meleeCount = heroes.filter(h => h.attack_type === 'Melee').length;
  if (meleeCount >= 4) {
    warnings.push({
      type: 'warning',
      text: 'Too much Melee! Extremely vulnerable to AoE spells and kiting.'
    });
  }

  const disablersCount = heroes.filter(h => h.roles.includes('Disabler')).length;
  if (heroes.length >= 3 && disablersCount < 1) {
    warnings.push({
      type: 'critical',
      text: 'Lacks Stuns/Catch! Enemy mobile heroes will escape easily.'
    });
  }

  const squishyInt = heroes.filter(h => h.primary_attr === 'int' && !h.roles.includes('Durable')).length;
  if (squishyInt >= 3) {
    warnings.push({
      type: 'warning',
      text: 'Squishy Lineup! High risk against physical burst or gap-closers.'
    });
  }

  const pusherCount = heroes.filter(h => h.roles.includes('Pusher') || ['Leshrac', 'Luna', 'Tiny', 'Troll Warlord', 'Terrorblade', 'Sniper'].includes(h.localized_name)).length;
  if (heroes.length >= 4 && pusherCount === 0) {
    warnings.push({
      type: 'warning',
      text: 'Low Building Damage! You may struggle to finish the game after winning teamfights.'
    });
  }

  const frontlinerCount = heroes.filter(h => h.roles.includes('Initiator') || h.roles.includes('Durable')).length;
  if (heroes.length >= 4 && frontlinerCount === 0) {
    warnings.push({
      type: 'critical',
      text: 'No Frontline! Your team lacks heroes who can safely start fights or tank spells.'
    });
  }

  return warnings;
};
