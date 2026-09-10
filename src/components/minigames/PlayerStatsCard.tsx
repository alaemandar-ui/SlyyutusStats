import React from 'react';
import { PlayerStats } from './types';
import { UserAvatar } from '../UserAvatar';
import { Trophy, Clock, Target, Flame, Zap, Award, CheckCircle2, Gamepad2 } from 'lucide-react';

interface Props {
  stats: PlayerStats | null;
  username?: string;
  avatarUrl?: string;
  loading?: boolean;
}

export const PlayerStatsCard: React.FC<Props> = ({ stats, username = 'Operator', avatarUrl, loading }) => {
  if (loading || !stats) {
    return (
      <div className="bg-[#121720] border border-[#232936] rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-[#1a2230] rounded w-48 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-[#161c26] rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 text-white shadow-xl">
      {/* Header Profile */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232936] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <UserAvatar
            username={username}
            avatarUrl={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
            size="md"
          />
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {username}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 font-mono uppercase">
                Active Operative
              </span>
            </h3>
            <p className="text-xs text-gray-400">Personal Mission Performance & Tactical Records</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="bg-[#161c24] px-3.5 py-1.5 rounded-xl border border-[#232936]">
            <span>Win Ratio: </span>
            <strong className="text-[#00ff88] font-mono ml-1">{stats.winRate}%</strong>
          </div>
        </div>
      </div>

      {/* 6 Core Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {/* Games Played */}
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
            Games Played
          </span>
          <span className="text-xl font-bold font-mono text-white mt-2">
            {stats.totalAttempts}
          </span>
        </div>

        {/* Games Won */}
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff88]" />
            Games Won
          </span>
          <span className="text-xl font-bold font-mono text-[#00ff88] mt-2">
            {stats.totalWins}
          </span>
        </div>

        {/* Best Score */}
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Best Score
          </span>
          <span className="text-xl font-bold font-mono text-amber-300 mt-2">
            {stats.bestScore}
          </span>
        </div>

        {/* Average Score */}
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            Average Score
          </span>
          <span className="text-xl font-bold font-mono text-purple-300 mt-2">
            {stats.averageScore}
          </span>
        </div>

        {/* Best Completion Time */}
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            Best Time
          </span>
          <span className="text-xl font-bold font-mono text-rose-300 mt-2">
            {stats.bestCompletionTime > 0 ? `${stats.bestCompletionTime.toFixed(1)}s` : '--'}
          </span>
        </div>

        {/* Top Game */}
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-blue-400" />
            Favorite Game
          </span>
          <span className="text-xs font-bold text-blue-300 truncate mt-2" title={stats.favoriteGame}>
            {stats.favoriteGame}
          </span>
        </div>
      </div>

      {/* Per-Game Breakdown Table */}
      {stats.perGame && Object.keys(stats.perGame).length > 0 && (
        <div className="bg-[#121720] border border-[#232936] rounded-xl p-4 overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Discipline Efficiency Breakdown</h4>
            <span className="text-[11px] text-gray-500">Highest Performing: <strong className="text-amber-300">{stats.highestPerformingGame}</strong></span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#232936] text-gray-400 pb-2">
                <th className="pb-2 font-medium">Game Title</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium text-center">Plays</th>
                <th className="pb-2 font-medium text-center">Wins</th>
                <th className="pb-2 font-medium text-right">Best Score</th>
                <th className="pb-2 font-medium text-right">Fastest Time</th>
                <th className="pb-2 font-medium text-right">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#232936]/40">
              {Object.entries(stats.perGame).map(([gameId, stat]: [string, any]) => (
                <tr key={gameId} className="hover:bg-[#161c26] transition-colors">
                  <td className="py-2.5 font-medium text-white">{stat.title}</td>
                  <td className="py-2.5">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#161c24] text-gray-300 border border-[#232936]">
                      {stat.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-mono text-gray-300">{stat.attempts}</td>
                  <td className="py-2.5 text-center font-mono text-[#00ff88]">{stat.wins}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-amber-300">{stat.bestScore || '--'}</td>
                  <td className="py-2.5 text-right font-mono text-gray-300">{stat.fastestTime > 0 ? `${stat.fastestTime.toFixed(1)}s` : '--'}</td>
                  <td className="py-2.5 text-right font-mono text-cyan-300">{stat.averageAccuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
