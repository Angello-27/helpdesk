import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import type { Ticket } from '../../types/ticket';

interface DeleteTicketDialogProps {
  ticket: Ticket | null;
  open: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteTicketDialog({
  ticket,
  open,
  deleting,
  onConfirm,
  onCancel,
}: DeleteTicketDialogProps) {
  return (
    <Dialog open={open} onClose={() => !deleting && onCancel()}>
      <DialogTitle>Eliminar ticket</DialogTitle>
      <DialogContent>
        <DialogContentText>
          ¿Estás seguro de que deseas eliminar el ticket{' '}
          <strong>{ticket?.asunto}</strong>?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={deleting}>
          Cancelar
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={deleting}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
