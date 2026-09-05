import React from 'react';
import { Trophy, ShieldCheck, Activity, ExternalLink, Flame } from 'lucide-react';

export const Footer: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  return (
    <footer className="mt-20 border-t border-zinc-800/80 bg-zinc-950/90 text-zinc-400 font-mono text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-heading font-black text-sm text-zinc-950">
                S
              </div>
              <span className="font-heading font-extrabold text-base tracking-wider text-zinc-100">
                SLYYUTUS<span className="text-amber-400">.STATS</span>
              </span>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed max-w-md font-sans">
              The official competitive analytics platform, Monthly Chatters League, and permanent community archive for Kick streamer <span className="text-amber-300 font-semibold">Slyyutus</span>. Real-time point tracking, tie-breaker rankings, and permanent badges.
            </p>
            <div className="flex items-center gap-4 text-zinc-500 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                <Activity className="w-3.5 h-3.5" />
                <span>Live Tracker Engine Online</span>
              </span>
              <span>•</span>
              <span className="text-xs text-zinc-500">Season 09-26 Active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="font-heading font-bold uppercase text-zinc-200 text-xs tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li>
                <button onClick={() => navigate('league')} className="hover:text-amber-300 transition-colors">
                  Monthly Chatters League
                </button>
              </li>
              <li>
                <button onClick={() => navigate('seasons')} className="hover:text-amber-300 transition-colors">
                  Historical Seasons & Badges
                </button>
              </li>
              <li>
                <button onClick={() => navigate('vods')} className="hover:text-amber-300 transition-colors">
                  Stream VOD Archive
                </button>
              </li>
              <li>
                <button onClick={() => navigate('users')} className="hover:text-amber-300 transition-colors">
                  Community Member Search
                </button>
              </li>
            </ul>
          </div>

          {/* External Links */}
          <div className="space-y-2">
            <h4 className="font-heading font-bold uppercase text-zinc-200 text-xs tracking-wider">
              Official Channels
            </h4>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li>
                <a
                  href="https://kick.com/slyyutus"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  <span>Kick Channel</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://kick.com/slyyutus/chatroom"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
                >
                  <span>Live Stream Chat</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <button onClick={() => navigate('stats')} className="hover:text-amber-300 transition-colors">
                  Channel Analytics
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-600 text-[11px]">
          <p>© {new Date().getFullYear()} SLYYUTUS.STATS — Crafted for the Slyyutus Community.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Verified League Engine</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Black & Gold Esports Edition</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
