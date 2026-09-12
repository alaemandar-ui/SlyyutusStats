import React, { useState, useEffect, useRef } from 'react';
import { GameDifficulty, GameScoreSubmission } from './types';
import { 
  Key, 
  RotateCcw, 
  Clock, 
  Award, 
  AlertOctagon, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  Delete,
  Terminal,
  Lock,
  Unlock,
  Eye
} from 'lucide-react';

interface Props {
  difficulty: GameDifficulty;
  onFinish: (result: GameScoreSubmission) => void;
  onCancel: () => void;
}

export const KeypadMemoryGame: React.FC<Props> = ({ difficulty, onFinish, onCancel }) => {
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'memorizing' | 'input' | 'gameover'>('ready');
  const [countdown, setCountdown] = useState<number>(3);

  const totalStages = difficulty === 'expert' ? 5 : difficulty === 'hard' ? 4 : difficulty === 'medium' ? 3 : 2;
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [score, setScore] = useState<number>(0);
  const [passcode, setPasscode] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [attemptsLeft, setAttemptsLeft] = useState<number>(3);
  const [stageTimer, setStageTimer] = useState<number>(10);
  const [success, setSuccess] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);

  const gameStartTimeRef = useRef<number>(Date.now());
  const stageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const memoryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const correctCodesRef = useRef<number>(0);

  // Code length based on stage & difficulty
  const getCodeLength = (stage: number) => {
    const base = difficulty === 'expert' ? 5 : difficulty === 'hard' ? 4 : 3;
    return base + (stage - 1);
  };

  // Memorization flash duration in milliseconds
  const getFlashDuration = (stage: number) => {
    const base = difficulty === 'expert' ? 2000 : difficulty === 'hard' ? 2400 : difficulty === 'medium' ? 2800 : 3200;
    return Math.max(1200, base - (stage - 1) * 350);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);
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
    setCurrentStage(1);
    setScore(0);
    setAttemptsLeft(3);
    setSuccess(false);
    correctCodesRef.current = 0;
    gameStartTimeRef.current = Date.now();

    startStage(1);
  };

  const startStage = (stage: number) => {
    cleanup();
    setUserInput('');
    setFeedback(null);

    // Generate random numerical code
    const length = getCodeLength(stage);
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    setPasscode(code);

    // Show memorizing state
    setGameState('memorizing');

    const flashMs = getFlashDuration(stage);
    memoryTimerRef.current = setTimeout(() => {
      // Transition to input state
      setGameState('input');
      const timeAllowed = Math.max(6, 12 - (stage - 1));
      setStageTimer(timeAllowed);

      stageTimerRef.current = setInterval(() => {
        setStageTimer(prev => {
          if (prev <= 1) {
            handleFailedAttempt('TIME LOCKOUT');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, flashMs);
  };

  const handleKeyPress = (digit: string) => {
    if (gameState !== 'input') return;
    if (userInput.length >= passcode.length) return;

    const nextInput = userInput + digit;
    setUserInput(nextInput);

    // Auto submit if full length reached
    if (nextInput.length === passcode.length) {
      verifyCode(nextInput);
    }
  };

  const handleBackspace = () => {
    if (gameState !== 'input') return;
    setUserInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (gameState !== 'input') return;
    setUserInput('');
  };

  const verifyCode = (entered: string) => {
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);

    if (entered === passcode) {
      // Correct!
      correctCodesRef.current += 1;
      const stageScore = 500 + currentStage * 150 + stageTimer * 20;
      setScore(prev => prev + stageScore);
      setFeedback({ text: 'ACCESS GRANTED! + ' + stageScore, color: '#10B981' });

      if (currentStage >= totalStages) {
        setTimeout(() => {
          endGame(true);
        }, 600);
      } else {
        setTimeout(() => {
          const nextS = currentStage + 1;
          setCurrentStage(nextS);
          startStage(nextS);
        }, 800);
      }
    } else {
      handleFailedAttempt('ACCESS DENIED: INCORRECT CIPHER');
    }
  };

  const handleFailedAttempt = (reason: string) => {
    if (stageTimerRef.current) clearInterval(stageTimerRef.current);

    setAttemptsLeft(prev => {
      const next = prev - 1;
      if (next <= 0) {
        setFeedback({ text: 'TERMINAL LOCKDOWN ACTIVATED', color: '#EF4444' });
        setTimeout(() => endGame(false), 900);
      } else {
        setFeedback({ text: `${reason} (${next} attempts remaining)`, color: '#EF4444' });
        setTimeout(() => {
          startStage(currentStage);
        }, 1200);
      }
      return Math.max(0, next);
    });
  };

  const endGame = (isWin: boolean) => {
    cleanup();
    setSuccess(isWin);
    setGameState('gameover');
  };

  // Keyboard input listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'input') return;
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, userInput, passcode]);

  const handleFinishSubmit = () => {
    const totalTime = Math.max(1, Math.round((Date.now() - gameStartTimeRef.current) / 1000));
    const finalScore = score + (success ? 800 + attemptsLeft * 200 : 0);
    const accuracy = totalStages > 0 ? Math.round((correctCodesRef.current / totalStages) * 100) : 0;

    onFinish({
      gameId: 'keypad_memory',
      gameTitle: 'Keypad Cipher Memory',
      score: finalScore,
      timeSeconds: totalTime,
      accuracy,
      difficulty,
      gameMode: 'Cipher Memory',
      success
    });
  };

  return (
    <div className="w-full bg-[#0d0f12] border border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Banner */}
      <div className="bg-[#12161c] px-6 py-4 border-b border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg text-[#D4AF37]">
            <Key className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              Keypad Cipher Memory
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] uppercase">
                {difficulty}
              </span>
            </h2>
            <p className="text-xs font-mono text-zinc-400">FiveM-inspired mainframe terminal memory breach</p>
          </div>
        </div>

        {(gameState === 'memorizing' || gameState === 'input') && (
          <div className="flex items-center gap-6 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-zinc-400">LOCKOUT:</span>
              <span className={`font-bold ${stageTimer <= 3 ? 'text-rose-500 animate-ping' : 'text-white'}`}>{stageTimer}s</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400">STAGE:</span>
              <span className="font-bold text-[#D4AF37]">{currentStage} / {totalStages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400 text-xs">CHANCES:</span>
              {[1, 2, 3].map(i => (
                <ShieldCheck
                  key={i}
                  className={`w-4 h-4 ${i <= attemptsLeft ? 'text-emerald-400' : 'text-zinc-700'}`}
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
              <Terminal className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Terminal Cipher Breach</h3>
              <p className="text-xs font-mono text-zinc-400 mt-2 leading-relaxed">
                A scrambled alphanumeric security passcode will flash on the terminal screen. Commit it to memory, then reproduce the code on the tactical numpad before the lockdown countdown expires.
              </p>
            </div>

            <div className="bg-[#0a0c0f] p-4 rounded-lg border border-zinc-800 text-left font-mono text-xs space-y-2">
              <div className="flex justify-between text-zinc-400">
                <span>Security Stages:</span>
                <strong className="text-white">{totalStages} Tiered Passcodes</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Input Controls:</span>
                <strong className="text-[#D4AF37]">Numpad Clicks or 0-9 Keys</strong>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Lockout Limit:</span>
                <strong className="text-rose-400">3 Failed Entries</strong>
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
                INITIATE BREACH <ChevronRight className="w-4 h-4" />
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
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400">Intercepting cipher transmission...</p>
          </div>
        )}

        {/* ACTIVE STAGE: KEYPAD TERMINAL */}
        {(gameState === 'memorizing' || gameState === 'input') && (
          <div className="max-w-sm w-full bg-[#11151c] border border-[#D4AF37]/30 rounded-2xl p-6 shadow-2xl relative z-10 space-y-5">
            {/* Feedback Message */}
            {feedback && (
              <div 
                style={{ color: feedback.color }}
                className="text-center font-mono font-black text-xs uppercase tracking-wider animate-pulse"
              >
                {feedback.text}
              </div>
            )}

            {/* Terminal Screen Header */}
            <div className="bg-[#07090c] border border-[#D4AF37]/40 rounded-xl p-4 text-center space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 border-b border-zinc-800 pb-1.5">
                <span className="flex items-center gap-1.5 text-[#D4AF37]">
                  <Lock className="w-3.5 h-3.5" /> SECURITY GATEWAY
                </span>
                <span>{gameState === 'memorizing' ? 'FLASHING CODE' : 'ENTER CODE'}</span>
              </div>

              {/* Display Box */}
              <div className="h-14 flex items-center justify-center">
                {gameState === 'memorizing' ? (
                  <div className="text-2xl sm:text-3xl font-black font-mono tracking-[0.3em] text-[#D4AF37] animate-pulse">
                    {passcode}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {Array.from({ length: passcode.length }).map((_, idx) => {
                      const char = userInput[idx];
                      return (
                        <div
                          key={idx}
                          className={`w-8 h-10 rounded border flex items-center justify-center font-mono text-lg font-black transition-all ${
                            char
                              ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-white'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-600'
                          }`}
                        >
                          {char || '•'}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-center gap-1">
                {gameState === 'memorizing' ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> MEMORIZE CIPHER NOW
                  </span>
                ) : (
                  <span>Use on-screen buttons or keyboard numbers</span>
                )}
              </div>
            </div>

            {/* Tactical Numpad Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  disabled={gameState !== 'input'}
                  onClick={() => handleKeyPress(num)}
                  className="py-3.5 rounded-lg bg-[#181d26] border border-zinc-800 text-white font-mono font-bold text-lg hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {num}
                </button>
              ))}

              <button
                disabled={gameState !== 'input'}
                onClick={handleClear}
                className="py-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs font-bold hover:text-rose-400 active:scale-95 disabled:opacity-40 transition"
              >
                CLR
              </button>

              <button
                disabled={gameState !== 'input'}
                onClick={() => handleKeyPress('0')}
                className="py-3.5 rounded-lg bg-[#181d26] border border-zinc-800 text-white font-mono font-bold text-lg hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/10 active:scale-95 disabled:opacity-40 transition"
              >
                0
              </button>

              <button
                disabled={gameState !== 'input'}
                onClick={handleBackspace}
                className="py-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs font-bold hover:text-amber-400 active:scale-95 disabled:opacity-40 transition flex items-center justify-center"
              >
                <Delete className="w-4 h-4" />
              </button>
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
                {success ? 'TERMINAL BREACH COMPLETE' : 'ACCESS TERMINATED'}
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mt-1">
                {success ? 'MAINFRAME OVERRIDDEN' : 'SECURITY LOCKDOWN'}
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-2">
                {success 
                  ? `Successfully authenticated all ${totalStages} mainframe passcode tiers.` 
                  : `Multiple invalid code submissions caused lockdown.`}
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
                  {currentStage - 1 + (success ? 1 : 0)} / {totalStages}
                </div>
              </div>
              <div className="bg-[#090b0e] p-3 rounded-lg border border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">CHANCES LEFT</div>
                <div className="text-xl font-black text-emerald-400 mt-1">{attemptsLeft} / 3</div>
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
