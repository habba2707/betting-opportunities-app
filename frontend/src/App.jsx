import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [opps, setOpps] = useState({ arbitrage: [], valueBets: [], matchedBets: [], bonusConversions: [] })
  const [loading, setLoading] = useState(false)

  const fetchOpportunities = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/opportunities`)
      const data = await res.json()
      setOpps({
        arbitrage: data.arbitrage || [],
        valueBets: data.valueBets || [],
        matchedBets: data.matchedBets || [],
        bonusConversions: data.bonusConversions || []
      })
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleScanOdds = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/scan-odds`)
      const data = await res.json()
      alert(`Scan completed! ${data.events || 0} events fetched. Now refresh opportunities.`)
      // Auto refresh opportunities after scan
      await fetchOpportunities()
    } catch (err) {
      console.error(err)
      alert('Scan failed. Check console and ensure API key is valid.')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOpportunities()
  }, [])

  return (
    <div className="App">
      <header>
        <h1>🏆 Betting Opportunities Platform</h1>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
          <button onClick={handleScanOdds} disabled={loading}>
            {loading ? 'Scanning Odds...' : '🔄 Refresh Live Odds'}
          </button>
          <button onClick={fetchOpportunities} disabled={loading}>
            {loading ? 'Loading...' : '📊 Refresh Opportunities'}
          </button>
        </div>
      </header>

      <main>
        {/* Arbitrage */}
        <section>
          <h2>🔄 Arbitrage Opportunities</h2>
          {opps.arbitrage.length === 0 ? (
            <p>No arbs found.</p>
          ) : (
            opps.arbitrage.map((opp, i) => (
              <div key={i} className="opportunity-card">
                <h3>{opp.home_team} vs {opp.away_team}</h3>
                <p>Home: {opp.home_odds} | Away: {opp.away_odds}</p>
                <p>Implied Prob Sum: {(opp.implied_prob_sum * 100).toFixed(1)}% → Guaranteed Profit!</p>
                {opp.aiExplanation && <p><strong>AI Insight:</strong> {opp.aiExplanation}</p>}
              </div>
            ))
          )}
        </section>

        {/* Matched Bets */}
        <section>
          <h2>🔄 Matched Betting Opportunities</h2>
          {opps.matchedBets.length === 0 ? (
            <p>No matched bets found yet.</p>
          ) : (
            opps.matchedBets.map((opp, i) => (
              <div key={i} className="opportunity-card">
                <h3>{opp.home_team} vs {opp.away_team}</h3>
                <p>Selection: {opp.selection} @ {opp.best_back_odds}</p>
                <p>Use free bet here. Lay on exchange for risk-free profit.</p>
                <p>Est. Profit: ~£20 on £100 stake</p>
                {opp.aiExplanation && <p><strong>AI Insight:</strong> {opp.aiExplanation}</p>}
              </div>
            ))
          )}
        </section>

        {/* Bonus Conversions */}
        <section>
          <h2>🎁 Bonus Conversion Opportunities</h2>
          {opps.bonusConversions.length === 0 ? (
            <p>No bonus opportunities found.</p>
          ) : (
            opps.bonusConversions.map((opp, i) => (
              <div key={i} className="opportunity-card">
                <h3>{opp.home_team} vs {opp.away_team} @ {opp.best_odds}</h3>
                <p>Bookmaker: {opp.bookmaker}</p>
                <p>Use qualifying bet to convert bonus to cash.</p>
                {opp.aiExplanation && <p><strong>AI Insight:</strong> {opp.aiExplanation}</p>}
              </div>
            ))
          )}
        </section>

        {/* Value Bets */}
        <section>
          <h2>💎 Value Bets</h2>
          {opps.valueBets.length === 0 ? (
            <p>No value bets.</p>
          ) : (
            opps.valueBets.map((opp, i) => (
              <div key={i} className="opportunity-card">
                <h3>{opp.home_team} vs {opp.away_team}</h3>
                <p>Odds: {opp.odds}</p>
                {opp.aiExplanation && <p><strong>AI Insight:</strong> {opp.aiExplanation}</p>}
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  )
}

export default App
