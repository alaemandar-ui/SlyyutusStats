import React from 'react';
import { PlayerStats } from './types';
import { UserAvatar } from '../UserAvatar';
import { 
  Trophy, 
  Clock, 
  Target, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Gamepad2, 
  TrendingUp, 
  ArrowRight, 
  Zap, 
  Flame, 
  Percent, 
  Play, 
  Calendar,
  Medal,
  Activity,
  Sparkles,
  Lock,
  LogIn
} from 'lucide-react';

interface Props {
  stats: PlayerStats | null;
  userId?: string;
  username?: string;
  avatarUrl?: string;
  isAuthenticated?: boolean;
  loading?: boolean;
  onGoToGames?: () => void;
  onPlayGame?: (gameId: string) => void;
  onLogin?: () => void;
}

export const PlayerStatsCard: React.FC<Props> = ({ 
  stats, 
  userId,
  username = 'Operator', 
  avatarUrl, 
  isAuthenticated = true,
  loading,
  onGoToGames,
  onPlayGame,
  onLogin
}) => {
  // 1. Loading State
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-[#111] border border-[#D4AF37]/20 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-zinc-800 rounded-lg"></div>
            <div className="space-y-2">
              <div className="h-5 w-40 bg-zinc-800 rounded"></div>
              <div className="h-3 w-60 bg-zinc-800/60 rounded"></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="h-24 bg-[#111] border border-zinc-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // 1.5 Unauthenticated State: "Please log in to play games"
  if (!isAuthenticated) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#18150c] via-[#0E0E0E] to-[#070707] p-8 sm:p-12 text-center shadow-[0_0_35px_rgba(212,175,55,0.1)]">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/50 flex items-center justify-center mx-auto text-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.25)]">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[11px] font-mono uppercase tracking-wider text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Authentication Required</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-heading text-white uppercase tracking-tight">
              Please Log In to Play Games
            </h3>
            <p className="text-xs sm:text-sm font-mono text-zinc-400 leading-relaxed">
              Personal performance analytics, accuracy ratings, and win rate history are linked to your official Kick account. Log in to play games and record your tactical achievements.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onLogin && (
              <button
                onClick={onLogin}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-all shadow-[0_0_20px_rgba(212,175,55,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
            )}
            {onGoToGames && (
              <button
                onClick={onGoToGames}
                className="w-full sm:w-auto px-5 py-3 rounded-xl font-mono text-xs uppercase tracking-wider bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                View Games Catalog
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const hasPlayed = stats && (stats.totalGamesPlayed > 0 || (stats.totalAttempts && stats.totalAttempts > 0));

  // 2. Clean Empty State: "No games played yet"
  if (!hasPlayed) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#16140c] via-[#0D0D0D] to-[#070707] p-8 sm:p-12 text-center shadow-[0_0_30px_rgba(212,175,55,0.08)]">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-md mx-auto space-y-5">
          <div className="flex justify-center">
            <UserAvatar
              src={avatarUrl}
              avatarUrl={avatarUrl}
              username={username}
              userId={userId}
              size="xl"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#D4AF37]/60 shadow-[0_0_25px_rgba(212,175,55,0.3)]"
            />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[11px] font-mono uppercase tracking-wider text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{username ? `${username}'s Tactical Records` : 'Personal Tactical Records'}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black font-heading text-white uppercase tracking-tight">
              No Games Played Yet
            </h3>
            <p className="text-xs sm:text-sm font-mono text-zinc-400 leading-relaxed">
              You haven't completed any tactical operations in the arena yet. Jump into an active game to record your first verified score, unlock personal bests, and climb the community rankings.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            {onGoToGames ? (
              <button
                onClick={onGoToGames}
                className="px-6 py-3 rounded-xl font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wider bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-all shadow-[0_0_20px_rgba(212,175,55,0.35)] flex items-center gap-2 group cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black group-hover:scale-110 transition-transform" />
                <span>Go to Games</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <div className="text-xs font-mono text-[#D4AF37]">
                Select a game from the Game Arena tab above to begin!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. User with real stats
  const totalPlayed = stats.totalGamesPlayed || stats.totalAttempts || 0;
  const totalWins = stats.totalWins || 0;
  const totalLost = stats.totalGamesLost != null ? stats.totalGamesLost : Math.max(0, totalPlayed - totalWins);
  const winRate = stats.winRate ?? (totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0);
  const totalScore = stats.totalScore ?? 0;
  const bestScore = stats.bestScore ?? 0;
  const averageScore = stats.averageScore ?? 0;
  const bestTime = stats.bestCompletionTime || stats.fastestWinTime || 0;
  const accuracy = stats.accuracyPercentage != null ? `${stats.accuracyPercentage}%` : '--';
  const currentRank = stats.currentRanking ? `#${stats.currentRanking}` : 'Unranked';
  const highestRankedGame = stats.highestRankedGame || stats.highestPerformingGame || '--';
  const favoriteGame = stats.favoriteGame || '--';

  const perGameEntries = stats.perGame ? Object.entries(stats.perGame) : [];
  const recentResults = stats.recentGameResults || stats.recentActivity || [];

  return (
    <div className="space-y-6 text-white">
      {/* Top Profile & Rank Identity Banner */}
      <div className="relative overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#1c190f] via-[#111] to-[#0A0A0A] p-6 shadow-[0_0_25px_rgba(212,175,55,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar
              src={avatarUrl}
              avatarUrl={avatarUrl}
              username={username}
              userId={userId}
              size="xl"
              className="w-14 h-14 rounded-lg object-cover border-2 border-[#D4AF37]/50 shadow-[0_0_15px_rgba(212,175,55,0.25)]"
            />
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black font-heading text-white tracking-tight">
                  {username}
                </h3>
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#FFD700] border border-[#D4AF37]/40">
                  Verified Operative
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Real-time competitive combat & cognitive telemetry
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {stats.currentRanking && (
              <div className="px-3.5 py-1.5 rounded-lg bg-[#141414] border border-[#D4AF37]/40 flex items-center gap-2">
                <Medal className="w-4 h-4 text-[#FFD700]" />
                <span className="text-xs font-mono text-zinc-400">Current Rank:</span>
                <strong className="text-sm font-black font-mono text-[#FFD700]">
                  #{stats.currentRanking}
                </strong>
                {stats.totalRankedPlayers && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    of {stats.totalRankedPlayers}
                  </span>
                )}
              </div>
            )}
            <div className="px-3.5 py-1.5 rounded-lg bg-[#141414] border border-emerald-500/30 flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Win Rate:</span>
              <strong className="text-sm font-black font-mono text-emerald-400">
                {winRate}%
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Core Performance Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Total Games Played */}
        <div className="bg-[#111] border border-[#D4AF37]/20 rounded-lg p-4 transition-all hover:border-[#D4AF37]/40">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
              Games Played
            </span>
            <Gamepad2 className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {totalPlayed}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
            Completed attempts
          </span>
        </div>

        {/* Total Wins */}
        <div className="bg-[#111] border border-emerald-500/20 rounded-lg p-4 transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Games Won
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {totalWins}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
            Victorious runs
          </span>
        </div>

        {/* Total Losses */}
        <div className="bg-[#111] border border-rose-500/20 rounded-lg p-4 transition-all hover:border-rose-500/40">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
              Games Lost
            </span>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
            {totalLost}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
            Incomplete or timed out
          </span>
        </div>

        {/* Total Score */}
        <div className="bg-gradient-to-b from-[#1b190e] to-[#111] border border-[#D4AF37]/40 rounded-lg p-4 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FFD700]">
              Total Score
            </span>
            <Zap className="w-3.5 h-3.5 text-[#FFD700]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#FFD700]">
            {totalScore.toLocaleString()}
          </div>
          <span className="text-[10px] font-mono text-zinc-400 mt-1 block">
            Cumulative points
          </span>
        </div>

        {/* Best Score */}
        <div className="bg-[#111] border border-[#D4AF37]/20 rounded-lg p-4 transition-all hover:border-[#D4AF37]/40">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
              Best Score
            </span>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
            {bestScore.toLocaleString()}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
            Single-run record
          </span>
        </div>

        {/* Average Score */}
        <div className="bg-[#111] border border-zinc-800 rounded-lg p-4 transition-all hover:border-[#D4AF37]/30">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Average Score
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-zinc-200">
            {averageScore.toLocaleString()}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
            Per attempt
          </span>
        </div>

        {/* Best Completion Time */}
        <div className="bg-[#111] border border-zinc-800 rounded-lg p-4 transition-all hover:border-[#D4AF37]/30">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Best Time
            </span>
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
            {bestTime > 0 ? `${bestTime.toFixed(1)}s` : '--'}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
            Fastest victorious clearance
          </span>
        </div>

        {/* Accuracy Percentage */}
        <div className="bg-[#111] border border-zinc-800 rounded-lg p-4 transition-all hover:border-[#D4AF37]/30">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Accuracy %
            </span>
            <Target className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-300">
            {accuracy}
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
            Precision rating
          </span>
        </div>
      </div>

      {/* Highest-Ranked Game & Favorite Game Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-r from-[#17150d] to-[#111] border border-[#D4AF37]/30 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
              Highest-Ranked Game
            </span>
            <h4 className="text-lg font-black font-heading text-white">
              {highestRankedGame}
            </h4>
            <p className="text-xs font-mono text-zinc-400">
              Top scoring discipline across all missions
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#12161f] to-[#111] border border-cyan-500/30 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              Favorite Game
            </span>
            <h4 className="text-lg font-black font-heading text-white">
              {favoriteGame}
            </h4>
            <p className="text-xs font-mono text-zinc-400">
              Most frequently deployed mission
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Game-By-Game Performance Table */}
      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#111] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <h4 className="text-sm font-black font-heading uppercase tracking-wider text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#D4AF37]" />
              Game-By-Game Performance Breakdown & Personal Bests
            </h4>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Personal best score, fastest completion time, win rate, and accuracy per game
            </p>
          </div>
          {onGoToGames && (
            <button
              onClick={onGoToGames}
              className="text-xs font-mono text-[#D4AF37] hover:text-[#FFD700] transition-colors flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Play More Games</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-[11px] font-mono">
                <th className="pb-2.5 font-bold uppercase">Game Title</th>
                <th className="pb-2.5 font-bold uppercase text-center">Category</th>
                <th className="pb-2.5 font-bold uppercase text-center">Plays</th>
                <th className="pb-2.5 font-bold uppercase text-center">Wins</th>
                <th className="pb-2.5 font-bold uppercase text-center">Win Rate</th>
                <th className="pb-2.5 font-bold uppercase text-right">Personal Best</th>
                <th className="pb-2.5 font-bold uppercase text-right">Fastest Time</th>
                <th className="pb-2.5 font-bold uppercase text-right">Accuracy</th>
                <th className="pb-2.5 font-bold uppercase text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {perGameEntries.map(([gameId, stat]: [string, any]) => {
                const hasPlayedThis = stat.attempts > 0;
                return (
                  <tr key={gameId} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3 font-medium text-white font-sans">
                      <span className="font-bold">{stat.title}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                        {stat.category}
                      </span>
                    </td>
                    <td className="py-3 text-center text-zinc-300">
                      {stat.attempts}
                    </td>
                    <td className="py-3 text-center text-emerald-400 font-bold">
                      {stat.wins}
                    </td>
                    <td className="py-3 text-center text-zinc-300">
                      {hasPlayedThis ? `${stat.winRate ?? (Math.round((stat.wins / stat.attempts) * 100))}%` : '--'}
                    </td>
                    <td className="py-3 text-right font-bold text-[#FFD700]">
                      {hasPlayedThis && stat.bestScore > 0 ? stat.bestScore.toLocaleString() : '--'}
                    </td>
                    <td className="py-3 text-right text-cyan-300">
                      {stat.fastestTime > 0 ? `${stat.fastestTime.toFixed(1)}s` : '--'}
                    </td>
                    <td className="py-3 text-right text-purple-300">
                      {stat.averageAccuracy != null ? `${stat.averageAccuracy}%` : '--'}
                    </td>
                    <td className="py-3 text-center">
                      {onPlayGame ? (
                        <button
                          onClick={() => onPlayGame(gameId)}
                          className="px-2.5 py-1 rounded bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black border border-[#D4AF37]/30 text-[10px] font-heading font-extrabold uppercase transition-all"
                        >
                          Launch
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-[10px]">Ready</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Game Results */}
      <div className="rounded-xl border border-[#D4AF37]/20 bg-[#111] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h4 className="text-sm font-black font-heading uppercase tracking-wider text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            Recent Game Results
          </h4>
          <span className="text-[11px] font-mono text-zinc-400">
            {recentResults.length} Logged Runs
          </span>
        </div>

        {recentResults.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-zinc-500">
            No recent game sessions recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60 font-mono text-xs">
            {recentResults.slice(0, 10).map((res: any, idx: number) => {
              const isVictory = Boolean(res.success);
              const dateStr = res.createdAt ? new Date(res.createdAt).toLocaleDateString() : '';
              const timeStr = res.createdAt ? new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

              return (
                <div 
                  key={res.id || `recent-${idx}`} 
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors px-2 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isVictory 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      {isVictory ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-sm text-white">
                          {res.gameTitle || res.gameId}
                        </span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {res.difficulty || 'standard'}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        {dateStr} {timeStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 text-right self-end sm:self-auto">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Score</span>
                      <strong className="text-sm font-bold text-[#FFD700]">
                        {(res.score || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase">Time</span>
                      <span className="text-xs text-zinc-300">
                        {res.timeSeconds ? `${res.timeSeconds.toFixed(1)}s` : '--'}
                      </span>
                    </div>
                    {typeof res.accuracy === 'number' && (
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase">Accuracy</span>
                        <span className="text-xs text-purple-300">
                          {res.accuracy}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
