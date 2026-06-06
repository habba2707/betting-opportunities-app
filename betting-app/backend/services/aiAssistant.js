const db = require('../db');

// Simple AI explanation generator (template-based for now; can be extended with OpenAI/Grok API)
async function generateExplanation(opportunity) {
  const { type, description, expected_profit, home_team, away_team } = opportunity;
  
  let explanation = '';
  
  switch(type) {
    case 'arbitrage':
      explanation = `This is a guaranteed profit opportunity! Bet on ${home_team} at the highest odds from one bookie and ${away_team} at the other. The combined implied probability is less than 100%, locking in profit regardless of outcome. Expected profit: ~${expected_profit.toFixed(1)}%. Stake proportionally.`;
      break;
    case 'matched_bet':
      explanation = `Excellent matched betting spot. Place your free bet or bonus on ${description}. Lay the opposing outcome on an exchange like Betfair to guarantee profit. Use a free bet calculator for exact stakes.`;
      break;
    case 'bonus_conversion':
      explanation = `Use this qualifying bet on ${home_team} vs ${away_team} to meet your bonus wagering requirements with low risk. Target mid-odds to minimize variance while completing rollover.`;
      break;
    default:
      explanation = `Strong value opportunity on ${description}. Consider this bet as part of your strategy.`;
  }
  
  return explanation;
}

// Add to opportunities or fetch with AI
async function enrichOpportunitiesWithAI(opps) {
  for (let category in opps) {
    for (let opp of opps[category]) {
      opp.aiExplanation = await generateExplanation(opp);
    }
  }
  return opps;
}

module.exports = {
  generateExplanation,
  enrichOpportunitiesWithAI
};
