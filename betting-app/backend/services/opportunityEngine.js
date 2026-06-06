const db = require('../db');

// Find arbitrage opportunities
async function findArbitrageOpportunities() {
  const query = `
    WITH best_odds AS (
      SELECT 
        event_id,
        market_type,
        selection,
        MAX(odds) as best_odds,
        ARRAY_AGG(DISTINCT bookmaker_id) as bookmakers
      FROM odds
      GROUP BY event_id, market_type, selection
    ),
    arb_candidates AS (
      SELECT 
        bo1.event_id,
        bo1.market_type,
        bo1.selection as home_selection,
        bo2.selection as away_selection,
        bo1.best_odds as home_odds,
        bo2.best_odds as away_odds,
        (1 / bo1.best_odds + 1 / bo2.best_odds) as implied_prob_sum
      FROM best_odds bo1
      JOIN best_odds bo2 ON bo1.event_id = bo2.event_id 
        AND bo1.market_type = bo2.market_type
        AND bo1.selection != bo2.selection
      WHERE bo1.market_type = 'h2h'
    )
    SELECT 
      ac.*,
      e.home_team,
      e.away_team,
      e.start_time
    FROM arb_candidates ac
    JOIN events e ON ac.event_id = e.id
    WHERE ac.implied_prob_sum < 0.99  -- Arbitrage threshold
    ORDER BY ac.implied_prob_sum ASC;
  `;

  const result = await db.query(query);
  const arbs = result.rows;

  // Save opportunities
  for (const arb of arbs) {
    const profit = ((1 / arb.home_odds) + (1 / arb.away_odds) - 1) * -100; // % profit
    await db.query(
      `INSERT INTO opportunities (event_id, type, description, expected_profit, confidence)
       VALUES ($1, 'arbitrage', $2, $3, 85.0)
       ON CONFLICT DO NOTHING`,
      [arb.event_id, 
       `Arb: ${arb.home_team} @ ${arb.home_odds} vs ${arb.away_team} @ ${arb.away_odds}`, 
       profit]
    );
  }

  return arbs;
}

// Find value bets (simple example)
async function findValueBets() {
  // Placeholder - compare to fair odds or model
  const query = `
    SELECT o.*, e.home_team, e.away_team
    FROM odds o
    JOIN events e ON o.event_id = e.id
    WHERE o.odds > 2.0 AND o.market_type = 'h2h'  -- Example threshold
    LIMIT 20;
  `;
  const result = await db.query(query);
  return result.rows;
}

// Matched Betting Logic
// Simplified: Find opportunities where a free bet or bonus can be used with back/lay or opposing bets
async function findMatchedBetOpportunities() {
  // For demo: Find events with good odds for back (bookie) and potential lay (exchange)
  // In production, integrate with Betfair API or assume exchange odds
  const query = `
    WITH bookie_odds AS (
      SELECT 
        event_id,
        selection,
        MAX(odds) as best_back_odds
      FROM odds 
      WHERE market_type = 'h2h'
      GROUP BY event_id, selection
    )
    SELECT 
      bo.event_id,
      e.home_team,
      e.away_team,
      bo.selection,
      bo.best_back_odds,
      (1 / bo.best_back_odds) as implied_prob
    FROM bookie_odds bo
    JOIN events e ON bo.event_id = e.id
    WHERE bo.best_back_odds > 1.8  -- Reasonable for matched betting
    ORDER BY bo.best_back_odds DESC
    LIMIT 15;
  `;

  const result = await db.query(query);
  const matches = result.rows;

  // Save as opportunities
  for (const match of matches) {
    const stake = 100; // example
    const expected_profit = 20; // placeholder % or $ 
    await db.query(
      `INSERT INTO opportunities (event_id, type, description, expected_profit, confidence)
       VALUES ($1, 'matched_bet', $2, $3, 70.0)
       ON CONFLICT DO NOTHING`,
      [match.event_id, 
       `Matched Bet: ${match.selection} on ${match.home_team} vs ${match.away_team} @ ${match.best_back_odds} (use free bet)`, 
       expected_profit]
    );
  }

  return matches;
}

// Bonus Converter Logic
// Logic to identify bonuses and calculate qualifying bets / profit
async function findBonusConversionOpportunities() {
  // Placeholder logic based on bookmakers known for bonuses
  // In real app: Track user bonuses, calculate rollover requirements
  const query = `
    SELECT DISTINCT 
      b.name as bookmaker,
      e.id as event_id,
      e.home_team,
      e.away_team,
      MAX(o.odds) as best_odds
    FROM bookmakers b
    JOIN odds o ON o.bookmaker_id = b.id
    JOIN events e ON o.event_id = e.id
    WHERE b.name ILIKE ANY(ARRAY['%bet365%', '%draftkings%', '%fanduel%']) -- Bonus-friendly bookies
      AND o.odds BETWEEN 1.5 AND 3.0  -- Good for qualifying bets
    GROUP BY b.name, e.id, e.home_team, e.away_team
    LIMIT 10;
  `;

  const result = await db.query(query);
  const bonuses = result.rows;

  for (const bonus of bonuses) {
    await db.query(
      `INSERT INTO opportunities (event_id, type, description, expected_profit, confidence)
       VALUES ($1, 'bonus_conversion', $2, $3, 65.0)
       ON CONFLICT DO NOTHING`,
      [bonus.event_id, 
       `Bonus Conversion: Use ${bonus.bookmaker} bonus on ${bonus.home_team} vs ${bonus.away_team} @ ${bonus.best_odds}. Stake to meet rollover.`, 
       15.0]  // estimated profit after conversion
    );
  }

  return bonuses;
}

// Enhanced Mug Betting Tool (Bonus Turnover / Low-Loss Qualifier)
async function findMugBettingOpportunities(amount = 50, priority = 'balanced', sportFilter = null) {
  const lossRate = priority === 'min_loss' ? 0.025 : 
                   priority === 'cheapest' ? 0.04 : 
                   priority === 'fastest' ? 0.035 : 0.03;

  let sportCondition = '';
  let params = [1.4, 2.8];

  if (sportFilter) {
    sportCondition = 'AND e.sport = $3';
    params.push(sportFilter);
  }

  const query = `
    SELECT 
      e.id as event_id,
      e.home_team,
      e.away_team,
      e.sport,
      b.name as bookmaker,
      MAX(o.odds) as best_odds,
      'h2h' as market_type
    FROM odds o
    JOIN events e ON o.event_id = e.id
    JOIN bookmakers b ON o.bookmaker_id = b.id
    WHERE o.odds BETWEEN $1 AND $2
      AND b.name ILIKE ANY(ARRAY['%sportsbet%', '%bet365%', '%draftkings%', '%fanduel%', '%betfair%'])
      ${sportCondition}
    GROUP BY e.id, e.home_team, e.away_team, e.sport, b.name
    ORDER BY o.odds DESC
    LIMIT 12;
  `;

  const result = await db.query(query, params);
  const mugs = result.rows;

  // Save to opportunities table
  for (const mug of mugs) {
    const expectedLoss = (amount * lossRate).toFixed(2);
    await db.query(
      `INSERT INTO opportunities (event_id, type, description, expected_profit, confidence)
       VALUES ($1, 'mug_bet', $2, $3, 75.0)
       ON CONFLICT DO NOTHING`,
      [mug.event_id, 
       `Mug Bet: ${mug.home_team} vs ${mug.away_team} @ ${mug.best_odds} on ${mug.bookmaker} | Est. Loss: -$${expectedLoss} (${(lossRate*100).toFixed(1)}%)`, 
       -parseFloat(expectedLoss)]
    );
  }

  return mugs.map(m => ({
    ...m,
    stake: amount,
    expectedLoss: `-${(amount * lossRate).toFixed(2)}`,
    lossPercent: (lossRate * 100).toFixed(1) + '% LOSS',
    recommendation: 'Use this qualifying bet to turnover bonus and withdraw original deposit with minimal loss. Ideal for clearing bonus wagering requirements.'
  }));
}

module.exports = {
  findArbitrageOpportunities,
  findValueBets,
  findMatchedBetOpportunities,
  findBonusConversionOpportunities,
  findMugBettingOpportunities
};
