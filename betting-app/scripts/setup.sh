#!/bin/bash

echo "=== Betting App Setup ==="

# Backend
cd backend
npm install
echo "Backend dependencies installed."

# Frontend
cd ../frontend
npm install
echo "Frontend dependencies installed."

echo "Setup complete!"
echo "1. Set up PostgreSQL database and load schema.sql"
echo "2. Add THE_ODDS_API_KEY to .env"
echo "3. Run backend: cd backend && npm run dev"
echo "4. Run frontend: cd frontend && npm run dev"
