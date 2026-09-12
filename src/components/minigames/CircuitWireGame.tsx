import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { 
  Scissors, 
  RotateCcw, 
  Clock, 
  Award, 
  AlertOctagon, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  ShieldAlert, 
  Cpu,
  Flame
} from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

type WireColor = 'red' | 'blue' | 'yellow' | 'green' | 'white' | 'purple';

interface WireItem {
  id: number;
  color: WireColor;
  voltage: number; // e.g. 120 - 480V
  isCut: boolean;
  label: string;
}

interface DefusalRound {
  wires: WireItem[];
  ruleDescription: string;
  correctWireIndex: number;
}

export const CircuitWireGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'playing' | 'gameover'>('ready');
  const [countdown, setCountdown] = useState<number>(3);
  
  const totalRounds = difficulty === 'expert' ? 5 : difficulty === 'hard' ? 4 : difficulty === 'medium' ? 3 : 2;
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const [success, setSuccess] = useState<boolean>(false);
  const [sparkEffect, setSparkEffect] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  const gameStartTimeRef = useRef<number>(Date.now());
  const gameClockRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const wrongCutsRef = useRef<number>(0);

  // Active round wires and rule
  const [roundData, setRoundData] = useState<DefusalRound | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
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

  const generateRound = (roundNum: number): DefusalRound => {
    const palette: WireColor[] = ['red', 'blue', 'yellow', 'green', 'white', 'purple'];
    const wireCount = difficulty === 'expert' ? 6 : difficulty === 'hard' ? 5 : 4;

    // Pick wires
    const wires: WireItem[] = [];
    for (let i = 0; i < wireCount; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      const voltage = Math.floor(Math.random() * 320) + 110;
      wires.push({
        id: i + 1,
        color,
        voltage,
        isCut: false,
        label: `T-${String.fromCharCode(65 + i)}`
      });
    }

    // Procedural rule decision tree
    let correctIdx = 0;
    let ruleText = '';

    const redCount = wires.filter(w => w.color === 'red').length;
    const blueCount = wires.filter(w => w.color === 'blue').length;
    const yellowCount = wires.filter(w => w.color === 'yellow').length;
    const highestVoltageIdx = wires.reduce((maxIdx, curr, idx, arr) => curr.voltage > arr[maxIdx].voltage ? idx : maxIdx, 0);

    const ruleVariant = (roundNum + wires.length) % 4;

    if (ruleVariant === 0) {
      if (redCount > 1) {
        correctIdx = wires.findIndex(w => w.color === 'red');
        ruleText = 'MULTIPLE RED WIRES DETECTED: Sever the primary Red conductor.';
      } else {
        correctIdx = highestVoltageIdx;
        ruleText = 'VOLTAGE SPIKE: Cut the conductor carrying the highest voltage reading.';
      }
    } else if (ruleVariant === 1) {
      if (yellowCount >= 1 && wires[wires.length - 1].color !== 'yellow') {
        correctIdx = wires.findIndex(w => w.color === 'yellow');
        ruleText = 'IMPEDANCE IMBALANCE: Sever the first Yellow tracer wire.';
      } else {
        correctIdx = Math.max(0, wires.length - 1);
        ruleText = 'CIRCUIT GROUND OVERFLOW: Cut the bottom-most terminal wire.';
      }
    } else if (ruleVariant === 2) {
      if (blueCount >= 2) {
        correctIdx = wires.map((w, i) => w.color === 'blue' ? i : -1).filter(i => i !== -1).pop()!;
        ruleText = 'DUAL HARMONICS: Sever the secondary Blue telemetry line.';
      } else {
        correctIdx = 0;
        ruleText = 'BYPASS ROUTE: Sever the top terminal (T-A) lead directly.';
      }
    } else {
      correctIdx = highestVoltageIdx;
      ruleText = 'HIGH LOAD ALERT: Cut the conductor carrying maximum load voltage.';
    }

    // Safeguard index in bounds
    if (correctIdx < 0 || correctIdx >= wires.length) {
      correctIdx = 0;
    }

    return {
      wires,
      ruleDescription: ruleText,
      correctWireIndex: correctIdx
    };
  };

  const launchGame = () => {
    cleanup();
    setGameState('playing');
    setCurrentRound(1);
    setScore(0);
    setSuccess(false);
    wrongCutsRef.current = 0;

    const initialTime = difficulty === 'expert' ? 25 : difficulty === 'hard' ? 30 : 35;
    setTimeLeft(initialTime);
    gameStartTimeRef.current = Date.now();

    const initialRound = generateRound(1);
    setRoundData(initialRound);

    gameClockRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame(false, 'TIME DETONATION');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCutWire = (index: number) => {
    if (gameState !== 'playing' || !roundData) return;
    if (roundData.wires[index].isCut) return;

    // Mark wire as cut
    const updatedWires = [...roundData.wires];
    updatedWires[index].isCut = true;
    setRoundData({ ...roundData, wires: updatedWires });

    if (index === roundData.correctWireIndex) {
      // Correct cut!
      setScore(prev => prev + 450 + Math.max(0, timeLeft * 10));
      setFeedback({ text: 'DISARMED CURRENT CIRCUIT! +450', color: '#10B981' });

      if (currentRound >= totalRounds) {
        endGame(true, 'DEVICE SAFELY DEFUSED');
      } else {
        setTimeout(() => {
          setFeedback(null);
          const nextR = currentRound + 1;
          setCurrentRound(nextR);
          setRoundData(generateRound(nextR));
        }, 800);
      }
    } else {
      // Wrong cut penalty
      wrongCutsRef.current += 1;
      setSparkEffect(true);
      setTimeout(() => setSparkEffect(false), 500);

      setTimeLeft(prev => {
        const nextT = Math.max(0, prev - 6);
        if (nextT <= 0) {
          endGame(false, 'OVERLOAD EXPLOSION');
        }
        return nextT;
      });

      setFeedback({ text: 'WRONG WIRE! SHORT CIRCUIT (-6 SECONDS)', color: '#EF4444' });
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  const endGame = (isWin: boolean, _reason: string) => {
    cleanup();
    setSuccess(isWin);
    setGameState('gameover');
  };

  const handleFinishSubmit = () => {
    const totalTime = Math.max(1, Math.round((Date.now() - gameStartTimeRef.current) / 1000));
    const totalCuts = (currentRound - 1 + (success ? 1 : 0)) + wrongCutsRef.current;
    const accuracy = totalCuts > 0 ? Math.round(((totalCuts - wrongCutsRef.current) / totalCuts) * 1000) / 10 : 0;
    const finalScore = score + (success ? 900 + Math.max(0, timeLeft * 20) : 0);

    onFinish({
      gameId: 'circuit_wire',
      gameTitle: 'Circuit Wire Defusal',
      score: finalScore,
      timeSeconds: totalTime,
      accuracy,
      difficulty,
      gameMode: 'Wire Defusal',
      success
    });
  };

  const colorStyles: Record<WireColor, { bg: string; border: string; glow: string }> = {
    red: { bg: '#DC2626', border: '#991B1B', glow: 'rgba(220, 38, 38, 0.6)' },
    blue: { bg: '#2563EB', border: '#1E40AF', glow: 'rgba(37, 99, 235, 0.6)' },
    yellow: { bg: '#EAB308', border: '#A16207', glow: 'rgba(234, 179, 8, 0.6)' },
    green: { bg: '#16A34A', border: '#15803D', glow: 'rgba(22, 163, 74, 0.6)' },
    white: { bg: '#E2E8F0', border: '#94A3B8', glow: 'rgba(226, 232, 240, 0.6)' },
    purple: { bg: '#9333EA', border: '#6B21A8', glow: 'rgba(147, 51, 234, 0.6)' }
  };

  return (
    <div className={`w-full bg-[#0d0f12] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl transition-colors duration-200 ${sparkEffect ? 'bg-rose-950/40' : ''}`}>
      {/* Top Banner */}
      <div className="bg-[#12161c] px-6 py-4 border-b border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37]">
            <Scissors className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              Circuit Wire Defusal
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] uppercase">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs font-mono text-zinc-400">FiveM-inspired electronic schematic defusal puzzle</p>
          </div>
        </div>

        {gameState === 'playing' && (
          <div className="flex items-center gap-6 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-zinc-400">DETONATION:</span>
              <span className={`font-black ${timeLeft <= 6 ? 'text-rose-500 animate-ping' : 'text-white'}`}>{timeLeft}s</span>
            </div>

            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="text-zinc-400">MODULE:</span>
              <span className="font-bold text-[#D4AF37]">{currentRound} / {totalRounds}</span>
            </div>

            <div className="bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-3 py-1 rounded text-[#D4AF37] font-black">
              SCORE: {score}
            </div>
          </div>
        )}
      </div>

      {/* Main Interactive Stage */}
      <div className="relative min-h-[440px] sm:min-h-[500px] bg-[#07090c] flex items-center justify-center p-6 select-none">
        {/* Spark Flash Overlay */}
        {sparkEffect && (
          <div className="absolute inset-0 bg-rose-500/20 pointer-events-none animate-ping z-30" />
        )}

        {/* READY STATE */}
        {gameState === 'ready' && (
          <div className="max-w-md w-full bg-[#12161c] border border-[#D4AF37]/30 rounded-xl p-6 text-center space-y-6 z-10 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center mx-auto text-[#D4AF37]">
              <Scissors className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Circuit Neutralization</h3>
              <p className="text-xs font-mono text-zinc-400 mt-2 leading-relaxed">
                Analyze the electronic terminal readings and follow the defusal protocol to snip the exact wire. Severing an incorrect wire causes short circuits and reduces timer by 6 seconds.
              </p>
            </div>

            <div className="bg-[#0a0c0f] p-4 rounded-lg border border-zinc-800 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Modules to Defuse:</span>
                <strong className="text-white">{totalRounds} Sequenced Circuit Blocks</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Initial Timer:</span>
                <strong className="text-rose-400">{difficulty === 'expert' ? 25 : 35} Seconds</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Penalty on Short:</span>
                <strong className="text-amber-400">-6 Seconds & Shock Hazard</strong>
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
                DEPLOY CUTTERS <ChevronRight className="w-4 h-4" />
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
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">Accessing high-voltage terminal...</p>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === 'playing' && roundData && (
          <div className="max-w-xl w-full bg-[#10141a] border border-[#D4AF37]/30 rounded-xl p-6 shadow-2xl relative z-10 space-y-6">
            {/* Feedback Popover */}
            {feedback && (
              <div 
                style={{ color: feedback.color }}
                className="text-center font-mono font-black text-xs sm:text-sm uppercase tracking-wider animate-bounce"
              >
                {feedback.text}
              </div>
            )}

            {/* Tactical Protocol Display Box */}
            <div className="bg-[#080a0d] border border-[#D4AF37]/40 rounded-lg p-4 font-mono">
              <div className="flex items-center justify-between text-[11px] text-[#D4AF37] border-b border-zinc-800 pb-2 mb-2">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> DEFUSAL PROTOCOL [MODULE {currentRound}]</span>
                <span className="text-zinc-400">SYS_V2.4</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-200 font-bold leading-relaxed">
                {roundData.ruleDescription}
              </p>
            </div>

            {/* Wires Rack Display */}
            <div className="space-y-4 bg-[#090b0e] p-5 rounded-lg border border-zinc-800/80">
              {roundData.wires.map((wire, idx) => {
                const style = colorStyles[wire.color];
                return (
                  <div key={wire.id} className="flex items-center gap-4">
                    {/* Left Terminal Block */}
                    <div className="w-12 text-center font-mono text-xs font-bold text-zinc-400 bg-zinc-900 border border-zinc-700 py-1 rounded">
                      {wire.label}
                    </div>

                    {/* Interactive Wire Cable */}
                    <div 
                      onClick={() => handleCutWire(idx)}
                      className={`flex-1 h-7 rounded relative flex items-center justify-center cursor-pointer transition-all duration-200 group ${
                        wire.isCut 
                          ? 'opacity-40 cursor-not-allowed' 
                          : 'hover:brightness-125 hover:scale-[1.01]'
                      }`}
                      style={{
                        backgroundColor: style.bg,
                        borderColor: style.border,
                        borderWidth: '2px',
                        boxShadow: wire.isCut ? 'none' : `0 0 10px ${style.glow}`
                      }}
                    >
                      {wire.isCut ? (
                        <span className="text-[10px] font-mono text-white font-black bg-black/60 px-2 py-0.5 rounded">
                          SEVERED
                        </span>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-white">
                          <Scissors className="w-3.5 h-3.5 text-[#D4AF37]" /> SNIP
                        </div>
                      )}
                    </div>

                    {/* Right Voltage Gauge */}
                    <div className="w-16 text-right font-mono text-xs text-amber-400 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded">
                      {wire.voltage}V
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-xs font-mono text-zinc-400">
              Click on the designated wire to cut it before the countdown expires
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
                {success ? 'OPERATION SUCCESS' : 'DEFUSAL FAILURE'}
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">
                {success ? 'CIRCUIT DEFUSED' : 'CIRCUIT OVERLOAD'}
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-2">
                {success 
                  ? `All ${totalRounds} modules neutralised with zero detonations.` 
                  : `High voltage circuit shorted before completing all modules.`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">SCORE</div>
                <div className="text-xl font-black text-white mt-1">{score}</div>
              </div>
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">MODULES</div>
                <div className="text-xl font-black text-[#D4AF37] mt-1">
                  {currentRound - 1 + (success ? 1 : 0)} / {totalRounds}
                </div>
              </div>
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">REMAINING</div>
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
