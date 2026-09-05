import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number; type?: 'card' | 'table' | 'profile' }> = ({
  rows = 4,
  type = 'card'
}) => {
  if (type === 'profile') {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-zinc-900/80 rounded-2xl border border-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-zinc-900/80 rounded-xl border border-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-12 bg-zinc-900/90 rounded-xl border border-zinc-800/80" />
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-16 bg-zinc-900/50 rounded-xl border border-zinc-800/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-32 bg-zinc-900/80 rounded-xl border border-zinc-800" />
      ))}
    </div>
  );
};
