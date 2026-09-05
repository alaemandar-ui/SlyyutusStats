import React, { useEffect, useState } from 'react';
import { KickUserSearchResult } from '../types';
import { searchUsers } from '../lib/api';
import { BadgeItem } from '../components/BadgeItem';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { 
  Users, 
  Search, 
  Trophy, 
  MessageSquare, 
  Crown, 
  ArrowRight, 
  ShieldCheck,
  Award
} from 'lucide-react';

export const UsersPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [users, setUsers] = useState<KickUserSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const data = await searchUsers(debouncedQuery, 30);
        setUsers(data || []);
      } catch (err) {
        console.error('Failed searching users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [debouncedQuery]);

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-2">
          <Users className="w-4 h-4" />
          <span>Kick Community Directory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-heading gold-gradient-text tracking-tight uppercase">
          Search Community Members
        </h1>
        <p className="text-sm text-zinc-400 font-mono mt-1 max-w-2xl">
          Look up any Kick user in the Slyyutus community to inspect permanent badges, monthly rankings, chat volumes, and VOD activity.
        </p>
      </div>

      {/* Big Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by Kick username or Kick user ID (e.g. ApexLegend99, 102938)..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 focus:border-amber-500 text-sm font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xl transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 hover:text-zinc-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid of Results */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : users.length === 0 ? (
        <div className="p-16 text-center rounded-2xl border border-zinc-800 bg-zinc-950/60 space-y-3">
          <Users className="w-12 h-12 text-[#D4AF37]/60 mx-auto" />
          <h3 className="font-heading font-bold text-lg text-[#D4AF37]">
            {debouncedQuery ? 'No Members Found' : 'No Real Data Yet'}
          </h3>
          <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto">
            {debouncedQuery 
              ? 'No Kick community member matched your search query.' 
              : 'No verified Kick community members have interacted yet. When community members authenticate via Kick OAuth or participate in chat, their real profiles will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.kickUserId}
              onClick={() => navigate(`user/${user.username}`)}
              className="group relative overflow-hidden rounded-2xl border border-zinc-800/80 hover:border-amber-500/50 bg-zinc-900/70 hover:bg-zinc-900/95 p-6 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-4">
                
                {/* User Header */}
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover border border-zinc-700 group-hover:border-amber-400 transition-colors"
                    />
                    {user.currentRank && user.currentRank <= 3 && (
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-zinc-950 text-[9px] font-black font-mono shadow">
                        #{user.currentRank}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-base text-zinc-100 group-hover:text-amber-300 truncate transition-colors">
                      {user.username}
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-500 block truncate">
                      ID: {user.kickUserId}
                    </span>
                    {user.currentRank ? (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-amber-400 font-semibold mt-0.5">
                        <Trophy className="w-3 h-3" />
                        Rank #{user.currentRank} ({((user.currentPoints || 0)).toLocaleString()} pts)
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-zinc-500 block">
                        Unranked this month
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges preview */}
                {user.badges && user.badges.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                      Earned Badges ({user.badges.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.badges.slice(0, 3).map((b, i) => (
                        <BadgeItem key={i} badgeAward={b} size="sm" showDetails={false} />
                      ))}
                      {user.badges.length > 3 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          +{user.badges.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom stats */}
              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                  {(user.totalChatMessages || 0).toLocaleString()} msgs
                </span>
                <span className="text-amber-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  <span>View Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
