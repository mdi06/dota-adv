// Calculate raw advantage from matchups data
const getMatchupScore = (heroId, enemyId, matchupsData) => {
  if (!matchupsData || !matchupsData[enemyId]) return 0;
  const match = matchupsData[enemyId][heroId];
  if (!match) return 0;
  return match;
};

// Calculate 2v2 or 1v1 lane dominance
export const simulateLane = (radiantHeroes, direHeroes, matchupsData) => {
  const rad = radiantHeroes.filter(Boolean);
  const dire = direHeroes.filter(Boolean);

  if (rad.length === 0 || dire.length === 0) {
    return { score: 50, winner: 'Even', warning: null, details: [] };
  }

  let radAdvantageTotal = 0;
  let comparisons = 0;

  rad.forEach(r => {
    dire.forEach(d => {
      radAdvantageTotal += getMatchupScore(r.id, d.id, matchupsData);
      comparisons++;
    });
  });

  const avgAdvantage = comparisons > 0 ? (radAdvantageTotal / comparisons) : 0;
  const baseWinRate = 50 + (avgAdvantage * 100);
  const finalScore = Math.max(30, Math.min(70, baseWinRate));

  let winner = 'Even';
  let warning = null;

  if (finalScore >= 56) {
    winner = 'Radiant Dominating';
  } else if (finalScore <= 44) {
    winner = 'Dire Dominating';
    warning = 'Your lane is severely countered. Consider swapping lanes or playing defensive.';
  } else if (finalScore > 51.5) {
    winner = 'Radiant Advantaged';
  } else if (finalScore < 48.5) {
    winner = 'Dire Advantaged';
  }

  // Heuristic Details
  const details = [];
  const getHeuristicScore = (heroes, checkFn) => heroes.reduce((acc, h) => acc + checkFn(h), 0);
  
  const sustainCheck = h => ['Dazzle', 'Oracle', 'Omniknight', 'Abaddon', 'Treant Protector', 'Winter Wyvern', 'Io', 'Chen', 'Enchantress', 'Warlock'].includes(h.localized_name) ? 1 : 0;
  const burstCheck = h => (h.roles.includes('Nuker') ? 1 : 0);
  const rangeCheck = h => (h.attack_type === 'Ranged' ? 1 : 0);
  
  const radSustain = getHeuristicScore(rad, sustainCheck);
  const direSustain = getHeuristicScore(dire, sustainCheck);
  
  if (radSustain > direSustain) details.push('Radiant has superior lane sustain.');
  else if (direSustain > radSustain) details.push('Dire has superior lane sustain. Harass carefully.');
  
  const radBurst = getHeuristicScore(rad, burstCheck);
  const direBurst = getHeuristicScore(dire, burstCheck);
  
  if (radBurst > direBurst) details.push('Radiant has higher kill threat with burst damage.');
  else if (direBurst > radBurst) details.push('Dire has dangerous burst potential. Watch your HP.');
  
  const radRanged = getHeuristicScore(rad, rangeCheck);
  const direRanged = getHeuristicScore(dire, rangeCheck);
  
  if (radRanged > direRanged && direRanged === 0) details.push('Radiant has range advantage against double melee.');
  else if (direRanged > radRanged && radRanged === 0) details.push('Radiant is double melee against ranged. Very tough lane.');

  if (details.length === 0) {
    details.push('Traditional lane matchup. Heavily reliant on player execution.');
  }

  return { score: finalScore, winner, warning, details };
};
