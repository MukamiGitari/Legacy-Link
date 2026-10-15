import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { resolveDisplayName } from '../../lib/names';

// wss:// address of the family-pool Worker (see pool-online/). Override with VITE_POOL_WS_URL.
// "Play online" needs it; two players on one device works without it.
const POOL_WS = (import.meta.env.VITE_POOL_WS_URL as string | undefined) || 'wss://family-pool.heritagehub.workers.dev';

const WIN_POINTS = 100;

export const PoolGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { data, currentProfile, recordGameScore } = useApp();
  const name = resolveDisplayName(data, currentProfile.id, currentProfile.displayName);

  // The table runs in an iframe (public/pool.html). When an online game ends, each player's
  // page reports whether *they* won, so only the winner earns leaderboard points.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'pool-over' && e.data.won) recordGameScore('pool', WIN_POINTS);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [recordGameScore]);

  const src = `/pool.html?name=${encodeURIComponent(name)}${POOL_WS ? `&ws=${encodeURIComponent(POOL_WS)}` : ''}`;

  return (
    <div className="space-y-3">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-heritage-green-700 dark:text-heritage-dark-muted hover:text-heritage-green-900"
      >
        <ArrowLeft size={16} /> All games
      </button>
      <iframe
        title="Pool table"
        src={src}
        className="w-full rounded-xl border border-heritage-cream-400 dark:border-heritage-dark-border"
        style={{ height: 'min(82vh, 760px)' }}
      />
      <p className="text-xs text-heritage-green-500 dark:text-heritage-dark-muted">
        Win an online match to earn {WIN_POINTS} points on the family leaderboard.
      </p>
    </div>
  );
};
