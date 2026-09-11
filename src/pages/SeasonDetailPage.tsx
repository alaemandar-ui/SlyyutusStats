import React, { useEffect, useState } from 'react';
import { LeagueSeason, LeagueRankingEntry } from '../types';
import { fetchSeasonDetail } from '../lib/api';
import { BadgeItem } from '../components/BadgeItem';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { UserAvatar } from '../components/UserAvatar';
import { 
  Calendar, 
  Trophy, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  CheckCircle2,
  Lock,
  MessageSquare,
  Crown
} from 'lucide-react';

interface SeasonDetailPageProps {
  seasonId: string;
  navigate: (route: string) => void;
}

export const SeasonDetailPage: React.FC<SeasonDetailPageProps> = ({ seasonId, navigate }) => {
  const [season, setSeason] = useState<LeagueSeason | null>(null);
  const [rankings, setRankings] = useState<LeagueRankingEntry[]>([]);
  const [topThree, setTopThree] = useState<LeagueRankingEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  const PAGE_SIZE = 25;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * PAGE_SIZE;
        const data = await fetchSeasonDetail(seasonId, debouncedQuery, PAGE_SIZE, offset);
        setSeason(data.season);
        setRankings(data.rankings || []);
        setTopThree(data.topThree || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('Failed fetching season detail:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [seasonId, debouncedQuery, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!season) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <Calendar className="w-16 h-16 text-zinc-600 mx-auto" />
        <h2 className="text-2xl font-black font-heading text-zinc-200 uppercase tracking-tight">Season Not Found</h2>
        <p className="text-sm text-zinc-500 font-mono">The requested season archive "{seasonId}" could not be located in our database.</p>
        <button
          onClick={() => navigate('seasons')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#D4AF37] text-black font-bold text-xs uppercase hover:bg-[#FFD700] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Seasons Archive</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('seasons')}
        className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-400 hover:text-amber-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Seasons Archive</span>
      </button>

      {/* Season Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-800/80 pb-8">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-2">
            <Calendar className="w-4 h-4" />
            <span>Historical Season Record</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              Finalized Archive
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading gold-gradient-text tracking-tight uppercase">
            Season {season?.seasonId} — {season?.name}
          </h1>
          <p className="text-sm text-zinc-400 font-mono mt-1">
            Permanent final results. {total} community chatters participated. Badges awarded to 1st, 2nd, and 3rd place.
          </p>
        </div>

        <div className="text-right font-mono text-xs text-zinc-400 space-y-1">
          <div>Dates: {season && new Date(season.startDate).toLocaleDateString()} — {season && new Date(season.endDate).toLocaleDateString()}</div>
          <div className="text-amber-400">Total Points Awarded: {(season?.totalPointsDistributed || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Top 3 Champions Box */}
      {topThree.length >= 3 && !debouncedQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topThree.map((winner, idx) => {
            const medal = idx === 0 ? '🏆 1st Place Champion' : idx === 1 ? '🥈 2nd Place Finalist' : '🥉 3rd Place Bronze';
            const borderCol = idx === 0 ? 'border-amber-400 gold-glow' : idx === 1 ? 'border-slate-300/40' : 'border-amber-700/40';

            return (
              <div
                key={winner.kickUserId}
                onClick={() => navigate(`user/${winner.username}`)}
                className={`p-6 rounded-2xl border bg-zinc-900/80 hover:bg-zinc-900 transition-all cursor-pointer space-y-3 text-center ${borderCol}`}
              >
                <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">{medal}</div>
                <UserAvatar
                  src={winner.avatarUrl}
                  username={winner.username}
                  userId={winner.kickUserId}
                  className="w-16 h-16 rounded-full mx-auto object-cover border-2 border-zinc-700"
                />
                <div>
                  <h3 className="text-base font-bold font-heading text-zinc-100">{winner.username}</h3>
                  <p className="text-sm font-mono font-bold text-amber-400">{(winner.points || 0).toLocaleString()} PTS</p>
                </div>
                <div className="pt-2 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex justify-around">
                  <span>{(winner.messagesCount || 0).toLocaleString()} msgs</span>
                  <span>{(winner.subsCount || 0) + (winner.giftsCount || 0)} subs</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search & Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search historical user..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Showing {rankings.length} of {total} permanent records
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  <th className="py-3.5 px-4 w-16 text-center">Final Rank</th>
                  <th className="py-3.5 px-4">Chatter</th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                  <th className="py-3.5 px-4 text-right hidden sm:table-cell">Messages</th>
                  <th className="py-3.5 px-4 text-right hidden md:table-cell">Subs</th>
                  <th className="py-3.5 px-4 text-right hidden md:table-cell">Gifts</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs font-mono">
                {rankings.map((r) => (
                  <tr key={r.kickUserId} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-4 px-4 text-center font-bold font-heading">
                      #{r.rank}
                    </td>
                    <td className="py-4 px-4">
                      <div
                        onClick={() => navigate(`user/${r.username}`)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <UserAvatar
                          src={r.avatarUrl}
                          username={r.username}
                          userId={r.kickUserId}
                          className="w-8 h-8 rounded-lg object-cover border border-zinc-700 group-hover:border-amber-400 transition-colors"
                        />
                        <div>
                          <span className="font-heading font-bold text-sm text-zinc-200 group-hover:text-amber-300 block">
                            {r.username}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            ID: {r.kickUserId}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-black font-heading text-sm text-amber-300">
                      {(r.points || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-300 hidden sm:table-cell">
                      {(r.messagesCount || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-300 hidden md:table-cell">
                      {r.subsCount || 0}
                    </td>
                    <td className="py-4 px-4 text-right text-amber-400 font-semibold hidden md:table-cell">
                      {r.giftsCount || 0}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => navigate(`user/${r.username}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase text-zinc-300 bg-zinc-900 hover:bg-amber-500/20 hover:text-amber-300 border border-zinc-800 transition-all"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
              <div className="text-xs font-mono text-zinc-400">Page {page} of {totalPages}</div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-amber-300 border border-zinc-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-amber-300 border border-zinc-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
