import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { 
  KeyRound, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  Award, 
  Clock, 
  ChevronRight, 
  Zap, 
  AlertTriangle,
  Lock,
  Unlock,
  Crosshair
} from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

export const SkillbarLockpickGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'playing' | 'gameover'>('ready');
  const [countdown, setCountdown] = useState<number>(3);
  
  // Total stages to clear based on difficulty
  const maxStages = difficulty === 'expert' ? 6 : difficulty === 'hard' ? 5 : difficulty === 'medium' ? 4 : 3;
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [lockpicksLeft, setLockpicksLeft] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(25);
  const [success, setSuccess] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  // Radial needle and target angle in degrees [0, 360)
  const [needleAngle, setNeedleAngle] = useState<number>(0);
  const [targetStartAngle, setTargetStartAngle] = useState<number>(90);
  const [targetWidth, setTargetWidth] = useState<number>(45); // degrees
  const [direction, setDirection] = useState<1 | -1>(1); // 1 = CW, -1 = CCW

  const needleAngleRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const gameClockRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTimeRef = useRef<number>(Date.now());
  const stageAttemptsRef = useRef<number>(0);
  const perfectHitsRef = useRef<number>(0);

  // Angular speed in degrees per frame
  const getSpeed = useCallback((stage: number) => {
    const base = difficulty === 'expert' ? 4.2 : difficulty === 'hard' ? 3.4 : difficulty === 'medium' ? 2.6 : 2.0;
    return base + (stage - 1) * 0.45;
  }, [difficulty]);

  // Target width shrinks each stage
  const getWidth = useCallback((stage: number) => {
    const base = difficulty === 'expert' ? 30 : difficulty === 'hard' ? 38 : difficulty === 'medium' ? 46 : 55;
    return Math.max(16, base - (stage - 1) * 4);
  }, [difficulty]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (gameClockRef.current) clearInterval(gameClockRef.current);
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

  const setupStage = (stage: number) => {
    // Random target starting angle [30, 330] away from needle starting position
    const randAngle = Math.floor(Math.random() * 260) + 50;
    const width = getWidth(stage);
    const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

    needleAngleRef.current = 0;
    setNeedleAngle(0);
    setTargetStartAngle(randAngle);
    setTargetWidth(width);
    setDirection(dir);
  };

  const launchGame = () => {
    cleanup();
    setGameState('playing');
    setCurrentStage(1);
    setScore(0);
    setLockpicksLeft(3);
    setSuccess(false);
    setFeedback(null);
    perfectHitsRef.current = 0;
    stageAttemptsRef.current = 0;

    const initialTime = difficulty === 'expert' ? 20 : difficulty === 'hard' ? 25 : 30;
    setTimeLeft(initialTime);
    gameStartTimeRef.current = Date.now();

    setupStage(1);

    // Start timer
    gameClockRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame(false, 'TIME EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    startAnimationLoop(1);
  };

  const startAnimationLoop = (stage: number) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const step = () => {
      const spd = getSpeed(stage);
      needleAngleRef.current = (needleAngleRef.current + spd * direction + 360) % 360;
      setNeedleAngle(needleAngleRef.current);
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  const triggerLockpickAttempt = () => {
    if (gameState !== 'playing') return;

    stageAttemptsRef.current += 1;
    const currentAngle = needleAngleRef.current;
    const targetEnd = (targetStartAngle + targetWidth) % 360;

    // Check hit logic accounting for 360 wraparound
    let isHit = false;
    if (targetStartAngle < targetEnd) {
      isHit = currentAngle >= targetStartAngle && currentAngle <= targetEnd;
    } else {
      isHit = currentAngle >= targetStartAngle || currentAngle <= targetEnd;
    }

    // Check critical / sweet center hit
    const center = (targetStartAngle + targetWidth / 2) % 360;
    const distFromCenter = Math.min(
      Math.abs(currentAngle - center),
      360 - Math.abs(currentAngle - center)
    );
    const isCritical = isHit && distFromCenter <= targetWidth * 0.22;

    if (isHit) {
      // Stage success
      const stageScore = isCritical ? 600 : 350;
      setScore(prev => prev + stageScore);

      if (isCritical) {
        perfectHitsRef.current += 1;
        setFeedback({ text: 'CRITICAL OVERRIDE! +600', color: '#D4AF37' });
      } else {
        setFeedback({ text: 'TUMBLER ALIGNED! +350', color: '#10B981' });
      }

      if (currentStage >= maxStages) {
        // Vault breached!
        endGame(true, 'ALL TUMBLERS UNLOCKED');
      } else {
        const nextStage = currentStage + 1;
        setCurrentStage(nextStage);
        setupStage(nextStage);
        startAnimationLoop(nextStage);
      }
    } else {
      // Failed attempt
      setFeedback({ text: 'PICK SNAPPED! -1 LOCKPICK', color: '#EF4444' });
      setLockpicksLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          endGame(false, 'OUT OF LOCKPICKS');
        } else {
          // Re-roll current stage position
          setupStage(currentStage);
          startAnimationLoop(currentStage);
        }
        return Math.max(0, next);
      });
    }

    setTimeout(() => {
      setFeedback(null);
    }, 900);
  };

  // Keyboard Spacebar listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerLockpickAttempt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentStage, targetStartAngle, targetWidth, direction]);

  const endGame = (isWin: boolean, reasonText: string) => {
    cleanup();
    setSuccess(isWin);
    setGameState('gameover');
  };

  const handleFinishSubmit = () => {
    const totalTime = Math.max(1, Math.round((Date.now() - gameStartTimeRef.current) / 1000));
    const accuracy = stageAttemptsRef.current > 0 
      ? Math.round(((currentStage - 1 + (success ? 1 : 0)) / stageAttemptsRef.current) * 1000) / 10
      : 0;

    // Completion bonus for unlocking
    const finalScore = score + (success ? 800 + lockpicksLeft * 200 + Math.max(0, timeLeft * 25) : 0);

    onFinish({
      gameId: 'skillbar_lockpick',
      gameTitle: 'Tactical Skillbar',
      score: finalScore,
      timeSeconds: totalTime,
      accuracy,
      difficulty,
      gameMode: 'QTE Lockpick',
      success
    });
  };

  // SVG arc calculation helpers
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, arcSweep, 0, end.x, end.y].join(' ');
  };

  return (
    <div className="w-full bg-[#0d0f12] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Banner */}
      <div className="bg-[#12161c] px-6 py-4 border-b border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37]">
            <KeyRound className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              Tactical Skillbar Lockpick
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] uppercase">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs font-mono text-zinc-400">FiveM-inspired quick-time mechanical bypass minigame</p>
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-6 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-zinc-400">LOCKDOWN:</span>
              <span className={`font-bold ${timeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-white'}`}>{timeLeft}s</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400">TUMBLER:</span>
              <span className="font-black text-[#D4AF37]">{currentStage} / {maxStages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400 mr-1">PICKS:</span>
              {[1, 2, 3].map(i => (
                <KeyRound
                  key={i}
                  className={`w-4 h-4 ${i <= lockpicksLeft ? 'text-[#D4AF37]' : 'text-zinc-700'}`}
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
      <div className="relative min-h-[440px] sm:min-h-[500px] bg-[#07090c] flex items-center justify-center p-6 select-none">
        {/* Ambient Radial Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-950/20 via-transparent to-transparent pointer-events-none" />

        {/* READY STATE */}
        {gameState === 'ready' && (
          <div className="max-w-md w-full bg-[#12161c] border border-[#D4AF37]/30 rounded-xl p-6 text-center space-y-6 z-10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Mechanical Bypass Protocol</h3>
              <p className="text-xs font-mono text-zinc-400 mt-2 leading-relaxed">
                Intercept the sweeping lockpick needle when it passes over the highlighted sweet spot. Press <strong className="text-[#D4AF37] border border-[#D4AF37]/40 px-1.5 py-0.5 rounded bg-[#D4AF37]/10">SPACEBAR</strong> or tap the vault dial.
              </p>
            </div>

            <div className="bg-[#0a0c0f] p-4 rounded-lg border border-zinc-800 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Stages to Bypass:</span>
                <strong className="text-white">{maxStages} Tumblers</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Available Picks:</span>
                <strong className="text-[#D4AF37]">3 Mechanical Picks</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Bonus Override:</span>
                <strong className="text-emerald-400">Center Bullseye Criticals</strong>
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
                ENGAGE LOCKPICK <ChevronRight className="w-4 h-4" />
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
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">Calibrating tension tool...</p>
          </div>
        )}

        {/* PLAYING STATE: RADIAL SKILLBAR DIAL */}
        {gameState === 'playing' && (
          <div 
            onClick={triggerLockpickAttempt}
            className="flex flex-col items-center justify-center cursor-pointer relative z-10"
          >
            {/* Feedback Popover */}
            {feedback && (
              <div 
                style={{ color: feedback.color }}
                className="absolute -top-12 font-mono font-black text-sm uppercase tracking-wider animate-bounce drop-shadow-md z-20"
              >
                {feedback.text}
              </div>
            )}

            {/* Radial SVG Dial */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {/* Dial Outer Ring */}
                <circle
                  cx="100"
                  cy="100"
                  r="85"
                  fill="#0a0c10"
                  stroke="#1c232d"
                  strokeWidth="8"
                />

                {/* Target Sweet Spot Arc */}
                <path
                  d={describeArc(100, 100, 85, targetStartAngle, (targetStartAngle + targetWidth) % 360)}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]"
                />

                {/* Center Critical Sweet Spot Arc */}
                <path
                  d={describeArc(
                    100, 
                    100, 
                    85, 
                    (targetStartAngle + targetWidth * 0.38) % 360, 
                    (targetStartAngle + targetWidth * 0.62) % 360
                  )}
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="12"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_12px_rgba(212,175,55,0.9)]"
                />

                {/* Dial Tick Marks */}
                {Array.from({ length: 24 }).map((_, i) => {
                  const angle = (i * 15 * Math.PI) / 180;
                  const x1 = 100 + 72 * Math.cos(angle);
                  const y1 = 100 + 72 * Math.sin(angle);
                  const x2 = 100 + 78 * Math.cos(angle);
                  const y2 = 100 + 78 * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#2d3748"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Center Tumbler Hub */}
                <circle cx="100" cy="100" r="32" fill="#141922" stroke="#D4AF37" strokeWidth="2.5" />
                <circle cx="100" cy="100" r="10" fill="#D4AF37" className="animate-pulse" />

                {/* Sweeping Indicator Needle */}
                <g transform={`rotate(${needleAngle} 100 100)`}>
                  <line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="14"
                    stroke="#EF4444"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="filter drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]"
                  />
                  <circle cx="100" cy="14" r="4.5" fill="#EF4444" />
                </g>
              </svg>

              {/* Center Lock Status Icon */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <KeyRound className="w-6 h-6 text-[#D4AF37] animate-pulse" />
              </div>
            </div>

            {/* Instruction banner */}
            <div className="mt-6 text-center">
              <span className="text-xs font-mono text-zinc-400 bg-[#12161c] px-4 py-2 rounded-full border border-zinc-800 flex items-center gap-2">
                Press <strong className="text-[#D4AF37]">SPACEBAR</strong> or tap anywhere when needle hits the green/gold zone
              </span>
            </div>
          </div>
        )}

        {/* GAMEOVER STATE */}
        {gameState === 'gameover' && (
          <div className="max-w-md w-full bg-[#12161c] border border-[#D4AF37]/40 rounded-xl p-6 sm:p-8 text-center space-y-6 z-10 shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2 shadow-lg">
              {success ? (
                <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-emerald-500/20">
                  <Unlock className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-rose-950/80 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-rose-500/20">
                  <Lock className="w-8 h-8" />
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#D4AF37] tracking-wider">
                {success ? 'BYPASS SUCCESSFUL' : 'BYPASS INTERRUPTED'}
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">
                {success ? 'VAULT UNLOCKED' : 'LOCKDOWN TRIGGERED'}
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-2">
                {success 
                  ? `Successfully picked all ${maxStages} mechanical tumblers.` 
                  : `Tension broke before completing all stages.`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">SCORE</div>
                <div className="text-xl font-black text-white mt-1">{score}</div>
              </div>
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">STAGES</div>
                <div className="text-xl font-black text-[#D4AF37] mt-1">
                  {currentStage - 1 + (success ? 1 : 0)} / {maxStages}
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
