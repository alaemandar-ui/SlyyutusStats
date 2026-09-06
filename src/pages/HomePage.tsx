import React, { useEffect, useState } from 'react';
import { ChannelStats, LeagueRankingEntry, StreamVod } from '../types';
import { fetchChannelStats, fetchCurrentLeague, fetchVods } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { BadgeItem } from '../components/BadgeItem';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { UserAvatar } from '../components/UserAvatar';
import { 
  Users, 
  Crown, 
  Eye, 
  Tv, 
  Radio, 
  Trophy, 
  Flame, 
  ArrowRight, 
  Calendar, 
  MessageSquare, 
  ExternalLink,
  Sparkles,
  Award,
  Play
} from 'lucide-react';

export const HomePage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const [channel, setChannel] = useState<ChannelStats | null>(null);
  const [topThree, setTopThree] = useState<LeagueRankingEntry[]>([]);
  const [activeSeasonName, setActiveSeasonName] = useState<string>('September 2026');
  const [recentVods, setRecentVods] = useState<StreamVod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [chanData, leagueData, vodsData] = await Promise.all([
          fetchChannelStats(),
          fetchCurrentLeague(undefined, 3, 0),
          fetchVods(3, 0)
        ]);
        setChannel(chanData);
        setTopThree(leagueData.topThree || []);
        if (leagueData.season) setActiveSeasonName(leagueData.season.name);
        setRecentVods(vodsData.streams || []);
      } catch (err) {
        console.error('Failed loading home data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !channel) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <LoadingSkeleton type="profile" />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-12 py-6 pb-20">
      
      {/* Hero Banner with Channel Header */}
      <section className="relative overflow-hidden rounded-lg border border-[#D4AF37]/20 bg-gradient-to-b from-[#111] to-[#050505] p-6 sm:p-8">
        
        {/* Big Background Watermark */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[120px] sm:text-[180px] font-black text-[#D4AF37] leading-none opacity-5 pointer-events-none select-none tracking-tighter">
          STATS
        </div>
        
        {/* Ambient Gold Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          
          {/* Avatar & Channel info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative group shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#D4AF37] overflow-hidden shadow-[0_0_30px_rgba(212,175,55,0.25)] bg-[#1A1A1A]">
                <UserAvatar
                  src={channel.avatarUrl}
                  username={channel.username}
                  className="w-full h-full object-cover"
                />
              </div>
              {channel.isLive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-sm bg-red-600 text-white text-[9px] font-black tracking-widest uppercase font-mono shadow-lg flex items-center gap-1 border border-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  LIVE
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none text-white">
                  {channel.username}
                </h1>
                <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-widest uppercase bg-[#D4AF37] text-black">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                OFFICIAL KICK STREAMER • COMMUNITY STATS & LEAGUE
              </p>
              <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
                {channel.bio}
              </p>
              
              {channel.isLive && (
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2 text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>{channel.currentStreamTitle}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
            <a
              href={`https://kick.com/${channel.slug}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-sm font-black text-xs uppercase tracking-widest bg-[#D4AF37] text-black hover:bg-[#FFD700] shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all"
            >
              <Radio className="w-4 h-4 text-black animate-pulse" />
              <span>WATCH ON KICK</span>
              <ExternalLink className="w-3.5 h-3.5 text-black" />
            </a>

            <button
              onClick={() => navigate('league')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-sm font-black text-xs uppercase tracking-widest bg-[#1A1A1A] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all"
            >
              <Trophy className="w-4 h-4" />
              <span>LEAGUE STANDINGS</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Stats Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#D4AF37]/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter text-white">
              CHANNEL <span className="text-[#D4AF37]">STATISTICS</span>
            </h2>
          </div>
          <button
            onClick={() => navigate('stats')}
            className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#FFD700] flex items-center gap-1 transition-colors"
          >
            <span>Full Analytics</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Followers"
            value={channel.followersCount}
            subValue="Verified Community"
            icon={Users}
            highlight={true}
          />
          <StatCard
            label="Subscribers"
            value={channel.subscribersCount}
            subValue="Subscribers Tier"
            icon={Crown}
            highlight={true}
          />
          <StatCard
            label="Current / Avg Viewers"
            value={channel.isLive ? `${channel.currentViewers || 0} Live` : `${channel.averageViewers || 0} Avg`}
            subValue={`Peak: ${(channel.peakViewers || 0).toLocaleString()} viewers`}
            icon={Eye}
          />
          <StatCard
            label="Total Streams"
            value={channel.totalStreams || 0}
            subValue="Recorded Sessions"
            icon={Tv}
          />
        </div>
      </section>

      {/* Monthly Chatters League Podium */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white">
                CHATTERS LEAGUE <span className="text-[#D4AF37]">— {activeSeasonName}</span>
              </h2>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              Monthly competition: Top 3 chatters receive permanent profile badges.
            </p>
          </div>
          <button
            onClick={() => navigate('league')}
            className="flex items-center gap-2 px-4 py-2 rounded-sm font-black text-[10px] uppercase tracking-widest bg-[#1A1A1A] text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black transition-all self-start sm:self-auto"
          >
            <span>Full Leaderboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Podium 3-Column Display with Bold Typography Lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
          
          {topThree.length === 0 && (
            <div className="md:col-span-3 p-10 text-center border border-[#D4AF37]/20 rounded-lg bg-[#111] space-y-2">
              <Trophy className="w-8 h-8 text-[#D4AF37]/60 mx-auto" />
              <p className="text-sm font-black uppercase tracking-widest text-[#D4AF37]">No real data yet</p>
              <p className="text-xs font-mono text-gray-400">Real Kick chat messages and subscriptions will appear here as community events are recorded.</p>
            </div>
          )}

          {/* 2nd Place */}
          {topThree[1] && (
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
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-around text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>{(topThree[1].messagesCount || 0).toLocaleString()} msgs</span>
                  <span>•</span>
                  <span>{(topThree[1].subsCount || 0) + (topThree[1].giftsCount || 0)} subs</span>
                </div>
              </div>
            </div>
          )}

          {/* 1st Place Champion (Highlighted Center) */}
          {topThree[0] && (
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
                <div className="pt-2 border-t border-[#D4AF37]/20 flex items-center justify-around text-[10px] font-bold uppercase tracking-wider text-gray-300">
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
          )}

          {/* 3rd Place */}
          {topThree[2] && (
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
                <div className="pt-2 border-t border-zinc-800 flex items-center justify-around text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>{(topThree[2].messagesCount || 0).toLocaleString()} msgs</span>
                  <span>•</span>
                  <span>{(topThree[2].subsCount || 0) + (topThree[2].giftsCount || 0)} subs</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stream Archive & Highlights */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#D4AF37]/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#D4AF37] rotate-45" />
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter text-white">
              VOD ARCHIVE <span className="text-[#D4AF37]">& RECENT STREAMS</span>
            </h2>
          </div>
          <button
            onClick={() => navigate('vods')}
            className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#FFD700] flex items-center gap-1 transition-colors"
          >
            <span>All Streams</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentVods.length === 0 ? (
          <div className="p-8 text-center border border-[#D4AF37]/20 rounded-lg bg-[#111]">
            <Play className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-xs font-mono text-gray-400">Streams and broadcasts will appear here automatically when recorded.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentVods.map((vod) => {
              const dur = vod.durationSeconds || 0;
              const hours = Math.floor(dur / 3600);
              const mins = Math.floor((dur % 3600) / 60);

              return (
                <div
                  key={vod.streamId}
                  onClick={() => navigate(`vod/${vod.streamId}`)}
                  className="group rounded-lg border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 bg-[#111] overflow-hidden shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                    <img
                      src={vod.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'}
                      alt={vod.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-sm bg-black/80 text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] border border-[#D4AF37]/30">
                      {vod.category}
                    </div>
                    {vod.isLive && (
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-sm bg-red-600 text-white text-[9px] font-mono font-black animate-pulse">
                        LIVE
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-white group-hover:text-[#D4AF37] line-clamp-2 transition-colors uppercase tracking-tight">
                        {vod.title}
                      </h3>
                      <p className="text-[10px] text-gray-500 font-mono mt-1 font-bold uppercase">
                        {new Date(vod.startedAt).toLocaleDateString()} • {hours}H {mins}M
                      </p>
                    </div>

                    <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] font-mono text-gray-400">
                      <span className="flex items-center gap-1 font-bold">
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        {(vod.views || 0).toLocaleString()} VIEWS
                      </span>
                      <span className="flex items-center gap-1 text-[#D4AF37] font-bold">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {(vod.totalChatMessages || 0).toLocaleString()} MSGS
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};
