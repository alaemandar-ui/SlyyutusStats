import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
  unavailable?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  trend,
  highlight = false,
  unavailable = false
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border transition-all duration-300 p-5 ${
        highlight
          ? 'bg-gradient-to-b from-[#1a180e] via-[#111] to-[#0A0A0A] border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
          : 'bg-[#111] hover:bg-[#161616] border-[#D4AF37]/10 hover:border-[#D4AF37]/30'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
          {label}
        </span>
        <div
          className={`p-1.5 rounded-sm border ${
            highlight
              ? 'bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/40'
              : 'bg-[#1A1A1A] text-gray-400 border-zinc-800'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        {unavailable ? (
          <span className="text-sm font-medium text-zinc-500 italic">Data Unavailable</span>
        ) : (
          <span
            className={`text-3xl sm:text-4xl font-black tracking-tighter leading-none ${
              highlight ? 'text-[#FFD700]' : 'text-white'
            }`}
          >
            {typeof value === 'number'
              ? Number.isNaN(value)
                ? '0'
                : value.toLocaleString()
              : (value ?? '0')}
          </span>
        )}

        {trend && !unavailable && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm font-mono ${
              trend.isPositive
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subValue && !unavailable && (
        <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">{subValue}</p>
      )}

      {highlight && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
      )}
    </div>
  );
};
