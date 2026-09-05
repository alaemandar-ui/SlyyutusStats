import React from 'react';
import { Trophy, Medal, Award, Flame, Crown, Shield, Sparkles } from 'lucide-react';
import { BadgeAward, Badge } from '../types';

interface BadgeItemProps {
  badgeAward?: BadgeAward;
  badge?: Badge;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const BadgeItem: React.FC<BadgeItemProps> = ({ badgeAward, badge: directBadge, size = 'md', showDetails = true }) => {
  const badge = badgeAward?.badge || directBadge;
  if (!badge) return null;

  const getTierColors = (tier: string) => {
    switch (tier) {
      case 'gold':
        return {
          bg: 'bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-transparent',
          border: 'border-amber-400/50 hover:border-amber-400',
          text: 'text-amber-300',
          glow: 'shadow-[0_0_15px_rgba(245,197,24,0.3)]',
          iconBg: 'bg-amber-400/20 text-amber-300 border-amber-400/40'
        };
      case 'silver':
        return {
          bg: 'bg-gradient-to-b from-slate-300/20 via-slate-400/10 to-transparent',
          border: 'border-slate-300/50 hover:border-slate-200',
          text: 'text-slate-200',
          glow: 'shadow-[0_0_15px_rgba(203,213,225,0.25)]',
          iconBg: 'bg-slate-300/20 text-slate-200 border-slate-300/40'
        };
      case 'bronze':
        return {
          bg: 'bg-gradient-to-b from-amber-700/20 via-amber-800/10 to-transparent',
          border: 'border-amber-700/50 hover:border-amber-600',
          text: 'text-amber-500',
          glow: 'shadow-[0_0_15px_rgba(180,83,9,0.25)]',
          iconBg: 'bg-amber-700/20 text-amber-500 border-amber-700/40'
        };
      case 'flame':
        return {
          bg: 'bg-gradient-to-b from-orange-500/20 via-red-500/10 to-transparent',
          border: 'border-orange-500/50 hover:border-orange-400',
          text: 'text-orange-400',
          glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]',
          iconBg: 'bg-orange-500/20 text-orange-400 border-orange-500/40'
        };
      case 'diamond':
        return {
          bg: 'bg-gradient-to-b from-cyan-500/20 via-blue-500/10 to-transparent',
          border: 'border-cyan-400/50 hover:border-cyan-300',
          text: 'text-cyan-300',
          glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
          iconBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
        };
      default:
        return {
          bg: 'bg-gradient-to-b from-yellow-500/15 via-amber-500/5 to-transparent',
          border: 'border-amber-500/40 hover:border-amber-400',
          text: 'text-amber-300',
          glow: 'shadow-[0_0_12px_rgba(234,179,8,0.2)]',
          iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        };
    }
  };

  const getIcon = (type: string, tier: string) => {
    const iconClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
    switch (type) {
      case 'trophy':
        return <Trophy className={iconClass} />;
      case 'medal':
        return <Medal className={iconClass} />;
      case 'award':
        return <Award className={iconClass} />;
      case 'flame':
        return <Flame className={iconClass} />;
      case 'crown':
        return <Crown className={iconClass} />;
      case 'shield':
        return <Shield className={iconClass} />;
      default:
        return <Sparkles className={iconClass} />;
    }
  };

  const colors = getTierColors(badge.badgeTier);

  if (size === 'sm') {
    return (
      <div
        title={`${badge.title} — ${badge.description}${badgeAward?.seasonName ? ` (${badgeAward.seasonName})` : ''}`}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${colors.bg} ${colors.border} ${colors.glow} transition-all duration-300 group cursor-default`}
      >
        <span className="shrink-0">{getIcon(badge.iconType, badge.badgeTier)}</span>
        <span className={`text-xs font-semibold ${colors.text} whitespace-nowrap`}>
          {badge.title}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative group overflow-hidden rounded-xl border ${colors.bg} ${colors.border} ${colors.glow} p-3.5 transition-all duration-300 hover:-translate-y-0.5`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg border ${colors.iconBg} shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          {getIcon(badge.iconType, badge.badgeTier)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className={`text-sm font-bold tracking-wide font-heading uppercase ${colors.text} truncate`}>
              {badge.title}
            </h4>
            <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-black/40 border border-zinc-800 text-zinc-400">
              {badge.badgeTier}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
            {badge.description}
          </p>
          {showDetails && badgeAward && (
            <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
              <span>{badgeAward.seasonName || badgeAward.streamTitle ? (badgeAward.seasonName || 'Stream VOD') : 'Permanent'}</span>
              <span>{new Date(badgeAward.awardedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
