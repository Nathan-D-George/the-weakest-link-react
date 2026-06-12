import React, { useState } from 'react'

export default function OptionsModal({ onClose, onQuit }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="modal-overlay" onClick={() => { if (!confirming) onClose() }}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {confirming ? (
          <>
            <h3>Quit Game?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '.9rem' }}>
              All progress will be lost.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-danger" onClick={onQuit}>Quit</button>
              <button className="btn btn-secondary" onClick={() => { setConfirming(false); onClose() }}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <h3>Options</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <button
                className="btn btn-danger"
                style={{ width: '100%', marginBottom: '.8rem' }}
                onClick={() => setConfirming(true)}
              >
                Quit to Menu
              </button>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onClose}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
