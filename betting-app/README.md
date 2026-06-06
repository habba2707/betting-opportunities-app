# Betting Opportunities App

A Progressive Web App (PWA) for finding arbitrage, matched betting, and bonus conversion opportunities using real-time odds.

## Features
- Real-time odds scanning (The Odds API)
- Arbitrage detection
- Matched betting suggestions
- Bonus conversion opportunities
- AI-powered explanations
- Mobile-friendly PWA (perfect for iPhone)

## Quick Deploy to Render.com (Free)

### 1. Create GitHub Repository
- Go to [github.com/new](https://github.com/new)
- Name: `betting-opportunities-app`
- Make it **Public**
- Click "Create repository"

### 2. Push Code from Here (Easiest on Computer)
Since you're on iPhone, you have two options:

**Option A (Recommended - Use Computer if possible)**
1. Download the entire folder as ZIP (ask me to generate it)
2. Upload to GitHub via their web interface or GitHub Desktop.

**Option B: Manual (Tedious on iPhone)**
Copy files one by one — not recommended.

### 3. Deploy on Render.com
1. Go to [render.com](https://render.com) → Dashboard
2. Click **New +** → **Blueprint**
3. Connect GitHub → Select `betting-opportunities-app`
4. Render will auto-detect `render.yaml` and create:
   - betting-backend
   - betting-frontend
   - betting-db (PostgreSQL)

5. **After deployment starts**:
   - Go to **betting-backend** service → Environment
     - Edit `THE_ODDS_API_KEY` → Set to: `c2b77048d7dacb10ff4e1f3819c1343d`
   - Wait for DB to be ready (check status)

6. Update Frontend:
   - In **betting-frontend** → Environment
     - Set `VITE_API_URL` to your backend URL (e.g. `https://betting-backend-xxx.onrender.com`)

7. Run Database Schema:
   - In betting-backend → **Shell** tab, run:
     ```bash
     psql $DATABASE_URL -f db/schema.sql
     ```

### 4. Access Your App
- Open the **betting-frontend** URL on your iPhone Safari
- Tap Share → "Add to Home Screen"
- Enjoy as a native-like app!

## Local Development
See `scripts/setup.sh`

## Making Changes Later
- Edit code → Push to GitHub → Render auto-deploys
- Very easy!

---

Need help with anything? Just ask! 🚀
