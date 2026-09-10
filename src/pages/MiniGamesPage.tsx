import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchMiniGameDashboard, 
  fetchMiniGameLeaderboard, 
  fetchUserMiniGameStats, 
  submitMiniGameScore, 
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
  Flame, 
  Clock, 
  Zap, 
  Target, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Medal, 
  Award, 
  RotateCcw,
  Sliders,
  ChevronRight,
  Layers,
  Terminal,
  Binary,
  Grid,
  Crosshair,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Activity,
  Play
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

export const MiniGamesPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { isAuthenticated, user, showToast } = useAuth();

  // Navigation tabs: 'dashboard' | 'arena' | 'leaderboard' | 'mystats'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'arena' | 'leaderboard' | 'mystats'>('dashboard');
  
  // Active game setup
  const [selectedGameId, setSelectedGameId] = useState<GameId>('logic_grid');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('medium');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'puzzle' | 'quiz' | 'skill' | 'arcade'>('all');

  // Dashboard server state
  const [dashboardData, setDashboardData] = useState<MiniGameDashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);
  const [submittingScore, setSubmittingScore] = useState<boolean>(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<any | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const data = await fetchMiniGameDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load mini game dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleLaunchGame = (gameId: GameId, targetDifficulty?: GameDifficulty) => {
    setSelectedGameId(gameId);
    if (targetDifficulty) setDifficulty(targetDifficulty);
    setIsPlaying(true);
    setActiveTab('arena');
    setLastSubmissionResult(null);
  };

  const handleGameFinish = async (submission: GameScoreSubmission) => {
    setSubmittingScore(true);
    try {
      const res = await submitMiniGameScore({
        ...submission,
        username: user?.username || 'Guest Operative'
      });
      setLastSubmissionResult({
        ...res,
        submission
      });
      showToast(res.message || 'Score verified and synced to community database!', 'success');
      loadDashboard();
    } catch (err: any) {
      showToast(err.message || 'Error recording mission score', 'error');
    } finally {
      setSubmittingScore(false);
    }
  };

  const activeGameCatalog = MINI_GAMES_CATALOG.find(g => g.id === selectedGameId) || MINI_GAMES_CATALOG[0];

  const filteredCatalog = categoryFilter === 'all' 
    ? MINI_GAMES_CATALOG 
    : MINI_GAMES_CATALOG.filter(g => g.category === categoryFilter);

  return (
    <div className="space-y-8 py-6 pb-24 text-white">
      {/* Top Header & Navigation Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#232936] pb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-1">
            <Gamepad2 className="w-4 h-4" />
            <span>Cybernetic Mini-Game Arena & Real-Time Records</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent uppercase tracking-tight">
            Tactical Mini Games
          </h1>
          <p className="text-xs font-mono text-gray-400 mt-1 max-w-2xl">
            Eight original, highly competitive cognitive games. All games sync real server records, track accuracy, and award Kick League league points.
          </p>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex flex-wrap items-center bg-[#121720] p-1.5 rounded-xl border border-[#232936] gap-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsPlaying(false); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('arena')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'arena'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Play className="w-3 h-3" />
            Game Arena
          </button>
          <button
            onClick={() => { setActiveTab('leaderboard'); setIsPlaying(false); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3 h-3" />
            Leaderboard
          </button>
          <button
            onClick={() => { setActiveTab('mystats'); setIsPlaying(false); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'mystats'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            My Performance
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. DASHBOARD VIEW                                         */}
      {/* ========================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Real Global Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Total Players */}
            <div className="bg-[#0e1217] border border-[#232936] rounded-xl p-4 shadow-lg flex flex-col justify-between">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                Total Players
              </span>
              <span className="text-2xl font-bold font-mono text-white mt-2">
                {loadingDashboard ? '--' : dashboardData?.totalPlayers || 0}
              </span>
            </div>

            {/* Total Games Played */}
            <div className="bg-[#0e1217] border border-[#232936] rounded-xl p-4 shadow-lg flex flex-col justify-between">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <Gamepad2 className="w-4 h-4 text-emerald-400" />
                Total Games Played
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                {loadingDashboard ? '--' : dashboardData?.totalGamesPlayed || 0}
              </span>
            </div>

            {/* Total Wins */}
            <div className="bg-[#0e1217] border border-[#232936] rounded-xl p-4 shadow-lg flex flex-col justify-between">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                Total Wins
              </span>
              <span className="text-2xl font-bold font-mono text-[#00ff88] mt-2">
                {loadingDashboard ? '--' : dashboardData?.totalWins || 0}
              </span>
            </div>

            {/* Highest Score */}
            <div className="bg-[#0e1217] border border-[#232936] rounded-xl p-4 shadow-lg flex flex-col justify-between">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Highest Score
              </span>
              <span className="text-2xl font-bold font-mono text-amber-300 mt-2">
                {loadingDashboard ? '--' : dashboardData?.highestScore || 0}
              </span>
            </div>

            {/* Fastest Completion */}
            <div className="bg-[#0e1217] border border-[#232936] rounded-xl p-4 shadow-lg flex flex-col justify-between col-span-2 sm:col-span-1">
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-400" />
                Fastest Record
              </span>
              <span className="text-2xl font-bold font-mono text-rose-300 mt-2">
                {loadingDashboard ? '--' : dashboardData?.fastestCompletionTime ? `${dashboardData.fastestCompletionTime.toFixed(1)}s` : '--'}
              </span>
            </div>
          </div>

          {/* Catalog Filter Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232936] pb-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Tactical Game Matrix
                <span className="text-xs text-gray-400 font-normal">({filteredCatalog.length} Operations Ready)</span>
              </h2>
              <p className="text-xs text-gray-400">Choose a discipline to test logic, cognitive dexterity, or high-speed reflexes</p>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-[#121720] text-gray-400 hover:text-white border border-[#232936]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Game Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCatalog.map(game => {
              const gameStats = dashboardData?.perGameStats?.[game.id];
              let icon = <Grid className="w-5 h-5 text-cyan-400" />;
              let themeBorder = 'hover:border-cyan-500/50';

              if (game.id === 'pattern_decoder') icon = <Binary className="w-5 h-5 text-purple-400" />;
              if (game.id === 'sequence_master') icon = <Sparkles className="w-5 h-5 text-pink-400" />;
              if (game.id === 'cipher_puzzle') icon = <Terminal className="w-5 h-5 text-emerald-400" />;
              if (game.id === 'difficult_quiz') icon = <Trophy className="w-5 h-5 text-amber-400" />;
              if (game.id === 'precision_timing') icon = <Target className="w-5 h-5 text-red-400" />;
              if (game.id === 'multi_task') icon = <Layers className="w-5 h-5 text-orange-400" />;
              if (game.id === 'arcade_shooter') icon = <Crosshair className="w-5 h-5 text-rose-400" />;

              return (
                <div
                  key={game.id}
                  className={`bg-[#0e1217] border border-[#232936] rounded-2xl p-5 flex flex-col justify-between transition-all group ${themeBorder} shadow-lg hover:shadow-cyan-500/5`}
                >
                  <div>
                    {/* Card Head */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#161c24] border border-[#232936] flex items-center justify-center">
                        {icon}
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#161c26] text-gray-300 border border-[#232936]">
                        {game.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-3">
                      {game.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#232936]/60">
                    {/* Mini stats preview */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3 font-mono">
                      <span>Top: <strong className="text-amber-300">{gameStats?.highScore || 0} pts</strong></span>
                      <span>Fast: <strong className="text-gray-300">{gameStats?.bestTime ? `${gameStats.bestTime.toFixed(1)}s` : '--'}</strong></span>
                    </div>

                    {/* Launch Button */}
                    <button
                      onClick={() => handleLaunchGame(game.id, 'medium')}
                      className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Deploy Operation
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lower Split: Recent Activity & Top Players Spotlight */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            {/* Recent Live Activity Feed (2 Cols) */}
            <div className="lg:col-span-2 bg-[#0e1217] border border-[#232936] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#232936] pb-3 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Live Operational Activity Feed
                </h3>
                <span className="text-[11px] text-gray-500 font-mono">Real-Time Database Records</span>
              </div>

              <div className="space-y-2.5">
                {(!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0) ? (
                  <p className="text-xs text-gray-500 py-6 text-center">No recent games logged yet. Deploy a mission to set the first score!</p>
                ) : (
                  dashboardData.recentActivity.slice(0, 6).map((act, i) => (
                    <div
                      key={act.id || i}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#121720] border border-[#232936] hover:bg-[#161c26] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          username={act.username}
                          avatarUrl={act.avatarUrl}
                          size="sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{act.username}</span>
                            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#161c26] text-gray-300 border border-[#232936]">
                              {act.gameTitle || act.gameId}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">
                            {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.difficulty} tier
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-[#00ff88] block">
                          {act.score} pts
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {act.timeSeconds}s {act.accuracy ? `(${act.accuracy}%)` : ''}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Operatives Rankings Spotlight (1 Col) */}
            <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#232936] pb-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Top Operatives
                  </h3>
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    View All
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(!dashboardData?.playerRankings || dashboardData.playerRankings.length === 0) ? (
                    <p className="text-xs text-gray-500 py-6 text-center">No ranked operatives yet.</p>
                  ) : (
                    dashboardData.playerRankings.slice(0, 5).map((rank) => (
                      <div
                        key={rank.userId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#121720] border border-[#232936]"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 text-center font-mono font-bold text-xs ${
                            rank.rank === 1 ? 'text-amber-400' : rank.rank === 2 ? 'text-slate-300' : rank.rank === 3 ? 'text-amber-600' : 'text-gray-500'
                          }`}>
                            #{rank.rank}
                          </span>
                          <UserAvatar
                            username={rank.username}
                            avatarUrl={rank.avatarUrl}
                            size="sm"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">{rank.username}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{rank.totalWins} wins</span>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-amber-300 block">{rank.bestScore} pts</span>
                          <span className="text-[10px] text-gray-400">{rank.favoriteGame}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className="w-full mt-4 py-2.5 rounded-xl text-xs font-bold bg-[#161c24] hover:bg-[#1e2533] border border-[#232936] text-gray-300 hover:text-white transition-all text-center"
              >
                Inspect Global Rankings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. GAME ARENA VIEW                                        */}
      {/* ========================================================= */}
      {activeTab === 'arena' && (
        <div className="space-y-6">
          {/* Game Selection & Tier Selector Bar */}
          <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            {/* Game Picker */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-gray-400 font-mono">Discipline:</span>
              <select
                value={selectedGameId}
                onChange={(e) => {
                  setSelectedGameId(e.target.value as GameId);
                  setLastSubmissionResult(null);
                }}
                className="bg-[#121720] border border-[#232936] text-white font-bold text-sm rounded-xl px-4 py-2 outline-none focus:border-cyan-400"
              >
                {MINI_GAMES_CATALOG.map(g => (
                  <option key={g.id} value={g.id}>{g.title} ({g.badge})</option>
                ))}
              </select>
            </div>

            {/* Difficulty Tier Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono mr-1">Difficulty:</span>
              {(['easy', 'medium', 'hard', 'expert'] as GameDifficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    setLastSubmissionResult(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    difficulty === d
                      ? d === 'expert' 
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md shadow-purple-500/20'
                        : d === 'hard'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-md shadow-rose-500/20'
                        : d === 'medium'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/20'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20'
                      : 'bg-[#121720] text-gray-400 hover:text-white border-[#232936]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Active Mission Card Info */}
          <div className="bg-[#121720] border border-[#232936] rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {activeGameCatalog.title}
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a2332] text-cyan-300 border border-cyan-500/20 font-mono">
                  {activeGameCatalog.badge}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{activeGameCatalog.description}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-gray-400">Target Tier: <strong className="text-cyan-300 font-mono uppercase">{difficulty}</strong></span>
            </div>
          </div>

          {/* Last Submission Result Notice */}
          {lastSubmissionResult && (
            <div className="bg-gradient-to-r from-[#00ff88]/10 via-cyan-500/10 to-[#0e1217] border border-[#00ff88]/30 rounded-2xl p-6 text-white shadow-xl animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#00ff88] font-bold text-base mb-1">
                    <CheckCircle2 className="w-5 h-5" />
                    Mission Record Synchronized!
                  </div>
                  <p className="text-xs text-gray-300">
                    Earned <strong className="text-amber-300 font-mono text-sm">{lastSubmissionResult.submission?.score || 0} pts</strong> and 
                    awarded <strong className="text-[#00ff88] font-mono text-sm">+{lastSubmissionResult.pointsAwarded || 50} Kick League Points</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#161c24] hover:bg-[#1e2533] border border-[#232936] text-gray-300 hover:text-white transition-colors"
                  >
                    View Leaderboard
                  </button>
                  <button
                    onClick={() => setLastSubmissionResult(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00ff88] text-black hover:bg-[#00ff88]/90 transition-colors shadow-md shadow-[#00ff88]/20"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Component Render */}
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
      {/* 4. PERSONAL PLAYER STATS VIEW                             */}
      {/* ========================================================= */}
      {activeTab === 'mystats' && (
        <div className="space-y-6">
          <PlayerStatsCard
            stats={dashboardData?.userStats || null}
            username={user?.username || 'Guest Operative'}
            avatarUrl={user?.avatarUrl}
            loading={loadingDashboard}
          />
        </div>
      )}
    </div>
  );
};
