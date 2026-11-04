import React, { useState } from 'react'
import OptionsModal from './OptionsModal'

export default function EliminationScreen({ gameState, setGameState, onContinue, onGameOver, onQuit, roundTime }) {
  const gs = gameState
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const playerStats = (player) => {
    const playerHistory = gs.history.filter(history => history.player === player)
    return { correct: playerHistory.filter(history => history.correct).length, total: playerHistory.length }
  }

  const sortedPlayers = [...gs.players].sort((a, b) => playerStats(b).correct - playerStats(a).correct)

  const eliminate = () => {
    const newPlayers = gs.players.filter(p => p !== selected)
    const newElim = [...gs.eliminated, selected]

    // Only 1 player left → game over
    if (newPlayers.length <= 1) {
      setGameState(prev => ({ ...prev, players: newPlayers, eliminated: newElim }));
      onGameOver();
      return;
    }

    setGameState(prev => ({
      ...prev,
      players: newPlayers,
      eliminated: newElim,
      round: prev.round + 1,
      currentPlayerIndex: 0,
      questionsThisRound: 0,
      tempBank: 0,
      chainIndex: 0,
      timeLeft: roundTime,
    }));

    onContinue();
  }

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: '3rem' }}>
      <button className="opt-btn" onClick={() => setShowOptions(true)}>⚙ Options</button>
      {showOptions && <OptionsModal onClose={() => setShowOptions(false)} onQuit={onQuit} />}

      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="title-logo" style={{ fontSize: '2.5rem' }}>End of Round {gs.round}</div>
          <div className="chain-bar" />
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)', marginTop: '.5rem' }}>
            Total Banked: {gs.bankTotal}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginTop: '.3rem' }}>
            Unbanked chain points have been lost.
          </div>
        </div>

        <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.8rem' }}>
          Vote Off — Select one player to eliminate
        </div>

        {sortedPlayers.map((p, i) => {
          const st = playerStats(p)
          const isSelected = selected === p
          return (
            <div key={p} className={`score-bar ${isSelected ? 'elim-select' : ''}`} onClick={() => setSelected(isSelected ? null : p)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', minWidth: '20px' }}>#{i + 1}</span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{p}</span>
                {i === 0 && <span className="tag tag-blue">Best</span>}
                {i === sortedPlayers.length - 1 && sortedPlayers.length > 1 && <span className="tag tag-red">Weakest</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>{st.correct}/{st.total} correct</span>
                {isSelected && <span className="tag tag-red">Selected</span>}
              </div>
            </div>
          )
        })}

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <button className="btn btn-danger" disabled={!selected} onClick={() => setConfirm(true)}>
            Eliminate {selected || '...'}
          </button>
        </div>
      </div>

      {confirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Eliminate {selected}?</h3>
            <p style={{ color: 'var(--text-muted)', margin: '1rem 0', fontSize: '.9rem' }}>
              This player will be removed from the game. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-danger" onClick={eliminate}>Eliminate</button>
              <button className="btn btn-secondary" onClick={() => setConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
