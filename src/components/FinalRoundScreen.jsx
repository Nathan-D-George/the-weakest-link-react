import React, { useState, useEffect, useRef } from 'react'
import OptionsModal from './OptionsModal'

const MIN_SETS = 5  // each player must answer at least 5 questions

export default function FinalRoundScreen({ gameState, setGameState, settings, onGameOver, onQuit }) {
  const gs = gameState
  const fr = gs.finalRound
  const timerRef = useRef(null)

  const [revealAnswer, setRevealAnswer] = useState(false)
  const [answered, setAnswered] = useState(null)          // null | true | false
  const [setResult, setSetResult] = useState(null)         // result summary after each set
  const [showOptions, setShowOptions] = useState(false)

  const questionsExhausted = gs.questionIndex >= gs.totalQuestions
  const currentQ = questionsExhausted ? null : gs.questionQueue[gs.questionIndex]

  // Who is currently answering
  const currentPlayer = fr.players[fr.currentPlayerIndex]
  const otherPlayer   = fr.players[1 - fr.currentPlayerIndex]

  // Scores in THIS final round
  const p0scores = fr.scores[fr.players[0]]  // array of true/false per set
  const p1scores = fr.scores[fr.players[1]]

  const p0correct = p0scores.filter(Boolean).length
  const p1correct = p1scores.filter(Boolean).length

  const showAnswerInBox = settings.autoDisplayAnswer || revealAnswer

  // Reset UI on question change
  useEffect(() => {
    setRevealAnswer(false)
    setAnswered(null)
    setSetResult(null)
  }, [gs.questionIndex, fr.currentPlayerIndex, fr.set])

  const handleAnswer = (correct) => {
    clearInterval(timerRef.current)
    setRevealAnswer(true)
    setAnswered(correct)

    const newHistory = [
      ...gs.history,
      {
        player: currentPlayer,
        question: currentQ.question,
        answer: currentQ.answer,
        correct,
        round: `Final S${fr.set}`,
      },
    ]

    // Record this answer in finalRound scores
    const newScores = {
      ...fr.scores,
      [currentPlayer]: [...fr.scores[currentPlayer], correct],
    }

    setGameState(prev => ({
      ...prev,
      questionIndex: prev.questionIndex + 1,
      history: newHistory,
      finalRound: { ...prev.finalRound, scores: newScores },
    }))
  }

  const handleNext = () => {
    const newP0scores = fr.scores[fr.players[0]]
    const newP1scores = fr.scores[fr.players[1]]

    // Is this the end of a set? (both players have answered `set` times)
    const setComplete = newP0scores.length === fr.set && newP1scores.length === fr.set

    if (setComplete) {
      const p0c = newP0scores.filter(Boolean).length
      const p1c = newP1scores.filter(Boolean).length
      const inSuddenDeath = fr.set >= MIN_SETS

      // After MIN_SETS, check for clear winner each set
      if (inSuddenDeath || fr.set >= MIN_SETS) {
        // Sudden death: one correct, other not → clear winner
        const lastP0 = newP0scores[newP0scores.length - 1]
        const lastP1 = newP1scores[newP1scores.length - 1]

        if (inSuddenDeath && lastP0 !== lastP1) {
          // One won, one didn't — game over
          const winnerIdx = lastP0 ? 0 : 1
          const winner = fr.players[winnerIdx]
          setGameState(prev => ({
            ...prev,
            players: [winner],
            eliminated: [...prev.eliminated, fr.players[1 - winnerIdx]],
            finalRound: { ...prev.finalRound, winner, phase: 'done' },
          }))
          onGameOver()
          return
        }

        // After min sets, check if overall score is decisive
        if (!inSuddenDeath && p0c !== p1c) {
          const winnerIdx = p0c > p1c ? 0 : 1
          const winner = fr.players[winnerIdx]
          setGameState(prev => ({
            ...prev,
            players: [winner],
            eliminated: [...prev.eliminated, fr.players[1 - winnerIdx]],
            finalRound: { ...prev.finalRound, winner, phase: 'done' },
          }))
          onGameOver()
          return
        }
      }

      // Show set summary if tied (or still in first 5 sets)
      const nextSet = fr.set + 1
      const isTied = p0c === p1c
      const justFinishedMin = fr.set === MIN_SETS

      setSetResult({
        set: fr.set,
        p0: { name: fr.players[0], score: p0c, last: newP0scores[newP0scores.length - 1] },
        p1: { name: fr.players[1], score: p1c, last: newP1scores[newP1scores.length - 1] },
        tied: isTied,
        enteringSuddenDeath: justFinishedMin && isTied,
      })

      setGameState(prev => ({
        ...prev,
        finalRound: {
          ...prev.finalRound,
          set: nextSet,
          currentPlayerIndex: 0,  // player 0 always starts each set
        },
      }))
      return
    }

    // Mid-set: switch to the other player
    setGameState(prev => ({
      ...prev,
      finalRound: {
        ...prev.finalRound,
        currentPlayerIndex: 1 - prev.finalRound.currentPlayerIndex,
      },
    }))
  }

  // After set result is acknowledged
  const dismissSetResult = () => {
    setSetResult(null)
    setAnswered(null)
    setRevealAnswer(false)
  }

  const setLabel = fr.set > MIN_SETS
    ? `Sudden Death — Set ${fr.set - MIN_SETS}`
    : `Set ${fr.set} of ${MIN_SETS}`

  const p0name = fr.players[0]
  const p1name = fr.players[1]

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>
      <button className="opt-btn" onClick={() => setShowOptions(true)}>⚙ Options</button>
      {showOptions && <OptionsModal onClose={() => setShowOptions(false)} onQuit={onQuit} />}

      <div style={{ width: '100%', maxWidth: '750px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
          <div>
            <span style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              ⚡ Final Round
            </span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--blue-bright)', marginTop: '.2rem' }}>{currentPlayer}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.2rem' }}>{setLabel}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.2rem' }}>Banked</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' }}>{gs.bankTotal}</div>
          </div>
        </div>

        <div className="chain-bar" style={{ background: 'linear-gradient(90deg, #7a1000, #cc1100, #7a1000)' }} />

        {/* Scoreboard */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          {[0, 1].map(i => {
            const pname = fr.players[i]
            const pscores = fr.scores[pname]
            const pcorrect = pscores.filter(Boolean).length
            const isCurrent = fr.currentPlayerIndex === i
            return (
              <div key={pname} style={{
                background: isCurrent ? 'rgba(26,74,204,0.15)' : 'var(--surface)',
                border: `1px solid ${isCurrent ? 'var(--blue)' : 'var(--border)'}`,
                borderRadius: '4px',
                padding: '.8rem 1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{pname}</span>
                  {isCurrent && <span className="tag tag-blue">Answering</span>}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)', marginBottom: '.4rem' }}>
                  {pcorrect} <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>correct</span>
                </div>
                {/* Answer history dots */}
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                  {pscores.map((r, idx) => (
                    <div key={idx} style={{
                      width: '14px', height: '14px', borderRadius: '50%',
                      background: r ? 'var(--green)' : 'var(--red)',
                    }} title={r ? 'Correct' : 'Incorrect'} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Questions exhausted mid-final */}
        {questionsExhausted && (
          <div style={{ background: 'rgba(26,74,204,0.12)', border: '1px solid var(--blue-dim)', borderRadius: '3px', padding: '1rem', textAlign: 'center', marginBottom: '1rem', color: 'var(--blue-bright)' }}>
            All questions used. Game ends — scores are final.
          </div>
        )}

        {/* Question box */}
        {!questionsExhausted && currentQ && answered === null && !setResult && (
          <>
            <div className="q-box">
              <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.8rem' }}>
                <span style={{ color: 'var(--gold)' }}>⚡ Final</span> &nbsp;·&nbsp; {gs.questionIndex + 1} of {gs.totalQuestions} total
              </div>
              <div className="q-text">{currentQ.question}</div>
              {showAnswerInBox && (
                <>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '.8rem 0' }} />
                  <div style={{ fontSize: '.7rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Answer</div>
                  <div className="a-text">{currentQ.answer}</div>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {!settings.autoDisplayAnswer && !revealAnswer && (
                <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '.3rem' }} onClick={() => setRevealAnswer(true)}>
                  👁 Reveal Answer
                </button>
              )}
              <button className="btn btn-danger" style={{ flex: 1, fontSize: '1.1rem', padding: '.9rem' }} onClick={() => handleAnswer(false)}>✗ Incorrect</button>
              <button className="btn btn-success" style={{ flex: 1, fontSize: '1.1rem', padding: '.9rem' }} onClick={() => handleAnswer(true)}>✓ Correct</button>
            </div>
          </>
        )}

        {/* Result after answering — before next */}
        {answered !== null && !setResult && (
          <>
            <div className="q-box" style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.8rem' }}>
                <span style={{ color: 'var(--gold)' }}>⚡ Final</span> &nbsp;·&nbsp; {gs.questionIndex} of {gs.totalQuestions} total
              </div>
              <div className="q-text" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{gs.questionQueue[gs.questionIndex - 1]?.question}</div>
              {(settings.autoDisplayAnswer || revealAnswer) && (
                <>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '.8rem 0' }} />
                  <div className="a-text">{gs.questionQueue[gs.questionIndex - 1]?.answer}</div>
                </>
              )}
            </div>
            <div className={answered ? 'result-correct' : 'result-wrong'} style={{ marginTop: '1rem' }}>
              {answered ? `✓ ${currentPlayer} got it correct!` : `✗ ${currentPlayer} got it wrong.`}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={handleNext}>
                {fr.scores[fr.players[0]].length === fr.set && fr.scores[fr.players[1]].length < fr.set
                  ? `${otherPlayer}'s turn →`
                  : 'Next →'}
              </button>
            </div>
          </>
        )}

        {/* Set result summary */}
        {setResult && (
          <div className="card" style={{ textAlign: 'center', marginTop: '1rem', border: '1px solid var(--gold)' }}>
            <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
              {setResult.enteringSuddenDeath ? '⚡ Tied after 5 sets — Sudden Death!' : `Set ${setResult.set} Complete`}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1.2rem' }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '.3rem' }}>{setResult.p0.name}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: setResult.p0.score > setResult.p1.score ? 'var(--gold)' : setResult.p0.score === setResult.p1.score ? 'var(--text)' : 'var(--red)' }}>
                  {setResult.p0.score}
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>vs</div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: '.3rem' }}>{setResult.p1.name}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: setResult.p1.score > setResult.p0.score ? 'var(--gold)' : setResult.p0.score === setResult.p1.score ? 'var(--text)' : 'var(--red)' }}>
                  {setResult.p1.score}
                </div>
              </div>
            </div>
            {setResult.tied && (
              <div style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: '1rem' }}>
                {setResult.enteringSuddenDeath
                  ? 'One question each — first to pull ahead wins.'
                  : 'Still tied — continuing...'}
              </div>
            )}
            <button className="btn btn-primary" onClick={dismissSetResult}>
              {setResult.enteringSuddenDeath ? '⚡ Start Sudden Death' : 'Continue →'}
            </button>
          </div>
        )}

        {/* Questions exhausted — show end button */}
        {questionsExhausted && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button className="btn btn-gold" onClick={() => {
              const winner = p0correct >= p1correct ? p0name : p1name
              const loser = p0correct >= p1correct ? p1name : p0name
              setGameState(prev => ({
                ...prev,
                players: [winner],
                eliminated: [...prev.eliminated, loser],
                questionsExhausted: true,
              }))
              onGameOver()
            }}>
              End Game & Declare Winner
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
