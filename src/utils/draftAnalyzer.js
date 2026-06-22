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
