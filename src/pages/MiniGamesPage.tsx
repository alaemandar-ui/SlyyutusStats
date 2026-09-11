import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchMiniGameDashboard, 
  fetchUserMiniGameStats, 
  submitMiniGameScore, 
  startMiniGameSession,
  MiniGameDashboardData 
} from '../lib/api';
import { 
  GameId, 
  GameDifficulty, 
  GameCatalogItem, 
  GameScoreSubmission, 
  PlayerStats 
} from '../components/minigames/types';

// Game Components
import { LogicGridGame } from '../components/minigames/LogicGridGame';
import { PatternDecoderGame } from '../components/minigames/PatternDecoderGame';
import { SequenceMasterGame } from '../components/minigames/SequenceMasterGame';
import { CipherPuzzleGame } from '../components/minigames/CipherPuzzleGame';
import { DifficultQuizGame } from '../components/minigames/DifficultQuizGame';
import { PrecisionTimingGame } from '../components/minigames/PrecisionTimingGame';
import { MultiTaskGame } from '../components/minigames/MultiTaskGame';
import { ArcadeShooterGame } from '../components/minigames/ArcadeShooterGame';

// UI Subcomponents
import { PlayerStatsCard } from '../components/minigames/PlayerStatsCard';
import { MiniGameLeaderboard } from '../components/minigames/MiniGameLeaderboard';
import { UserAvatar } from '../components/UserAvatar';

import { 
  Gamepad2, 
  Trophy, 
  Clock, 
  Zap, 
  Target, 
  CheckCircle2, 
  Sparkles, 
  Medal, 
  Award, 
  ArrowRight, 
  UserCheck, 
  TrendingUp, 
  Activity, 
  Play, 
  ShieldCheck, 
  Sliders, 
  Flame, 
  Layers, 
  Terminal, 
  Binary, 
  Grid, 
  Crosshair,
  RotateCcw,
  BarChart3,
  Calendar,
  Lock,
  LogIn,
  X,
  ShieldAlert
} from 'lucide-react';

export const MINI_GAMES_CATALOG: GameCatalogItem[] = [
  {
    id: 'logic_grid',
    title: 'Neural Grid Matrix',
    category: 'puzzle',
    description: 'Deductive constraint grid. Uncover valid node coordinates using interconnected logical clues and negative scratchpad elimination.',
    badge: 'Logic & IQ'
  },
  {
    id: 'pattern_decoder',
    title: 'Pattern Decoder',
    category: 'puzzle',
    description: 'Determine the missing element in complex algorithmic sequences, Fibonacci variations, and interwoven number transformations.',
    badge: 'Algorithmic'
  },
  {
    id: 'sequence_master',
    title: 'Sequence Master',
    category: 'puzzle',
    description: 'High-speed memory retention challenge. Memorize and reproduce progressively elongating cyber glyph transmissions.',
    badge: 'Memory Tier'
  },
  {
    id: 'cipher_puzzle',
    title: 'Cipher Decoder',
    category: 'puzzle',
    description: 'Intercepted cryptographic telemetry. Calibrate rotation keys and decrypt mainframe communication under rapid countdown.',
    badge: 'Cryptography'
  },
  {
    id: 'difficult_quiz',
    title: 'Apex Intellect Trivia',
    category: 'quiz',
    description: 'Demanding global trivia across 13 disciplines: Science, Quantum Physics, Space, History, Geography, Tech, and Records.',
    badge: 'Global Trivia'
  },
  {
    id: 'precision_timing',
    title: 'Oscillation Calibrator',
    category: 'skill',
    description: 'Stop the oscillating quantum beam within microscopic sweet spots. Center bullseyes award critical precision bonuses.',
    badge: 'Reflex Sync'
  },
  {
    id: 'multi_task',
    title: 'Cognitive Overload',
    category: 'skill',
    description: 'Triple simultaneous tactical stream: Stabilize drone balance, verify algebraic integrity, and vent rising reactor heat.',
    badge: 'Multitask'
  },
  {
    id: 'arcade_shooter',
    title: 'Holo-Range Assault',
    category: 'arcade',
    description: 'High-velocity target range. Blast swift recon drones, hit gold bonus targets, avoid EMP decoys, and chain combo multipliers.',
    badge: 'Shooter Arena',
    modes: ['Time Attack', 'Accuracy Challenge', 'Survival', 'Endless']
  }
];

interface MiniGamesPageProps {
  navigate: (route: string) => void;
  initialTab?: 'dashboard' | 'arena' | 'leaderboard' | 'mystats';
}

export const MiniGamesPage: React.FC<MiniGamesPageProps> = ({ 
  navigate, 
  initialTab = 'dashboard' 
}) => {
  const { isAuthenticated, user, showToast } = useAuth();

  // Navigation tabs: 'dashboard' | 'arena' | 'leaderboard' | 'mystats'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'arena' | 'leaderboard' | 'mystats'>(initialTab);
  
  // Active game setup
  const [selectedGameId, setSelectedGameId] = useState<GameId>('logic_grid');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'puzzle' | 'quiz' | 'skill' | 'arcade'>('all');

  // Dashboard & User server state
  const [dashboardData, setDashboardData] = useState<MiniGameDashboardData | null>(null);
  const [userStats, setUserStats] = useState<PlayerStats | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);
  const [loadingUserStats, setLoadingUserStats] = useState<boolean>(true);
  const [submittingScore, setSubmittingScore] = useState<boolean>(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<any | null>(null);

  // Authentication gate modal state
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginModalGameTitle, setLoginModalGameTitle] = useState<string>('');

  useEffect(() => {
    loadDashboard();
    if (isAuthenticated) {
      loadUserStats();
    } else {
      setUserStats(null);
      setLoadingUserStats(false);
    }
  }, [isAuthenticated, user?.kickUserId]);

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const data = await fetchMiniGameDashboard();
      setDashboardData(data);
      if (data && (data as any).userStats) {
        setUserStats((data as any).userStats);
      }
    } catch (err) {
      console.error('Failed to load mini game dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadUserStats = async () => {
    if (!isAuthenticated) {
      setUserStats(null);
      setLoadingUserStats(false);
      return;
    }
    setLoadingUserStats(true);
    try {
      const stats = await fetchUserMiniGameStats(user?.kickUserId, user?.username);
      if (stats) {
        setUserStats(stats);
      }
    } catch (err) {
      console.error('Failed to load user mini game stats:', err);
    } finally {
      setLoadingUserStats(false);
    }
  };

  const handleLaunchGame = async (gameId: GameId, targetDifficulty?: GameDifficulty) => {
    if (!isAuthenticated) {
      const game = MINI_GAMES_CATALOG.find(g => g.id === gameId);
      setLoginModalGameTitle(game?.title || 'Tactical Operation');
      setShowLoginModal(true);
      showToast('Please log in to play games.', 'info');
      return;
    }

    try {
      await startMiniGameSession({ 
        gameId, 
        difficulty: targetDifficulty || difficulty 
      });
    } catch (err: any) {
      if (err.message?.includes('log in') || err.message?.includes('Unauthorized')) {
        setShowLoginModal(true);
        showToast('Please log in to play games.', 'error');
        return;
      }
    }

    setSelectedGameId(gameId);
    if (targetDifficulty) setDifficulty(targetDifficulty);
    setIsPlaying(true);
    setActiveTab('arena');
    setLastSubmissionResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGameFinish = async (submission: GameScoreSubmission) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      showToast('Please log in to play games.', 'error');
      return;
    }

    setSubmittingScore(true);
    try {
      const res = await submitMiniGameScore({
        ...submission,
        userId: user?.kickUserId,
        username: user?.username,
        avatarUrl: user?.avatarUrl
      });
      setLastSubmissionResult({
        ...res,
        submission
      });
      if (res.userStats) {
        setUserStats(res.userStats);
      }
      showToast(res.message || 'Score verified and synced to community database!', 'success');
      loadDashboard();
      loadUserStats();
    } catch (err: any) {
      if (err.message?.includes('log in') || err.message?.includes('Unauthorized')) {
        setShowLoginModal(true);
        showToast('Please log in to play games.', 'error');
      } else {
        showToast(err.message || 'Error recording mission score', 'error');
      }
    } finally {
      setSubmittingScore(false);
    }
  };

  const activeGameCatalog = MINI_GAMES_CATALOG.find(g => g.id === selectedGameId) || MINI_GAMES_CATALOG[0];

  const filteredCatalog = categoryFilter === 'all' 
    ? MINI_GAMES_CATALOG 
    : MINI_GAMES_CATALOG.filter(g => g.category === categoryFilter);

  // Derive top stats from dashboardData
  const totalPlayers = dashboardData?.totalPlayers || 0;
  const totalGamesPlayed = dashboardData?.totalGamesPlayed || 0;
  const totalWins = dashboardData?.totalWins || 0;
  const highestScore = dashboardData?.highestScore || 0;
  const fastestTime = dashboardData?.fastestCompletionTime || 0;
  const recentResults = dashboardData?.recentResults || [];
  const topRankedPlayers = dashboardData?.topRankedPlayers || [];
  const perGameStats = dashboardData?.perGameStats || [];

  return (
    <div className="space-y-8 py-6 pb-24 text-white">
      {/* Top Header & Navigation Banner - High-contrast Gold & Dark Aesthetics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-[#D4AF37]/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#D4AF37] font-mono text-xs uppercase tracking-wider mb-1.5">
            <Gamepad2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Tactical Arena • Real-Time Community Records</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-white uppercase tracking-tight">
            MINI <span className="text-[#D4AF37]">GAMES</span>
          </h1>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Eight challenging cognitive operations. Compete on official leaderboards, track individual accuracy, and earn verified Kick League Points.
          </p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center bg-[#111] p-1.5 rounded-xl border border-[#D4AF37]/30 shadow-lg gap-1.5">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsPlaying(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setShowLoginModal(true);
                showToast('Please log in to play games.', 'info');
                return;
              }
              setActiveTab('arena');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'arena'
                ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {isAuthenticated ? (
              <Play className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            )}
            <span>Game Arena</span>
          </button>

          <button
            onClick={() => { setActiveTab('leaderboard'); setIsPlaying(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => { setActiveTab('mystats'); setIsPlaying(false); }}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'mystats'
                ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Performance</span>
          </button>
        </div>
      </div>

      {/* Guest Mode Notification Banner */}
      {!isAuthenticated && (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-zinc-950 to-black p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-sm uppercase text-amber-300">
                  Guest Mode • Login Required to Play
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Read-Only Catalog
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-300 mt-0.5">
                You can browse operations and view global rankings. Please log in with Kick to start games, record official scores, and appear on leaderboards.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('login')}
            className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-heading font-extrabold uppercase text-xs hover:bg-[#FFD700] transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.25)] shrink-0 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Log In</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. DASHBOARD VIEW                                         */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Real Global Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Players */}
            <div className="relative overflow-hidden rounded-xl border border-[#D4AF37]/20 bg-[#111] p-4 transition-all hover:border-[#D4AF37]/40 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                  Total Players
                </span>
                <UserCheck className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {loadingDashboard ? '--' : totalPlayers}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                Unique operatives
              </span>
            </div>

            {/* Total Games Played */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-[#111] p-4 transition-all hover:border-[#D4AF37]/30 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Total Games Played
                </span>
                <Gamepad2 className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-100">
                {loadingDashboard ? '--' : totalGamesPlayed}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                Attempted missions
              </span>
            </div>

            {/* Total Wins */}
            <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-[#111] p-4 transition-all hover:border-emerald-500/40 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Total Wins
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {loadingDashboard ? '--' : totalWins}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                Successful clearances
              </span>
            </div>

            {/* Highest Score */}
            <div className="relative overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#1c190f] to-[#111] p-4 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]">
                  Highest Score
                </span>
                <Trophy className="w-4 h-4 text-[#FFD700]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-[#FFD700]">
                {loadingDashboard ? '--' : highestScore.toLocaleString()}
              </div>
              <span className="text-[10px] font-mono text-zinc-400 mt-1 block">
                Arena record
              </span>
            </div>

            {/* Fastest Completion */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-[#111] p-4 transition-all hover:border-[#D4AF37]/30 shadow-sm col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Fastest Time
                </span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
                {loadingDashboard ? '--' : fastestTime > 0 ? `${fastestTime.toFixed(1)}s` : '--'}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                Lightning clearance
              </span>
            </div>
          </div>

          {/* Quick Access to My Performance */}
          <div className="relative overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#1c190e] via-[#111] to-[#0A0A0A] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {isAuthenticated && user ? (
                <UserAvatar
                  src={user.avatarUrl}
                  avatarUrl={user.avatarUrl}
                  username={user.username}
                  userId={user.kickUserId}
                  size="lg"
                  className="w-12 h-12 rounded-xl object-cover border-2 border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.25)] shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shrink-0">
                  <Activity className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-base font-black font-heading uppercase text-white tracking-wide">
                  {isAuthenticated ? `Welcome Back, ${user?.username}!` : 'Track Your Tactical Legacy'}
                </h3>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  {isAuthenticated
                    ? userStats && userStats.totalGamesPlayed > 0
                      ? `You have played ${userStats.totalGamesPlayed} games with a ${userStats.winRate}% win rate. View complete stats below.`
                      : 'You haven’t played any games yet. Launch a mission to claim your rank!'
                    : 'Log in to track personal bests, accuracy percentage, and game-by-game records.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveTab('mystats')}
                className="px-5 py-2.5 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-all shadow-[0_0_15px_rgba(212,175,55,0.25)] flex items-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-black" />
                <span>My Performance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Catalog Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-xl font-black font-heading text-white flex items-center gap-2 uppercase tracking-wide">
                <span>Tactical Game Catalog</span>
                <span className="text-xs font-mono text-[#D4AF37] font-normal">
                  ({filteredCatalog.length} Operations Ready)
                </span>
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Select a game to calibrate logic, high-speed reflexes, or cognitive multitasking
              </p>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All Operations' },
                { id: 'puzzle', label: 'Logic & Puzzle' },
                { id: 'quiz', label: 'Trivia' },
                { id: 'skill', label: 'Reaction & Skill' },
                { id: 'arcade', label: 'Arcade Range' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase whitespace-nowrap transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-[#D4AF37] text-black font-bold shadow-[0_0_12px_rgba(212,175,55,0.25)]'
                      : 'bg-[#111] text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Game Cards Grid - High Contrast Dark with Gold Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCatalog.map(game => {
              const gameStat = perGameStats.find((s: any) => s.gameId === game.id);
              const userGameStat = userStats?.perGame?.[game.id];

              let icon = <Grid className="w-5 h-5 text-[#D4AF37]" />;
              if (game.id === 'pattern_decoder') icon = <Binary className="w-5 h-5 text-amber-400" />;
              if (game.id === 'sequence_master') icon = <Sparkles className="w-5 h-5 text-yellow-400" />;
              if (game.id === 'cipher_puzzle') icon = <Terminal className="w-5 h-5 text-emerald-400" />;
              if (game.id === 'difficult_quiz') icon = <Trophy className="w-5 h-5 text-[#FFD700]" />;
              if (game.id === 'precision_timing') icon = <Target className="w-5 h-5 text-cyan-400" />;
              if (game.id === 'multi_task') icon = <Layers className="w-5 h-5 text-orange-400" />;
              if (game.id === 'arcade_shooter') icon = <Crosshair className="w-5 h-5 text-rose-400" />;

              return (
                <div
                  key={game.id}
                  className="bg-[#111] border border-zinc-800 hover:border-[#D4AF37]/50 rounded-xl p-5 flex flex-col justify-between transition-all group shadow-md hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                >
                  <div>
                    {/* Card Head */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#181818] border border-zinc-700/60 flex items-center justify-center group-hover:border-[#D4AF37]/40 transition-colors">
                        {icon}
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-900 text-[#D4AF37] border border-[#D4AF37]/30">
                        {game.badge}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-base font-black font-heading text-white tracking-wide group-hover:text-[#FFD700] transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 mt-2 leading-relaxed line-clamp-3">
                      {game.description}
                    </p>
                  </div>

                  {/* Footer Stats & Launch Button */}
                  <div className="mt-5 pt-4 border-t border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-500">Arena High Score:</span>
                      <strong className="text-[#FFD700]">
                        {gameStat?.highestScore ? gameStat.highestScore.toLocaleString() : '--'}
                      </strong>
                    </div>

                    {userGameStat && userGameStat.bestScore > 0 && (
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">Personal Best:</span>
                        <strong className="text-emerald-400">
                          {userGameStat.bestScore.toLocaleString()}
                        </strong>
                      </div>
                    )}

                    <button
                      onClick={() => handleLaunchGame(game.id, 'medium')}
                      className={`w-full py-2.5 rounded-lg font-heading font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        isAuthenticated
                          ? 'bg-[#1A1A1A] group-hover:bg-[#D4AF37] text-zinc-200 group-hover:text-black border border-zinc-700 group-hover:border-[#D4AF37]'
                          : 'bg-zinc-900 group-hover:bg-[#D4AF37] text-amber-400 group-hover:text-black border border-amber-500/40 group-hover:border-[#D4AF37]'
                      }`}
                    >
                      {isAuthenticated ? (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Deploy Operation</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:text-black" />
                          <span>Deploy (Login Required)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leaderboard Summary & Live Feed Dual Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {/* Left: Top Operatives Ranking */}
            <div className="rounded-xl border border-[#D4AF37]/20 bg-[#111] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-5 h-5 text-[#FFD700]" />
                  <h3 className="text-base font-black font-heading text-white uppercase tracking-wider">
                    Top Ranked Operatives
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className="text-xs font-mono text-[#D4AF37] hover:text-[#FFD700] transition-colors flex items-center gap-1"
                >
                  <span>Full Leaderboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {topRankedPlayers.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-zinc-500">
                  No registered rankings yet. Be the first to play and rank!
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60 font-mono text-xs">
                  {topRankedPlayers.slice(0, 5).map((p: any) => (
                    <div key={p.userId} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                          p.rank === 1 ? 'bg-[#D4AF37] text-black' :
                          p.rank === 2 ? 'bg-slate-300 text-black' :
                          p.rank === 3 ? 'bg-amber-700 text-white' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {p.rank}
                        </span>
                        <UserAvatar
                          src={p.avatarUrl}
                          avatarUrl={p.avatarUrl}
                          username={p.username}
                          userId={p.userId}
                          size="sm"
                        />
                        <span className="font-bold text-white font-sans">{p.username}</span>
                      </div>

                      <div className="text-right">
                        <strong className="text-[#FFD700] block text-sm">
                          {p.totalPoints?.toLocaleString()} pts
                        </strong>
                        <span className="text-[10px] text-zinc-500">
                          {p.totalWins} wins • {p.totalPlays} plays
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Recent Live Deployments */}
            <div className="rounded-xl border border-zinc-800 bg-[#111] p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-base font-black font-heading text-white uppercase tracking-wider">
                    Recent Verified Runs
                  </h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">Live Telemetry</span>
              </div>

              {recentResults.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-zinc-500">
                  No games logged yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60 font-mono text-xs">
                  {recentResults.slice(0, 5).map((s: any, idx: number) => (
                    <div key={s.id || idx} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          src={s.avatarUrl}
                          avatarUrl={s.avatarUrl}
                          username={s.username}
                          userId={s.userId}
                          size="sm"
                        />
                        <div>
                          <span className="font-bold text-white block font-sans">{s.username}</span>
                          <span className="text-[10px] text-zinc-500">
                            {s.gameTitle || s.gameId} ({s.difficulty})
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-[#FFD700] block">
                          {(s.score || 0).toLocaleString()} pts
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {s.timeSeconds?.toFixed(1)}s • {s.success ? 'Won' : 'Lost'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. GAME ARENA VIEW                                        */}
      {/* ========================================================= */}
      {activeTab === 'arena' && (
        !isAuthenticated ? (
          <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#18150c] via-[#0E0E0E] to-[#070707] p-8 sm:p-14 text-center shadow-[0_0_40px_rgba(212,175,55,0.15)] animate-in fade-in">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/10 border-2 border-[#D4AF37]/60 flex items-center justify-center mx-auto text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                <Lock className="w-10 h-10" />
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-xs font-mono uppercase tracking-wider text-[#D4AF37]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tactical Security Gate</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black font-heading text-white uppercase tracking-tight">
                  Please Log In to Play Games
                </h2>
                <p className="text-sm font-mono text-zinc-400 leading-relaxed max-w-lg mx-auto">
                  Access to live training simulations, accuracy telemetry, and official score recording requires an authenticated Kick account. Please log in to deploy operations and climb the global leaderboards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-md mx-auto pt-2">
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Real-time score verification</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Global leaderboard rankings</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Kick League Points earned</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>Personal performance stats</span>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('login')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-heading font-extrabold text-sm uppercase tracking-wider bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-mono text-xs uppercase tracking-wider bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Return to Catalog
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Game Selection & Difficulty Bar */}
            <div className="rounded-xl border border-[#D4AF37]/30 bg-[#111] p-5 shadow-lg space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest block mb-1">
                    Active Mission Environment
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-white uppercase tracking-tight flex items-center gap-2">
                    <span>{activeGameCatalog.title}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#FFD700] border border-[#D4AF37]/40 font-mono">
                      {activeGameCatalog.badge}
                    </span>
                  </h2>
                  <p className="text-xs font-mono text-zinc-400 mt-1 max-w-xl">
                    {activeGameCatalog.description}
                  </p>
                </div>

                {/* Difficulty Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <span className="text-xs font-mono text-zinc-400">Select Tier:</span>
                  <div className="flex items-center bg-[#181818] p-1 rounded-lg border border-zinc-700">
                    {(['easy', 'medium', 'hard', 'expert'] as GameDifficulty[]).map(diff => (
                      <button
                        key={diff}
                        onClick={() => setDifficulty(diff)}
                        className={`px-3 py-1 rounded text-xs font-mono uppercase transition-all ${
                          difficulty === diff
                            ? 'bg-[#D4AF37] text-black font-bold shadow-sm'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Game Switcher Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-mono text-zinc-500 shrink-0">Switch Operation:</span>
                {MINI_GAMES_CATALOG.map(g => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGameId(g.id);
                      setLastSubmissionResult(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                      selectedGameId === g.id
                        ? 'bg-[#D4AF37]/20 text-[#FFD700] border border-[#D4AF37]/50 font-bold'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {g.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Submission Result Notification */}
            {lastSubmissionResult && (
              <div className="rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#1c190f] via-[#111] to-[#0A0A0A] p-5 shadow-[0_0_20px_rgba(212,175,55,0.15)] animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#FFD700] font-black font-heading text-base uppercase tracking-wider mb-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      Mission Record Synchronized!
                    </div>
                    <p className="text-xs font-mono text-zinc-300">
                      Recorded Score: <strong className="text-[#FFD700] font-mono text-sm">{lastSubmissionResult.submission?.score || 0} pts</strong> • 
                      Time: <span className="text-cyan-300">{lastSubmissionResult.submission?.timeSeconds?.toFixed(1)}s</span> • 
                      Awarded: <strong className="text-emerald-400 font-mono text-sm">+{lastSubmissionResult.pointsAwarded || 50} Kick League Points</strong>.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('leaderboard')}
                      className="px-4 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider bg-[#1A1A1A] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      View Leaderboard
                    </button>
                    <button
                      onClick={() => setLastSubmissionResult(null)}
                      className="px-5 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)] cursor-pointer"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Game Component Render */}
            <div className="rounded-xl border border-zinc-800 bg-[#0A0A0A] overflow-hidden shadow-2xl">
              {selectedGameId === 'logic_grid' && (
                <LogicGridGame
                  difficulty={difficulty}
                  onFinish={handleGameFinish}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}

              {selectedGameId === 'pattern_decoder' && (
                <PatternDecoderGame
                  difficulty={difficulty}
                  onFinish={handleGameFinish}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}

              {selectedGameId === 'sequence_master' && (
                <SequenceMasterGame
                  difficulty={difficulty}
                  onFinish={handleGameFinish}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}

              {selectedGameId === 'cipher_puzzle' && (
                <CipherPuzzleGame
                  difficulty={difficulty}
                  onFinish={handleGameFinish}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}

              {selectedGameId === 'difficult_quiz' && (
                <DifficultQuizGame
                  difficulty={difficulty}
                  onFinish={handleGameFinish}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}

              {selectedGameId === 'precision_timing' && (
                <PrecisionTimingGame
                  difficulty={difficulty}
                  onFinish={handleGameFinish}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}

              {selectedGameId === 'multi_task' && (
                <MultiTaskGame
                  difficulty={difficulty}
                  onFinish={handleGameFinish}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}

              {selectedGameId === 'arcade_shooter' && (
                <ArcadeShooterGame
                  difficulty={difficulty}
                  onFinish={handleGameFinish}
                  onCancel={() => setActiveTab('dashboard')}
                />
              )}
            </div>
          </div>
        )
      )}

      {/* ========================================================= */}
      {/* 3. OFFICIAL LEADERBOARD VIEW                              */}
      {/* ========================================================= */}
      {activeTab === 'leaderboard' && (
        <MiniGameLeaderboard
          selectedGameId={selectedGameId}
          onSelectGame={(gameId) => setSelectedGameId(gameId as GameId)}
        />
      )}

      {/* ========================================================= */}
      {/* 4. PERSONAL PLAYER STATS VIEW ("MY PERFORMANCE")          */}
      {/* ========================================================= */}
      {activeTab === 'mystats' && (
        <div className="space-y-6">
          <PlayerStatsCard
            stats={userStats}
            userId={user?.kickUserId || userStats?.userId}
            username={user?.username || userStats?.username || 'Guest Operative'}
            avatarUrl={user?.avatarUrl || userStats?.avatarUrl}
            isAuthenticated={isAuthenticated}
            loading={loadingUserStats}
            onLogin={() => navigate('login')}
            onGoToGames={() => {
              setActiveTab('dashboard');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPlayGame={(gId) => {
              handleLaunchGame(gId as GameId, 'medium');
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* AUTHENTICATION REQUIRED MODAL                             */}
      {/* ========================================================= */}
      {showLoginModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowLoginModal(false)}
        >
          <div 
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-b from-[#18150c] via-[#0E0E0E] to-[#070707] p-6 sm:p-8 shadow-[0_0_50px_rgba(212,175,55,0.25)] space-y-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border-2 border-[#D4AF37]/50 flex items-center justify-center mx-auto text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.3)]">
              <Lock className="w-8 h-8" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[11px] font-mono uppercase tracking-wider text-[#D4AF37]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Authentication Required</span>
              </div>
              <h3 className="text-2xl font-black font-heading text-white uppercase tracking-tight">
                Please Log In to Play Games
              </h3>
              <p className="text-xs sm:text-sm font-mono text-zinc-400 leading-relaxed">
                {loginModalGameTitle 
                  ? `To deploy ${loginModalGameTitle} and submit your verified mission results, you must be logged in with your Kick account.`
                  : 'You must be logged in with your Kick account to play tactical operations, calibrate challenges, and rank on the global leaderboard.'}
              </p>
            </div>

            {/* Feature bullets */}
            <div className="text-left space-y-2 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 font-mono text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>Play all 8 cognitive training simulations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>Submit verified scores & climb leaderboards</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                <span>Track personal accuracy & win rate records</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  navigate('login');
                }}
                className="w-full py-3.5 rounded-xl font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-all shadow-[0_0_20px_rgba(212,175,55,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
