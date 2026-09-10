import React, { useState, useEffect } from 'react';
import { UserAvatar } from '../UserAvatar';
import { fetchMiniGameLeaderboard } from '../../lib/api';
import { Trophy, Medal, Award, Clock, Target, Calendar, Filter, Sparkles, Flame, CheckCircle2 } from 'lucide-react';

interface Props {
  selectedGameId?: string;
  onSelectGame?: (gameId: string) => void;
}

export const MiniGameLeaderboard: React.FC<Props> = ({ selectedGameId = 'all', onSelectGame }) => {
  const [activeGame, setActiveGame] = useState<string>(selectedGameId);
  const [activeDiff, setActiveDiff] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'users' | 'runs'>('users');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const GAME_OPTIONS = [
    { id: 'all', label: 'All Disciplines' },
    { id: 'arcade_shooter', label: 'Holo-Range Assault' },
    { id: 'logic_grid', label: 'Neural Grid Matrix' },
    { id: 'difficult_quiz', label: 'Apex Intellect Trivia' },
    { id: 'precision_timing', label: 'Oscillation Calibrator' },
    { id: 'pattern_decoder', label: 'Pattern Decoder' },
    { id: 'sequence_master', label: 'Sequence Master' },
    { id: 'cipher_puzzle', label: 'Cipher Decoder' },
    { id: 'multi_task', label: 'Cognitive Overload' }
  ];

  const DIFF_OPTIONS = [
    { id: 'all', label: 'All Tiers' },
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
    { id: 'expert', label: 'Expert' }
  ];

  useEffect(() => {
    loadLeaderboard();
  }, [activeGame, activeDiff]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetchMiniGameLeaderboard(activeGame, activeDiff);
      setData(res);
    } catch (err) {
      console.error('Failed to load mini game leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const entries = viewMode === 'users' ? data?.leaderboard || [] : data?.topRuns || [];

  return (
    <div className="bg-[#0e1217] border border-[#232936] rounded-2xl p-6 text-white shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#232936] pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Official Leaderboard & Rankings
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 font-mono">
                Verified DB Records
              </span>
            </h3>
            <p className="text-xs text-gray-400">Real verified player records, completion times, and competitive point rankings</p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-[#161c24] p-1 rounded-xl border border-[#232936]">
          <button
            onClick={() => setViewMode('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'users'
                ? 'bg-gradient-to-r from-[#00ff88]/20 to-cyan-500/20 text-[#00ff88] border border-[#00ff88]/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Player Standings
          </button>
          <button
            onClick={() => setViewMode('runs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'runs'
                ? 'bg-gradient-to-r from-[#00ff88]/20 to-cyan-500/20 text-[#00ff88] border border-[#00ff88]/40 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Top Runs
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-[#121720] border border-[#232936] p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            Game:
          </span>
          <select
            value={activeGame}
            onChange={(e) => {
              setActiveGame(e.target.value);
              if (onSelectGame) onSelectGame(e.target.value);
            }}
            className="bg-[#161c26] border border-[#232936] text-white text-xs rounded-lg px-3 py-1.5 outline-none focus:border-[#00ff88]"
          >
            {GAME_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 mr-2">Difficulty Tier:</span>
          {DIFF_OPTIONS.map(d => (
            <button
              key={d.id}
              onClick={() => setActiveDiff(d.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                activeDiff === d.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#161c26] text-gray-400 hover:text-white border border-[#232936]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#232936] text-gray-400 uppercase tracking-wider pb-3 font-semibold">
              <th className="py-3 px-3 w-16">Rank</th>
              <th className="py-3 px-3">Player</th>
              <th className="py-3 px-3">Game</th>
              <th className="py-3 px-3 text-right">Score</th>
              <th className="py-3 px-3 text-right">Time</th>
              <th className="py-3 px-3 text-center">Tier</th>
              <th className="py-3 px-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232936]/50">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  <div className="inline-block w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p>Retrieving secure competitive database records...</p>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-400">
                  No verified records found for this combination. Be the first to establish a high score!
                </td>
              </tr>
            ) : (
              entries.map((entry: any, index: number) => {
                const isTop1 = entry.rank === 1;
                const isTop2 = entry.rank === 2;
                const isTop3 = entry.rank === 3;

                return (
                  <tr
                    key={entry.id || `${entry.userId}_${index}`}
                    className={`hover:bg-[#151c27] transition-colors ${
                      isTop1 ? 'bg-amber-500/5' : isTop2 ? 'bg-slate-400/5' : isTop3 ? 'bg-amber-700/5' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 font-mono font-bold">
                      {isTop1 ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300">
                          <Trophy className="w-4 h-4" />
                        </div>
                      ) : isTop2 ? (
                        <div className="w-7 h-7 rounded-lg bg-slate-400/20 border border-slate-400/50 flex items-center justify-center text-slate-200">
                          <Medal className="w-4 h-4" />
                        </div>
                      ) : isTop3 ? (
                        <div className="w-7 h-7 rounded-lg bg-amber-700/20 border border-amber-700/50 flex items-center justify-center text-amber-500">
                          <Award className="w-4 h-4" />
                        </div>
                      ) : (
                        <span className="text-gray-400 ml-2">#{entry.rank}</span>
                      )}
                    </td>

                    {/* Player */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          username={entry.username}
                          avatarUrl={entry.avatarUrl}
                          size="sm"
                        />
                        <div>
                          <span className="font-bold text-white block">{entry.username}</span>
                          <span className="text-[10px] text-gray-500 font-mono">UID: {entry.userId.slice(-6)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Game */}
                    <td className="py-3 px-3 font-medium text-gray-200">
                      <div>
                        <span className="font-medium text-white">{entry.gameTitle || entry.gameId}</span>
                        {entry.gameMode && (
                          <span className="text-[10px] text-gray-500 block font-mono">Mode: {entry.gameMode}</span>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono font-bold text-base text-[#00ff88]">
                        {entry.score || entry.bestScore}
                      </span>
                      <span className="text-[10px] text-gray-500 block">pts</span>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-3 text-right font-mono text-gray-300">
                      {(entry.timeSeconds || entry.fastestTime)?.toFixed(1)}s
                    </td>

                    {/* Difficulty */}
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                        entry.difficulty === 'expert' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                        entry.difficulty === 'hard' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        entry.difficulty === 'medium' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {entry.difficulty}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-right text-gray-400 font-mono text-[11px]">
                      {entry.date ? new Date(entry.date).toLocaleDateString() : 'Recent'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
