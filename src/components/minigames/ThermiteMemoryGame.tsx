import React, { useState, useEffect, useRef } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { 
  Flame, 
  RotateCcw, 
  Clock, 
  Award, 
  AlertOctagon, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  Grid, 
  Sparkles,
  Eye,
  ShieldAlert
} from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

export const ThermiteMemoryGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'memorizing' | 'input' | 'gameover'>('ready');
  const [countdown, setCountdown] = useState<number>(3);

  const totalRounds = difficulty === 'expert' ? 4 : difficulty === 'hard' ? 4 : 3;
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [livesLeft, setLivesLeft] = useState<number>(2);
  const [success, setSuccess] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  // Grid dimensions
  const gridSize = difficulty === 'expert' ? 7 : difficulty === 'hard' ? 6 : difficulty === 'medium' ? 6 : 5;
  const totalCells = gridSize * gridSize;

  // Active target indices
  const [targetIndices, setTargetIndices] = useState<Set<number>>(new Set());
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());

  const gameStartTimeRef = useRef<number>(Date.now());
  const gameClockRef = useRef<NodeJS.Timeout | null>(null);
  const memoryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const totalErrorsRef = useRef<number>(0);

  // Target count per round
  const getTargetCount = (round: number) => {
    const base = difficulty === 'expert' ? 14 : difficulty === 'hard' ? 10 : difficulty === 'medium' ? 8 : 6;
    return base + (round - 1) * 2;
  };

  // Flash memorization time
  const getFlashTime = (round: number) => {
    const base = difficulty === 'expert' ? 2200 : difficulty === 'hard' ? 2500 : difficulty === 'medium' ? 3000 : 3500;
    return Math.max(1500, base - (round - 1) * 300);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (gameClockRef.current) clearInterval(gameClockRef.current);
    if (memoryTimerRef.current) clearTimeout(memoryTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const startCountdown = () => {
    cleanup();
    setGameState('countdown');
    setCountdown(3);

    let count = 3;
    countdownRef.current = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(countdownRef.current!);
        launchGame();
      }
    }, 1000);
  };

  const launchGame = () => {
    cleanup();
    setCurrentRound(1);
    setScore(0);
    setLivesLeft(2);
    setSuccess(false);
    totalErrorsRef.current = 0;
    gameStartTimeRef.current = Date.now();

    startRound(1);
  };

  const startRound = (roundNum: number) => {
    cleanup();
    setSelectedIndices(new Set());
    setErrorIndices(new Set());
    setFeedback(null);

    // Pick random unique targets
    const targetCount = getTargetCount(roundNum);
    const indices = new Set<number>();
    while (indices.size < targetCount) {
      indices.add(Math.floor(Math.random() * totalCells));
    }
    setTargetIndices(indices);

    // Show memorizing state
    setGameState('memorizing');

    const flashMs = getFlashTime(roundNum);
    memoryTimerRef.current = setTimeout(() => {
      // Transition to input state
      setGameState('input');
      const timeAllowed = Math.max(10, 22 - (roundNum - 1) * 2);
      setTimeLeft(timeAllowed);

      gameClockRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleRoundFail('TIME DETONATION');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, flashMs);
  };

  const handleCellClick = (index: number) => {
    if (gameState !== 'input') return;
    if (selectedIndices.has(index) || errorIndices.has(index)) return;

    if (targetIndices.has(index)) {
      // Correct node clicked!
      const nextSelected = new Set(selectedIndices);
      nextSelected.add(index);
      setSelectedIndices(nextSelected);
      setScore(prev => prev + 150);

      // Check if all nodes in this round have been ignited
      if (nextSelected.size === targetIndices.size) {
        if (gameClockRef.current) clearInterval(gameClockRef.current);
        const roundBonus = 500 + timeLeft * 25;
        setScore(prev => prev + roundBonus);
        setFeedback({ text: `THERMITE INJECTED! +${roundBonus}`, color: '#10B981' });

        if (currentRound >= totalRounds) {
          setTimeout(() => endGame(true), 800);
        } else {
          setTimeout(() => {
            const nextR = currentRound + 1;
            setCurrentRound(nextR);
            startRound(nextR);
          }, 1000);
        }
      }
    } else {
      // Wrong node clicked!
      totalErrorsRef.current += 1;
      const nextErrors = new Set(errorIndices);
      nextErrors.add(index);
      setErrorIndices(nextErrors);

      setLivesLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          handleRoundFail('THERMITE OVERLOAD');
        } else {
          setFeedback({ text: 'DEAD NODE IGNITED! (1 life remaining)', color: '#EF4444' });
          setTimeout(() => setFeedback(null), 1000);
        }
        return Math.max(0, next);
      });
    }
  };

  const handleRoundFail = (reason: string) => {
    cleanup();
    setFeedback({ text: reason, color: '#EF4444' });
    setTimeout(() => endGame(false), 900);
  };

  const endGame = (isWin: boolean) => {
    cleanup();
    setSuccess(isWin);
    setGameState('gameover');
  };

  const handleFinishSubmit = () => {
    const totalTime = Math.max(1, Math.round((Date.now() - gameStartTimeRef.current) / 1000));
    const totalHits = selectedIndices.size + (currentRound - 1) * 8;
    const totalAttempts = totalHits + totalErrorsRef.current;
    const accuracy = totalAttempts > 0 ? Math.round((totalHits / totalAttempts) * 1000) / 10 : 0;
    const finalScore = score + (success ? 900 + livesLeft * 300 : 0);

    onFinish({
      gameId: 'thermite_memory',
      gameTitle: 'Thermite Memory Grid',
      score: finalScore,
      timeSeconds: totalTime,
      accuracy,
      difficulty,
      gameMode: 'Thermite Hack',
      success
    });
  };

  return (
    <div className="w-full bg-[#0d0f12] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Banner */}
      <div className="bg-[#12161c] px-6 py-4 border-b border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37]">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              Thermite Memory Grid
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] uppercase">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs font-mono text-zinc-400">FiveM-inspired thermite memory hack</p>
          </div>
        </div>

        {(gameState === 'memorizing' || gameState === 'input') && (
          <div className="flex items-center gap-6 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-zinc-400">BURNOUT:</span>
              <span className={`font-bold ${timeLeft <= 4 ? 'text-rose-500 animate-ping' : 'text-white'}`}>{timeLeft}s</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400">ROUND:</span>
              <span className="font-bold text-[#D4AF37]">{currentRound} / {totalRounds}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-xs">CORES:</span>
              {[1, 2].map(i => (
                <Flame
                  key={i}
                  className={`w-4 h-4 ${i <= livesLeft ? 'text-amber-500 fill-amber-500' : 'text-zinc-700'}`}
                />
              ))}
            </div>

            <div className="bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-3 py-1 rounded text-[#D4AF37] font-black">
              SCORE: {score}
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Stage */}
      <div className="relative min-h-[460px] sm:min-h-[520px] bg-[#07090c] flex items-center justify-center p-6 select-none">
        {/* READY STATE */}
        {gameState === 'ready' && (
          <div className="max-w-md w-full bg-[#12161c] border border-[#D4AF37]/30 rounded-xl p-6 text-center space-y-6 z-10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
              <Flame className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Thermite Memory Protocol</h3>
              <p className="text-xs font-mono text-zinc-400 mt-2 leading-relaxed">
                Thermal charges will ignite momentarily across the matrix. Memorize the exact positions of the glowing thermal nodes, then ignite them without striking a dead node.
              </p>
            </div>

            <div className="bg-[#0a0c0f] p-4 rounded-lg border border-zinc-800 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Matrix Dimensions:</span>
                <strong className="text-white">{gridSize} x {gridSize} Thermal Grid</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Rounds to Breach:</span>
                <strong className="text-[#D4AF37]">{totalRounds} Sequential Grids</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Core Stability:</span>
                <strong className="text-rose-400">2 Fault Tolerances</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold transition"
              >
                ABORT
              </button>
              <button
                onClick={startCountdown}
                className="flex-2 py-3 px-6 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-heading font-black text-sm uppercase tracking-wider hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition flex items-center justify-center gap-2"
              >
                IGNITE THERMITE <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* COUNTDOWN STATE */}
        {gameState === 'countdown' && (
          <div className="text-center space-y-4 z-10">
            <div className="text-7xl sm:text-8xl font-black font-heading text-[#D4AF37] animate-bounce">
              {countdown}
            </div>
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">Charging thermite compound...</p>
          </div>
        )}

        {/* ACTIVE STAGE: THERMITE GRID */}
        {(gameState === 'memorizing' || gameState === 'input') && (
          <div className="max-w-md w-full flex flex-col items-center justify-center space-y-5 relative z-10">
            {/* Feedback message */}
            {feedback && (
              <div 
                style={{ color: feedback.color }}
                className="text-center font-mono font-black text-xs uppercase tracking-wider animate-bounce"
              >
                {feedback.text}
              </div>
            )}

            {/* Status indicator bar */}
            <div className="w-full flex items-center justify-between px-4 py-2 bg-[#10141a] rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300">
              <span className="flex items-center gap-1.5">
                {gameState === 'memorizing' ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> MEMORIZE THERMAL NODES
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> IGNITE NODES ({selectedIndices.size} / {targetIndices.size})
                  </span>
                )}
              </span>
              <span className="text-zinc-500">{gridSize}x{gridSize} MATRIX</span>
            </div>

            {/* Grid Container */}
            <div 
              className="grid gap-2.5 p-4 bg-[#11151c] border border-[#D4AF37]/30 rounded-2xl shadow-2xl"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
              }}
            >
              {Array.from({ length: totalCells }).map((_, idx) => {
                const isTarget = targetIndices.has(idx);
                const isSelected = selectedIndices.has(idx);
                const isError = errorIndices.has(idx);
                const isFlashing = gameState === 'memorizing' && isTarget;

                return (
                  <button
                    key={idx}
                    disabled={gameState !== 'input' || isSelected || isError}
                    onClick={() => handleCellClick(idx)}
                    className={`w-11 h-11 sm:w-14 sm:h-14 rounded-lg border flex items-center justify-center font-mono font-bold transition-all duration-200 ${
                      isFlashing
                        ? 'bg-gradient-to-br from-[#D4AF37] to-amber-600 border-amber-300 shadow-[0_0_15px_rgba(212,175,55,0.8)] scale-105'
                        : isSelected
                        ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.7)] text-white'
                        : isError
                        ? 'bg-rose-600 border-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.7)] text-white'
                        : 'bg-[#181d26] border-zinc-800 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 active:scale-95'
                    }`}
                  >
                    {isFlashing ? (
                      <Flame className="w-6 h-6 text-black animate-pulse" />
                    ) : isSelected ? (
                      <CheckCircle2 className="w-6 h-6 text-black" />
                    ) : isError ? (
                      <AlertOctagon className="w-6 h-6 text-white animate-ping" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* GAMEOVER STATE */}
        {gameState === 'gameover' && (
          <div className="max-w-md w-full bg-[#12161c] border border-[#D4AF37]/40 rounded-xl p-6 sm:p-8 text-center space-y-6 z-10 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2 shadow-lg">
              {success ? (
                <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-rose-950/80 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-rose-500/20">
                  <AlertOctagon className="w-8 h-8" />
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#D4AF37] tracking-wider">
                {success ? 'BREACH COMPLETE' : 'BREACH ABORTED'}
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">
                {success ? 'THERMITE REACTION COMPLETE' : 'THERMAL OVERHEAT'}
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-2">
                {success 
                  ? `Successfully breached all ${totalRounds} thermite grid stages.` 
                  : `Thermal core exploded due to fault tolerances.`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">SCORE</div>
                <div className="text-xl font-black text-white mt-1">{score}</div>
              </div>
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">ROUNDS</div>
                <div className="text-xl font-black text-[#D4AF37] mt-1">
                  {currentRound - 1 + (success ? 1 : 0)} / {totalRounds}
                </div>
              </div>
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">TIME REMAINING</div>
                <div className="text-xl font-black text-emerald-400 mt-1">{timeLeft}s</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={startCountdown}
                className="flex-1 py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> RETRY
              </button>
              <button
                onClick={handleFinishSubmit}
                className="flex-2 py-3 px-6 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-heading font-black text-sm uppercase tracking-wider hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" /> RECORD SCORE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
