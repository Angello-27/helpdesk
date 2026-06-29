import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { StatsCards } from '../components/StatsCards';
import { TicketDetailDialog } from '../components/TicketDetailDialog';
import { TicketFiltersBar } from '../components/TicketFilters';
import { TicketForm } from '../components/TicketForm';
import { TicketTable } from '../components/TicketTable';
import type { useTickets } from '../hooks/useTickets';
import type { Ticket } from '../types/ticket';

interface DashboardPageProps {
  ticketsState: ReturnType<typeof useTickets>;
  showCreateForm?: boolean;
  onCreateFormShown?: () => void;
}

export function DashboardPage({
  ticketsState,
  showCreateForm,
  onCreateFormShown,
}: DashboardPageProps) {
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
  } = ticketsState;

  const formRef = useRef<HTMLDivElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (showCreateForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onCreateFormShown?.();
    }
  }, [showCreateForm, onCreateFormShown]);

  const handleCreate = async (
    payload: Parameters<typeof createTicket>[0],
  ) => {
    try {
      const created = await createTicket(payload);
      setSnackbar({
        open: true,
        message: `Ticket creado con ID: ${created.id.substring(0, 8)}`,
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: 'Error al crear ticket',
        severity: 'error',
      });
      throw new Error('create failed');
    }
  };

  const handleConfirmDelete = async () => {
    if (!ticketToDelete) return;
    setDeleting(true);
    try {
      await deleteTicket(ticketToDelete.id);
      setSnackbar({
        open: true,
        message: 'Ticket eliminado',
        severity: 'success',
      });
      setTicketToDelete(null);
    } catch {
      setSnackbar({
        open: true,
        message: 'Error al eliminar ticket',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <StatsCards stats={stats} />

      <Box ref={formRef}>
        <TicketForm
          key={showCreateForm ? 'open' : 'closed'}
          defaultOpen={showCreateForm}
          onSubmit={handleCreate}
        />
      </Box>

      <TicketFiltersBar
        filters={filters}
        onChange={setFilters}
        onRefresh={() => void loadTickets()}
        loading={loading}
      />

      <TicketTable
        tickets={tickets}
        loading={loading}
        error={apiOnline ? null : apiError}
        onView={setSelectedTicket}
        onDelete={setTicketToDelete}
      />

      <TicketDetailDialog
        ticket={selectedTicket}
        open={Boolean(selectedTicket)}
        onClose={() => setSelectedTicket(null)}
      />

      <Dialog
        open={Boolean(ticketToDelete)}
        onClose={() => !deleting && setTicketToDelete(null)}
      >
        <DialogTitle>Eliminar ticket</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el ticket{' '}
            <strong>{ticketToDelete?.asunto}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setTicketToDelete(null)}
            disabled={deleting}
          >
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void handleConfirmDelete()}
            disabled={deleting}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
