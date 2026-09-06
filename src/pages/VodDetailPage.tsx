import React, { useEffect, useState } from 'react';
import { StreamVod, VodChatterRanking, ChatMessage } from '../types';
import { fetchVodDetail } from '../lib/api';
import { BadgeItem } from '../components/BadgeItem';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { UserAvatar } from '../components/UserAvatar';
import { 
  Video, 
  Eye, 
  MessageSquare, 
  Crown, 
  Flame, 
  Calendar, 
  Clock, 
  ExternalLink,
  ArrowLeft,
  Trophy,
  Award,
  Search,
  Users,
  Activity
} from 'lucide-react';

interface VodDetailPageProps {
  streamId: string;
  navigate: (route: string) => void;
}

export const VodDetailPage: React.FC<VodDetailPageProps> = ({ streamId, navigate }) => {
  const [stream, setStream] = useState<StreamVod | null>(null);
  const [rankings, setRankings] = useState<VodChatterRanking[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [totalMessages, setTotalMessages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [chatSearch, setChatSearch] = useState<string>('');

  useEffect(() => {
    const loadVod = async () => {
      setLoading(true);
      try {
        const data = await fetchVodDetail(streamId);
        setStream(data.stream);
        setRankings(data.rankings || []);
        setChatMessages(data.chatMessages || []);
        setTotalMessages(data.totalMessages || 0);
      } catch (err) {
        console.error('Failed fetching vod detail:', err);
      } finally {
        setLoading(false);
      }
    };
    loadVod();
  }, [streamId]);

  if (loading || !stream) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <LoadingSkeleton type="profile" />
      </div>
    );
  }

  const filteredRankings = rankings.filter(r => 
    r.username.toLowerCase().includes(search.toLowerCase()) || 
    r.kickUserId.includes(search)
  );

  const filteredMessages = chatMessages.filter(m =>
    m.content.toLowerCase().includes(chatSearch.toLowerCase()) ||
    m.username.toLowerCase().includes(chatSearch.toLowerCase())
  );

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Back CTA */}
      <button
        onClick={() => navigate('vods')}
        className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-400 hover:text-amber-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to VODs Archive</span>
      </button>

      {/* Stream Banner & Meta */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                {stream.category}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(stream.startedAt).toLocaleDateString()}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {Math.floor((stream.durationSeconds || 0) / 3600)}h {Math.floor(((stream.durationSeconds || 0) % 3600) / 60)}m
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-zinc-100 uppercase tracking-tight">
              {stream.title}
            </h1>

            <p className="text-xs text-zinc-400 font-mono">
              Session ID: <strong className="text-zinc-300">{stream.streamId}</strong>
            </p>
          </div>

          <a
            href={stream.vodUrl || `https://kick.com/slyyutus`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-heading font-extrabold text-xs uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 hover:from-amber-300 hover:to-amber-400 transition-all shadow-lg shrink-0"
          >
            <span>WATCH VOD ON KICK</span>
            <ExternalLink className="w-4 h-4 text-zinc-950" />
          </a>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/80">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold block">Total Views</span>
            <span className="text-xl font-extrabold font-heading text-zinc-100">{(stream.views || 0).toLocaleString()}</span>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold block">Peak Viewers</span>
            <span className="text-xl font-extrabold font-heading text-amber-400">{(stream.peakViewers || 0).toLocaleString()}</span>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold block">Chat Messages</span>
            <span className="text-xl font-extrabold font-heading text-zinc-100">{Math.max(stream.totalChatMessages || 0, totalMessages).toLocaleString()}</span>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase font-mono text-zinc-500 font-semibold block">Subs Gained</span>
            <span className="text-xl font-extrabold font-heading text-emerald-400">+{stream.subsGained || 0}</span>
          </div>
        </div>
      </div>

      {/* Stream Chatter Leaderboard */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black font-heading uppercase text-zinc-100 tracking-wider">
              Top Stream Chatters
            </h2>
            <span className="text-xs font-mono text-zinc-500">({rankings.length} tracked)</span>
          </div>

          {rankings.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chatters in this stream..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          )}
        </div>

        {/* Rankings Table */}
        {rankings.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-zinc-800 bg-zinc-950/80">
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-mono">No chatter rankings recorded for this stream session yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                    <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                    <th className="py-3.5 px-4">Chatter</th>
                    <th className="py-3.5 px-4 text-right">Messages Sent</th>
                    <th className="py-3.5 px-4 text-center">VOD Badge Awarded</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs font-mono">
                  {filteredRankings.map((r) => {
                    const isMvp = r.rank === 1;

                    return (
                      <tr
                        key={r.kickUserId}
                        className={`hover:bg-zinc-900/50 transition-colors ${
                          isMvp ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        <td className="py-4 px-4 text-center font-bold">
                          {isMvp ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-zinc-950 font-black font-heading text-sm shadow-[0_0_12px_rgba(245,197,24,0.4)]">
                              1
                            </span>
                          ) : (
                            <span className="text-zinc-400">#{r.rank}</span>
                          )}
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
                          {(r.messageCount || 0).toLocaleString()} msgs
                        </td>

                        <td className="py-4 px-4 text-center">
                          {isMvp ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold uppercase tracking-wider">
                              <Award className="w-3 h-3" />
                              STREAM MVP BADGE
                            </span>
                          ) : r.rank <= 3 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-mono">
                              Top 3 Contributor
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-[10px]">—</span>
                          )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Real Stream VOD Chat Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black font-heading uppercase text-zinc-100 tracking-wider">
              VOD Chat History
            </h2>
            <span className="text-xs font-mono text-zinc-500">({chatMessages.length} messages)</span>
          </div>

          {chatMessages.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Filter messages or user..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60"
              />
            </div>
          )}
        </div>

        {chatMessages.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-3">
            <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-200">No chat data available for this VOD</h3>
            <p className="text-xs text-zinc-500 font-mono max-w-md mx-auto">
              Real Kick chat tracking is connected to active broadcasts. Historical messages for this broadcast were not recorded or this stream has no chat events.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 overflow-hidden divide-y divide-zinc-800/60 max-h-[600px] overflow-y-auto">
            {filteredMessages.map((msg) => {
              const displayTime = msg.timestamp || msg.sentAt || '';
              const timeString = displayTime ? new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

              return (
                <div key={msg.messageId} className="p-4 hover:bg-zinc-900/40 transition-colors flex items-start gap-3.5">
                  <UserAvatar
                    src={msg.avatarUrl}
                    username={msg.username}
                    userId={msg.kickUserId}
                    className="w-8 h-8 rounded-lg object-cover border border-zinc-700 shrink-0 mt-0.5"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        onClick={() => navigate(`user/${msg.username}`)}
                        className="font-heading font-bold text-xs text-amber-300 hover:underline cursor-pointer"
                      >
                        {msg.username}
                      </span>
                      {timeString && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {timeString}
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-mono font-bold">
                        +{msg.pointsAwarded || 1} pt
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 font-mono break-words leading-relaxed">
                      {msg.content}
                    </p>
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
