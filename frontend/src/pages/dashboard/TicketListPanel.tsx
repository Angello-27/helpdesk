import { TicketDetailDialog } from '../../components/TicketDetailDialog';
import { DeleteTicketDialog } from '../../components/tickets/DeleteTicketDialog';
import { TicketFiltersBar } from '../../components/TicketFilters';
import { TicketTable } from '../../components/TicketTable';
import type { TicketFilters } from '../../hooks/useTickets';
import type { Ticket, UpdateTicketPayload } from '../../types/ticket';

interface TicketListPanelProps {
  tickets: Ticket[];
  filters: TicketFilters;
  loading: boolean;
  apiOnline: boolean;
  apiError: string | null;
  selectedTicket: Ticket | null;
  ticketToDelete: Ticket | null;
  deleting: boolean;
  onFiltersChange: (filters: TicketFilters) => void;
  onRefresh: () => void;
  onView: (ticket: Ticket) => void;
  onDeleteRequest: (ticket: Ticket) => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onDetailClose: () => void;
  onUpdate: (id: string, payload: UpdateTicketPayload) => Promise<Ticket>;
}

export function TicketListPanel({
  tickets,
  filters,
  loading,
  apiOnline,
  apiError,
  selectedTicket,
  ticketToDelete,
  deleting,
  onFiltersChange,
  onRefresh,
  onView,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onDetailClose,
  onUpdate,
}: TicketListPanelProps) {
  return (
    <>
      <TicketFiltersBar
        filters={filters}
        onChange={onFiltersChange}
        onRefresh={onRefresh}
        loading={loading}
      />

      <TicketTable
        tickets={tickets}
        loading={loading}
        error={apiOnline ? null : apiError}
        onView={onView}
        onDelete={onDeleteRequest}
      />

      <TicketDetailDialog
        ticket={selectedTicket}
        open={Boolean(selectedTicket)}
        onClose={onDetailClose}
        onUpdate={onUpdate}
      />

      <DeleteTicketDialog
        ticket={ticketToDelete}
        open={Boolean(ticketToDelete)}
        deleting={deleting}
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    </>
  );
}
