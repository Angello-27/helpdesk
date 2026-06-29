import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';
import type { TicketPriority, TicketStatus } from '../types/ticket';
import { getPriorityLabel, getStatusLabel } from '../utils/labels';

const statusColorMap: Record<
  TicketStatus,
  ChipProps['color']
> = {
  abierto: 'info',
  asignado: 'secondary',
  en_progreso: 'warning',
  resuelto: 'success',
  cerrado: 'default',
  sin_asignar: 'error',
};

const priorityColorMap: Record<
  TicketPriority,
  ChipProps['color']
> = {
  baja: 'success',
  media: 'warning',
  alta: 'warning',
  critica: 'error',
};

interface StatusChipProps {
  status: TicketStatus;
  size?: ChipProps['size'];
}

export function StatusChip({ status, size = 'small' }: StatusChipProps) {
  return (
    <Chip
      label={getStatusLabel(status)}
      color={statusColorMap[status]}
      size={size}
      variant="outlined"
    />
  );
}

interface PriorityChipProps {
  priority: TicketPriority;
  size?: ChipProps['size'];
}

export function PriorityChip({ priority, size = 'small' }: PriorityChipProps) {
  return (
    <Chip
      label={getPriorityLabel(priority)}
      color={priorityColorMap[priority]}
      size={size}
      variant={priority === 'critica' ? 'filled' : 'outlined'}
    />
  );
}
