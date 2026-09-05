import React, { useEffect, useState } from 'react';
import { LeagueSeason } from '../types';
import { fetchSeasons } from '../lib/api';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { 
  Calendar, 
  Trophy, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Sparkles,
  Award
} from 'lucide-react';

export const SeasonsPage: React.FC<{ navigate: (route: string) => void }> = ({ navigate }) => {
  const [seasons, setSeasons] = useState<LeagueSeason[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const data = await fetchSeasons();
        setSeasons(data);
      } catch (err) {
        console.error('Failed fetching seasons:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSeasons();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 pb-20">
      
      {/* Header */}
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest mb-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>HISTORICAL LEAGUE ARCHIVE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none text-white">
          MONTHLY <span className="text-[#D4AF37]">SEASONS ARCHIVE</span>
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1.5 max-w-2xl">
          Historical record of all Slyyutus Chatters League seasons. Final standings and badges are permanently minted.
        </p>
      </div>

      {/* Season Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {seasons.map((season) => {
          const isActive = season.isActive;
          const topWinners = season.topWinners;

          return (
            <div
              key={season.seasonId}
              className={`relative rounded-lg border transition-all duration-300 p-6 flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-b from-yellow-500/10 to-[#111] border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                  : 'bg-[#111] hover:bg-[#161616] border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
              }`}
            >
              <div className="space-y-4">
                
                {/* Season Badge & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-black uppercase px-2.5 py-1 rounded-sm bg-[#1A1A1A] border border-[#D4AF37]/30 text-[#D4AF37]">
                    SEASON {season.seasonId}
                  </span>
                  {isActive ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest bg-[#D4AF37] text-black">
                      ACTIVE NOW
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-white/5 text-gray-400 border border-white/10 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                      FINALIZED
                    </span>
                  )}
                </div>

                {/* Season Title */}
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">
                    {season.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono font-bold uppercase mt-1">
                    {new Date(season.startDate).toLocaleDateString()} — {new Date(season.endDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Top 3 Champions Showcase */}
                {topWinners && (topWinners.first || topWinners.second || topWinners.third) && (
                  <div className="pt-3 border-t border-zinc-800 space-y-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                      PERMANENT CHAMPIONS
                    </span>
                    <div className="space-y-1.5">
                      {topWinners.first && (
                        <div
                          onClick={() => navigate(`user/${topWinners.first?.username}`)}
                          className="flex items-center justify-between p-2 rounded-sm bg-yellow-500/10 border border-[#D4AF37]/30 text-xs font-mono cursor-pointer hover:border-[#D4AF37] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#D4AF37]">01</span>
                            <span className="font-black text-white uppercase text-xs">
                              {topWinners.first.username}
                            </span>
                          </div>
                          <span className="text-[#D4AF37] font-black text-xs">
                            {(topWinners.first.points || 0).toLocaleString()} PTS
                          </span>
                        </div>
                      )}

                      {topWinners.second && (
                        <div
                          onClick={() => navigate(`user/${topWinners.second?.username}`)}
                          className="flex items-center justify-between p-2 rounded-sm bg-white/5 border border-gray-600/30 text-xs font-mono cursor-pointer hover:border-gray-400 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-400">02</span>
                            <span className="font-bold text-gray-200 uppercase text-xs">
                              {topWinners.second.username}
                            </span>
                          </div>
                          <span className="text-gray-300 font-bold text-xs">
                            {(topWinners.second.points || 0).toLocaleString()} PTS
                          </span>
                        </div>
                      )}

                      {topWinners.third && (
                        <div
                          onClick={() => navigate(`user/${topWinners.third?.username}`)}
                          className="flex items-center justify-between p-2 rounded-sm bg-white/5 border border-[#CD7F32]/30 text-xs font-mono cursor-pointer hover:border-[#CD7F32] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#CD7F32]">03</span>
                            <span className="font-bold text-gray-200 uppercase text-xs">
                              {topWinners.third.username}
                            </span>
                          </div>
                          <span className="text-[#CD7F32] font-bold text-xs">
                            {(topWinners.third.points || 0).toLocaleString()} PTS
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">
                  {season.totalParticipants} PARTICIPANTS
                </span>
                <button
                  onClick={() => navigate(isActive ? 'league' : `season/${season.seasonId}`)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                    isActive
                      ? 'bg-[#D4AF37] text-black hover:bg-[#FFD700]'
                      : 'bg-[#1A1A1A] text-[#D4AF37] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-black'
                  }`}
                >
                  <span>{isActive ? 'VIEW CURRENT' : 'VIEW SEASON'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
