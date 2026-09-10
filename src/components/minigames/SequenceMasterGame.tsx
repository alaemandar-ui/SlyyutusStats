import React, { useState, useEffect, useRef } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { Sparkles, Heart, Clock, Play, RotateCcw, Award } from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

const GLYPHS = [
  { id: 0, symbol: '▲', label: 'North', color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/20' },
  { id: 1, symbol: '▶', label: 'East', color: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-500/20' },
  { id: 2, symbol: '▼', label: 'South', color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/20' },
  { id: 3, symbol: '◀', label: 'West', color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/20' },
  { id: 4, symbol: '◆', label: 'Core', color: 'text-pink-400', border: 'border-pink-500/50', bg: 'bg-pink-500/20' },
  { id: 5, symbol: '✦', label: 'Star', color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/20' }
];

export const SequenceMasterGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [level, setLevel] = useState<number>(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [activeGlyph, setActiveGlyph] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'showing' | 'input' | 'success' | 'failed' | 'gameover'>('idle');
  const [lives, setLives] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [totalTime, setTotalTime] = useState<number>(0);

  const activeGlyphCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
  const availableGlyphs = GLYPHS.slice(0, activeGlyphCount);

  useEffect(() => {
    startNewGame();
  }, [difficulty]);

  const startNewGame = () => {
    setLevel(1);
    setLives(3);
    setScore(0);
    setStartTime(Date.now());
    generateNextLevelSequence(1);
  };

  const generateNextLevelSequence = (targetLevel: number) => {
    const seqLen = targetLevel + 2; // Level 1 = 3 items, Level 2 = 4 items...
    const newSeq: number[] = [];
    for (let i = 0; i < seqLen; i++) {
      newSeq.push(Math.floor(Math.random() * activeGlyphCount));
    }
    setSequence(newSeq);
    setUserSequence([]);
    setGameState('showing');

    // Playback sequence
    playSequence(newSeq);
  };

  const playSequence = (seq: number[]) => {
    const flashSpeed = difficulty === 'expert' ? 400 : difficulty === 'hard' ? 500 : difficulty === 'medium' ? 650 : 800;
    
    seq.forEach((glyphId, index) => {
      setTimeout(() => {
        setActiveGlyph(glyphId);
        setTimeout(() => {
          setActiveGlyph(null);
        }, flashSpeed * 0.7);
      }, (index + 1) * flashSpeed);
    });

    setTimeout(() => {
      setGameState('input');
    }, (seq.length + 1) * flashSpeed);
  };

  const handlePadClick = (glyphId: number) => {
    if (gameState !== 'input') return;

    // Visual feedback
    setActiveGlyph(glyphId);
    setTimeout(() => setActiveGlyph(null), 200);

    const nextIndex = userSequence.length;
    const isCorrect = sequence[nextIndex] === glyphId;

    if (!isCorrect) {
      // Mistake
      const remainingLives = lives - 1;
      setLives(remainingLives);
      if (remainingLives <= 0) {
        endGame(false);
      } else {
        setGameState('failed');
        setTimeout(() => {
          setUserSequence([]);
          setGameState('showing');
          playSequence(sequence);
        }, 1200);
      }
      return;
    }

    const newUserSeq = [...userSequence, glyphId];
    setUserSequence(newUserSeq);

    // If finished current level
    if (newUserSeq.length === sequence.length) {
      setGameState('success');
      const diffMult = difficulty === 'expert' ? 2.5 : difficulty === 'hard' ? 2.0 : difficulty === 'medium' ? 1.5 : 1.0;
      const levelPoints = Math.round((level * 150 + 100) * diffMult);
      setScore(prev => prev + levelPoints);

      if (level >= 8) {
        // Master victory!
        setTimeout(() => endGame(true), 1000);
      } else {
        setTimeout(() => {
          setLevel(prev => prev + 1);
          generateNextLevelSequence(level + 1);
        }, 1200);
      }
    }
  };

  const endGame = (isVictory: boolean) => {
    setGameState('gameover');
    const elapsedSecs = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    setTotalTime(elapsedSecs);

    const accuracy = Math.round((level / 8) * 100);
    onFinish({
      gameId: 'sequence_master',
      gameTitle: 'Sequence Master',
      score,
      timeSeconds: elapsedSecs,
      accuracy,
      difficulty,
      gameMode: 'Standard',
      success: isVictory || level >= 4
    });
  };

  return (
    <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 relative overflow-hidden text-white shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232936] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Sequence Master
              <span className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Memorize and reproduce growing algorithmic glyph transmissions</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936]">
            {[1, 2, 3].map(heartIdx => (
              <Heart
                key={heartIdx}
                className={`w-4 h-4 ${heartIdx <= lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
              />
            ))}
          </div>

          <div className="bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936] text-xs">
            <span className="text-gray-400">Sequence Tier:</span>{' '}
            <span className="font-bold text-pink-300 font-mono text-sm">{level} / 8</span>
          </div>

          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* Stage Status Display */}
      <div className="bg-[#121720] border border-[#232936] rounded-xl p-4 mb-6 text-center">
        <div className="text-sm font-semibold tracking-wider uppercase mb-1">
          {gameState === 'showing' && <span className="text-cyan-400 animate-pulse">Memorizing Signal Transmission...</span>}
          {gameState === 'input' && <span className="text-emerald-400">Your Turn: Input {sequence.length - userSequence.length} Remaining</span>}
          {gameState === 'success' && <span className="text-green-400 font-bold">Signal Synchronized! Level Up</span>}
          {gameState === 'failed' && <span className="text-red-400 font-bold">Signal Desync! Replaying...</span>}
          {gameState === 'gameover' && <span className="text-amber-400 font-bold">Session Concluded</span>}
        </div>

        {/* User Input Progress Dots */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {sequence.map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full transition-all ${
                idx < userSequence.length
                  ? 'bg-pink-400 shadow-md shadow-pink-400/50 scale-110'
                  : 'bg-[#232936]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Glyph Interactive Pad */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto mb-6">
        {availableGlyphs.map((glyph) => {
          const isFlashed = activeGlyph === glyph.id;
          return (
            <button
              key={glyph.id}
              disabled={gameState !== 'input'}
              onClick={() => handlePadClick(glyph.id)}
              className={`h-28 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 active:scale-95 ${
                isFlashed
                  ? `${glyph.bg} ${glyph.border} shadow-xl scale-105 brightness-125`
                  : 'bg-[#161c26] border-[#232936] hover:bg-[#1c2432]'
              } ${gameState !== 'input' ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
            >
              <span className={`text-4xl ${glyph.color}`}>{glyph.symbol}</span>
              <span className="text-[11px] font-mono tracking-wider uppercase text-gray-400">{glyph.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-[#232936] pt-4">
        <span>Current Score: <strong className="text-pink-300 font-mono">{score} pts</strong></span>
        <span>Reach Tier 8 for Master Synchronization</span>
      </div>
    </div>
  );
};
