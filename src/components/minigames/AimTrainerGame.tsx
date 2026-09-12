import React, { useState, useEffect, useRef } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { 
  Crosshair, 
  Zap, 
  ShieldAlert, 
  Award, 
  Clock, 
  Heart, 
  AlertOctagon, 
  RotateCcw, 
  ChevronRight, 
  Flame,
  Target,
  BarChart2,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

type AimMode = 'Time Attack' | 'Accuracy Challenge' | 'Survival';

interface TargetItem {
  id: number;
  type: 'standard' | 'reflex' | 'micro' | 'decoy';
  x: number; // percentage [5, 90]
  y: number; // percentage [5, 90]
  size: number; // px
  speedX: number;
  speedY: number;
  points: number;
  spawnTime: number;
  lifetime: number; // ms
  remainingPercent: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export const AimTrainerGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [mode, setMode] = useState<AimMode>('Time Attack');
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'playing' | 'gameover'>('ready');
  const [countdown, setCountdown] = useState<number>(3);
  
  // Gameplay metrics
  const [score, setScore] = useState<number>(0);
  const [shotsFired, setShotsFired] = useState<number>(0);
  const [shotsHit, setShotsHit] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [shields, setShields] = useState<number>(3);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  
  const gameStartTimeRef = useRef<number>(Date.now());
  const nextTargetId = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gameClockRef = useRef<NodeJS.Timeout | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  // Difficulty tuning parameters
  const speedMult = difficulty === 'expert' ? 2.1 : difficulty === 'hard' ? 1.6 : difficulty === 'medium' ? 1.2 : 0.85;
  const baseSpawnRate = difficulty === 'expert' ? 550 : difficulty === 'hard' ? 700 : difficulty === 'medium' ? 850 : 1100;
  const maxSimultaneous = difficulty === 'expert' ? 6 : difficulty === 'hard' ? 5 : difficulty === 'medium' ? 4 : 3;

  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, []);

  const cleanupTimers = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (gameClockRef.current) clearInterval(gameClockRef.current);
  };

  const handleStartCountdown = () => {
    cleanupTimers();
    setGameState('countdown');
    setCountdown(3);
    
    let currentCount = 3;
    countdownTimerRef.current = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
      } else {
        clearInterval(countdownTimerRef.current!);
        launchActiveGame();
      }
    }, 1000);
  };

  const launchActiveGame = () => {
    cleanupTimers();
    setGameState('playing');
    setScore(0);
    setShotsFired(0);
    setShotsHit(0);
    setCombo(0);
    setMaxCombo(0);
    setShields(3);
    setReactionTimes([]);
    setFloatingTexts([]);
    setTargets([]);

    const duration = mode === 'Time Attack' ? 30 : mode === 'Accuracy Challenge' ? 45 : 60;
    setTimeLeft(duration);
    gameStartTimeRef.current = Date.now();

    // Spawn 2 initial targets
    spawnSingleTarget();
    setTimeout(spawnSingleTarget, 200);

    // Continuous spawner
    spawnTimerRef.current = setInterval(() => {
      spawnSingleTarget();
    }, baseSpawnRate);

    // 1-second interval clock
    gameClockRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame('time_up');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Animation physics loop
    runPhysicsLoop();
  };

  const spawnSingleTarget = () => {
    setTargets(prev => {
      if (prev.length >= maxSimultaneous) return prev;

      const roll = Math.random();
      let type: TargetItem['type'] = 'standard';
      let size = 52;
      let points = 100;
      let lifetime = 3200;

      if (roll < 0.15) {
        type = 'decoy'; // Do not shoot!
        size = 46;
        points = -150;
        lifetime = 3500;
      } else if (roll < 0.35) {
        type = 'reflex'; // High velocity
        size = 42;
        points = 250;
        lifetime = 2000;
      } else if (roll < 0.50) {
        type = 'micro'; // Tiny gold
        size = 34;
        points = 400;
        lifetime = 1700;
      }

      // Random position with safety borders
      const x = Math.floor(Math.random() * 78) + 8;
      const y = Math.floor(Math.random() * 74) + 10;

      // Random drift velocity
      const angle = Math.random() * Math.PI * 2;
      const velocity = (type === 'reflex' ? 0.35 : 0.18) * speedMult;
      const speedX = Math.cos(angle) * velocity;
      const speedY = Math.sin(angle) * velocity;

      const newTarget: TargetItem = {
        id: nextTargetId.current++,
        type,
        x,
        y,
        size,
        speedX,
        speedY,
        points,
        spawnTime: Date.now(),
        lifetime,
        remainingPercent: 100
      };

      return [...prev, newTarget];
    });
  };

  const runPhysicsLoop = () => {
    const updateFrame = () => {
      const now = Date.now();

      setTargets(prevTargets => {
        const nextTargets: TargetItem[] = [];
        let lostLife = false;

        for (const t of prevTargets) {
          const age = now - t.spawnTime;
          if (age >= t.lifetime) {
            // Target expired
            if (t.type !== 'decoy' && mode === 'Survival') {
              lostLife = true;
            }
            continue;
          }

          const remainingPercent = Math.max(0, 100 - (age / t.lifetime) * 100);

          // Update position with edge bounce
          let newX = t.x + t.speedX;
          let newY = t.y + t.speedY;
          let newSpeedX = t.speedX;
          let newSpeedY = t.speedY;

          if (newX <= 5 || newX >= 90) {
            newSpeedX = -newSpeedX;
            newX = Math.max(5, Math.min(90, newX));
          }
          if (newY <= 5 || newY >= 88) {
            newSpeedY = -newSpeedY;
            newY = Math.max(5, Math.min(88, newY));
          }

          nextTargets.push({
            ...t,
            x: newX,
            y: newY,
            speedX: newSpeedX,
            speedY: newSpeedY,
            remainingPercent
          });
        }

        if (lostLife) {
          setShields(curr => {
            const nextShields = curr - 1;
            if (nextShields <= 0) {
              endGame('shields_depleted');
            }
            return Math.max(0, nextShields);
          });
        }

        return nextTargets;
      });

      // Cleanup expired floating texts
      setFloatingTexts(prev => prev.slice(-8));

      animFrameRef.current = requestAnimationFrame(updateFrame);
    };

    animFrameRef.current = requestAnimationFrame(updateFrame);
  };

  const addFloatingText = (text: string, x: number, y: number, color: string) => {
    setFloatingTexts(prev => [
      ...prev,
      { id: Date.now() + Math.random(), text, x, y, color }
    ]);
  };

  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'playing') return;
    
    // Only handle missed shots if clicking background directly
    const targetElement = e.target as HTMLElement;
    if (targetElement.dataset.targetId) return;

    setShotsFired(prev => prev + 1);
    setCombo(0);

    if (arenaRef.current) {
      const rect = arenaRef.current.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
      addFloatingText('MISS', xPercent, yPercent, '#EF4444');
    }
  };

  const handleTargetClick = (target: TargetItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameState !== 'playing') return;

    const clickTime = Date.now();
    const reactionMs = Math.max(80, clickTime - target.spawnTime);
    setReactionTimes(prev => [...prev, reactionMs]);

    setShotsFired(prev => prev + 1);

    if (target.type === 'decoy') {
      // Hit a decoy penalty
      setScore(prev => Math.max(0, prev - 150));
      setCombo(0);
      addFloatingText('-150 HAZARD', target.x, target.y, '#EF4444');
      if (mode === 'Survival') {
        setShields(prev => {
          const next = prev - 1;
          if (next <= 0) endGame('shields_depleted');
          return Math.max(0, next);
        });
      }
    } else {
      // Hit a valid target
      setShotsHit(prev => prev + 1);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);

      // Multiplier tier based on combo
      const multiplier = nextCombo >= 15 ? 3.0 : nextCombo >= 8 ? 2.0 : nextCombo >= 4 ? 1.5 : 1.0;
      const addedPoints = Math.round(target.points * multiplier);
      setScore(prev => prev + addedPoints);

      const label = multiplier > 1 ? `+${addedPoints} (${multiplier}x)` : `+${addedPoints}`;
      const color = target.type === 'micro' ? '#D4AF37' : target.type === 'reflex' ? '#38BDF8' : '#22C55E';
      addFloatingText(label, target.x, target.y, color);
    }

    // Remove hit target
    setTargets(prev => prev.filter(t => t.id !== target.id));
  };

  const endGame = (_reason: string) => {
    cleanupTimers();
    setGameState('gameover');
  };

  const calculateFinalStats = () => {
    const totalTime = Math.max(1, Math.round((Date.now() - gameStartTimeRef.current) / 1000));
    const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 1000) / 10 : 0;
    const avgReaction = reactionTimes.length > 0 
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) 
      : 0;

    let grade = 'D';
    if (score >= 3500 && accuracy >= 88) grade = 'S+';
    else if (score >= 2500 && accuracy >= 80) grade = 'S';
    else if (score >= 1800 && accuracy >= 70) grade = 'A';
    else if (score >= 1100 && accuracy >= 60) grade = 'B';
    else if (score >= 600) grade = 'C';

    return { totalTime, accuracy, avgReaction, grade };
  };

  const handleSubmitScore = () => {
    const { totalTime, accuracy } = calculateFinalStats();
    onFinish({
      gameId: 'aim_trainer',
      gameTitle: 'AimLabs Reflex Arena',
      score,
      timeSeconds: totalTime,
      accuracy,
      difficulty,
      gameMode: mode,
      success: score >= 500
    });
  };

  const { totalTime, accuracy, avgReaction, grade } = calculateFinalStats();

  return (
    <div className="w-full bg-[#0d0f12] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Tactical Banner */}
      <div className="bg-[#12161c] px-6 py-4 border-b border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37]">
            <Crosshair className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              AimLabs Reflex Arena
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] uppercase">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs font-mono text-zinc-400">Precision target acquisition & reaction telemetry</p>
          </div>
        </div>

        {/* Live HUD when playing */}
        {gameState === 'playing' && (
          <div className="flex items-center gap-6 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-zinc-400">TIMER:</span>
              <span className={`font-bold ${timeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-white'}`}>{timeLeft}s</span>
            </div>

            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-400">ACC:</span>
              <span className="font-bold text-emerald-400">{shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 100}%</span>
            </div>

            <div className="flex items-center gap-2">
              <Flame className={`w-4 h-4 ${combo > 3 ? 'text-amber-400 animate-bounce' : 'text-zinc-500'}`} />
              <span className="text-zinc-400">STREAK:</span>
              <span className="font-bold text-amber-400">{combo}x</span>
            </div>

            {mode === 'Survival' && (
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map(i => (
                  <Heart 
                    key={i} 
                    className={`w-4 h-4 ${i <= shields ? 'text-rose-500 fill-rose-500' : 'text-zinc-700'}`} 
                  />
                ))}
              </div>
            )}

            <div className="bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-3 py-1 rounded text-[#D4AF37] font-black">
              SCORE: {score}
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Stage */}
      <div className="relative min-h-[480px] sm:min-h-[540px] bg-[#07090c] flex items-center justify-center p-4 select-none">
        {/* Background Grid Lines */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#D4AF37 1px, transparent 1px), linear-gradient(to right, #1f242d 1px, transparent 1px), linear-gradient(to bottom, #1f242d 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />

        {/* STATE: READY SCREEN */}
        {gameState === 'ready' && (
          <div className="max-w-md w-full bg-[#12161c] border border-[#D4AF37]/30 rounded-xl p-6 text-center space-y-6 z-10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
              <Crosshair className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Operation Briefing</h3>
              <p className="text-xs font-mono text-zinc-400 mt-2 leading-relaxed">
                Click high-value targets with sub-pixel precision. Build combo streaks for score multipliers. Avoid firing upon red decoy hazards.
              </p>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-3 gap-2 text-left">
              {(['Time Attack', 'Accuracy Challenge', 'Survival'] as AimMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                    mode === m 
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white font-bold' 
                      : 'bg-[#181d24] border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-[11px] font-bold">{m}</div>
                  <div className="text-[9px] text-zinc-400 mt-0.5">
                    {m === 'Time Attack' ? '30s Rush' : m === 'Accuracy Challenge' ? 'Zero Misses' : '3 Shields'}
                  </div>
                </button>
              ))}
            </div>

            {/* Target Legend */}
            <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-zinc-400 border-t border-b border-zinc-800/80 py-2.5">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Standard +100</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Swift +250</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" /> Micro +400</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Hazard -150</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold transition"
              >
                ABORT
              </button>
              <button
                onClick={handleStartCountdown}
                className="flex-2 py-3 px-6 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-heading font-black text-sm uppercase tracking-wider hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition flex items-center justify-center gap-2"
              >
                DEPLOY OPERATOR <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STATE: COUNTDOWN */}
        {gameState === 'countdown' && (
          <div className="text-center space-y-4 z-10">
            <div className="text-7xl sm:text-8xl font-black font-heading text-[#D4AF37] animate-bounce">
              {countdown}
            </div>
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">Locking crosshairs...</p>
          </div>
        )}

        {/* STATE: ACTIVE PLAYING ARENA */}
        {gameState === 'playing' && (
          <div 
            ref={arenaRef}
            onClick={handleArenaClick}
            className="absolute inset-0 cursor-crosshair overflow-hidden"
          >
            {/* Center Reticle Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-[#D4AF37]/10 pointer-events-none" />

            {/* Active Targets */}
            {targets.map(t => {
              const isMicro = t.type === 'micro';
              const isReflex = t.type === 'reflex';
              const isDecoy = t.type === 'decoy';

              return (
                <div
                  key={t.id}
                  data-target-id={t.id}
                  onClick={(e) => handleTargetClick(t, e)}
                  style={{
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    width: `${t.size}px`,
                    height: `${t.size}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-90 cursor-pointer shadow-lg ${
                    isDecoy
                      ? 'bg-rose-950/80 border-2 border-rose-500 shadow-rose-500/30'
                      : isMicro
                      ? 'bg-amber-950/80 border-2 border-[#D4AF37] shadow-[#D4AF37]/40'
                      : isReflex
                      ? 'bg-sky-950/80 border-2 border-sky-400 shadow-sky-400/40'
                      : 'bg-emerald-950/80 border-2 border-emerald-400 shadow-emerald-400/30'
                  }`}
                >
                  {/* Shrinking Ring indicator for lifetime */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    <circle
                      cx={t.size / 2}
                      cy={t.size / 2}
                      r={(t.size / 2) - 3}
                      fill="none"
                      stroke={isDecoy ? '#EF4444' : isMicro ? '#D4AF37' : isReflex ? '#38BDF8' : '#10B981'}
                      strokeWidth="2.5"
                      strokeDasharray={`${Math.PI * (t.size - 6)}`}
                      strokeDashoffset={`${(Math.PI * (t.size - 6)) * (1 - t.remainingPercent / 100)}`}
                    />
                  </svg>

                  {/* Core Icon */}
                  {isDecoy ? (
                    <AlertOctagon className="w-5 h-5 text-rose-400" />
                  ) : isMicro ? (
                    <Sparkles className="w-4 h-4 text-[#D4AF37] animate-spin" />
                  ) : isReflex ? (
                    <Zap className="w-4 h-4 text-sky-400" />
                  ) : (
                    <Target className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
              );
            })}

            {/* Floating Impact Numbers */}
            {floatingTexts.map(f => (
              <div
                key={f.id}
                style={{
                  left: `${f.x}%`,
                  top: `${f.y}%`,
                  color: f.color,
                  transform: 'translate(-50%, -100%)'
                }}
                className="absolute pointer-events-none font-mono font-black text-xs sm:text-sm animate-fade-up drop-shadow-md"
              >
                {f.text}
              </div>
            ))}
          </div>
        )}

        {/* STATE: GAME OVER / RESULTS */}
        {gameState === 'gameover' && (
          <div className="max-w-lg w-full bg-[#12161c] border border-[#D4AF37]/40 rounded-xl p-6 sm:p-8 text-center space-y-6 z-10 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="text-left">
                <span className="text-[10px] font-mono uppercase text-[#D4AF37] tracking-wider">Mission Debriefing</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Operation Concluded</h3>
              </div>
              <div className="px-4 py-2 bg-[#D4AF37]/15 border border-[#D4AF37]/50 rounded-lg text-center">
                <div className="text-[9px] font-mono uppercase text-[#D4AF37]">RATING</div>
                <div className="text-2xl font-black text-[#D4AF37]">{grade}</div>
              </div>
            </div>

            {/* Main Score Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">FINAL SCORE</div>
                <div className="text-xl font-black text-white mt-1">{score}</div>
              </div>
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">ACCURACY</div>
                <div className={`text-xl font-black mt-1 ${accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {accuracy}%
                </div>
              </div>
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">AVG REACTION</div>
                <div className="text-xl font-black text-sky-400 mt-1">{avgReaction}ms</div>
              </div>
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">MAX COMBO</div>
                <div className="text-xl font-black text-[#D4AF37] mt-1">{maxCombo}x</div>
              </div>
            </div>

            {/* Shot breakdown */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#181e27] rounded-lg border border-zinc-800 font-mono text-xs text-zinc-300">
              <span>Shots Fired: <strong className="text-white">{shotsFired}</strong></span>
              <span>Direct Hits: <strong className="text-emerald-400">{shotsHit}</strong></span>
              <span>Time Elapsed: <strong className="text-white">{totalTime}s</strong></span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleStartCountdown}
                className="flex-1 py-3 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> RETRY DRILL
              </button>
              <button
                onClick={handleSubmitScore}
                className="flex-2 py-3 px-6 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-heading font-black text-sm uppercase tracking-wider hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" /> SUBMIT TO LEADERBOARD
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
