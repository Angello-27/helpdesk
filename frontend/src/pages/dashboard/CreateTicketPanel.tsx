import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import { TicketForm } from '../../components/TicketForm';
import type { CreateTicketPayload } from '../../types/ticket';

interface CreateTicketPanelProps {
  showForm: boolean;
  onFormShown: () => void;
  onSubmit: (payload: CreateTicketPayload) => Promise<void>;
}

export function CreateTicketPanel({
  showForm,
  onFormShown,
  onSubmit,
}: CreateTicketPanelProps) {
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onFormShown();
    }
  }, [showForm, onFormShown]);

  return (
    <Box ref={formRef}>
      <TicketForm
        key={showForm ? 'open' : 'closed'}
        defaultOpen={showForm}
        onSubmit={onSubmit}
      />
    </Box>
  );
}
