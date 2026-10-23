import { createContext, useContext, useState, type ReactNode } from 'react';

export type Walk = {
  id: string;
  name: string;
  miles: number;
  message?: string;
  createdAt: Date;
};

export type NewWalk = Pick<Walk, 'name' | 'miles' | 'message'>;

type WalksContextValue = {
  walks: Walk[];
  totalMiles: number;
  addWalk: (walk: NewWalk) => void;
};

const WalksContext = createContext<WalksContextValue | null>(null);

// For now walks are only kept in memory, so they reset when the app restarts.
// Next we'll swap this for an online database so everyone shares one total.
export function WalksProvider({ children }: { children: ReactNode }) {
  const [walks, setWalks] = useState<Walk[]>([]);

  const totalMiles = walks.reduce((sum, walk) => sum + walk.miles, 0);

  function addWalk(newWalk: NewWalk) {
    const walk: Walk = { ...newWalk, id: String(Date.now()), createdAt: new Date() };
    setWalks((current) => [walk, ...current]);
  }

  return <WalksContext value={{ walks, totalMiles, addWalk }}>{children}</WalksContext>;
}

export function useWalks() {
  const context = useContext(WalksContext);
  if (!context) {
    throw new Error('useWalks must be used inside a WalksProvider');
  }
  return context;
}
