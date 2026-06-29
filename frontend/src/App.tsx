import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { useTickets } from './hooks/useTickets';
import { theme } from './theme';

type NavItem = 'dashboard' | 'create';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const ticketsState = useTickets();

  const handleNavigate = (item: NavItem) => {
    setActiveNav(item);
    if (item === 'create') {
      setShowCreateForm(true);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell
        activeNav={activeNav}
        onNavigate={handleNavigate}
        apiOnline={ticketsState.apiOnline}
        apiError={ticketsState.apiError}
      >
        <DashboardPage
          ticketsState={ticketsState}
          showCreateForm={showCreateForm}
          onCreateFormShown={() => setShowCreateForm(false)}
        />
      </AppShell>
    </ThemeProvider>
  );
}
