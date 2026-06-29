import type { SvgIconComponent } from '@mui/icons-material';
import ComputerIcon from '@mui/icons-material/Computer';
import LanIcon from '@mui/icons-material/Lan';
import MemoryIcon from '@mui/icons-material/Memory';
import type {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../types/ticket';

export const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: 'redes', label: 'Redes' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'software', label: 'Software' },
];

export const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'abierto', label: 'Abierto' },
  { value: 'asignado', label: 'Asignado' },
  { value: 'sin_asignar', label: 'Sin asignar' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'resuelto', label: 'Resuelto' },
  { value: 'cerrado', label: 'Cerrado' },
];

const categoryIcons: Record<TicketCategory, SvgIconComponent> = {
  redes: LanIcon,
  hardware: MemoryIcon,
  software: ComputerIcon,
};

export function getCategoryIcon(category: TicketCategory): SvgIconComponent {
  return categoryIcons[category] ?? ComputerIcon;
}

export function getCategoryLabel(category: TicketCategory): string {
  return CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? category;
}

export function getPriorityLabel(priority: TicketPriority): string {
  return PRIORITY_OPTIONS.find((o) => o.value === priority)?.label ?? priority;
}

export function getStatusLabel(status: TicketStatus): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateLong(date: string): string {
  return new Date(date).toLocaleString('es-ES');
}
