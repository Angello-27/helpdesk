import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  checkApiHealth,
  createTicket as apiCreateTicket,
  deleteTicket as apiDeleteTicket,
  fetchTickets,
  updateTicket as apiUpdateTicket,
} from '../api/tickets';
import { POLL_INTERVAL } from '../api/config';
import type {
  CreateTicketPayload,
  Ticket,
  TicketCategory,
  TicketStats,
  TicketStatus,
  UpdateTicketPayload,
} from '../types/ticket';

export interface TicketFilters {
  search: string;
  category: TicketCategory | '';
  status: TicketStatus | '';
}

const defaultFilters: TicketFilters = {
  search: '',
  category: '',
  status: '',
};

function computeStats(tickets: Ticket[]): TicketStats {
  return {
    total: tickets.length,
    abiertos: tickets.filter((t) => t.estado === 'abierto').length,
    asignados: tickets.filter((t) => t.estado === 'asignado').length,
    sinAsignar: tickets.filter((t) => t.estado === 'sin_asignar').length,
  };
}

function filterTickets(tickets: Ticket[], filters: TicketFilters): Ticket[] {
  const search = filters.search.toLowerCase();

  return tickets.filter((ticket) => {
    const matchesSearch =
      !search ||
      ticket.asunto.toLowerCase().includes(search) ||
      ticket.id.includes(search);

    const matchesCategory =
      !filters.category || ticket.categoria === filters.category;

    const matchesStatus = !filters.status || ticket.estado === filters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filters, setFilters] = useState<TicketFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const healthy = await checkApiHealth();
      if (!healthy) {
        setApiOnline(false);
        setApiError('API error');
        return;
      }

      const data = await fetchTickets();
      setTickets(data);
      setApiOnline(true);
      setApiError(null);
    } catch {
      setApiOnline(false);
      setApiError('No se pudieron cargar tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadTickets();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [loadTickets]);

  const filteredTickets = useMemo(
    () => filterTickets(tickets, filters),
    [tickets, filters],
  );

  const stats = useMemo(() => computeStats(tickets), [tickets]);

  const createTicket = useCallback(
    async (payload: CreateTicketPayload) => {
      const created = await apiCreateTicket(payload);
      await loadTickets();
      return created;
    },
    [loadTickets],
  );

  const deleteTicket = useCallback(
    async (id: string) => {
      await apiDeleteTicket(id);
      await loadTickets();
    },
    [loadTickets],
  );

  const updateTicket = useCallback(
    async (id: string, payload: UpdateTicketPayload) => {
      const updated = await apiUpdateTicket(id, payload);
      await loadTickets();
      return updated;
    },
    [loadTickets],
  );

  return {
    tickets: filteredTickets,
    allTickets: tickets,
    stats,
    filters,
    setFilters,
    loading,
    apiOnline,
    apiError,
    loadTickets,
    createTicket,
    deleteTicket,
    updateTicket,
  };
}
