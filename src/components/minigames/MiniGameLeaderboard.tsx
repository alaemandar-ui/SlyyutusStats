import React, { useState, useEffect } from 'react';
import { UserAvatar } from '../UserAvatar';
import { fetchMiniGameLeaderboard } from '../../lib/api';
import { Trophy, Medal, Award, Clock, Target, Calendar, Filter, Sparkles, CheckCircle2 } from 'lucide-react';

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
    { id: 'all', label: 'All Operations' },
    { id: 'logic_grid', label: 'Neural Grid Matrix' },
    { id: 'pattern_decoder', label: 'Pattern Decoder' },
    { id: 'sequence_master', label: 'Sequence Master' },
    { id: 'cipher_puzzle', label: 'Cipher Decoder' },
    { id: 'difficult_quiz', label: 'Apex Intellect Trivia' },
    { id: 'precision_timing', label: 'Oscillation Calibrator' },
    { id: 'multi_task', label: 'Cognitive Overload' },
    { id: 'arcade_shooter', label: 'Holo-Range Assault' }
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
    <div className="rounded-xl border border-[#D4AF37]/30 bg-[#111] p-6 text-white shadow-[0_0_25px_rgba(212,175,55,0.08)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-heading text-white flex items-center gap-2.5">
              <span>Official Leaderboard & Rankings</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#FFD700] border border-[#D4AF37]/40 font-mono uppercase">
                Verified Records
              </span>
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Live database records, completion times, and competitive point rankings
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-[#1A1A1A] p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setViewMode('users')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-heading font-extrabold uppercase tracking-wider transition-all ${
              viewMode === 'users'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Player Standings
          </button>
          <button
            onClick={() => setViewMode('runs')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-heading font-extrabold uppercase tracking-wider transition-all ${
              viewMode === 'runs'
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Top Clearances
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-[#161616] border border-zinc-800 p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
            Operation:
          </span>
          <select
            value={activeGame}
            onChange={(e) => {
              setActiveGame(e.target.value);
              if (onSelectGame) onSelectGame(e.target.value);
            }}
            className="bg-[#111] border border-zinc-700 text-white text-xs rounded-lg px-3 py-1.5 outline-none focus:border-[#D4AF37] font-mono cursor-pointer"
          >
            {GAME_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 mr-1">Difficulty Tier:</span>
          {DIFF_OPTIONS.map(d => (
            <button
              key={d.id}
              onClick={() => setActiveDiff(d.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase transition-all ${
                activeDiff === d.id
                  ? 'bg-[#D4AF37]/20 text-[#FFD700] border border-[#D4AF37]/50 font-bold'
                  : 'bg-[#111] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table: Rank | Player | Game | Score | Time | Date */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider pb-3 font-mono text-[11px]">
              <th className="py-3 px-3 w-16">Rank</th>
              <th className="py-3 px-3">Player</th>
              <th className="py-3 px-3">Game</th>
              <th className="py-3 px-3 text-right">Score</th>
              <th className="py-3 px-3 text-right">Time</th>
              <th className="py-3 px-3 text-center">Tier</th>
              <th className="py-3 px-3 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-mono">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400">
                  <div className="inline-block w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="font-mono text-xs text-zinc-500">Retrieving official competitive records...</p>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400">
                  <div className="max-w-sm mx-auto space-y-2">
                    <Trophy className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-sm font-bold text-white">No Verified Records Found</p>
                    <p className="text-xs text-zinc-500">
                      Be the first player to establish a record in this discipline!
                    </p>
                  </div>
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
                    className={`hover:bg-zinc-900/60 transition-colors ${
                      isTop1 ? 'bg-[#D4AF37]/5' : isTop2 ? 'bg-slate-400/5' : isTop3 ? 'bg-amber-700/5' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 font-bold">
                      {isTop1 ? (
                        <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/60 flex items-center justify-center text-[#FFD700]">
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
                        <span className="text-zinc-500 ml-2 font-mono">#{entry.rank}</span>
                      )}
                    </td>

                    {/* Player */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          src={entry.avatarUrl}
                          avatarUrl={entry.avatarUrl}
                          username={entry.username}
                          userId={entry.userId}
                          size="sm"
                        />
                        <div>
                          <span className="font-bold text-white block font-sans">{entry.username}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">ID: {entry.userId?.slice(-6) || 'active'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Game */}
                    <td className="py-3 px-3 font-medium text-zinc-200">
                      <div>
                        <span className="font-bold text-white font-sans">{entry.gameTitle || entry.gameId}</span>
                        {entry.gameMode && (
                          <span className="text-[10px] text-zinc-500 block font-mono">Mode: {entry.gameMode}</span>
                        )}
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono font-bold text-base text-[#FFD700]">
                        {(entry.score || entry.bestScore || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">pts</span>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-3 text-right text-zinc-300">
                      {(entry.timeSeconds || entry.fastestTime)?.toFixed(1)}s
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                        entry.difficulty === 'expert' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                        entry.difficulty === 'hard' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        entry.difficulty === 'medium' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {entry.difficulty || 'standard'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-right text-zinc-400 font-mono text-[11px]">
                      {entry.createdAt || entry.date ? new Date(entry.createdAt || entry.date).toLocaleDateString() : 'Recent'}
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
