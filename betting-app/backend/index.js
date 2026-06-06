const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Betting Opportunity App Backend is running!' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Import services
const { fetchSports, fetchOdds, saveOddsToDb } = require('./services/oddsScanner');
const { findArbitrageOpportunities, findValueBets, findMatchedBetOpportunities, findBonusConversionOpportunities, findMugBettingOpportunities } = require('./services/opportunityEngine');
const { enrichOpportunitiesWithAI } = require('./services/aiAssistant');

// Routes
app.get('/api/scan-odds', async (req, res) => {
  try {
    logger.info('Starting odds scan...');
    const sport = req.query.sport || 'basketball_nba'; // Default NBA, changeable via ?sport=...
    const regions = req.query.regions || 'us';
    const markets = req.query.markets || 'h2h';
    
    logger.info(`Scanning sport: ${sport}`);
    const oddsData = await fetchOdds(sport, regions, markets);
    await saveOddsToDb(oddsData);
    res.json({ success: true, events: oddsData.length, sport });
  } catch (error) {
    logger.error('Odds scan failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/opportunities', async (req, res) => {
  try {
    const arbs = await findArbitrageOpportunities();
    const values = await findValueBets();
    const matched = await findMatchedBetOpportunities();
    const bonuses = await findBonusConversionOpportunities();
    const mugs = await findMugBettingOpportunities(50, 'balanced');
    
    let allOpps = { 
      arbitrage: arbs, 
      valueBets: values,
      matchedBets: matched,
      bonusConversions: bonuses,
      mugBets: mugs 
    };
    
    // Enrich with AI explanations
    allOpps = await enrichOpportunitiesWithAI(allOpps);
    
    res.json(allOpps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New Mug Betting Tool Endpoint
app.post('/api/mug-bets', async (req, res) => {
  try {
    const { amount = 50, priority = 'balanced', sport } = req.body;
    const mugs = await findMugBettingOpportunities(amount, priority, sport);
    res.json({ success: true, mugBets: mugs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/scan', async (req, res) => {
  // Trigger full scan
  const { sport } = req.body;
  try {
    const oddsData = await fetchOdds(sport || 'upcoming');
    await saveOddsToDb(oddsData);
    res.json({ message: 'Scan completed', count: oddsData.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app; // for testing