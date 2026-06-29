import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import type { CreateTicketPayload, TicketCategory, TicketPriority } from '../types/ticket';
import { CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../utils/labels';

interface TicketFormProps {
  onSubmit: (payload: CreateTicketPayload) => Promise<void>;
  defaultOpen?: boolean;
}

const emptyForm = (): CreateTicketPayload => ({
  asunto: '',
  descripcion: '',
  categoria: 'software',
  prioridad: 'media',
  solicitante_nombre: '',
  solicitante_email: '',
});

export function TicketForm({ onSubmit, defaultOpen = false }: TicketFormProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [form, setForm] = useState<CreateTicketPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof CreateTicketPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm(emptyForm());
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: open ? 2 : 0,
          }}
        >
          <Typography variant="h6">Crear nuevo ticket</Typography>
          <Button
            variant={open ? 'outlined' : 'contained'}
            startIcon={<AddIcon />}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Ocultar formulario' : 'Mostrar formulario'}
          </Button>
        </Box>

        <Collapse in={open}>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  required
                  fullWidth
                  label="Asunto"
                  placeholder="Descripción breve del problema"
                  value={form.asunto}
                  onChange={(e) => handleChange('asunto', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Descripción detallada"
                  placeholder="Proporciona detalles adicionales..."
                  value={form.descripcion}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  required
                  select
                  fullWidth
                  label="Categoría"
                  value={form.categoria}
                  onChange={(e) =>
                    handleChange('categoria', e.target.value as TicketCategory)
                  }
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Prioridad"
                  value={form.prioridad}
                  onChange={(e) =>
                    handleChange('prioridad', e.target.value as TicketPriority)
                  }
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  required
                  fullWidth
                  label="Nombre del solicitante"
                  value={form.solicitante_nombre}
                  onChange={(e) =>
                    handleChange('solicitante_nombre', e.target.value)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  required
                  fullWidth
                  type="email"
                  label="Email del solicitante"
                  value={form.solicitante_email}
                  onChange={(e) =>
                    handleChange('solicitante_email', e.target.value)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SendIcon />}
                    disabled={submitting}
                  >
                    Enviar ticket
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setForm(emptyForm())}
                    disabled={submitting}
                  >
                    Limpiar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
