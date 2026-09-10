import React, { useState, useEffect, useRef } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { Layers, AlertTriangle, Flame, Compass, Check, X, ShieldAlert, Heart } from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

export const MultiTaskGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [survivalSeconds, setSurvivalSeconds] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Stream 1: Drone Pitch / Tilt Balance (-50 to +50, 0 is centered)
  const [droneTilt, setDroneTilt] = useState<number>(0);
  
  // Stream 2: Rapid Math / Logic Verification
  const [mathPrompt, setMathPrompt] = useState<{ expr: string; shownResult: number; isValid: boolean }>({
    expr: '7 + 8',
    shownResult: 15,
    isValid: true
  });
  const [mathTimer, setMathTimer] = useState<number>(5);

  // Stream 3: Reactor Core Heat (0 to 100%)
  const [reactorHeat, setReactorHeat] = useState<number>(20);

  const startTimeRef = useRef<number>(Date.now());

  const heatSpeed = difficulty === 'expert' ? 3.5 : difficulty === 'hard' ? 2.8 : difficulty === 'medium' ? 2.0 : 1.4;
  const driftSpeed = difficulty === 'expert' ? 4.0 : difficulty === 'hard' ? 3.0 : difficulty === 'medium' ? 2.2 : 1.5;

  // Global Loop
  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setSurvivalSeconds(prev => prev + 1);

      // Passive score accumulation for surviving
      setScore(prev => prev + (difficulty === 'expert' ? 40 : difficulty === 'hard' ? 30 : 20));

      // Drone drift random turbulence
      setDroneTilt(prev => {
        const drift = (Math.random() - 0.5) * driftSpeed * 4;
        const next = Math.max(-60, Math.min(60, prev + drift));
        if (Math.abs(next) >= 50) {
          triggerDamage('Drone unstable! Pitch exceeded critical angle');
        }
        return next;
      });

      // Reactor heat increase
      setReactorHeat(prev => {
        const next = prev + heatSpeed;
        if (next >= 100) {
          triggerDamage('Reactor Overheated! Thermal breakdown occurred');
          return 30; // reset heat
        }
        return next;
      });

      // Math verification timer
      setMathTimer(prev => {
        if (prev <= 1) {
          triggerDamage('Data Stream Timeout! Verification expired');
          generateNewMath();
          return 5;
        }
        return prev - 1;
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [gameOver, lives, difficulty]);

  const triggerDamage = (reason: string) => {
    setLives(prev => {
      const next = prev - 1;
      if (next <= 0) {
        endSession();
      }
      return next;
    });
  };

  const generateNewMath = () => {
    const a = Math.floor(Math.random() * 12) + 2;
    const b = Math.floor(Math.random() * 12) + 2;
    const op = Math.random() > 0.5 ? '+' : '-';
    const trueVal = op === '+' ? a + b : a - b;
    const makeValid = Math.random() > 0.5;
    const shown = makeValid ? trueVal : trueVal + (Math.random() > 0.5 ? 2 : -2);

    setMathPrompt({
      expr: `${a} ${op} ${b}`,
      shownResult: shown,
      isValid: shown === trueVal
    });
    setMathTimer(difficulty === 'expert' ? 3 : difficulty === 'hard' ? 4 : 5);
  };

  const handleMathAnswer = (userSaysValid: boolean) => {
    if (userSaysValid === mathPrompt.isValid) {
      setScore(prev => prev + 150);
      generateNewMath();
    } else {
      triggerDamage('Wrong Verification! Computation error');
      generateNewMath();
    }
  };

  const handleStabilize = (direction: 'left' | 'right') => {
    setDroneTilt(prev => {
      const adjust = direction === 'left' ? -12 : 12;
      return Math.max(-50, Math.min(50, prev + adjust));
    });
  };

  const handleVentReactor = () => {
    if (reactorHeat >= 50) {
      setScore(prev => prev + 100);
      setReactorHeat(Math.max(10, reactorHeat - 45));
    } else {
      // premature vent penalty
      setScore(prev => Math.max(0, prev - 25));
      setReactorHeat(Math.max(5, reactorHeat - 15));
    }
  };

  const endSession = () => {
    setGameOver(true);
    const totalTime = Math.max(1, survivalSeconds);
    const isSuccess = survivalSeconds >= 25;
    const accuracy = Math.min(100, Math.round((survivalSeconds / 45) * 100));

    onFinish({
      gameId: 'multi_task',
      gameTitle: 'Cognitive Overload',
      score,
      timeSeconds: totalTime,
      accuracy,
      difficulty,
      gameMode: 'Survival',
      success: isSuccess
    });
  };

  return (
    <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 relative overflow-hidden text-white shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232936] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Cognitive Overload
              <span className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Handle 3 simultaneous tactical streams: Drone Pitch, Neural Math, and Core Cooling</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936]">
            {[1, 2, 3].map(heart => (
              <Heart key={heart} className={`w-4 h-4 ${heart <= lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
            ))}
          </div>

          <div className="bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936] text-xs">
            <span className="text-gray-400">Survived:</span>{' '}
            <span className="font-bold text-orange-400 font-mono text-sm">{survivalSeconds}s</span>
          </div>

          <div className="bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936] text-xs">
            <span className="text-gray-400">Score:</span>{' '}
            <span className="font-bold text-[#00ff88] font-mono text-sm">{score}</span>
          </div>

          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* 3 Concurrent Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Stream 1: Drone Balance */}
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                Stream 1: Pitch Trim
              </span>
              <span className={`text-xs font-mono font-bold ${Math.abs(droneTilt) > 35 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                {Math.round(droneTilt)}°
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">Keep balance within safe range (-45° to +45°)</p>

            {/* Gauge bar */}
            <div className="relative w-full h-8 bg-[#0a0d13] rounded-lg border border-[#232936] flex items-center px-1 mb-4 overflow-hidden">
              <div className="absolute left-1/2 w-0.5 h-full bg-cyan-400 -translate-x-1/2 z-0 opacity-50"></div>
              {/* Drone indicator */}
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shadow-md transition-all z-10 ${
                  Math.abs(droneTilt) > 35 ? 'bg-red-500 text-white animate-bounce' : 'bg-cyan-400 text-black'
                }`}
                style={{
                  transform: `translateX(${(droneTilt / 50) * 110}px)`
                }}
              >
                ▲
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleStabilize('left')}
              className="flex-1 py-2.5 bg-[#161c26] hover:bg-[#202735] border border-[#232936] rounded-lg text-xs font-bold text-cyan-300 active:scale-95"
            >
              ◀ Left
            </button>
            <button
              onClick={() => handleStabilize('right')}
              className="flex-1 py-2.5 bg-[#161c26] hover:bg-[#202735] border border-[#232936] rounded-lg text-xs font-bold text-cyan-300 active:scale-95"
            >
              Right ▶
            </button>
          </div>
        </div>

        {/* Stream 2: Fast Math Verification */}
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                Stream 2: Verification
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {mathTimer}s
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Confirm or reject algebraic equality</p>

            <div className="bg-[#0a0d13] border border-[#232936] rounded-lg p-3 text-center mb-4">
              <span className="text-lg font-mono font-bold text-white tracking-wider">
                {mathPrompt.expr} = {mathPrompt.shownResult}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleMathAnswer(false)}
              className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-xs font-bold text-red-300 active:scale-95 flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Invalid
            </button>
            <button
              onClick={() => handleMathAnswer(true)}
              className="flex-1 py-2.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-xs font-bold text-green-300 active:scale-95 flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Valid
            </button>
          </div>
        </div>

        {/* Stream 3: Thermal Core Heat */}
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-300 uppercase flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-red-400" />
                Stream 3: Core Temp
              </span>
              <span className={`text-xs font-mono font-bold ${reactorHeat > 70 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
                {Math.round(reactorHeat)}%
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">Vent pressure before reaching critical 100%</p>

            <div className="w-full h-4 bg-[#0a0d13] border border-[#232936] rounded-full overflow-hidden mb-4">
              <div
                className={`h-full transition-all ${
                  reactorHeat > 75 ? 'bg-red-500 animate-pulse' : reactorHeat > 50 ? 'bg-orange-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${reactorHeat}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={handleVentReactor}
            className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-lg text-xs font-bold active:scale-95 shadow-md shadow-orange-600/20"
          >
            VENT THERMAL CORE
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500">
        Survive for at least 25 seconds across all 3 streams to register a verified completion.
      </div>
    </div>
  );
};
