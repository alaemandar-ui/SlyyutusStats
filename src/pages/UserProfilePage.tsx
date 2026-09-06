import React, { useEffect, useState } from 'react';
import { UserProfileData, ChatMessage } from '../types';
import { fetchUserProfile, fetchUserChatHistory } from '../lib/api';
import { BadgeItem } from '../components/BadgeItem';
import { StatCard } from '../components/StatCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { UserAvatar } from '../components/UserAvatar';
import { 
  User, 
  Trophy, 
  MessageSquare, 
  Crown, 
  Gift, 
  Calendar, 
  ArrowLeft, 
  Award, 
  Flame, 
  ShieldCheck, 
  Clock, 
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface UserProfilePageProps {
  username: string;
  navigate: (route: string) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ username, navigate }) => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatTotal, setChatTotal] = useState<number>(0);
  const [chatPage, setChatPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'history' | 'chats'>('overview');

  const CHAT_PAGE_SIZE = 20;

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await fetchUserProfile(username);
        setProfile(data);
      } catch (err) {
        console.error('Failed fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username]);

  // Load chat history
  useEffect(() => {
    if (!profile) return;
    const loadChats = async () => {
      setChatLoading(true);
      try {
        const offset = (chatPage - 1) * CHAT_PAGE_SIZE;
        const data = await fetchUserChatHistory(profile.user.kickUserId, CHAT_PAGE_SIZE, offset);
        setChatMessages(data.messages);
        setChatTotal(data.total);
      } catch (err) {
        console.error('Failed fetching chats:', err);
      } finally {
        setChatLoading(false);
      }
    };
    loadChats();
  }, [profile, chatPage]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <LoadingSkeleton type="profile" />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <User className="w-16 h-16 text-zinc-600 mx-auto" />
        <h2 className="text-2xl font-black font-heading text-zinc-200">User Not Found</h2>
        <p className="text-sm text-zinc-500 font-mono">The Kick user "{username}" could not be located in our tracking database.</p>
        <button
          onClick={() => navigate('users')}
          className="px-5 py-2.5 rounded-xl bg-amber-400 text-zinc-950 font-heading font-bold uppercase text-xs hover:bg-amber-300"
        >
          Return to Member Directory
        </button>
      </div>
    );
  }

  const user = profile.user;
  const currentSeasonRank = profile.currentSeasonRank;
  const currentSeasonPoints = profile.currentSeasonPoints ?? 0;
  const badges = profile.badges || [];
  const seasonHistory = profile.seasonHistory || [];
  const vodParticipation = profile.vodParticipation || [];
  const chatTotalPages = Math.ceil(chatTotal / CHAT_PAGE_SIZE) || 1;

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Back Button */}
      <button
        onClick={() => navigate('users')}
        className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-400 hover:text-amber-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Community Search</span>
      </button>

      {/* User Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-[#08080a] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-[2px] bg-gradient-to-tr from-amber-400 to-amber-600 shadow-2xl">
              <UserAvatar
                src={user.avatarUrl}
                username={user.username}
                userId={user.kickUserId}
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            {currentSeasonRank && currentSeasonRank <= 3 && (
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-xs font-black font-mono shadow-lg">
                #{currentSeasonRank} LEAGUE
              </span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-heading text-zinc-100 tracking-tight">
                {user.username}
              </h1>
              <a
                href={`https://kick.com/${user.username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 transition-colors border border-zinc-700"
              >
                <span>Kick Profile</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>

            <p className="text-xs font-mono text-zinc-400">
              Permanent Kick ID: <strong className="text-amber-400">{user.kickUserId}</strong> • First Seen: {new Date(user.createdAt).toLocaleDateString()}
            </p>

            {/* Quick Badges Preview */}
            {badges.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {badges.map((b, idx) => (
                  <BadgeItem key={b.awardId || (b as any).id || `badge-quick-${b.badgeId}-${idx}`} badgeAward={b} size="sm" showDetails={true} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Key Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-zinc-800">
          <StatCard
            label="Current Season"
            value={currentSeasonRank ? `#${currentSeasonRank}` : 'Unranked'}
            subValue={`${(currentSeasonPoints || 0).toLocaleString()} Points`}
            icon={Trophy}
            highlight={Boolean(currentSeasonRank && currentSeasonRank <= 3)}
          />
          <StatCard
            label="Total Chat Messages"
            value={user.totalChatMessages ?? (user as any).totalMessages ?? 0}
            subValue="Across all streams"
            icon={MessageSquare}
          />
          <StatCard
            label="Subscriptions"
            value={user.totalSubscriptions ?? (user as any).totalSubs ?? 0}
            subValue="Kingdom tier"
            icon={Crown}
          />
          <StatCard
            label="Gifted Subs"
            value={user.totalGifts ?? 0}
            subValue="Community gifts"
            icon={Gift}
          />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-heading tracking-wider transition-all ${
            activeTab === 'overview'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Overview & Stats
        </button>
        <button
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-heading tracking-wider transition-all flex items-center gap-1.5 ${
            activeTab === 'badges'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Badges ({badges.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-heading tracking-wider transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Seasons & VODs</span>
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase font-heading tracking-wider transition-all flex items-center gap-1.5 ${
            activeTab === 'chats'
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/40'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat Log ({chatTotal})</span>
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Season History highlights */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-lg uppercase text-zinc-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Historical League Placements</span>
            </h3>

            {seasonHistory.length === 0 ? (
              <p className="text-xs font-mono text-zinc-500">No historical seasons finalized yet for this user.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {seasonHistory.map((s, idx) => (
                  <div
                    key={s.seasonId || `season-ov-${idx}`}
                    onClick={() => navigate(`season/${s.seasonId}`)}
                    className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-300">Season {s.seasonId}</span>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-xs font-black font-heading text-zinc-200">
                        Rank #{s.rank}
                      </span>
                    </div>
                    <div className="text-sm font-bold font-heading text-zinc-200">{s.seasonName}</div>
                    <div className="text-xs font-mono text-zinc-400 flex justify-between pt-2 border-t border-zinc-800">
                      <span>{(s.points || 0).toLocaleString()} PTS</span>
                      <span>{(s.messagesCount || 0).toLocaleString()} msgs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* VOD participation */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-lg uppercase text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Recent VOD Activity</span>
            </h3>

            {vodParticipation.length === 0 ? (
              <p className="text-xs font-mono text-zinc-500">No recorded stream sessions found.</p>
            ) : (
              <div className="divide-y divide-zinc-800/80">
                {vodParticipation.map((vod, idx) => (
                  <div
                    key={vod.streamId ? `${vod.streamId}-${idx}` : `vod-part-${idx}`}
                    onClick={() => navigate(`vod/${vod.streamId}`)}
                    className="py-3 flex items-center justify-between cursor-pointer hover:text-amber-300 transition-colors"
                  >
                    <div>
                      <h4 className="text-sm font-bold font-heading text-zinc-200">{vod.streamTitle}</h4>
                      <span className="text-[11px] font-mono text-zinc-500">{new Date(vod.startedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="text-amber-400 font-bold">{(vod.messagesCount || 0).toLocaleString()} messages</div>
                      <div className="text-zinc-500">Stream Rank #{vod.rank}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab: Badges */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-lg uppercase text-zinc-100">
              Permanent Minted Badges
            </h3>
            <span className="text-xs font-mono text-zinc-400">Total Awarded: {badges.length}</span>
          </div>

          {badges.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
              <Award className="w-12 h-12 text-zinc-600 mx-auto" />
              <h4 className="font-heading font-bold text-zinc-300">No Badges Minted Yet</h4>
              <p className="text-xs text-zinc-500 font-mono">
                Place in the top 3 of a monthly season or be the MVP chatter in a stream broadcast to earn permanent badges.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((b, idx) => (
                <BadgeItem key={b.awardId || (b as any).id || `badge-tab-${b.badgeId}-${idx}`} badgeAward={b} size="md" showDetails={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <div className="space-y-8">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-lg uppercase text-zinc-100">
              Complete Season Placements
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 uppercase">
                    <th className="py-2.5 px-3">Season</th>
                    <th className="py-2.5 px-3 text-center">Rank</th>
                    <th className="py-2.5 px-3 text-right">Points</th>
                    <th className="py-2.5 px-3 text-right">Messages</th>
                    <th className="py-2.5 px-3 text-right">Subs/Gifts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {seasonHistory.map((s, idx) => (
                    <tr key={s.seasonId || `season-hist-row-${idx}`} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-3 font-bold text-amber-300">{s.seasonName} ({s.seasonId})</td>
                      <td className="py-3 px-3 text-center font-bold text-zinc-100">#{s.rank}</td>
                      <td className="py-3 px-3 text-right text-amber-400 font-bold">{(s.points || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-zinc-300">{(s.messagesCount || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-zinc-300">{(s.subsCount || 0) + (s.giftsCount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Chat History */}
      {activeTab === 'chats' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-extrabold text-lg uppercase text-zinc-100">
              Recorded Chat Logs
            </h3>
            <span className="text-xs font-mono text-zinc-400">Total: {chatTotal} messages</span>
          </div>

          {chatLoading ? (
            <LoadingSkeleton rows={5} />
          ) : chatMessages.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 text-xs font-mono text-zinc-500">
              No chat messages recorded for this user.
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 divide-y divide-zinc-800/60 overflow-hidden">
              {chatMessages.map((msg, idx) => (
                <div key={msg.messageId || `chat-msg-${idx}`} className="p-4 hover:bg-zinc-900/40 transition-colors space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-400/90 font-bold">{user.username}</span>
                    <span className="text-zinc-500 text-[11px]">
                      {new Date(msg.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 font-sans leading-relaxed">
                    {msg.content}
                  </p>
                  {msg.streamId && (
                    <span className="text-[10px] font-mono text-zinc-500 block">
                      Stream: {msg.streamId}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Chat Pagination */}
          {chatTotalPages > 1 && (
            <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400">
              <span>Page {chatPage} of {chatTotalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={chatPage <= 1}
                  onClick={() => setChatPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-amber-300 border border-zinc-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={chatPage >= chatTotalPages}
                  onClick={() => setChatPage(p => Math.min(chatTotalPages, p + 1))}
                  className="p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-amber-300 border border-zinc-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
