const axios = require('axios');
const db = require('../db');

const THE_ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.THE_ODDS_API_KEY;

// Fetch sports
async function fetchSports() {
  try {
    const response = await axios.get(`${THE_ODDS_API_BASE}/sports`, {
      params: { apiKey: API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sports:', error.message);
    return [];
  }
}

// Fetch odds for a sport
async function fetchOdds(sportKey = 'upcoming', regions = 'us', markets = 'h2h') {
  try {
    const response = await axios.get(`${THE_ODDS_API_BASE}/odds`, {
      params: {
        apiKey: API_KEY,
        sport: sportKey,
        regions,
        markets,
        oddsFormat: 'decimal'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching odds:', error.message);
    return [];
  }
}

// Save event and odds to DB
async function saveOddsToDb(oddsData) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    for (const event of oddsData) {
      // Insert or get sport
      const sportRes = await client.query(
        `INSERT INTO sports (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = $1 RETURNING id`,
        [event.sport_title, event.sport_key]
      );
      const sportId = sportRes.rows[0].id;

      // Insert league (simplified)
      const leagueRes = await client.query(
        `INSERT INTO leagues (sport_id, name, slug) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id`,
        [sportId, event.sport_title, event.sport_key]
      );

      // Insert event
      const eventRes = await client.query(
        `INSERT INTO events (sport_id, league_id, home_team, away_team, start_time, external_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'upcoming')
         ON CONFLICT (external_id) DO UPDATE SET start_time = $5 RETURNING id`,
        [sportId, leagueRes.rows[0]?.id || sportId, event.home_team, event.away_team, event.commence_time, event.id]
      );
      const eventId = eventRes.rows[0].id;

      // Insert bookmakers and odds
      for (const bookie of event.bookmakers) {
        const bmRes = await client.query(
          `INSERT INTO bookmakers (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = $1 RETURNING id`,
          [bookie.title, bookie.key]
        );
        const bmId = bmRes.rows[0].id;

        for (const market of bookie.markets) {
          for (const outcome of market.outcomes) {
            await client.query(
              `INSERT INTO odds (event_id, bookmaker_id, market_type, selection, odds, line)
               VALUES ($1, $2, $3, $4, $5, $6)
               ON CONFLICT DO NOTHING`,
              [eventId, bmId, market.key, outcome.name, outcome.price, outcome.point || null]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log(`Saved ${oddsData.length} events to DB`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving odds:', error);
  } finally {
    client.release();
  }
}

module.exports = {
  fetchSports,
  fetchOdds,
  saveOddsToDb
};
