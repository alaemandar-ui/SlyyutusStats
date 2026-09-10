import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchMiniGameLeaderboard, 
  fetchUserMiniGameStats, 
  submitMiniGameScore 
} from '../lib/api';
import { UserAvatar } from '../components/UserAvatar';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { 
  Gamepad2, 
  Trophy, 
  Flame, 
  Clock, 
  Zap, 
  Target, 
  HelpCircle, 
  Keyboard, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Medal, 
  Award, 
  RotateCcw,
  Sliders,
  ChevronRight
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string;
  bestScore: number;
  fastestTime: number;
  totalWins: number;
  lastPlayedAt: string;
  favoriteGame: string;
  difficulty: string;
}

export const MiniGamesPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { isAuthenticated, user, showToast } = useAuth();
  
  // Navigation & filter state
  const [selectedGame, setSelectedGame] = useState<'reflex' | 'trivia' | 'typing'>('reflex');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard'>('play');
  
  // Leaderboard state
  const [leaderboardFilterGame, setLeaderboardFilterGame] = useState<string>('all');
  const [leaderboardFilterDiff, setLeaderboardFilterDiff] = useState<string>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(true);
  const [submittingScore, setSubmittingScore] = useState<boolean>(false);
  const [lastSubmittedResult, setLastSubmittedResult] = useState<any | null>(null);

  // -------------------------------------------------------------
  // GAME 1: APEX REFLEX BLITZ STATE
  // -------------------------------------------------------------
  const [reflexActive, setReflexActive] = useState<boolean>(false);
  const [reflexGameOver, setReflexGameOver] = useState<boolean>(false);
  const [reflexTimeLeft, setReflexTimeLeft] = useState<number>(25);
  const [reflexScore, setReflexScore] = useState<number>(0);
  const [reflexHits, setReflexHits] = useState<number>(0);
  const [reflexMisses, setReflexMisses] = useState<number>(0);
  const [reflexCombo, setReflexCombo] = useState<number>(0);
  const [reflexMaxCombo, setReflexMaxCombo] = useState<number>(0);
  const [activeTargets, setActiveTargets] = useState<Array<{ id: number; type: 'normal' | 'gold' | 'hazard'; index: number }>>([]);
  const reflexTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reflexSpawnRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------
  // GAME 2: STREAM LORE TRIVIA STATE
  // -------------------------------------------------------------
  const TRIVIA_QUESTIONS = [
    {
      q: "What is Slyyutus's signature competitive game on Kick?",
      options: ["Apex Legends", "Valorant", "Fortnite", "League of Legends"],
      correct: 0,
      lore: "Slyyutus is legendary for high-tier predator Apex Legends gameplay!"
    },
    {
      q: "How many points does a regular chat message grant in the Monthly League?",
      options: ["5 Points", "1 Point", "10 Points", "25 Points"],
      correct: 1,
      lore: "Every regular chat message gives 1 point to keep the chat active and fair."
    },
    {
      q: "What tier badge does the 1st place monthly champion receive?",
      options: ["Bronze Tier", "Diamond Tier", "Gold Champion Tier", "Mythic Champion"],
      correct: 2,
      lore: "The Season Champion is crowned with the permanent Gold Trophy badge!"
    },
    {
      q: "How many points are awarded for subscribing or gifting a sub?",
      options: ["50 Points", "100 Points", "200 Points", "500 Points"],
      correct: 1,
      lore: "Subscriptions and sub gifts distribute 100 points per sub to boost ranking!"
    },
    {
      q: "What is the official Slyyutus stream community known as?",
      options: ["The Slyyutus Kingdom", "Apex Dynasty", "Kick Commandos", "VOD Nation"],
      correct: 0,
      lore: "The Slyyutus Kingdom is the official community title for stream loyalists!"
    }
  ];

  const [triviaActive, setTriviaActive] = useState<boolean>(false);
  const [triviaGameOver, setTriviaGameOver] = useState<boolean>(false);
  const [triviaIndex, setTriviaIndex] = useState<number>(0);
  const [triviaScore, setTriviaScore] = useState<number>(0);
  const [triviaStreak, setTriviaStreak] = useState<number>(0);
  const [triviaSelectedOption, setTriviaSelectedOption] = useState<number | null>(null);
  const [triviaTimeLeft, setTriviaTimeLeft] = useState<number>(12);
  const triviaTimerRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------------------------
  // GAME 3: CHAT SPEED RUSH STATE
  // -------------------------------------------------------------
  const TYPING_PHRASES = [
    "SLYYUTUS KINGDOM ON TOP",
    "CHAMPION SQUAD INCOMING GG",
    "LOCK IN APEX LEGENDS GRIND",
    "W STREAM W CHAT NO CAP",
    "DROP HOT SKULL TOWN VICTORY",
    "SUB TRAIN ROLLING FULL POWER",
    "PREDATOR LOBBY WIPED OUT"
  ];

  const [typingActive, setTypingActive] = useState<boolean>(false);
  const [typingGameOver, setTypingGameOver] = useState<boolean>(false);
  const [typingIndex, setTypingIndex] = useState<number>(0);
  const [typingInput, setTypingInput] = useState<string>('');
  const [typingScore, setTypingScore] = useState<number>(0);
  const [typingWpm, setTypingWpm] = useState<number>(0);
  const [typingTimeLeft, setTypingTimeLeft] = useState<number>(30);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Leaderboard Data
  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const data = await fetchMiniGameLeaderboard(leaderboardFilterGame, leaderboardFilterDiff);
      setLeaderboard(data.leaderboard || []);
      
      const stats = await fetchUserMiniGameStats();
      setUserStats(stats);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [leaderboardFilterGame, leaderboardFilterDiff]);

  // Handle Score Submission
  const handleScoreSubmit = async (gameId: string, score: number, timeSeconds: number) => {
    try {
      setSubmittingScore(true);
      const res = await submitMiniGameScore({
        gameId,
        score,
        timeSeconds,
        difficulty,
        success: score > 0,
        username: user?.username || 'Guest_' + Math.floor(Math.random() * 1000)
      });
      setLastSubmittedResult(res);
      showToast(res.message || 'Score recorded on the community leaderboard!', 'success');
      loadLeaderboard();
    } catch (err: any) {
      showToast(err.message || 'Error recording score', 'error');
    } finally {
      setSubmittingScore(false);
    }
  };

  // -------------------------------------------------------------
  // APEX REFLEX BLITZ LOGIC
  // -------------------------------------------------------------
  const startReflexGame = () => {
    setReflexActive(true);
    setReflexGameOver(false);
    setReflexScore(0);
    setReflexHits(0);
    setReflexMisses(0);
    setReflexCombo(0);
    setReflexMaxCombo(0);
    setReflexTimeLeft(difficulty === 'easy' ? 30 : difficulty === 'hard' ? 20 : 25);
    setActiveTargets([]);
    setLastSubmittedResult(null);

    // Countdown timer
    reflexTimerRef.current = setInterval(() => {
      setReflexTimeLeft((prev) => {
        if (prev <= 1) {
          endReflexGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Spawn loop
    const spawnRate = difficulty === 'easy' ? 900 : difficulty === 'hard' ? 500 : 700;
    reflexSpawnRef.current = setInterval(() => {
      spawnTarget();
    }, spawnRate);
  };

  const spawnTarget = () => {
    const gridCount = 16;
    const randomIndex = Math.floor(Math.random() * gridCount);
    const randType = Math.random();
    const type: 'normal' | 'gold' | 'hazard' = randType < 0.15 ? 'gold' : randType < 0.3 ? 'hazard' : 'normal';

    setActiveTargets((prev) => {
      // Keep max 4 targets at a time
      const filtered = prev.slice(-3);
      return [...filtered, { id: Date.now() + Math.random(), type, index: randomIndex }];
    });
  };

  const hitTarget = (targetId: number, type: 'normal' | 'gold' | 'hazard', e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveTargets((prev) => prev.filter((t) => t.id !== targetId));

    if (type === 'hazard') {
      setReflexScore((s) => Math.max(0, s - 25));
      setReflexCombo(0);
      setReflexMisses((m) => m + 1);
    } else {
      const basePoints = type === 'gold' ? 35 : 15;
      const mult = reflexCombo >= 10 ? 3 : reflexCombo >= 5 ? 2 : 1;
      const added = basePoints * mult;

      setReflexScore((s) => s + added);
      setReflexHits((h) => h + 1);
      setReflexCombo((c) => {
        const next = c + 1;
        setReflexMaxCombo((max) => Math.max(max, next));
        return next;
      });
    }
  };

  const missClick = () => {
    if (!reflexActive) return;
    setReflexScore((s) => Math.max(0, s - 5));
    setReflexMisses((m) => m + 1);
    setReflexCombo(0);
  };

  const endReflexGame = () => {
    if (reflexTimerRef.current) clearInterval(reflexTimerRef.current);
    if (reflexSpawnRef.current) clearInterval(reflexSpawnRef.current);
    setReflexActive(false);
    setReflexGameOver(true);
    setActiveTargets([]);

    // Submit score
    setReflexScore((finalScore) => {
      handleScoreSubmit('reflex_blitz', finalScore, difficulty === 'easy' ? 30 : difficulty === 'hard' ? 20 : 25);
      return finalScore;
    });
  };

  useEffect(() => {
    return () => {
      if (reflexTimerRef.current) clearInterval(reflexTimerRef.current);
      if (reflexSpawnRef.current) clearInterval(reflexSpawnRef.current);
    };
  }, []);

  // -------------------------------------------------------------
  // TRIVIA LOGIC
  // -------------------------------------------------------------
  const startTriviaGame = () => {
    setTriviaActive(true);
    setTriviaGameOver(false);
    setTriviaIndex(0);
    setTriviaScore(0);
    setTriviaStreak(0);
    setTriviaSelectedOption(null);
    setTriviaTimeLeft(difficulty === 'hard' ? 8 : 12);
    setLastSubmittedResult(null);

    runTriviaTimer();
  };

  const runTriviaTimer = () => {
    if (triviaTimerRef.current) clearInterval(triviaTimerRef.current);
    setTriviaTimeLeft(difficulty === 'hard' ? 8 : 12);

    triviaTimerRef.current = setInterval(() => {
      setTriviaTimeLeft((prev) => {
        if (prev <= 1) {
          handleTriviaTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTriviaTimeout = () => {
    if (triviaTimerRef.current) clearInterval(triviaTimerRef.current);
    nextTriviaQuestion(false);
  };

  const selectTriviaAnswer = (optIndex: number) => {
    if (triviaSelectedOption !== null) return;
    if (triviaTimerRef.current) clearInterval(triviaTimerRef.current);

    setTriviaSelectedOption(optIndex);
    const isCorrect = optIndex === TRIVIA_QUESTIONS[triviaIndex].correct;

    if (isCorrect) {
      const speedBonus = triviaTimeLeft * 5;
      const streakBonus = triviaStreak * 10;
      const points = 50 + speedBonus + streakBonus;
      setTriviaScore((s) => s + points);
      setTriviaStreak((st) => st + 1);
    } else {
      setTriviaStreak(0);
    }

    setTimeout(() => {
      nextTriviaQuestion(isCorrect);
    }, 1200);
  };

  const nextTriviaQuestion = (wasCorrect: boolean) => {
    setTriviaSelectedOption(null);
    if (triviaIndex + 1 < TRIVIA_QUESTIONS.length) {
      setTriviaIndex((i) => i + 1);
      runTriviaTimer();
    } else {
      endTriviaGame();
    }
  };

  const endTriviaGame = () => {
    if (triviaTimerRef.current) clearInterval(triviaTimerRef.current);
    setTriviaActive(false);
    setTriviaGameOver(true);

    setTriviaScore((finalScore) => {
      handleScoreSubmit('stream_trivia', finalScore, 45);
      return finalScore;
    });
  };

  useEffect(() => {
    return () => {
      if (triviaTimerRef.current) clearInterval(triviaTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------
  // CHAT SPEED RUSH LOGIC
  // -------------------------------------------------------------
  const startTypingGame = () => {
    setTypingActive(true);
    setTypingGameOver(false);
    setTypingIndex(0);
    setTypingInput('');
    setTypingScore(0);
    setTypingWpm(0);
    setTypingTimeLeft(30);
    setLastSubmittedResult(null);

    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    typingTimerRef.current = setInterval(() => {
      setTypingTimeLeft((prev) => {
        if (prev <= 1) {
          endTypingGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTypingInput(val);

    const currentPhrase = TYPING_PHRASES[typingIndex];
    if (val.trim().toUpperCase() === currentPhrase) {
      const points = currentPhrase.length * 5 + 30;
      setTypingScore((s) => s + points);
      setTypingInput('');

      if (typingIndex + 1 < TYPING_PHRASES.length) {
        setTypingIndex((i) => i + 1);
      } else {
        setTypingIndex(0); // loop
      }
    }
  };

  const endTypingGame = () => {
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setTypingActive(false);
    setTypingGameOver(true);

    setTypingScore((finalScore) => {
      const estimatedWpm = Math.round(finalScore / 10);
      setTypingWpm(estimatedWpm);
      handleScoreSubmit('chat_speed', finalScore, 30);
      return finalScore;
    });
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Gamepad2 className="w-4 h-4" />
            <span>Official Kick Community Mini Games & Arena</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading gold-gradient-text uppercase">
            Stream Arcade & Leaderboard
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1 max-w-xl">
            Test your gaming reflexes, stream lore, and chat speed in real-time. Compete for the top arcade positions!
          </p>
        </div>

        {/* Global Action Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('play')}
            className={`px-4 py-2.5 rounded-xl font-heading font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'play'
                ? 'bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(245,197,24,0.3)]'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-amber-500/40'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Play Games</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2.5 rounded-xl font-heading font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(245,197,24,0.3)]'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-amber-500/40'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: PLAY ARENA */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'play' && (
        <div className="space-y-8">
          {/* Game Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => {
                setSelectedGame('reflex');
                setReflexGameOver(false);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                selectedGame === 'reflex'
                  ? 'border-amber-400/80 bg-amber-500/10 shadow-[0_0_20px_rgba(245,197,24,0.15)]'
                  : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-zinc-100 uppercase">
                    Apex Reflex Blitz
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-400/20 text-amber-300 font-bold uppercase">
                    Aim Test
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Click targets rapidly, dodge hazard traps & rack up combos!
                </p>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedGame('trivia');
                setTriviaGameOver(false);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                selectedGame === 'trivia'
                  ? 'border-amber-400/80 bg-amber-500/10 shadow-[0_0_20px_rgba(245,197,24,0.15)]'
                  : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-zinc-100 uppercase">
                    Stream Lore Trivia
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-400/20 text-cyan-300 font-bold uppercase">
                    Trivia
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Answer fast questions on Slyyutus stream moments & Apex lore.
                </p>
              </div>
            </div>

            <div
              onClick={() => {
                setSelectedGame('typing');
                setTypingGameOver(false);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                selectedGame === 'typing'
                  ? 'border-amber-400/80 bg-amber-500/10 shadow-[0_0_20px_rgba(245,197,24,0.15)]'
                  : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Keyboard className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-bold text-base text-zinc-100 uppercase">
                    Chat Speed Rush
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-400/20 text-emerald-300 font-bold uppercase">
                    Speed Type
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Type iconic chat phrases before the timer expires!
                </p>
              </div>
            </div>
          </div>

          {/* Difficulty Modifier */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>DIFFICULTY LEVEL:</span>
            </span>
            <div className="flex items-center gap-2">
              {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                <button
                  key={lvl}
                  disabled={reflexActive || triviaActive || typingActive}
                  onClick={() => setDifficulty(lvl)}
                  className={`px-3 py-1.5 rounded-lg uppercase font-bold text-[11px] transition-all ${
                    difficulty === lvl
                      ? 'bg-amber-400 text-zinc-950 shadow-md'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* GAME 1 CANVAS: APEX REFLEX BLITZ */}
          {selectedGame === 'reflex' && (
            <div className="p-6 sm:p-8 rounded-3xl border border-zinc-800 bg-zinc-900/80 space-y-6 shadow-2xl">
              {/* Game Stats Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-6 font-mono">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Time Remaining</span>
                    <span className={`text-2xl font-black font-heading ${reflexTimeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-zinc-100'}`}>
                      {reflexTimeLeft}s
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Score</span>
                    <span className="text-2xl font-black font-heading text-amber-400">
                      {reflexScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Combo Streak</span>
                    <span className="text-2xl font-black font-heading text-emerald-400">
                      {reflexCombo}x
                    </span>
                  </div>
                </div>

                {!reflexActive && (
                  <button
                    onClick={startReflexGame}
                    className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Play className="w-4 h-4" />
                    <span>{reflexGameOver ? 'PLAY AGAIN' : 'START BLITZ ROUND'}</span>
                  </button>
                )}
              </div>

              {/* Reflex Arena Board */}
              <div
                onClick={missClick}
                className="relative aspect-[16/9] max-h-[460px] w-full bg-zinc-950 rounded-2xl border-2 border-dashed border-zinc-800 grid grid-cols-4 grid-rows-4 p-4 gap-3 select-none overflow-hidden cursor-crosshair"
              >
                {!reflexActive && !reflexGameOver && (
                  <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <Target className="w-14 h-14 text-amber-400 animate-bounce" />
                    <h3 className="text-2xl font-black font-heading text-zinc-100 uppercase">
                      Apex Reflex Target Blitz
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 max-w-md">
                      Click the yellow targets (+15 pts) and golden wingman targets (+35 pts). Avoid red hazard traps (-25 pts)!
                    </p>
                    <button
                      onClick={startReflexGame}
                      className="px-8 py-3.5 rounded-xl bg-amber-400 text-zinc-950 font-heading font-black text-xs uppercase tracking-widest hover:bg-amber-300 shadow-xl"
                    >
                      CLICK TO START
                    </button>
                  </div>
                )}

                {reflexGameOver && (
                  <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in duration-300">
                    <Trophy className="w-14 h-14 text-amber-400" />
                    <h3 className="text-2xl font-black font-heading text-zinc-100 uppercase">
                      Round Finished!
                    </h3>
                    <div className="flex items-center gap-6 font-mono text-xs">
                      <div>
                        <span className="text-zinc-500 block">FINAL SCORE</span>
                        <span className="text-xl font-bold text-amber-400">{reflexScore}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">TARGETS HIT</span>
                        <span className="text-xl font-bold text-emerald-400">{reflexHits}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">MAX STREAK</span>
                        <span className="text-xl font-bold text-cyan-400">{reflexMaxCombo}x</span>
                      </div>
                    </div>

                    {lastSubmittedResult && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Leaderboard Rank #{lastSubmittedResult.rank || 1} Achieved!</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={startReflexGame}
                        className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-heading font-bold text-xs uppercase tracking-wider"
                      >
                        RETRY ROUND
                      </button>
                      <button
                        onClick={() => setActiveTab('leaderboard')}
                        className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-heading font-bold text-xs uppercase tracking-wider"
                      >
                        VIEW LEADERBOARD
                      </button>
                    </div>
                  </div>
                )}

                {/* Grid Cells */}
                {Array.from({ length: 16 }).map((_, idx) => {
                  const target = activeTargets.find((t) => t.index === idx);
                  return (
                    <div
                      key={`grid-${idx}`}
                      className="relative rounded-xl border border-zinc-900 bg-zinc-900/30 flex items-center justify-center"
                    >
                      {target && (
                        <button
                          onClick={(e) => hitTarget(target.id, target.type, e)}
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-transform transform active:scale-90 animate-in zoom-in-50 duration-200 ${
                            target.type === 'hazard'
                              ? 'bg-rose-600/90 text-white shadow-[0_0_20px_rgba(225,29,72,0.6)] border-2 border-rose-400'
                              : target.type === 'gold'
                              ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-zinc-950 shadow-[0_0_25px_rgba(250,204,21,0.8)] border-2 border-yellow-200'
                              : 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] border-2 border-amber-300'
                          }`}
                        >
                          {target.type === 'hazard' ? (
                            <XCircle className="w-8 h-8" />
                          ) : target.type === 'gold' ? (
                            <Sparkles className="w-8 h-8 animate-spin" />
                          ) : (
                            <Target className="w-8 h-8" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAME 2 CANVAS: STREAM LORE TRIVIA */}
          {selectedGame === 'trivia' && (
            <div className="p-6 sm:p-8 rounded-3xl border border-zinc-800 bg-zinc-900/80 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Question</span>
                  <span className="text-xl font-bold text-zinc-100">
                    {triviaIndex + 1} / {TRIVIA_QUESTIONS.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Score</span>
                  <span className="text-2xl font-black font-heading text-cyan-400">
                    {triviaScore}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Time Remaining</span>
                  <span className={`text-xl font-bold ${triviaTimeLeft <= 3 ? 'text-rose-400 animate-pulse' : 'text-zinc-200'}`}>
                    {triviaTimeLeft}s
                  </span>
                </div>
              </div>

              {!triviaActive && !triviaGameOver && (
                <div className="py-16 text-center space-y-4">
                  <HelpCircle className="w-14 h-14 text-cyan-400 mx-auto animate-pulse" />
                  <h3 className="text-2xl font-black font-heading text-zinc-100 uppercase">
                    Stream Lore & Apex Trivia
                  </h3>
                  <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">
                    Answer 5 rapid-fire questions about Slyyutus, Apex Legends, and the Kick Chatters League.
                  </p>
                  <button
                    onClick={startTriviaGame}
                    className="px-8 py-3 rounded-xl bg-cyan-400 text-zinc-950 font-heading font-black text-xs uppercase tracking-wider hover:bg-cyan-300 shadow-lg"
                  >
                    START TRIVIA QUIZ
                  </button>
                </div>
              )}

              {triviaActive && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800">
                    <h4 className="text-lg sm:text-xl font-bold font-heading text-zinc-100">
                      {TRIVIA_QUESTIONS[triviaIndex].q}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    {TRIVIA_QUESTIONS[triviaIndex].options.map((opt, oIdx) => {
                      const isChosen = triviaSelectedOption === oIdx;
                      const isAnswer = oIdx === TRIVIA_QUESTIONS[triviaIndex].correct;
                      const showFeedback = triviaSelectedOption !== null;

                      let btnStyle = 'border-zinc-800 bg-zinc-950/80 hover:border-cyan-500/50 text-zinc-200';
                      if (showFeedback) {
                        if (isAnswer) {
                          btnStyle = 'border-emerald-500 bg-emerald-500/20 text-emerald-300';
                        } else if (isChosen && !isAnswer) {
                          btnStyle = 'border-rose-500 bg-rose-500/20 text-rose-300';
                        }
                      }

                      return (
                        <button
                          key={`opt-${oIdx}`}
                          disabled={showFeedback}
                          onClick={() => selectTriviaAnswer(oIdx)}
                          className={`p-4 rounded-xl border text-left font-bold transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {showFeedback && isAnswer && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {showFeedback && isChosen && !isAnswer && <XCircle className="w-4 h-4 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {triviaGameOver && (
                <div className="py-12 text-center space-y-4">
                  <Trophy className="w-14 h-14 text-cyan-400 mx-auto" />
                  <h3 className="text-2xl font-black font-heading text-zinc-100 uppercase">
                    Trivia Completed!
                  </h3>
                  <p className="text-sm font-mono text-zinc-300">
                    Final Score: <strong className="text-cyan-400 text-lg">{triviaScore} PTS</strong>
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={startTriviaGame}
                      className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-heading font-bold text-xs uppercase tracking-wider"
                    >
                      TRY AGAIN
                    </button>
                    <button
                      onClick={() => setActiveTab('leaderboard')}
                      className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-heading font-bold text-xs uppercase tracking-wider"
                    >
                      VIEW RANKINGS
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GAME 3 CANVAS: CHAT SPEED RUSH */}
          {selectedGame === 'typing' && (
            <div className="p-6 sm:p-8 rounded-3xl border border-zinc-800 bg-zinc-900/80 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Time Remaining</span>
                  <span className={`text-2xl font-black font-heading ${typingTimeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-zinc-100'}`}>
                    {typingTimeLeft}s
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Points</span>
                  <span className="text-2xl font-black font-heading text-emerald-400">
                    {typingScore}
                  </span>
                </div>
              </div>

              {!typingActive && !typingGameOver && (
                <div className="py-16 text-center space-y-4">
                  <Keyboard className="w-14 h-14 text-emerald-400 mx-auto animate-pulse" />
                  <h3 className="text-2xl font-black font-heading text-zinc-100 uppercase">
                    Chat Speed Rush Challenge
                  </h3>
                  <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">
                    Type famous Slyyutus stream chat slogans and predator callouts as fast as possible within 30 seconds!
                  </p>
                  <button
                    onClick={startTypingGame}
                    className="px-8 py-3 rounded-xl bg-emerald-400 text-zinc-950 font-heading font-black text-xs uppercase tracking-wider hover:bg-emerald-300 shadow-lg"
                  >
                    START SPEED RUSH
                  </button>
                </div>
              )}

              {typingActive && (
                <div className="space-y-6">
                  <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                    <span className="text-xs font-mono text-zinc-500 uppercase block mb-2 font-bold">
                      TYPE EXACT PHRASE:
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black font-heading tracking-widest text-emerald-400">
                      {TYPING_PHRASES[typingIndex]}
                    </h3>
                  </div>

                  <input
                    type="text"
                    autoFocus
                    value={typingInput}
                    onChange={handleTypingChange}
                    placeholder="Type the exact phrase here..."
                    className="w-full px-6 py-4 rounded-2xl bg-zinc-950 border-2 border-zinc-700 text-lg font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 text-center"
                  />
                </div>
              )}

              {typingGameOver && (
                <div className="py-12 text-center space-y-4">
                  <Trophy className="w-14 h-14 text-emerald-400 mx-auto" />
                  <h3 className="text-2xl font-black font-heading text-zinc-100 uppercase">
                    Rush Time Complete!
                  </h3>
                  <p className="text-sm font-mono text-zinc-300">
                    Speed Score: <strong className="text-emerald-400 text-lg">{typingScore} PTS</strong> • Est WPM: <strong>{typingWpm} WPM</strong>
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={startTypingGame}
                      className="px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-heading font-bold text-xs uppercase tracking-wider"
                    >
                      PLAY AGAIN
                    </button>
                    <button
                      onClick={() => setActiveTab('leaderboard')}
                      className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-heading font-bold text-xs uppercase tracking-wider"
                    >
                      VIEW RANKINGS
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIEW 2: LEADERBOARD ARENA */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-8">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-500 uppercase font-semibold">Game:</span>
              <button
                onClick={() => setLeaderboardFilterGame('all')}
                className={`px-3 py-1.5 rounded-lg uppercase font-bold text-[11px] ${
                  leaderboardFilterGame === 'all'
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Games
              </button>
              <button
                onClick={() => setLeaderboardFilterGame('reflex_blitz')}
                className={`px-3 py-1.5 rounded-lg uppercase font-bold text-[11px] ${
                  leaderboardFilterGame === 'reflex_blitz'
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Reflex Blitz
              </button>
              <button
                onClick={() => setLeaderboardFilterGame('stream_trivia')}
                className={`px-3 py-1.5 rounded-lg uppercase font-bold text-[11px] ${
                  leaderboardFilterGame === 'stream_trivia'
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Stream Trivia
              </button>
              <button
                onClick={() => setLeaderboardFilterGame('chat_speed')}
                className={`px-3 py-1.5 rounded-lg uppercase font-bold text-[11px] ${
                  leaderboardFilterGame === 'chat_speed'
                    ? 'bg-amber-400 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Chat Speed
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500 uppercase font-semibold">Difficulty:</span>
              {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setLeaderboardFilterDiff(d)}
                  className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold ${
                    leaderboardFilterDiff === d
                      ? 'bg-zinc-100 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Top 3 Podium Cards */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* 2nd Place */}
              <div className="order-2 md:order-1 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center space-y-3 relative">
                <div className="w-8 h-8 rounded-full bg-slate-400/20 text-slate-300 font-black font-heading flex items-center justify-center mx-auto">
                  2
                </div>
                <UserAvatar
                  src={leaderboard[1].avatarUrl}
                  username={leaderboard[1].username}
                  userId={leaderboard[1].userId}
                  className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-slate-400"
                />
                <h4 className="font-heading font-black text-lg text-zinc-200 uppercase">
                  {leaderboard[1].username}
                </h4>
                <div className="text-xs font-mono text-zinc-400 space-y-1">
                  <span className="text-slate-300 font-bold block text-sm">{leaderboard[1].bestScore.toLocaleString()} PTS</span>
                  <span className="text-[11px] text-zinc-500 block">{leaderboard[1].totalWins} Wins • {leaderboard[1].difficulty.toUpperCase()}</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-1 md:order-2 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-amber-500/10 to-zinc-900/90 p-7 text-center space-y-3 relative md:-mt-4 shadow-2xl">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-zinc-950 font-black font-heading flex items-center justify-center mx-auto text-lg shadow-lg">
                  1
                </div>
                <UserAvatar
                  src={leaderboard[0].avatarUrl}
                  username={leaderboard[0].username}
                  userId={leaderboard[0].userId}
                  className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-amber-400 shadow-xl"
                />
                <div>
                  <h4 className="font-heading font-black text-xl text-amber-300 uppercase">
                    {leaderboard[0].username}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold uppercase">
                    ARCADE CHAMPION
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-400 space-y-1">
                  <span className="text-amber-400 font-black block text-base">{leaderboard[0].bestScore.toLocaleString()} PTS</span>
                  <span className="text-[11px] text-zinc-400 block">{leaderboard[0].totalWins} Wins • {leaderboard[0].difficulty.toUpperCase()}</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center space-y-3 relative">
                <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-600 font-black font-heading flex items-center justify-center mx-auto">
                  3
                </div>
                <UserAvatar
                  src={leaderboard[2].avatarUrl}
                  username={leaderboard[2].username}
                  userId={leaderboard[2].userId}
                  className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-amber-700"
                />
                <h4 className="font-heading font-black text-lg text-zinc-200 uppercase">
                  {leaderboard[2].username}
                </h4>
                <div className="text-xs font-mono text-zinc-400 space-y-1">
                  <span className="text-amber-600 font-bold block text-sm">{leaderboard[2].bestScore.toLocaleString()} PTS</span>
                  <span className="text-[11px] text-zinc-500 block">{leaderboard[2].totalWins} Wins • {leaderboard[2].difficulty.toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-base font-bold font-heading text-zinc-100 uppercase flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Arcade Rankings ({leaderboard.length} Players Tracked)</span>
              </h3>
              <button
                onClick={loadLeaderboard}
                disabled={loadingLeaderboard}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loadingLeaderboard ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {loadingLeaderboard ? (
              <div className="py-12 text-center font-mono text-xs text-zinc-500">
                Loading arcade leaderboard...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-12 text-center font-mono text-xs text-zinc-500 space-y-2">
                <Gamepad2 className="w-8 h-8 text-zinc-600 mx-auto" />
                <p>No scores recorded for this filter combination yet. Be the first to play!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[11px] text-zinc-500 uppercase">
                      <th className="py-3 px-3">Rank</th>
                      <th className="py-3 px-3">Player</th>
                      <th className="py-3 px-3">Favorite Game</th>
                      <th className="py-3 px-3">Best Score</th>
                      <th className="py-3 px-3">Total Wins</th>
                      <th className="py-3 px-3">Difficulty</th>
                      <th className="py-3 px-3 text-right">Last Played</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {leaderboard.map((entry) => (
                      <tr key={`entry-${entry.rank}-${entry.userId}`} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-3 font-bold">
                          {entry.rank === 1 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-400 text-zinc-950 font-black">#1</span>
                          ) : entry.rank === 2 ? (
                            <span className="px-2 py-0.5 rounded bg-slate-300 text-zinc-950 font-black">#2</span>
                          ) : entry.rank === 3 ? (
                            <span className="px-2 py-0.5 rounded bg-amber-700 text-white font-black">#3</span>
                          ) : (
                            <span className="text-zinc-400">#{entry.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div
                            onClick={() => navigate(`user/${entry.username}`)}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <UserAvatar
                              src={entry.avatarUrl}
                              username={entry.username}
                              userId={entry.userId}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="font-bold text-zinc-200 group-hover:text-amber-300 transition-colors">
                              @{entry.username}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 text-[11px]">
                          {entry.favoriteGame === 'reflex_blitz'
                            ? 'Apex Reflex'
                            : entry.favoriteGame === 'stream_trivia'
                            ? 'Stream Trivia'
                            : 'Chat Speed'}
                        </td>
                        <td className="py-3 px-3 font-bold text-amber-400">
                          {entry.bestScore.toLocaleString()} PTS
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">
                          {entry.totalWins}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-300 uppercase">
                            {entry.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-zinc-500 text-[11px]">
                          {entry.lastPlayedAt ? new Date(entry.lastPlayedAt).toLocaleDateString() : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
