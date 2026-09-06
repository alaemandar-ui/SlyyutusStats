import React, { useEffect, useState } from 'react';
import { LeagueSeason, LeagueRankingEntry } from '../types';
import { fetchCurrentLeague } from '../lib/api';
import { BadgeItem } from '../components/BadgeItem';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { UserAvatar } from '../components/UserAvatar';
import { 
  Trophy, 
  Search, 
  Crown, 
  MessageSquare, 
  Gift, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  Flame,
  ShieldCheck,
  Zap,
  HelpCircle,
  X
} from 'lucide-react';

export const LeaguePage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const [season, setSeason] = useState<LeagueSeason | null>(null);
  const [rankings, setRankings] = useState<LeagueRankingEntry[]>([]);
  const [topThree, setTopThree] = useState<LeagueRankingEntry[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  const PAGE_SIZE = 25;

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to page 1 on new search
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch league data
  useEffect(() => {
    const loadLeague = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * PAGE_SIZE;
        const data = await fetchCurrentLeague(debouncedQuery, PAGE_SIZE, offset);
        setSeason(data.season);
        setRankings(data.rankings || []);
        setTopThree(data.topThree || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('Failed loading league:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLeague();
  }, [debouncedQuery, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Header & Season Meta */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#D4AF37]/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest mb-1.5">
            <Trophy className="w-3.5 h-3.5" />
            <span>MONTHLY CHATTERS LEAGUE</span>
            <span className="px-2 py-0.5 rounded-sm bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] font-bold">
              SEASON {season?.seasonId || '09-26'} ACTIVE
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none text-white">
            SLYYUTUS <span className="text-[#D4AF37]">LEAGUE</span>
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1.5 max-w-2xl">
            Real-time standings for {season?.name || 'Current Month'}. Top 3 chatters receive permanent badges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-sm font-black text-[10px] uppercase tracking-widest bg-[#1A1A1A] text-gray-300 hover:text-[#D4AF37] border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all shadow-md"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>POINT RULES</span>
          </button>
          <button
            onClick={() => navigate('seasons')}
            className="flex items-center gap-2 px-4 py-2 rounded-sm font-black text-[10px] uppercase tracking-widest bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-all shadow-md"
          >
            <Trophy className="w-3.5 h-3.5 text-black" />
            <span>PAST SEASONS</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards (Visible when not filtering by search) */}
      {!debouncedQuery && topThree.length >= 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
            <h2 className="text-sm font-black uppercase tracking-widest text-[#D4AF37]">
              LEAGUE PODIUM LEADERS
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            
            {/* 2nd Place */}
            <div
              onClick={() => navigate(`user/${topThree[1].username}`)}
              className="order-2 md:order-1 relative rounded-lg border-l-4 border-gray-400 border-y border-r border-white/5 bg-[#111] p-6 shadow-xl hover:border-gray-300 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl font-black text-gray-400">02</span>
                <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-gray-400/20 text-gray-300 border border-gray-400/40">
                  SILVER
                </span>
              </div>
              <div className="text-center space-y-3">
                <div className="relative inline-block">
                  <UserAvatar
                    src={topThree[1].avatarUrl}
                    username={topThree[1].username}
                    userId={topThree[1].kickUserId}
                    className="w-18 h-18 rounded-full mx-auto object-cover border-2 border-gray-400 shadow-md"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white group-hover:text-gray-300 uppercase">
                    {topThree[1].username}
                  </h3>
                  <p className="text-xs font-mono font-bold text-gray-400 mt-0.5">
                    {(topThree[1].points || 0).toLocaleString()} PTS
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-center gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>{(topThree[1].messagesCount || 0).toLocaleString()} msgs</span>
                  <span>•</span>
                  <span>{(topThree[1].subsCount || 0) + (topThree[1].giftsCount || 0)} subs</span>
                </div>
              </div>
            </div>

            {/* 1st Place */}
            <div
              onClick={() => navigate(`user/${topThree[0].username}`)}
              className="order-1 md:order-2 relative rounded-lg border-l-4 border-[#D4AF37] border-y border-r border-[#D4AF37]/30 bg-gradient-to-r from-yellow-500/10 via-[#111] to-[#111] p-7 shadow-2xl hover:border-[#D4AF37] transition-all cursor-pointer group md:-mt-4"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl font-black text-[#D4AF37]">01</span>
                <span className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-sm bg-[#D4AF37] text-black">
                  CHAMPION
                </span>
              </div>
              <div className="text-center space-y-3">
                <div className="relative inline-block">
                  <div className="w-22 h-22 rounded-full mx-auto p-1 bg-gradient-to-tr from-[#D4AF37] to-[#FFD700] shadow-[0_0_25px_rgba(212,175,55,0.4)]">
                    <UserAvatar
                      src={topThree[0].avatarUrl}
                      username={topThree[0].username}
                      userId={topThree[0].kickUserId}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-[#FFD700] uppercase">
                    {topThree[0].username}
                  </h3>
                  <p className="text-sm font-mono font-black text-[#D4AF37] mt-0.5">
                    {(topThree[0].points || 0).toLocaleString()} PTS
                  </p>
                </div>
                <div className="pt-2 border-t border-[#D4AF37]/20 flex justify-center gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-300">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {(topThree[0].messagesCount || 0).toLocaleString()} msgs
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {(topThree[0].subsCount || 0) + (topThree[0].giftsCount || 0)} subs
                  </span>
                </div>
              </div>
            </div>

            {/* 3rd Place */}
            <div
              onClick={() => navigate(`user/${topThree[2].username}`)}
              className="order-3 relative rounded-lg border-l-4 border-[#CD7F32] border-y border-r border-white/5 bg-[#111] p-6 shadow-xl hover:border-[#CD7F32] transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-2xl font-black text-[#CD7F32]">03</span>
                <span className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-[#CD7F32]/20 text-[#CD7F32] border border-[#CD7F32]/40">
                  BRONZE
                </span>
              </div>
              <div className="text-center space-y-3">
                <div className="relative inline-block">
                  <UserAvatar
                    src={topThree[2].avatarUrl}
                    username={topThree[2].username}
                    userId={topThree[2].kickUserId}
                    className="w-18 h-18 rounded-full mx-auto object-cover border-2 border-[#CD7F32] shadow-md"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white group-hover:text-[#CD7F32] uppercase">
                    {topThree[2].username}
                  </h3>
                  <p className="text-xs font-mono font-bold text-[#CD7F32] mt-0.5">
                    {(topThree[2].points || 0).toLocaleString()} PTS
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-800 flex justify-center gap-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>{(topThree[2].messagesCount || 0).toLocaleString()} msgs</span>
                  <span>•</span>
                  <span>{(topThree[2].subsCount || 0) + (topThree[2].giftsCount || 0)} subs</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Search & Leaderboard Table */}
      <div className="space-y-4">
        
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH CHATTER OR ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-[#111] border border-[#D4AF37]/20 focus:border-[#D4AF37] text-xs font-bold text-white placeholder-gray-500 focus:outline-none transition-all uppercase tracking-wider"
            />
          </div>

          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 self-end sm:self-auto">
            SHOWING {rankings.length} OF {total} TRACKED CHATTERS
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-hidden rounded-lg border border-[#D4AF37]/20 bg-[#0A0A0A] shadow-2xl">
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton type="table" rows={10} />
            </div>
          ) : rankings.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Trophy className="w-10 h-10 text-[#D4AF37]/60 mx-auto" />
              <h3 className="font-black uppercase tracking-wider text-lg text-[#D4AF37]">
                {debouncedQuery ? 'NO CHATTERS FOUND' : 'NO REAL DATA YET'}
              </h3>
              <p className="text-xs text-gray-400 font-mono max-w-md mx-auto">
                {debouncedQuery 
                  ? 'No participating user matched your search query.' 
                  : 'Leaderboard points are awarded exclusively from real Kick chat messages (+1) and subscriptions (+100). No real community event data has been recorded for this season yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D4AF37]/20 bg-[#111] text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
                    <th className="py-3 px-4 w-16 text-center">RANK</th>
                    <th className="py-3 px-4">CHATTER</th>
                    <th className="py-3 px-4 text-right">POINTS</th>
                    <th className="py-3 px-4 text-right hidden sm:table-cell">MESSAGES</th>
                    <th className="py-3 px-4 text-right hidden md:table-cell">SUBS</th>
                    <th className="py-3 px-4 text-right hidden md:table-cell">GIFTS</th>
                    <th className="py-3 px-4 text-center hidden lg:table-cell">BADGES</th>
                    <th className="py-3 px-4 text-right">PROFILE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4AF37]/10 text-xs font-mono">
                  {rankings.map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;

                    return (
                      <tr
                        key={entry.kickUserId}
                        className={`hover:bg-[#161616] transition-colors ${
                          isTop1 ? 'bg-yellow-500/5' : isTop2 ? 'bg-white/5' : isTop3 ? 'bg-amber-900/5' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-[#D4AF37] text-black font-black text-xs">
                              01
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-gray-400 text-black font-black text-xs">
                              02
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-[#CD7F32] text-black font-black text-xs">
                              03
                            </span>
                          ) : (
                            <span className="text-gray-400 font-bold">
                              #{entry.rank < 10 ? `0${entry.rank}` : entry.rank}
                            </span>
                          )}
                        </td>

                        {/* Chatter Identity */}
                        <td className="py-3.5 px-4">
                          <div
                            onClick={() => navigate(`user/${entry.username}`)}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <UserAvatar
                              src={entry.avatarUrl}
                              username={entry.username}
                              userId={entry.kickUserId}
                              className="w-8 h-8 rounded-sm object-cover border border-[#D4AF37]/30 group-hover:border-[#D4AF37] transition-colors"
                            />
                            <div>
                              <span className="font-black text-xs uppercase tracking-tight text-white group-hover:text-[#D4AF37] transition-colors block">
                                {entry.username}
                              </span>
                              <span className="text-[9px] text-gray-500 uppercase font-mono block -mt-0.5">
                                ID: {entry.kickUserId}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Points */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-black text-sm ${
                              isTop1 ? 'text-[#FFD700]' : isTop2 ? 'text-gray-300' : isTop3 ? 'text-[#CD7F32]' : 'text-white'
                            }`}
                          >
                            {(entry.points || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Messages */}
                        <td className="py-3.5 px-4 text-right text-gray-300 font-bold hidden sm:table-cell">
                          {(entry.messagesCount || 0).toLocaleString()}
                        </td>

                        {/* Subs */}
                        <td className="py-3.5 px-4 text-right text-gray-300 font-bold hidden md:table-cell">
                          {entry.subsCount || 0}
                        </td>

                        {/* Gifts */}
                        <td className="py-3.5 px-4 text-right text-[#D4AF37] font-bold hidden md:table-cell">
                          {entry.giftsCount || 0}
                        </td>

                        {/* Badges preview */}
                        <td className="py-3.5 px-4 text-center hidden lg:table-cell">
                          {entry.badges && entry.badges.length > 0 ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {entry.badges.slice(0, 2).map((b, i) => (
                                <BadgeItem key={b.awardId || (b as any).id || `badge-entry-${b.badgeId || i}-${i}`} badgeAward={b} size="sm" showDetails={false} />
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-600 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Profile CTA */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => navigate(`user/${entry.username}`)}
                            className="px-2.5 py-1 rounded-sm text-[10px] font-black uppercase tracking-wider text-gray-300 bg-[#1A1A1A] hover:bg-[#D4AF37] hover:text-black border border-[#D4AF37]/20 transition-all"
                          >
                            VIEW
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#D4AF37]/20 bg-[#111] flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                PAGE {page} OF {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-sm bg-[#1A1A1A] text-gray-300 hover:text-[#D4AF37] border border-[#D4AF37]/20 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-sm bg-[#1A1A1A] text-gray-300 hover:text-[#D4AF37] border border-[#D4AF37]/20 disabled:opacity-40 disabled:pointer-events-none transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-lg border border-[#D4AF37]/40 bg-[#0A0A0A] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-black text-base uppercase tracking-tight text-white">
                  LEAGUE POINT RULES
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-sm text-gray-400 hover:text-white bg-[#111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono text-gray-300">
              <div className="p-3 rounded-sm bg-[#111] border border-[#D4AF37]/20 space-y-1">
                <div className="flex justify-between items-center text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                  <span>Chat Message</span>
                  <span>+1 POINT</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Awarded for verified chat messages during live broadcasts.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-[#111] border border-[#D4AF37]/20 space-y-1">
                <div className="flex justify-between items-center text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                  <span>Channel Subscription</span>
                  <span>+100 POINTS</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Awarded for subscribing/resubscribing to the channel.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-[#111] border border-[#D4AF37]/20 space-y-1">
                <div className="flex justify-between items-center text-xs font-black text-[#D4AF37] uppercase tracking-wider">
                  <span>Gifted Subscription</span>
                  <span>+100 POINTS / GIFT</span>
                </div>
                <p className="text-gray-400 text-[11px]">
                  Awarded to the gifter for each community sub gifted.
                </p>
              </div>

              <div className="p-3 rounded-sm bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] space-y-1">
                <h4 className="font-black uppercase tracking-wider text-[11px]">TIE-BREAKING PROTOCOL</h4>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-gray-300">
                  <li>Higher total points</li>
                  <li>Higher qualifying activity volume</li>
                  <li>Earlier timestamp of achievement</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2 rounded-sm font-black uppercase tracking-widest text-xs bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-colors"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
