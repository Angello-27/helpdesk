import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { TicketsProvider, useTicketsContext } from './context/TicketsContext';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { theme } from './theme';

type NavItem = 'dashboard' | 'create';

function AppContent() {
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { apiOnline, apiError } = useTicketsContext();

  const handleNavigate = (item: NavItem) => {
    setActiveNav(item);
    if (item === 'create') {
      setShowCreateForm(true);
    }
  };

  return (
    <AppShell
      activeNav={activeNav}
      onNavigate={handleNavigate}
      apiOnline={apiOnline}
      apiError={apiError}
    >
      <DashboardPage
        showCreateForm={showCreateForm}
        onCreateFormShown={() => setShowCreateForm(false)}
      />
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TicketsProvider>
        <AppContent />
      </TicketsProvider>
    </ThemeProvider>
  );
}
