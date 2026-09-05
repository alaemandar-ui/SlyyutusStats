import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMyStats, fetchUserChatHistory } from '../lib/api';
import { MyStatsResponse, ChatMessage } from '../types';
import { BadgeItem } from '../components/BadgeItem';
import { StatCard } from '../components/StatCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { 
  User, 
  Trophy, 
  MessageSquare, 
  Crown, 
  Gift, 
  LogIn, 
  Award, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export const MyStatsPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [myStats, setMyStats] = useState<MyStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chats, setChats] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchMyStats();
        setMyStats(data);
        if (data.user) {
          const chatRes = await fetchUserChatHistory(data.user.kickUserId, 10, 0);
          setChats(chatRes.messages);
        }
      } catch (err) {
        console.error('Failed fetching my stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <LoadingSkeleton type="profile" />
      </div>
    );
  }

  // Not logged in view
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-8">
        <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto text-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)]">
          <User className="w-10 h-10" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-white uppercase tracking-tight">
            Personalized Community Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-lg mx-auto leading-relaxed">
            Log in with your Kick account to track your real-time Monthly League standing, earned permanent badges, points needed for next rank, and message analytics.
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <button
            onClick={() => navigate('login')}
            className="px-8 py-3.5 rounded-xl font-heading font-extrabold text-sm uppercase tracking-wider bg-[#D4AF37] text-black hover:bg-[#FFD700] shadow-[0_0_25px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-black" />
            <span>LOGIN WITH KICK</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading || !myStats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <LoadingSkeleton type="profile" />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  const profileUser = myStats.user;
  const rank = myStats.rank;
  const points = myStats.points ?? 0;
  const pointsToNextRank = myStats.pointsToNextRank;
  const nextRank = myStats.nextRank;
  const badges = myStats.badges || [];
  const seasonName = myStats.seasonName || 'Current Season';

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <img
            src={profileUser.avatarUrl}
            alt={profileUser.username}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400/60 shadow-lg"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-zinc-100">
                {profileUser.username}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono uppercase font-bold">
                {profileUser.role}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Kick ID: <strong className="text-amber-400">{profileUser.kickUserId}</strong> • Current Season: {seasonName}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`user/${profileUser.username}`)}
          className="px-4 py-2 rounded-xl text-xs font-heading font-bold uppercase tracking-wider bg-zinc-900 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 transition-all flex items-center gap-1.5"
        >
          <span>View Public Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current League Rank"
          value={rank ? `#${rank}` : 'Unranked'}
          subValue={pointsToNextRank != null && typeof pointsToNextRank === 'number' ? `${(pointsToNextRank || 0).toLocaleString()} pts to #${nextRank}` : 'Top of Leaderboard!'}
          icon={Trophy}
          highlight={true}
        />
        <StatCard
          label="Monthly League Points"
          value={points}
          subValue="Season 09-26"
          icon={Zap}
          highlight={true}
        />
        <StatCard
          label="Total Chat Messages"
          value={profileUser.totalChatMessages}
          subValue="All recorded streams"
          icon={MessageSquare}
        />
        <StatCard
          label="Badges Minted"
          value={badges.length}
          subValue="Permanent achievements"
          icon={Award}
        />
      </div>

      {/* Next Rank Progress Card */}
      {rank && nextRank && pointsToNextRank && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-zinc-100">
                Rank Progression
              </h3>
            </div>
            <span className="text-xs font-mono text-amber-300 font-bold">
              {pointsToNextRank} points needed for Rank #{nextRank}
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full w-3/4" />
          </div>
          <p className="text-[11px] font-mono text-zinc-400">
            Tip: Earn points faster by subscribing (+100 pts), gifting subs (+100 pts/sub), or chatting during live streams (+1 pt/msg).
          </p>
        </div>
      )}

      {/* Badges Collection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-extrabold font-heading uppercase text-zinc-100 tracking-wider">
              My Permanent Badges
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {badges.length} Unlocked
          </span>
        </div>

        {badges.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 text-xs font-mono text-zinc-500">
            No permanent badges unlocked yet. Keep chatting and supporting Slyyutus to earn season badges!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((b, idx) => (
              <BadgeItem key={b.awardId || (b as any).id || `my-badge-${b.badgeId}-${idx}`} badgeAward={b} size="md" showDetails={true} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-extrabold font-heading uppercase text-zinc-100 tracking-wider">
            My Recent Chat Activity
          </h3>
        </div>

        {chats.length === 0 ? (
          <div className="p-10 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 text-xs font-mono text-zinc-500">
            No recent chat messages logged.
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 divide-y divide-zinc-800/60 overflow-hidden">
            {chats.map((c, idx) => (
              <div key={c.messageId || `my-chat-${idx}`} className="p-4 hover:bg-zinc-900/40 transition-colors flex items-center justify-between text-xs font-mono">
                <div className="space-y-1">
                  <p className="text-zinc-200 font-sans">{c.content}</p>
                  <span className="text-[10px] text-zinc-500">Stream: {c.streamId}</span>
                </div>
                <span className="text-zinc-500 text-[11px] shrink-0 ml-4">
                  {new Date(c.sentAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
