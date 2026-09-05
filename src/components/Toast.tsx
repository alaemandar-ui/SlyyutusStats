import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useAuth();
  if (!toast) return null;

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-zinc-900/95 border-amber-500/60 gold-glow text-amber-200',
          icon: <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
        };
      case 'error':
        return {
          bg: 'bg-zinc-900/95 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.25)] text-rose-200',
          icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        };
      default:
        return {
          bg: 'bg-zinc-900/95 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] text-cyan-200',
          icon: <Info className="w-5 h-5 text-cyan-400 shrink-0" />
        };
    }
  };

  const style = getStyles();

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl ${style.bg} max-w-md shadow-2xl`}>
        {style.icon}
        <span className="text-sm font-medium tracking-wide font-heading">{toast.message}</span>
      </div>
    </div>
  );
};
