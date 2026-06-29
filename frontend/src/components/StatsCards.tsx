import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import type { TicketStats } from '../types/ticket';

interface StatsCardsProps {
  stats: TicketStats;
}

const items = [
  {
    key: 'total' as const,
    label: 'Tickets totales',
    icon: AssignmentIcon,
    color: '#1565C0',
    bg: '#E3F2FD',
  },
  {
    key: 'abiertos' as const,
    label: 'Abiertos',
    icon: FolderOpenIcon,
    color: '#0277BD',
    bg: '#E1F5FE',
  },
  {
    key: 'asignados' as const,
    label: 'Asignados',
    icon: SupportAgentIcon,
    color: '#6A1B9A',
    bg: '#F3E5F5',
  },
  {
    key: 'sinAsignar' as const,
    label: 'Sin asignar',
    icon: PersonOffIcon,
    color: '#C62828',
    bg: '#FFEBEE',
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <Grid container spacing={2}>
      {items.map(({ key, label, icon: Icon, color, bg }) => (
        <Grid key={key} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: bg,
                    color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color }}>
                    {stats[key]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
