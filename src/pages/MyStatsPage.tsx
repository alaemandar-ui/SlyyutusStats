import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMyStats, fetchUserChatHistory, fetchUserMiniGameStats } from '../lib/api';
import { MyStatsResponse, ChatMessage } from '../types';
import { PlayerStats } from '../components/minigames/types';
import { BadgeItem } from '../components/BadgeItem';
import { StatCard } from '../components/StatCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { UserAvatar } from '../components/UserAvatar';
import { PlayerStatsCard } from '../components/minigames/PlayerStatsCard';
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
  Activity,
  Gamepad2,
  BarChart3
} from 'lucide-react';

interface MyStatsPageProps {
  navigate: (route: string) => void;
  defaultTab?: 'minigames' | 'league' | 'chat';
}

export const MyStatsPage: React.FC<MyStatsPageProps> = ({ 
  navigate,
  defaultTab = 'minigames'
}) => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'minigames' | 'league' | 'chat'>(defaultTab);

  const [myStats, setMyStats] = useState<MyStatsResponse | null>(null);
  const [miniGameStats, setMiniGameStats] = useState<PlayerStats | null>(null);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  
  const [loadingLeague, setLoadingLeague] = useState<boolean>(true);
  const [loadingMiniGames, setLoadingMiniGames] = useState<boolean>(true);

  useEffect(() => {
    if (!isAuthenticated && !user) {
      setLoadingLeague(false);
      setLoadingMiniGames(false);
      return;
    }

    const loadData = async () => {
      setLoadingLeague(true);
      setLoadingMiniGames(true);

      const targetId = user?.kickUserId;
      const targetUsername = user?.username;

      // 1. Fetch Mini Games stats
      try {
        const gameStats = await fetchUserMiniGameStats(targetId, targetUsername);
        setMiniGameStats(gameStats);
      } catch (err) {
        console.error('Failed fetching mini game stats:', err);
      } finally {
        setLoadingMiniGames(false);
      }

      // 2. Fetch League & Chat stats
      try {
        const leagueData = await fetchMyStats();
        setMyStats(leagueData);
        if (leagueData.user) {
          const chatRes = await fetchUserChatHistory(leagueData.user.kickUserId, 15, 0);
          setChats(chatRes.messages);
        }
      } catch (err) {
        console.error('Failed fetching my league stats:', err);
      } finally {
        setLoadingLeague(false);
      }
    };

    loadData();
  }, [isAuthenticated, user?.kickUserId]);

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
            Personal Performance Hub
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono max-w-lg mx-auto leading-relaxed">
            Log in with your Kick account to view verified mini-game combat telemetry, accuracy rating, global leaderboards, personal bests, and monthly league standing.
          </p>
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <button
            onClick={() => navigate('login')}
            className="px-8 py-3.5 rounded-xl font-heading font-extrabold text-sm uppercase tracking-wider bg-[#D4AF37] text-black hover:bg-[#FFD700] shadow-[0_0_25px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4 text-black" />
            <span>LOGIN WITH KICK</span>
          </button>
          <button
            onClick={() => navigate('minigames')}
            className="px-6 py-3.5 rounded-xl font-heading font-extrabold text-sm uppercase tracking-wider bg-zinc-900 text-zinc-200 hover:text-white border border-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            <Gamepad2 className="w-4 h-4 text-[#D4AF37]" />
            <span>PLAY AS GUEST</span>
          </button>
        </div>
      </div>
    );
  }

  const profileUser = myStats?.user || {
    username: user?.username || 'Operator',
    kickUserId: user?.kickUserId || '0',
    avatarUrl: user?.avatarUrl,
    role: user?.role || 'user',
    totalChatMessages: 0
  };

  const rank = myStats?.rank;
  const points = myStats?.points ?? 0;
  const pointsToNextRank = myStats?.pointsToNextRank;
  const nextRank = myStats?.nextRank;
  const badges = myStats?.badges || [];
  const seasonName = myStats?.seasonName || 'Current Season';

  return (
    <div className="space-y-8 py-6 pb-24 text-white">
      {/* Top Profile Card Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border-b border-[#D4AF37]/20 pb-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <UserAvatar
            src={profileUser.avatarUrl}
            username={profileUser.username}
            className="w-16 h-16 rounded-xl object-cover border-2 border-[#D4AF37]/60 shadow-[0_0_20px_rgba(212,175,55,0.25)]"
          />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-white uppercase tracking-tight">
                {profileUser.username}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#FFD700] border border-[#D4AF37]/40 text-[10px] font-mono uppercase font-bold">
                {profileUser.role}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Kick ID: <strong className="text-[#FFD700]">{profileUser.kickUserId}</strong> • Community Member
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`user/${profileUser.username}`)}
            className="px-4 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-[#D4AF37]/40 transition-all flex items-center gap-1.5"
          >
            <span>Public Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('minigames')}
            className="px-4 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider bg-[#D4AF37] text-black hover:bg-[#FFD700] transition-all shadow-[0_0_15px_rgba(212,175,55,0.25)] flex items-center gap-1.5"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Open Arena</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center bg-[#111] p-1.5 rounded-xl border border-[#D4AF37]/30 max-w-xl">
        <button
          onClick={() => setActiveTab('minigames')}
          className={`flex-1 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'minigames'
              ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Mini Games Performance</span>
        </button>

        <button
          onClick={() => setActiveTab('league')}
          className={`flex-1 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'league'
              ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>League & Badges</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 rounded-lg text-xs font-heading font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat Stream</span>
        </button>
      </div>

      {/* TAB 1: MINI GAMES PERFORMANCE */}
      {activeTab === 'minigames' && (
        <div className="space-y-6">
          <PlayerStatsCard
            stats={miniGameStats}
            username={profileUser.username}
            avatarUrl={profileUser.avatarUrl}
            loading={loadingMiniGames}
            onGoToGames={() => navigate('minigames')}
            onPlayGame={() => navigate('minigames')}
          />
        </div>
      )}

      {/* TAB 2: LEAGUE & BADGES */}
      {activeTab === 'league' && (
        <div className="space-y-8">
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
              subValue={seasonName}
              icon={Zap}
              highlight={true}
            />
            <StatCard
              label="Total Chat Messages"
              value={profileUser.totalChatMessages || 0}
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
            <div className="rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#1b190f] via-[#111] to-[#0A0A0A] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#FFD700]" />
                  <h3 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                    Rank Progression
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#FFD700] font-bold">
                  {pointsToNextRank} points needed for Rank #{nextRank}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] h-full rounded-full w-3/4" />
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Tip: Earn points faster by playing Mini Games, subscribing, gifting subs, or chatting during live streams.
              </p>
            </div>
          )}

          {/* Badges Collection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-xl font-black font-heading uppercase text-white tracking-wider">
                  Permanent Badges
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                {badges.length} Unlocked
              </span>
            </div>

            {badges.length === 0 ? (
              <div className="p-10 text-center rounded-xl border border-zinc-800 bg-[#111] text-xs font-mono text-zinc-500">
                No permanent badges unlocked yet. Keep chatting, playing mini games, and supporting Slyyutus to earn season badges!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((b, idx) => (
                  <BadgeItem key={b.awardId || (b as any).id || `my-badge-${b.badgeId}-${idx}`} badgeAward={b} size="md" showDetails={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CHAT LOGS */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-xl font-black font-heading uppercase text-white tracking-wider">
                Recent Chat Messages
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {chats.length} Recorded Transmissions
            </span>
          </div>

          {chats.length === 0 ? (
            <div className="p-10 text-center rounded-xl border border-zinc-800 bg-[#111] text-xs font-mono text-zinc-500">
              No recent chat messages logged.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-[#111] divide-y divide-zinc-800/60 overflow-hidden font-mono text-xs">
              {chats.map((c, idx) => (
                <div key={c.messageId || `my-chat-${idx}`} className="p-4 hover:bg-zinc-900/40 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-zinc-200 font-sans">{c.content}</p>
                    <span className="text-[10px] text-zinc-500">Stream ID: {c.streamId}</span>
                  </div>
                  <span className="text-zinc-500 text-[11px] shrink-0 ml-4">
                    {new Date(c.sentAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
