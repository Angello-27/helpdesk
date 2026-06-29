import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import type { Ticket } from '../types/ticket';
import {
  formatDateLong,
  getCategoryIcon,
  getCategoryLabel,
} from '../utils/labels';
import { PriorityChip, StatusChip } from './StatusChip';

interface TicketDetailDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ py: 1.5 }}>
      <Typography variant="caption" color="primary" fontWeight={600}>
        {label}
      </Typography>
      <Box sx={{ mt: 0.5 }}>{children}</Box>
    </Box>
  );
}

export function TicketDetailDialog({
  ticket,
  open,
  onClose,
}: TicketDetailDialogProps) {
  if (!ticket) return null;

  const CategoryIcon = getCategoryIcon(ticket.categoria);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Detalles del ticket</DialogTitle>
      <DialogContent dividers>
        <DetailRow label="ID del ticket">
          <Typography component="code" sx={{ wordBreak: 'break-all' }}>
            {ticket.id}
          </Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Asunto">
          <Typography>{ticket.asunto}</Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Descripción">
          <Typography color="text.secondary">
            {ticket.descripcion || 'N/A'}
          </Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Categoría">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CategoryIcon fontSize="small" />
            {getCategoryLabel(ticket.categoria)}
          </Box>
        </DetailRow>
        <Divider />
        <DetailRow label="Prioridad">
          <PriorityChip priority={ticket.prioridad} />
        </DetailRow>
        <Divider />
        <DetailRow label="Estado">
          <StatusChip status={ticket.estado} />
        </DetailRow>
        <Divider />
        <DetailRow label="Solicitante">
          <Typography>
            {ticket.solicitante_nombre} ({ticket.solicitante_email})
          </Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Agente asignado">
          <Typography>
            {ticket.agente_nombre || 'Pendiente de asignación'}
          </Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Creado">
          <Typography>{formatDateLong(ticket.creado_en)}</Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Actualizado">
          <Typography>{formatDateLong(ticket.actualizado_en)}</Typography>
        </DetailRow>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
