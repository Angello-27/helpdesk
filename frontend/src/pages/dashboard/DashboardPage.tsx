import Box from '@mui/material/Box';
import { StatsCards } from '../../components/StatsCards';
import { AppSnackbar } from '../../components/feedback/AppSnackbar';
import { CreateTicketPanel } from './CreateTicketPanel';
import { TicketListPanel } from './TicketListPanel';
import { useDashboardPage } from './useDashboardPage';

interface DashboardPageProps {
  showCreateForm?: boolean;
  onCreateFormShown?: () => void;
}

export function DashboardPage({
  showCreateForm,
  onCreateFormShown,
}: DashboardPageProps) {
  const { stats, create, list, snackbar } = useDashboardPage({
    showCreateForm,
    onCreateFormShown,
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <StatsCards stats={stats} />
      <CreateTicketPanel {...create} />
      <TicketListPanel {...list} />
      <AppSnackbar {...snackbar} />
    </Box>
  );
}
