import { createContext, useContext } from 'react';
import { useTickets } from '../hooks/useTickets';

export type TicketsContextValue = ReturnType<typeof useTickets>;

const TicketsContext = createContext<TicketsContextValue | null>(null);

export function TicketsProvider({ children }: { children: React.ReactNode }) {
  const value = useTickets();
  return (
    <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>
  );
}

export function useTicketsContext(): TicketsContextValue {
  const context = useContext(TicketsContext);
  if (!context) {
    throw new Error('useTicketsContext debe usarse dentro de TicketsProvider');
  }
  return context;
}
