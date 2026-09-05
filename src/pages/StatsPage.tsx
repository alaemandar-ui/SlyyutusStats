import React, { useEffect, useState } from 'react';
import { ChannelStats } from '../types';
import { fetchChannelStats, fetchChannelHistory } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Crown, 
  Eye, 
  Tv, 
  Calendar, 
  Flame, 
  Clock, 
  Zap,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export const StatsPage: React.FC = () => {
  const [channel, setChannel] = useState<ChannelStats | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [chanData, histData] = await Promise.all([
          fetchChannelStats(),
          fetchChannelHistory()
        ]);
        setChannel(chanData);
        setHistory(histData);
      } catch (err) {
        console.error('Failed fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading || !channel) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <LoadingSkeleton type="profile" />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-12 py-6 pb-20">
      
      {/* Page Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-2">
          <BarChart3 className="w-4 h-4" />
          <span>Slyyutus Official Metrics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-heading gold-gradient-text tracking-tight uppercase">
          Channel Analytics & Growth
        </h1>
        <p className="text-sm text-zinc-400 font-mono mt-1">
          Historical viewership, stream duration metrics, chat engagement volume, and community subscriber milestones.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Followers"
          value={channel.followersCount}
          subValue="Verified Kick Followers"
          icon={Users}
          highlight={true}
        />
        <StatCard
          label="Subscribers"
          value={channel.subscribersCount}
          subValue="Active Subscribers"
          icon={Crown}
          highlight={true}
        />
        <StatCard
          label="Peak Viewership"
          value={channel.peakViewers}
          subValue="Recorded Stream Peak"
          icon={Flame}
        />
        <StatCard
          label="Average Viewers"
          value={channel.averageViewers}
          subValue="Broadcast Average"
          icon={Eye}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Viewership Trends Area Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-base uppercase text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Viewership & Peak Trends</span>
              </h3>
              <p className="text-xs text-zinc-500 font-mono">Recent stream viewer counts</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Live Verified
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            {history && history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#272730" />
                  <XAxis dataKey="date" stroke="#71717A" fontSize={11} />
                  <YAxis stroke="#71717A" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="peak" name="Peak Viewers" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#peakGradient)" />
                  <Area type="monotone" dataKey="viewers" name="Average Viewers" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#avgGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-xs text-gray-500">
                Not enough real data yet
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Peak Viewers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Avg Viewers</span>
            </div>
          </div>
        </div>

        {/* Chat Engagement Volume Bar Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-extrabold text-base uppercase text-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Chat Activity Volume</span>
              </h3>
              <p className="text-xs text-zinc-500 font-mono">Total messages sent per stream</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
              League Engine
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            {history && history.some(h => h.chatVolume > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#272730" />
                  <XAxis dataKey="date" stroke="#71717A" fontSize={11} />
                  <YAxis stroke="#71717A" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="chatVolume" name="Chat Messages" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-xs text-gray-500">
                No real chat data yet
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Tracked Messages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Channel Metadata & Stream Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-heading font-bold uppercase">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Channel Status</span>
          </div>
          <h4 className="text-lg font-bold font-heading text-zinc-100">
            {channel.isLive ? 'Currently LIVE on Kick' : 'Currently Offline'}
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed font-mono">
            {channel.streamTitle ? `"${channel.streamTitle}"` : 'No active stream title broadcasted.'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-heading font-bold uppercase">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Current Category</span>
          </div>
          <div className="pt-1">
            <span className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-100 font-bold uppercase">
              {channel.category || 'N/A'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-2">
            Real-time game / category reported by Kick API.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-heading font-bold uppercase">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Verified Channel ID</span>
          </div>
          <h4 className="text-lg font-bold font-mono text-zinc-100">
            {channel.kickChannelId ? `ID: ${channel.kickChannelId}` : 'Slug: slyyutus'}
          </h4>
          <p className="text-[11px] text-zinc-500 font-mono">
            Directly connected to Kick Developer API for @slyyutus.
          </p>
        </div>
      </div>

    </div>
  );
};
