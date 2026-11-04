import React, { useState } from 'react'
import Menu from './components/Menu'
import GameScreen from './components/GameScreen'
import EliminationScreen from './components/EliminationScreen'
import FinalRoundIntro from './components/FinalRoundIntro'
import FinalRoundScreen from './components/FinalRoundScreen'
import GameOverScreen from './components/GameOverScreen'
import { QUESTION_ORDER, SCREENS } from './types'

const DEFAULT_SETTINGS = {
  questionOrder: QUESTION_ORDER.RANDOM,
  autoDisplayAnswer: true,
}

function createInitialGameState(players, questions, roundTime, settings) {
  const ordered = settings.questionOrder === QUESTION_ORDER.RANDOM
    ? [...questions].sort(() => Math.random() - 0.5)
    : [...questions]
  return {
    players: [...players],
    eliminated: [],
    round: 1,
    currentPlayerIndex: 0,
    bankTotal: 0,
    tempBank: 0,
    chainIndex: 0,
    questionQueue: ordered,
    totalQuestions: ordered.length,
    questionIndex: 0,
    questionsThisRound: 0,
    history: [],
    timeLeft: roundTime,
    questionsExhausted: false,
  }
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.MENU)
  const [players, setPlayers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [roundTime, setRoundTime] = useState(120);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameState, setGameState] = useState(null);

  const handleStart = () => {
    if (players.length < 2 || questions.length === 0) return;
    setGameState(createInitialGameState(players, questions, roundTime, settings));
    setScreen(SCREENS.GAME);
  }

  // After a normal round ends — go to elimination
  const handleRoundEnd = () => setScreen(SCREENS.ELIMINATION);

  // After elimination: if 2 players remain → final intro, else → next round
  const handlePostElimination = () => {
    if (gameState.players.length === 2) {
      setScreen(SCREENS.FINAL_INTRO);
    } else {
      setScreen(SCREENS.GAME);
    }
  }

  const handleFinalIntroComplete = () => setScreen(SCREENS.FINAL);
  const handleGameOver = () => setScreen(SCREENS.GAMEOVER);

  const handleQuit = () => {
    setGameState(null);
    setScreen(SCREENS.MENU);
  }

  return (
    <>
      {screen === SCREENS.MENU && (
        <Menu
          players={players} setPlayers={setPlayers}
          questions={questions} setQuestions={setQuestions}
          roundTime={roundTime} setRoundTime={setRoundTime}
          settings={settings} setSettings={setSettings}
          onStart={handleStart}
        />
      )}

      {screen === SCREENS.GAME && gameState && (
        <GameScreen
          gameState={gameState} setGameState={setGameState}
          settings={settings}
          onRoundEnd={handleRoundEnd}
          onAllQuestionsUsed={handleGameOver}
          onQuit={handleQuit}
        />
      )}

      {screen === SCREENS.ELIMINATION && gameState && (
        <EliminationScreen
          gameState={gameState} setGameState={setGameState}
          onContinue={handlePostElimination}
          onGameOver={handleGameOver}
          onQuit={handleQuit}
          roundTime={roundTime}
        />
      )}

      {screen === SCREENS.FINAL_INTRO && gameState && (
        <FinalRoundIntro
          gameState={gameState} setGameState={setGameState}
          onContinue={handleFinalIntroComplete}
          onQuit={handleQuit}
        />
      )}

      {screen === SCREENS.FINAL && gameState && (
        <FinalRoundScreen
          gameState={gameState} setGameState={setGameState}
          settings={settings}
          onGameOver={handleGameOver}
          onQuit={handleQuit}
        />
      )}

      {screen === SCREENS.GAMEOVER && gameState && (
        <GameOverScreen
          gameState={gameState}
          onMenu={handleQuit}
        />
      )}
    </>
  )
}
