import { useCallback, useState } from 'react';
import { useTicketsContext } from '../../context/TicketsContext';
import { useSnackbar } from '../../hooks/useSnackbar';
import type { CreateTicketPayload, Ticket, UpdateTicketPayload } from '../../types/ticket';

interface UseDashboardPageOptions {
  showCreateForm?: boolean;
  onCreateFormShown?: () => void;
}

export function useDashboardPage({
  showCreateForm = false,
  onCreateFormShown,
}: UseDashboardPageOptions = {}) {
  const {
    tickets,
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
  } = useTicketsContext();

  const { snackbar, showSuccess, showError, close } = useSnackbar();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = useCallback(
    async (payload: CreateTicketPayload) => {
      try {
        const created = await createTicket(payload);
        showSuccess(`Ticket creado con ID: ${created.id.substring(0, 8)}`);
      } catch {
        showError('Error al crear ticket');
        throw new Error('create failed');
      }
    },
    [createTicket, showSuccess, showError],
  );

  const handleUpdate = useCallback(
    async (id: string, payload: UpdateTicketPayload) => {
      try {
        const updated = await updateTicket(id, payload);
        setSelectedTicket(updated);
        showSuccess('Ticket actualizado');
        return updated;
      } catch {
        showError('Error al actualizar ticket');
        throw new Error('update failed');
      }
    },
    [updateTicket, showSuccess, showError],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!ticketToDelete) return;
    setDeleting(true);
    try {
      await deleteTicket(ticketToDelete.id);
      showSuccess('Ticket eliminado');
      setTicketToDelete(null);
    } catch {
      showError('Error al eliminar ticket');
    } finally {
      setDeleting(false);
    }
  }, [ticketToDelete, deleteTicket, showSuccess, showError]);

  return {
    stats,
    create: {
      showForm: showCreateForm,
      onFormShown: onCreateFormShown ?? (() => {}),
      onSubmit: handleCreate,
    },
    list: {
      tickets,
      filters,
      loading,
      apiOnline,
      apiError,
      selectedTicket,
      ticketToDelete,
      deleting,
      onFiltersChange: setFilters,
      onRefresh: () => void loadTickets(),
      onView: setSelectedTicket,
      onDeleteRequest: setTicketToDelete,
      onDeleteConfirm: () => void handleDeleteConfirm(),
      onDeleteCancel: () => setTicketToDelete(null),
      onDetailClose: () => setSelectedTicket(null),
      onUpdate: handleUpdate,
    },
    snackbar: {
      open: snackbar.open,
      message: snackbar.message,
      severity: snackbar.severity,
      onClose: close,
    },
  };
}
