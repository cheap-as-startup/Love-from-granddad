import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { NewWalk } from '@/lib/walk-rules';

export type Walk = NewWalk & {
  id: number;
  createdAt: Date;
};

type Status = 'loading' | 'ready' | 'error';

type WalksContextValue = {
  walks: Walk[];
  totalMiles: number;
  status: Status;
  refresh: () => Promise<void>;
  addWalk: (walk: NewWalk) => Promise<void>;
};

const WalksContext = createContext<WalksContextValue | null>(null);

// Walks are stored online by our server (src/app/api/walks+api.ts),
// so everyone sees the same total.
export function WalksProvider({ children }: { children: ReactNode }) {
  const [walks, setWalks] = useState<Walk[]>([]);
  const [totalMiles, setTotalMiles] = useState(0);
  const [status, setStatus] = useState<Status>('loading');

  async function refresh() {
    try {
      const response = await fetch('/api/walks');
      if (!response.ok) {
        throw new Error(`Server replied ${response.status}`);
      }
      const data = await response.json();
      setTotalMiles(data.totalMiles);
      // Dates arrive as text, so turn them back into real dates.
      setWalks(data.walks.map((walk: Walk) => ({ ...walk, createdAt: new Date(walk.createdAt) })));
      setStatus('ready');
    } catch (error) {
      console.warn('Could not load walks', error);
      setStatus('error');
    }
  }

  async function addWalk(walk: NewWalk) {
    const response = await fetch('/api/walks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(walk),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? 'Sorry, something went wrong. Please try again.');
    }
    await refresh();
  }

  // Load the walks once when the app opens.
  useEffect(() => {
    refresh();
  }, []);

  return (
    <WalksContext value={{ walks, totalMiles, status, refresh, addWalk }}>{children}</WalksContext>
  );
}

export function useWalks() {
  const context = useContext(WalksContext);
  if (!context) {
    throw new Error('useWalks must be used inside a WalksProvider');
  }
  return context;
}
