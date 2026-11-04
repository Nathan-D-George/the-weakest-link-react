import React, { useState, useEffect, useRef } from 'react'
import { POINT_CHAIN } from '../constants'
import OptionsModal from './OptionsModal'

export default function GameScreen({ gameState, setGameState, settings, onRoundEnd, onAllQuestionsUsed, onQuit }) {
  const timerRef = useRef(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [answered, setAnswered] = useState(null);
  const [roundEnded, setRoundEnded] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const questionsExhausted = gameState.questionIndex >= gameState.totalQuestions;
  const currentQuestion = questionsExhausted ? null : gameState.questionQueue[gameState.questionIndex];
  const currentPlayer = gameState.players[gameState.currentPlayerIndex % gameState.players.length];
  const showAnswerInBox = settings.autoDisplayAnswer || revealAnswer;

  // Reset per-question UI state on question change
  useEffect(() => {
    setRevealAnswer(false);
    setAnswered(null);
  }, [gameState.questionIndex]);

  // Questions exhausted → auto-bank and end
  useEffect(() => {
    if (questionsExhausted) {
      clearInterval(timerRef.current);
      setGameState(prev => ({
        ...prev,
        bankTotal: prev.bankTotal + prev.tempBank,
        tempBank: 0,
        chainIndex: 0,
        questionsExhausted: true,
      }));
      onAllQuestionsUsed();
    }
  }, [questionsExhausted]);

  // Timer — runs while unanswered, not exhausted, round not ended
  useEffect(() => {
    if (roundEnded || answered !== null || questionsExhausted) return;
    timerRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          clearInterval(timerRef.current);
          setRoundEnded(true);
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [roundEnded, answered, gameState.questionIndex, questionsExhausted]);

  const bankPoints = () => {
    if (gameState.tempBank === 0) return;
    setGameState(prev => ({
      ...prev,
      bankTotal: prev.bankTotal + prev.tempBank,
      tempBank: 0,
      chainIndex: 0,
    }));
  }

  const handleAnswer = (correct) => {
    clearInterval(timerRef.current);
    setRevealAnswer(true);
    setAnswered(correct);
    setGameState(prev => ({
      ...prev,
      chainIndex: correct ? Math.min(prev.chainIndex + 1, POINT_CHAIN.length - 1) : 0,
      tempBank: correct ? POINT_CHAIN[prev.chainIndex] : 0,
      history: [
        ...prev.history,
        { player: currentPlayer, question: currentQuestion.question, answer: currentQuestion.answer, correct, round: prev.round },
      ],
    }));
  }

  const nextQuestion = () => {
    clearInterval(timerRef.current);
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    const nextQuestionIndex = gameState.questionIndex + 1;
    const nextExhausts = nextQuestionIndex >= gameState.totalQuestions;

    // End the round if: timer ran out, or questions will be exhausted
    if (nextExhausts || roundEnded || gameState.timeLeft === 0) {
      setGameState(prev => ({
        ...prev,
        questionsThisRound: prev.questionsThisRound + 1,
        questionIndex: nextQuestionIndex,
        currentPlayerIndex: nextPlayerIndex,
        bankTotal: prev.bankTotal + prev.tempBank,
        tempBank: 0,
        chainIndex: 0,
      }));

      if (!nextExhausts) onRoundEnd();
      return;
    }

    // Continue round
    setGameState(prev => ({
      ...prev,
      questionIndex: nextQuestionIndex,
      currentPlayerIndex: nextPlayerIndex,
      questionsThisRound: prev.questionsThisRound + 1,
    }));
    setRoundEnded(false);
    setRevealAnswer(false);
    setAnswered(null);
  }

  const timerColor =
    gameState.timeLeft <= 10 ? 'var(--red)' :
    gameState.timeLeft <= 30 ? 'var(--gold)' : 'var(--text)';

  if (questionsExhausted) return null;

  return (
    <div className="screen" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>
      <button className="opt-btn" onClick={() => setShowOptions(true)}>⚙ Options</button>
      {showOptions && <OptionsModal onClose={() => setShowOptions(false)} onQuit={onQuit} />}

      <div style={{ width: '100%', maxWidth: '750px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
          <div>
            <span style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Round {gameState.round}</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--blue-bright)', marginTop: '.2rem' }}>{currentPlayer}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.2rem' }}>Time</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: timerColor, fontFamily: 'Impact,"Arial Narrow",sans-serif', lineHeight: 1 }}>{gameState.timeLeft}s</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.2rem' }}>Banked</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)' }}>{gameState.bankTotal}</div>
          </div>
        </div>

        <div className="chain-bar" />

        {/* Chain meter */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '.7rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.4rem' }}>Chain</div>
          <div className="bank-meter">
            {POINT_CHAIN.map((value, index) => (
              <div key={index} className={`bank-step ${index < gameState.chainIndex ? 'active' : 'inactive'}`}>
                {value >= 1000 ? '1k' : value}
              </div>
            ))}
            {gameState.tempBank > 0 && (
              <span style={{ marginLeft: '.5rem', color: 'var(--gold)', fontSize: '.8rem', fontWeight: 700 }}>+{gameState.tempBank} ready</span>
            )}
          </div>
        </div>

        {(roundEnded || gameState.timeLeft === 0) && answered === null && (
          <div className="timeout-banner">⏱ Time is up! Round ending after this question.</div>
        )}

        {/* Question box */}
        <div className="q-box">
          <div style={{ fontSize: '.7rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.8rem' }}>
            Q{gameState.questionsThisRound + 1} &nbsp;·&nbsp;
            <span style={{ color: 'var(--blue-bright)' }}>{gameState.questionIndex + 1} of {gameState.totalQuestions} total</span>
          </div>
          <div className="q-text">{currentQuestion.question}</div>
          {showAnswerInBox && (
            <>
              <div style={{ height: '1px', background: 'var(--border)', margin: '.8rem 0' }} />
              <div style={{ fontSize: '.7rem', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '.3rem' }}>Answer</div>
              <div className="a-text">{currentQuestion.answer}</div>
            </>
          )}
        </div>

        {answered === null && (
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!settings.autoDisplayAnswer && !revealAnswer && (
              <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '.3rem' }} onClick={() => setRevealAnswer(true)}>
                👁 Reveal Answer
              </button>
            )}
            <button className="btn btn-danger" style={{ flex: 1, fontSize: '1.1rem', padding: '.9rem' }} onClick={() => handleAnswer(false)}>✗ Incorrect</button>
            <button className="btn btn-success" style={{ flex: 1, fontSize: '1.1rem', padding: '.9rem' }} onClick={() => handleAnswer(true)}>✓ Correct</button>
          </div>
        )}

        {answered !== null && (
          <>
            <div className={answered ? 'result-correct' : 'result-wrong'}>
              {answered ? '✓ Correct' : '✗ Incorrect — Chain broken'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={nextQuestion}>Next Question →</button>
            </div>
          </>
        )}
      </div>

      <div className="bank-corner">
        <button className="btn btn-gold" style={{ fontSize: '1rem', padding: '.8rem 1.5rem' }} disabled={gameState.tempBank === 0} onClick={bankPoints}>
          🏦 Bank {gameState.tempBank > 0 ? `(+${gameState.tempBank})` : ''}
        </button>
      </div>
    </div>
  );
}
