import React, { useState, useEffect, useRef } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { Crosshair, Zap, ShieldAlert, Award, Clock, Heart, AlertOctagon } from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

type ShooterMode = 'Time Attack' | 'Accuracy Challenge' | 'Survival' | 'Endless';

interface TargetItem {
  id: number;
  type: 'standard' | 'fast' | 'gold' | 'hazard';
  x: number; // %
  y: number; // %
  size: number; // px
  speedX: number;
  speedY: number;
  points: number;
  createdAt: number;
  lifetime: number; // ms
}

export const ArcadeShooterGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [mode, setMode] = useState<ShooterMode>('Time Attack');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [shotsFired, setShotsFired] = useState<number>(0);
  const [shotsHit, setShotsHit] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [lives, setLives] = useState<number>(3);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const nextTargetId = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);

  const spawnIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Speed multiplier based on difficulty
  const speedMult = difficulty === 'expert' ? 1.9 : difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.1 : 0.8;

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setShotsFired(0);
    setShotsHit(0);
    setCombo(0);
    setMaxCombo(0);
    setLives(3);
    setTimeLeft(mode === 'Time Attack' ? 30 : 45);
    setTargets([]);
    setGameStartTime(Date.now());

    // Spawner loop
    const spawnRate = difficulty === 'expert' ? 600 : difficulty === 'hard' ? 750 : difficulty === 'medium' ? 950 : 1200;
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    spawnIntervalRef.current = setInterval(spawnTarget, spawnRate);

    // Main animation & collision loop
    startAnimationLoop();
  };

  const spawnTarget = () => {
    const roll = Math.random();
    let type: TargetItem['type'] = 'standard';
    let size = 48;
    let points = 100;
    let lifetime = 3500;

    if (roll < 0.18) {
      type = 'hazard'; // EMP Decoy
      size = 42;
      points = -150;
      lifetime = 4000;
    } else if (roll < 0.35) {
      type = 'fast'; // Swift Recon Drone
      size = 36;
      points = 250;
      lifetime = 2200;
    } else if (roll < 0.45) {
      type = 'gold'; // High Value Gold Core
      size = 40;
      points = 500;
      lifetime = 1800;
    }

    const speed = (type === 'fast' ? 1.8 : 1.0) * speedMult;
    const angle = Math.random() * Math.PI * 2;

    const newTarget: TargetItem = {
      id: nextTargetId.current++,
      type,
      x: Math.floor(Math.random() * 70) + 15,
      y: Math.floor(Math.random() * 60) + 20,
      size,
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      points,
      createdAt: Date.now(),
      lifetime
    };

    setTargets(prev => [...prev.slice(-12), newTarget]);
  };

  const startAnimationLoop = () => {
    const loop = () => {
      const now = Date.now();

      setTargets(prev => {
        return prev
          .map(t => {
            let nextX = t.x + t.speedX * 0.2;
            let nextY = t.y + t.speedY * 0.2;
            let sx = t.speedX;
            let sy = t.speedY;

            // Bounce off edges
            if (nextX <= 5 || nextX >= 90) sx = -sx;
            if (nextY <= 5 || nextY >= 85) sy = -sy;

            return {
              ...t,
              x: Math.max(5, Math.min(90, nextX)),
              y: Math.max(5, Math.min(85, nextY)),
              speedX: sx,
              speedY: sy
            };
          })
          .filter(t => now - t.createdAt < t.lifetime); // Expire old targets
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  // Timer countdown for Time Attack & modes
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, shotsFired, shotsHit, combo]);

  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlaying) return;
    setShotsFired(prev => prev + 1);

    // If clicked empty arena background, break combo
    const targetElement = (e.target as HTMLElement).closest('[data-target-id]');
    if (!targetElement) {
      setCombo(0);
      setScore(prev => Math.max(0, prev - 25)); // Miss penalty
    }
  };

  const handleTargetClick = (target: TargetItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPlaying) return;

    setShotsFired(prev => prev + 1);
    setShotsHit(prev => prev + 1);

    if (target.type === 'hazard') {
      // Hit a hazard decoy!
      setCombo(0);
      setScore(prev => Math.max(0, prev - 200));
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0 && mode === 'Survival') {
          endGame();
        }
        return Math.max(0, next);
      });
    } else {
      // Hit valid target
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);

      const comboMultiplier = 1 + Math.min(5, newCombo * 0.15);
      const diffMult = difficulty === 'expert' ? 2.2 : difficulty === 'hard' ? 1.8 : difficulty === 'medium' ? 1.4 : 1.0;
      const ptsEarned = Math.round(target.points * comboMultiplier * diffMult);
      setScore(prev => prev + ptsEarned);
    }

    // Remove hit target
    setTargets(prev => prev.filter(t => t.id !== target.id));
  };

  const endGame = () => {
    setIsPlaying(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);

    const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;
    const timeUsed = Math.max(1, Math.round((Date.now() - gameStartTime) / 1000));
    const isSuccess = score >= 800;

    onFinish({
      gameId: 'arcade_shooter',
      gameTitle: 'Holo-Range Assault',
      score,
      timeSeconds: timeUsed,
      accuracy,
      difficulty,
      gameMode: mode,
      success: isSuccess
    });
  };

  return (
    <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 relative overflow-hidden text-white shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232936] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Holo-Range Assault
              <span className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Fast-paced target shooting gallery with combo chains and hazard decoys</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPlaying && (
            <>
              <div className="flex items-center gap-2 bg-[#161c24] px-3.5 py-1.5 rounded-xl border border-[#232936]">
                <Clock className="w-4 h-4 text-rose-400" />
                <span className="text-sm font-bold font-mono text-white">{timeLeft}s</span>
              </div>

              <div className="flex items-center gap-2 bg-[#161c24] px-3.5 py-1.5 rounded-xl border border-[#232936]">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-300 font-mono">{combo}x Combo</span>
              </div>

              <div className="bg-[#161c24] px-3.5 py-1.5 rounded-xl border border-[#232936]">
                <span className="text-sm font-bold text-[#00ff88] font-mono">{score} pts</span>
              </div>
            </>
          )}

          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* Mode Selector (When not playing) */}
      {!isPlaying && (
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-6 mb-6 text-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-3">Select Firing Mode</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto mb-6">
            {(['Time Attack', 'Accuracy Challenge', 'Survival', 'Endless'] as ShooterMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                  mode === m
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-lg shadow-rose-500/20'
                    : 'bg-[#161c26] border-[#232936] text-gray-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={startGame}
            className="px-8 py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-xl shadow-rose-600/30 transition-all inline-flex items-center gap-2 active:scale-95"
          >
            <Crosshair className="w-5 h-5" />
            INITIALIZE FIRING RANGE
          </button>
        </div>
      )}

      {/* Target Arena Area */}
      <div
        ref={arenaRef}
        onClick={handleArenaClick}
        className={`relative w-full h-[400px] bg-[#090c12] border border-[#1e2533] rounded-2xl overflow-hidden cursor-crosshair select-none shadow-inner ${
          !isPlaying ? 'opacity-40 pointer-events-none' : ''
        }`}
      >
        {/* Grid HUD Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370f_1px,transparent_1px),linear-gradient(to_bottom,#1f29370f_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* Targets */}
        {targets.map(t => {
          let badgeColor = 'bg-cyan-500/20 border-cyan-400 text-cyan-300';
          let label = 'TARGET';

          if (t.type === 'hazard') {
            badgeColor = 'bg-red-500/30 border-red-500 text-red-400 animate-pulse';
            label = 'DECOY';
          } else if (t.type === 'fast') {
            badgeColor = 'bg-purple-500/30 border-purple-400 text-purple-300';
            label = 'SWIFT';
          } else if (t.type === 'gold') {
            badgeColor = 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/50';
            label = 'GOLD';
          }

          return (
            <div
              key={t.id}
              data-target-id={t.id}
              onClick={(e) => handleTargetClick(t, e)}
              className={`absolute rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-90 ${badgeColor}`}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: `${t.size}px`,
                height: `${t.size}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-2 h-2 rounded-full bg-current"></div>
              <span className="text-[8px] font-mono font-bold mt-0.5">{label}</span>
            </div>
          );
        })}

        {/* Live HUD info */}
        {isPlaying && (
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-gray-500 font-mono pointer-events-none">
            <span>ACCURACY: {shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 100}%</span>
            <span>TARGETS IN SECTOR: {targets.length}</span>
            <span>MISS PENALTY ACTIVE</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-gray-400 border-t border-[#232936] pt-4">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Standard (+100)
          <span className="w-2 h-2 rounded-full bg-purple-400 ml-2"></span> Swift (+250)
          <span className="w-2 h-2 rounded-full bg-amber-400 ml-2"></span> Gold (+500)
          <span className="w-2 h-2 rounded-full bg-red-400 ml-2"></span> Hazard Decoy (-200)
        </span>
        <span>Combo chains increase score multiplier up to 5x</span>
      </div>
    </div>
  );
};
