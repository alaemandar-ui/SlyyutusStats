import React, { useState, useEffect, useRef } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { Target, Zap, RotateCcw, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

export const PrecisionTimingGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [round, setRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [indicatorPos, setIndicatorPos] = useState<number>(50); // 0 to 100%
  const [targetZone, setTargetZone] = useState<{ center: number; width: number }>({ center: 50, width: 14 });
  const [isOscillating, setIsOscillating] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ text: string; type: 'perfect' | 'good' | 'miss' } | null>(null);
  const [precisionHistory, setPrecisionHistory] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const animationFrameRef = useRef<number | null>(null);
  const posRef = useRef<number>(50);
  const directionRef = useRef<number>(1);

  const totalRounds = 5;

  // Base width by difficulty
  const baseWidth = difficulty === 'expert' ? 6 : difficulty === 'hard' ? 9 : difficulty === 'medium' ? 14 : 20;
  const speedMultiplier = difficulty === 'expert' ? 1.8 : difficulty === 'hard' ? 1.4 : difficulty === 'medium' ? 1.1 : 0.8;

  useEffect(() => {
    initRound(1);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [difficulty]);

  const initRound = (r: number) => {
    // Narrow width progressively each round
    const currentWidth = Math.max(3, baseWidth - (r - 1) * 1.5);
    // Random target center between 20% and 80%
    const center = Math.floor(Math.random() * 50) + 25;
    
    setTargetZone({ center, width: currentWidth });
    posRef.current = 10;
    directionRef.current = 1;
    setIndicatorPos(10);
    setIsOscillating(true);
    setFeedback(null);

    startOscillation(speedMultiplier + (r - 1) * 0.15);
  };

  const startOscillation = (speed: number) => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    const step = () => {
      posRef.current += directionRef.current * (speed * 0.9);
      if (posRef.current >= 95) {
        posRef.current = 95;
        directionRef.current = -1;
      } else if (posRef.current <= 5) {
        posRef.current = 5;
        directionRef.current = 1;
      }
      setIndicatorPos(posRef.current);
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);
  };

  const handleTrigger = () => {
    if (!isOscillating || feedback !== null) return;

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsOscillating(false);

    const hitPos = posRef.current;
    const distanceToCenter = Math.abs(hitPos - targetZone.center);
    const halfWidth = targetZone.width / 2;

    if (distanceToCenter <= halfWidth) {
      // Hit!
      const deviationRatio = distanceToCenter / halfWidth; // 0 (dead center) to 1.0 (edge)
      const accuracy = Math.round((1 - deviationRatio) * 100);
      setPrecisionHistory(prev => [...prev, accuracy]);

      const isBullseye = distanceToCenter <= 1.5;
      const basePts = isBullseye ? 450 : 250;
      const precisionBonus = Math.round((1 - deviationRatio) * 200);
      const diffMult = difficulty === 'expert' ? 2.5 : difficulty === 'hard' ? 2.0 : difficulty === 'medium' ? 1.5 : 1.0;
      const earned = Math.round((basePts + precisionBonus) * diffMult);

      setScore(prev => prev + earned);
      setFeedback({
        text: isBullseye ? 'PERFECT BULLSEYE (100% Core Lock)' : `Calibrated! (${accuracy}% Precision)`,
        type: isBullseye ? 'perfect' : 'good'
      });
    } else {
      // Miss
      setPrecisionHistory(prev => [...prev, 0]);
      setFeedback({
        text: 'Desync! Laser missed calibration threshold.',
        type: 'miss'
      });
    }

    setTimeout(() => {
      if (round < totalRounds) {
        setRound(prev => prev + 1);
        initRound(round + 1);
      } else {
        finishGame();
      }
    }, 1500);
  };

  const finishGame = () => {
    const validHits = precisionHistory.filter(p => p > 0).length;
    const avgAccuracy = precisionHistory.length > 0 
      ? Math.round(precisionHistory.reduce((a, b) => a + b, 0) / precisionHistory.length) 
      : 0;
    const totalTime = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const isSuccess = validHits >= 3;

    onFinish({
      gameId: 'precision_timing',
      gameTitle: 'Oscillation Calibrator',
      score,
      timeSeconds: totalTime,
      accuracy: avgAccuracy,
      difficulty,
      gameMode: 'Standard',
      success: isSuccess
    });
  };

  return (
    <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 relative overflow-hidden text-white shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232936] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Oscillation Calibrator
              <span className="text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Lock the oscillating quantum laser within sub-millisecond sweet-spots</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936] text-xs">
            <span className="text-gray-400">Calibration Wave:</span>{' '}
            <span className="font-bold text-red-400 font-mono text-sm">{round} / {totalRounds}</span>
          </div>

          <div className="bg-[#161c24] px-4 py-2 rounded-xl border border-[#232936] text-xs">
            <span className="text-gray-400">Score:</span>{' '}
            <span className="font-bold text-[#00ff88] font-mono text-sm">{score} pts</span>
          </div>

          <button
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            Exit Game
          </button>
        </div>
      </div>

      {/* Main Track Stage */}
      <div className="bg-[#121720] border border-[#232936] rounded-xl p-8 mb-6 relative">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-6 font-mono">
          <span>0% ZERO FLUX</span>
          <span>TARGET LOCK-ZONE: {Math.round(targetZone.width)}% TOLERANCE</span>
          <span>100% MAX FLUX</span>
        </div>

        {/* The Track Container */}
        <div className="relative w-full h-20 bg-[#0a0d13] border border-[#232936] rounded-2xl overflow-hidden flex items-center px-4 shadow-inner">
          {/* Target Sweet Spot Area */}
          <div
            className="absolute top-0 bottom-0 bg-red-500/20 border-x-2 border-red-500 transition-all flex items-center justify-center"
            style={{
              left: `${targetZone.center - targetZone.width / 2}%`,
              width: `${targetZone.width}%`
            }}
          >
            {/* Bullseye Core Line */}
            <div className="w-1 h-full bg-red-400 shadow-lg shadow-red-400/80 animate-pulse"></div>
          </div>

          {/* Sweeping Laser Indicator */}
          <div
            className="absolute top-1 bottom-1 w-1.5 bg-[#00ff88] shadow-lg shadow-[#00ff88]/80 transition-none z-10"
            style={{ left: `${indicatorPos}%` }}
          >
            <div className="w-4 h-4 rounded-full bg-[#00ff88] -ml-1.5 absolute -top-1 shadow-md shadow-[#00ff88]"></div>
            <div className="w-4 h-4 rounded-full bg-[#00ff88] -ml-1.5 absolute -bottom-1 shadow-md shadow-[#00ff88]"></div>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className={`mt-6 p-3 rounded-xl border text-center text-xs font-bold animate-fade-in ${
            feedback.type === 'perfect' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
              : feedback.type === 'good'
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
              : 'bg-red-500/20 border-red-500/50 text-red-300'
          }`}>
            {feedback.text}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="flex flex-col items-center justify-center gap-3">
        <button
          disabled={!isOscillating}
          onClick={handleTrigger}
          className={`w-full max-w-md py-4 rounded-2xl font-bold text-lg tracking-wider transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${
            isOscillating
              ? 'bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-red-600/30 animate-pulse'
              : 'bg-[#1e2533] text-gray-500 cursor-not-allowed'
          }`}
        >
          <Zap className="w-5 h-5" />
          LOCK FREQUENCY (SPACE / CLICK)
        </button>
        <span className="text-xs text-gray-500">Center hits trigger Perfect Bullseye bonus points</span>
      </div>
    </div>
  );
};
