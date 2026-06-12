import React, { useState } from 'react'

export default function GameOverScreen({ gameState, onMenu }) {
  const gs = gameState
  const [tab, setTab] = useState('summary')

  const fr = gs.finalRound
  const winners = gs.players.length > 0 ? gs.players : [gs.eliminated[gs.eliminated.length - 1] || 'No one']
  const multiWin = winners.length > 1
  const allPlayers = [...gs.players, ...[...gs.eliminated].reverse()]

  const playerStats = (p) => {
    const ph = gs.history.filter(h => h.player === p)
    const correct = ph.filter(h => h.correct).length
    return { correct, total: ph.length, pct: ph.length ? Math.round(correct / ph.length * 100) : 0 }
  }

  // Final round score breakdown if applicable
  const finalScores = fr ? {
    [fr.players[0]]: fr.scores[fr.players[0]].filter(Boolean).length,
    [fr.players[1]]: fr.scores[fr.players[1]].filter(Boolean).length,
  } : null

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: '3rem' }}>
      <div style={{ maxWidth: '700px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="title-logo">Game Over</div>
          <div className="chain-bar" />

          {gs.questionsExhausted && (
            <div style={{ background: 'rgba(26,74,204,0.12)', border: '1px solid var(--blue-dim)', borderRadius: '3px', padding: '.6rem 1rem', marginBottom: '1rem', color: 'var(--blue-bright)', fontSize: '.85rem' }}>
              All questions were used — game ended early.
            </div>
          )}

          <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '.5rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            {multiWin ? 'Winners' : 'Winner'}
          </div>

          {multiWin ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', justifyContent: 'center', marginTop: '.8rem' }}>
              {winners.map(w => (
                <span key={w} style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--gold)', background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)', borderRadius: '4px', padding: '.3rem .9rem' }}>{w}</span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--gold)', marginTop: '.3rem' }}>{winners[0]}</div>
          )}

          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '.8rem' }}>
            Total Banked: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{gs.bankTotal}</span>
          </div>

          {/* Final round scorecard */}
          {finalScores && (
            <div style={{ marginTop: '1.2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1rem', display: 'inline-block', minWidth: '260px' }}>
              <div style={{ fontSize: '.65rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '.7rem' }}>⚡ Final Round</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '.8rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700 }}>{fr.players[0]}</div>
                  <div style={{ fontSize: '.8rem', display: 'flex', gap: '3px', marginTop: '.3rem' }}>
                    {fr.scores[fr.players[0]].map((r, i) => (
                      <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: r ? 'var(--green)' : 'var(--red)' }} />
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {finalScores[fr.players[0]]} – {finalScores[fr.players[1]]}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{fr.players[1]}</div>
                  <div style={{ fontSize: '.8rem', display: 'flex', gap: '3px', marginTop: '.3rem', justifyContent: 'flex-end' }}>
                    {fr.scores[fr.players[1]].map((r, i) => (
                      <div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: r ? 'var(--green)' : 'var(--red)' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
          {['summary', 'history'].map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
          ))}
        </div>

        {tab === 'summary' && (
          <div>
            <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.8rem' }}>Player Statistics</div>
            <table className="stats-table">
              <thead><tr><th>Player</th><th>Status</th><th>Correct</th><th>Total Qs</th><th>%</th></tr></thead>
              <tbody>
                {allPlayers.map(p => {
                  const st = playerStats(p)
                  const isElim = gs.eliminated.includes(p)
                  return (
                    <tr key={p}>
                      <td style={{ fontWeight: 700 }}>{p}</td>
                      <td>{isElim ? <span className="tag tag-red">Eliminated</span> : <span className="tag tag-gold">Winner</span>}</td>
                      <td className="correct-cell">{st.correct}</td>
                      <td>{st.total}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{st.pct}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'history' && (
          <div>
            <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.8rem' }}>Full Question Log</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="stats-table">
                <thead><tr><th>Rnd</th><th>Player</th><th>Question</th><th>Answer</th><th>Result</th></tr></thead>
                <tbody>
                  {gs.history.map((h, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-muted)' }}>{h.round}</td>
                      <td style={{ fontWeight: 700 }}>{h.player}</td>
                      <td style={{ maxWidth: '200px', wordBreak: 'break-word' }}>{h.question}</td>
                      <td style={{ color: 'var(--gold)', maxWidth: '130px', wordBreak: 'break-word' }}>{h.answer}</td>
                      <td>{h.correct ? <span className="correct-cell">✓</span> : <span className="wrong-cell">✗</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={onMenu}>← Back to Menu</button>
        </div>
      </div>
    </div>
  )
}
