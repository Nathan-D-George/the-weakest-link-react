import React, { useState } from 'react'
import OptionsModal from './OptionsModal'

export default function FinalRoundIntro({ gameState, setGameState, onContinue, onQuit }) {
  const gs = gameState
  const [selected, setSelected] = useState(null)
  const [showOptions, setShowOptions] = useState(false)

  const [p1, p2] = gs.players

  const playerStats = (p) => {
    const ph = gs.history.filter(h => h.player === p)
    return { correct: ph.filter(h => h.correct).length, total: ph.length }
  }

  const handleConfirm = () => {
    if (!selected) return
    // Put the selected player first in the final round order
    const orderedPlayers = selected === p1 ? [p1, p2] : [p2, p1]
    setGameState(prev => ({
      ...prev,
      players: orderedPlayers,
      // Final round state
      finalRound: {
        players: orderedPlayers,
        // Per-player question tracking for penalty shootout
        scores: { [orderedPlayers[0]]: [], [orderedPlayers[1]]: [] },
        currentPlayerIdx: 0,
        set: 1,          // current set (1–5 = standard, 6+ = sudden death)
        phase: 'playing', // 'playing' | 'set_result' | 'done'
        winner: null,
      },
    }))
    onContinue()
  }

  const st1 = playerStats(p1)
  const st2 = playerStats(p2)

  return (
    <div className="screen">
      <button className="opt-btn" onClick={() => setShowOptions(true)}>⚙ Options</button>
      {showOptions && <OptionsModal onClose={() => setShowOptions(false)} onQuit={onQuit} />}

      <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
        <div className="title-logo" style={{ fontSize: '2.2rem' }}>Final Round</div>
        <div className="subtitle" style={{ marginBottom: '.5rem' }}>Penalty Shootout</div>
        <div className="chain-bar" />

        <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', lineHeight: 1.6, margin: '1rem 0 2rem' }}>
          Each player answers a minimum of <strong style={{ color: 'var(--text)' }}>5 questions</strong>, alternating one at a time.
          After 5 each, if scores are equal, <strong style={{ color: 'var(--text)' }}>sudden death</strong> continues until one player
          answers correctly and the other does not in the same set.
        </p>

        {/* Player stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          {[p1, p2].map((p, i) => {
            const st = i === 0 ? st1 : st2
            return (
              <div key={p} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '.3rem' }}>{p}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>{st.correct}/{st.total} correct this game</div>
              </div>
            )
          })}
        </div>

        <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Select who answers first
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          {[p1, p2].map(p => (
            <button
              key={p}
              className={`btn ${selected === p ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '1.1rem', padding: '1rem', width: '100%' }}
              onClick={() => setSelected(p)}
            >
              {selected === p ? '✓ ' : ''}{p}
            </button>
          ))}
        </div>

        <button
          className="btn btn-gold"
          style={{ fontSize: '1.1rem', padding: '.9rem 2rem' }}
          disabled={!selected}
          onClick={handleConfirm}
        >
          Begin Final Round →
        </button>
      </div>
    </div>
  )
}
