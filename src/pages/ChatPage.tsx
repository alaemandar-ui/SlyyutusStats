import React, { useEffect, useState } from 'react';
import { fetchChatAnalytics } from '../lib/api';
import { ChatMessage } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { UserAvatar } from '../components/UserAvatar';
import { 
  MessageSquare, 
  Users, 
  Flame, 
  Clock, 
  Radio, 
  ShieldCheck, 
  RefreshCw,
  ExternalLink,
  Crown
} from 'lucide-react';

export const ChatPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{
    totalMessages: number;
    activeChatters: number;
    averageMessagesPerUser: number;
    topChatters: { kickUserId: string; username: string; avatarUrl: string; messageCount: number }[];
    recentMessages: ChatMessage[];
  } | null>(null);

  const loadChatData = async () => {
    try {
      const res = await fetchChatAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load chat analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatData();
    const interval = setInterval(loadChatData, 15000); // 15s poll
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-8 py-6">
        <LoadingSkeleton type="profile" />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#D4AF37]/20 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest mb-1.5">
            <Radio className="w-3.5 h-3.5 text-[#53FC18] animate-pulse" />
            <span>REAL KICK CHAT ENGINE</span>
            <span className="px-2 py-0.5 rounded-sm bg-[#53FC18]/10 text-[#53FC18] border border-[#53FC18]/30 text-[9px] font-bold">
              VERIFIED EVENTS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none text-white">
            CHAT <span className="text-[#D4AF37]">ANALYTICS</span>
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1.5 max-w-2xl">
            Live and historical chat activity for @slyyutus on Kick. 1 message = 1 League point.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              loadChatData();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-sm font-black text-[10px] uppercase tracking-widest bg-[#1A1A1A] text-gray-300 hover:text-[#D4AF37] border border-[#D4AF37]/20 hover:border-[#D4AF37] transition-all shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>REFRESH</span>
          </button>
          <a
            href="https://kick.com/slyyutus"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-sm font-black text-[10px] uppercase tracking-widest bg-[#53FC18] text-black hover:bg-[#47dc14] transition-all shadow-md"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>OPEN KICK CHAT</span>
          </a>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border-l-4 border-[#D4AF37] border-y border-r border-white/5 bg-[#111] p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">Total Stored Messages</span>
            <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {(data?.totalMessages || 0).toLocaleString()}
          </div>
          <p className="text-[10px] font-mono text-gray-500">Real Kick chat messages stored</p>
        </div>

        <div className="rounded-lg border-l-4 border-emerald-500 border-y border-r border-white/5 bg-[#111] p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">Active Chatters</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {(data?.activeChatters || 0).toLocaleString()}
          </div>
          <p className="text-[10px] font-mono text-gray-500">Unique participants in chat</p>
        </div>

        <div className="rounded-lg border-l-4 border-amber-500 border-y border-r border-white/5 bg-[#111] p-6 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">Avg Messages / User</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {data?.averageMessagesPerUser || 0}
          </div>
          <p className="text-[10px] font-mono text-gray-500">Community engagement ratio</p>
        </div>
      </div>

      {/* Main Grid: Top Chatters & Recent Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Chatters Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-black uppercase tracking-widest text-[#D4AF37]">
              TOP CHAT CONTRIBUTORS
            </h2>
          </div>

          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0A0A0A] p-4 space-y-3 shadow-xl">
            {(!data?.topChatters || data.topChatters.length === 0) ? (
              <div className="py-8 text-center text-xs font-mono text-gray-400">
                No real chat data yet.
              </div>
            ) : (
              data.topChatters.map((chatter, idx) => (
                <div
                  key={chatter.kickUserId}
                  onClick={() => navigate(`user/${chatter.username}`)}
                  className="flex items-center justify-between p-3 rounded bg-[#141414] hover:bg-[#1A1A1A] border border-white/5 hover:border-[#D4AF37]/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-gray-500 w-5 text-center">
                      #{idx + 1}
                    </span>
                    <UserAvatar
                      src={chatter.avatarUrl}
                      username={chatter.username}
                      userId={chatter.kickUserId}
                      className="w-8 h-8 rounded-full border border-white/10 group-hover:border-[#D4AF37] transition-all object-cover"
                    />
                    <div>
                      <div className="text-xs font-black text-white group-hover:text-[#D4AF37] transition-all uppercase">
                        {chatter.username}
                      </div>
                      <div className="text-[10px] font-mono text-gray-500">
                        ID: {chatter.kickUserId}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#D4AF37]">
                      {chatter.messageCount.toLocaleString()}
                    </span>
                    <div className="text-[9px] font-mono text-gray-500 uppercase">msgs</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Message Stream Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="text-sm font-black uppercase tracking-widest text-[#D4AF37]">
                RECENT KICK MESSAGES
              </h2>
            </div>
            <span className="text-[10px] font-mono text-gray-500 uppercase">
              Showing last {data?.recentMessages?.length || 0} messages
            </span>
          </div>

          <div className="rounded-lg border border-[#D4AF37]/20 bg-[#0A0A0A] p-4 shadow-xl divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {(!data?.recentMessages || data.recentMessages.length === 0) ? (
              <div className="py-16 text-center space-y-3">
                <MessageSquare className="w-10 h-10 text-[#D4AF37]/60 mx-auto" />
                <h3 className="font-black uppercase tracking-wider text-base text-[#D4AF37]">
                  NO REAL CHAT DATA YET
                </h3>
                <p className="text-xs text-gray-400 font-mono max-w-sm mx-auto">
                  No real chat events have been received yet. Live chat messages sent during Slyyutus streams will be automatically recorded here without fabrication.
                </p>
              </div>
            ) : (
              data.recentMessages.map((msg) => (
                <div key={msg.messageId} className="py-3 px-2 hover:bg-white/[0.02] transition-colors flex items-start gap-3">
                  <UserAvatar
                    src={msg.avatarUrl}
                    username={msg.username}
                    userId={msg.kickUserId}
                    onClick={() => navigate(`user/${msg.username}`)}
                    className="w-7 h-7 rounded-full border border-white/10 shrink-0 mt-0.5 cursor-pointer hover:border-[#D4AF37] transition-all object-cover"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => navigate(`user/${msg.username}`)}
                          className="text-xs font-black text-white hover:text-[#D4AF37] transition-all cursor-pointer uppercase"
                        >
                          {msg.username}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-xs bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] font-mono font-bold">
                          +1 PT
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 font-mono break-words leading-relaxed">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
