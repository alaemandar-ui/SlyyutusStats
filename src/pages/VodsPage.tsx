import React, { useEffect, useState } from 'react';
import { StreamVod } from '../types';
import { fetchVods } from '../lib/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { 
  Video, 
  Eye, 
  MessageSquare, 
  Crown, 
  Flame, 
  Calendar, 
  Clock, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Play
} from 'lucide-react';

export const VodsPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const [streams, setStreams] = useState<StreamVod[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  const PAGE_SIZE = 9;

  useEffect(() => {
    const loadStreams = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * PAGE_SIZE;
        const data = await fetchVods(PAGE_SIZE, offset);
        setStreams(data.streams || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error('Failed fetching vods:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStreams();
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Header */}
      <div className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-2">
          <Video className="w-4 h-4" />
          <span>Broadcast & VOD Archive</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-heading gold-gradient-text tracking-tight uppercase">
          Streams & VODs
        </h1>
        <p className="text-sm text-zinc-400 font-mono mt-1 max-w-2xl">
          Tracked Kick broadcasts with complete viewership analytics, chat volume, and individual stream chatter leaderboards.
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : streams.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-zinc-800 bg-zinc-900/50">
          <Play className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-300">No Streams Recorded Yet</h3>
          <p className="text-xs text-zinc-500 font-mono mt-1">Real broadcasts will be archived here automatically as Slyyutus streams on Kick.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <div
              key={stream.streamId}
              onClick={() => navigate(`vod/${stream.streamId}`)}
              className="group rounded-2xl border border-zinc-800/80 hover:border-amber-500/50 bg-zinc-900/70 hover:bg-zinc-900/95 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
                <img
                  src={stream.thumbnailUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'}
                  alt={stream.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-mono font-bold text-amber-300 border border-amber-500/30">
                  {stream.category}
                </div>

                {/* Live or Duration */}
                {stream.isLive ? (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-mono font-black animate-pulse flex items-center gap-1 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE BROADCAST
                  </div>
                ) : (
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-zinc-300 text-[10px] font-mono">
                    {Math.floor((stream.durationSeconds || 0) / 3600)}h {Math.floor(((stream.durationSeconds || 0) % 3600) / 60)}m
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-heading font-extrabold text-base text-zinc-100 group-hover:text-amber-300 line-clamp-2 transition-colors">
                    {stream.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(stream.startedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {(stream.views || 0).toLocaleString()} views
                    </span>
                  </div>
                </div>

                {/* Top Chatters Pill Preview */}
                {stream.topChatters && stream.topChatters.length > 0 && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
                      Top Stream Chatters
                    </span>
                    <div className="flex items-center gap-1.5">
                      {stream.topChatters.map((tc, idx) => (
                        <div
                          key={tc.kickUserId}
                          title={`${tc.username}: ${(tc.messageCount || 0).toLocaleString()} messages`}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[11px] font-mono text-zinc-300"
                        >
                          <span className="text-[10px] text-amber-400">#{idx + 1}</span>
                          <span className="truncate max-w-[70px]">{tc.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Stats Line */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">
                    Peak: <strong className="text-zinc-200">{(stream.peakViewers || 0).toLocaleString()}</strong>
                  </span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {(stream.totalChatMessages || 0).toLocaleString()} messages
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between font-mono text-xs text-zinc-400">
          <span>Page {page} of {totalPages}</span>
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
  );
};
