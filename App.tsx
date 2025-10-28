
import React, { useState, useCallback, useMemo } from 'react';
import { GameState, ResultType } from './types';
import { fetchMatchResult } from './services/geminiService';

// --- UI Components (Defined outside the main App to prevent re-declaration on renders) ---

interface ScoreboardProps {
  score: number;
  streak: number;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ score, streak }) => (
  <div className="flex justify-center gap-8 w-full max-w-md mx-auto my-6 text-center animate-fade-in">
    <div>
      <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Current Score</p>
      <p className="text-4xl font-bold text-brand-gold">{score}</p>
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Longest Streak</p>
      <p className="text-4xl font-bold text-brand-gold">{streak}</p>
    </div>
  </div>
);

interface GameCardProps {
  year: number;
  onGuess: (guess: ResultType) => void;
}

const GameCard: React.FC<GameCardProps> = ({ year, onGuess }) => (
  <div className="bg-brand-light p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto text-center animate-slide-up">
    <h2 className="text-xl md:text-2xl font-semibold text-gray-200 mb-6">
      Who won the primary El Clásico played in <span className="text-brand-accent font-bold">{year}</span>?
    </h2>
    <div className="grid grid-cols-1 gap-4">
      <button onClick={() => onGuess('REAL_MADRID')} className="bg-white text-gray-800 font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 hover:bg-gray-200">
        Real Madrid
      </button>
      <button onClick={() => onGuess('BARCELONA')} className="bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 hover:bg-red-500">
        FC Barcelona
      </button>
      <button onClick={() => onGuess('DRAW')} className="bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 hover:bg-gray-400">
        Draw / Tie
      </button>
    </div>
  </div>
);

const LoadingIndicator: React.FC = () => (
    <div className="w-full max-w-md mx-auto text-center py-12 animate-fade-in">
        <p className="text-lg text-gray-300 animate-pulse">Retrieving historical data...</p>
    </div>
);


interface ResultModalProps {
  isCorrect: boolean;
  resultDetails: string;
  onNextMatch: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ isCorrect, resultDetails, onNextMatch }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 animate-fade-in z-50">
    <div className="bg-brand-light p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-md mx-auto text-center animate-slide-up">
      <h3 className={`text-3xl font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
        {isCorrect ? 'Correct!' : 'Incorrect!'}
      </h3>
      <div className="text-left bg-brand-dark p-4 rounded-lg text-gray-300 mb-6 max-h-60 overflow-y-auto">
        <p className="font-semibold text-gray-200 mb-2">The Actual Result:</p>
        <p className="text-sm leading-relaxed">{resultDetails}</p>
      </div>
      <button onClick={onNextMatch} className="bg-brand-accent text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105 w-full">
        Next Match
      </button>
    </div>
  </div>
);

// --- Main App Component ---

function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.Idle);
  const [gameYear, setGameYear] = useState<number | null>(null);
  const [actualResult, setActualResult] = useState<{ winner: ResultType; details: string } | null>(null);
  const [userGuess, setUserGuess] = useState<ResultType | null>(null);
  
  const [score, setScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const startNewMatch = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const randomYear = Math.floor(Math.random() * (currentYear - 1950 + 1)) + 1950;
    setGameYear(randomYear);
    setGameState(GameState.Playing);
    setActualResult(null);
    setUserGuess(null);
  }, []);

  const handleGuess = useCallback(async (guess: ResultType) => {
    if (!gameYear) return;

    setUserGuess(guess);
    setGameState(GameState.Loading);
    const result = await fetchMatchResult(gameYear);
    setActualResult(result);

    const correct = guess === result.winner;
    if (correct) {
      setScore(prev => prev + 1);
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      if (newStreak > longestStreak) {
        setLongestStreak(newStreak);
      }
    } else {
      setCurrentStreak(0);
    }
    
    setGameState(GameState.Result);
  }, [gameYear, currentStreak, longestStreak]);

  const isCorrect = useMemo(() => {
    if (!userGuess || !actualResult) return false;
    return userGuess === actualResult.winner;
  }, [userGuess, actualResult]);

  return (
    <div className="min-h-screen bg-brand-dark text-white font-sans flex flex-col items-center p-4">
      <header className="text-center my-6 md:my-10 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-100">El Clásico Guess</h1>
        <p className="text-md md:text-lg text-gray-400">The Historical Showdown</p>
      </header>

      <main className="w-full flex-grow flex flex-col items-center justify-center">
        {gameState === GameState.Idle && (
          <button onClick={startNewMatch} className="bg-brand-accent text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 animate-slide-up">
            New Match
          </button>
        )}

        {(gameState === GameState.Playing || gameState === GameState.Loading) && (
          <>
            <Scoreboard score={score} streak={longestStreak} />
            {gameYear && <GameCard year={gameYear} onGuess={handleGuess} />}
            {gameState === GameState.Loading && <LoadingIndicator />}
          </>
        )}
        
        {gameState === GameState.Result && actualResult && (
           <ResultModal 
            isCorrect={isCorrect}
            resultDetails={actualResult.details}
            onNextMatch={startNewMatch}
          />
        )}
      </main>

      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Historical Showdown Games. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
