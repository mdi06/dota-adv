// Calculate raw advantage from matchups data
const getMatchupScore = (heroId, enemyId, matchupsData) => {
  if (!matchupsData || !matchupsData[enemyId]) return 0;
  const match = matchupsData[enemyId][heroId];
  if (!match) return 0;

  // match is the advantage decimal (e.g. 0.035 meaning 3.5% advantage)
  return match;
};

// Calculate 2v2 or 1v1 lane dominance
export const simulateLane = (radiantHeroes, direHeroes, matchupsData) => {
  const rad = radiantHeroes.filter(Boolean);
  const dire = direHeroes.filter(Boolean);

  if (rad.length === 0 || dire.length === 0) {
    return { score: 50, winner: 'Even', warning: null };
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
  // Convert advantage decimal (e.g. 0.05) to win rate percentage (e.g. 55%)
  const baseWinRate = 50 + (avgAdvantage * 100);
  
  // Clamp to realistic bounds (30% to 70%)
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

  return { score: finalScore, winner, warning };
};
