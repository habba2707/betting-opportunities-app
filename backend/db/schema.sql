-- Betting App Database Schema

CREATE DATABASE betting_db;

\c betting_db

-- Sports and Leagues
CREATE TABLE sports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE leagues (
  id SERIAL PRIMARY KEY,
  sport_id INTEGER REFERENCES sports(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100),
  country VARCHAR(100),
  UNIQUE(sport_id, name)
);

-- Bookmakers
CREATE TABLE bookmakers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  website VARCHAR(255),
  is_active BOOLEAN DEFAULT true
);

-- Events/Games
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  sport_id INTEGER REFERENCES sports(id),
  league_id INTEGER REFERENCES leagues(id),
  home_team VARCHAR(150) NOT NULL,
  away_team VARCHAR(150) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  external_id VARCHAR(100), -- from API
  status VARCHAR(50) DEFAULT 'upcoming', -- upcoming, live, finished
  UNIQUE(external_id)
);

-- Odds snapshots
CREATE TABLE odds (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  bookmaker_id INTEGER REFERENCES bookmakers(id),
  market_type VARCHAR(100) NOT NULL, -- e.g., 'moneyline', 'spread', 'total', 'player_prop'
  selection VARCHAR(100) NOT NULL, -- e.g., 'home', 'away', 'over'
  odds DECIMAL(10,4) NOT NULL,
  line DECIMAL(10,2), -- for spreads/totals
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_live BOOLEAN DEFAULT false
);

-- Opportunities (arbs, matched bets, etc.)
CREATE TABLE opportunities (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  type VARCHAR(50) NOT NULL, -- 'arbitrage', 'matched_bet', 'bonus_conversion', 'value_bet'
  description TEXT,
  expected_profit DECIMAL(10,4),
  confidence DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'new', -- new, notified, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- User accounts (for notifications, saved bets)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  email VARCHAR(255) UNIQUE,
  preferences JSONB
);

-- Notifications log
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  opportunity_id INTEGER REFERENCES opportunities(id),
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  channel VARCHAR(50) -- push, email, in-app
);

-- Indexes for performance
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_odds_event ON odds(event_id);
CREATE INDEX idx_odds_timestamp ON odds(timestamp);
CREATE INDEX idx_opportunities_type ON opportunities(type);