import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import type { Ticket, UpdateTicketPayload } from '../types/ticket';
import {
  CATEGORY_OPTIONS,
  formatDateLong,
  getCategoryIcon,
  getCategoryLabel,
  PRIORITY_OPTIONS,
  STATUS_OPTIONS,
} from '../utils/labels';
import { PriorityChip, StatusChip } from './StatusChip';

interface TicketDetailDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, payload: UpdateTicketPayload) => Promise<Ticket>;
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

function ticketToForm(ticket: Ticket): UpdateTicketPayload {
  return {
    asunto: ticket.asunto,
    descripcion: ticket.descripcion ?? '',
    categoria: ticket.categoria,
    prioridad: ticket.prioridad,
    estado: ticket.estado,
    agente_nombre: ticket.agente_nombre ?? '',
  };
}

export function TicketDetailDialog({
  ticket,
  open,
  onClose,
  onUpdate,
}: TicketDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateTicketPayload>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ticket) {
      setForm(ticketToForm(ticket));
      setEditing(false);
    }
  }, [ticket]);

  const handleClose = () => {
    if (saving) return;
    setEditing(false);
    onClose();
  };

  const handleSave = async () => {
    if (!ticket) return;
    setSaving(true);
    try {
      const payload: UpdateTicketPayload = {
        asunto: form.asunto?.trim(),
        descripcion: form.descripcion?.trim(),
        categoria: form.categoria,
        prioridad: form.prioridad,
        estado: form.estado,
        agente_nombre: form.agente_nombre?.trim() || undefined,
      };
      await onUpdate(ticket.id, payload);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!ticket) return null;

  const CategoryIcon = getCategoryIcon(ticket.categoria);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {editing ? 'Editar ticket' : 'Detalles del ticket'}
      </DialogTitle>
      <DialogContent dividers>
        <DetailRow label="ID del ticket">
          <Typography component="code" sx={{ wordBreak: 'break-all' }}>
            {ticket.id}
          </Typography>
        </DetailRow>
        <Divider />

        {editing ? (
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  required
                  fullWidth
                  label="Asunto"
                  value={form.asunto ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, asunto: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción"
                  value={form.descripcion ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Categoría"
                  value={form.categoria ?? ticket.categoria}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      categoria: e.target.value as Ticket['categoria'],
                    }))
                  }
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Prioridad"
                  value={form.prioridad ?? ticket.prioridad}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      prioridad: e.target.value as Ticket['prioridad'],
                    }))
                  }
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={form.estado ?? ticket.estado}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      estado: e.target.value as Ticket['estado'],
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Agente asignado"
                  placeholder="Nombre del agente (opcional)"
                  value={form.agente_nombre ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      agente_nombre: e.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <>
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
          </>
        )}

        <Divider sx={{ mt: editing ? 2 : 0 }} />
        <DetailRow label="Creado">
          <Typography>{formatDateLong(ticket.creado_en)}</Typography>
        </DetailRow>
        <Divider />
        <DetailRow label="Actualizado">
          <Typography>{formatDateLong(ticket.actualizado_en)}</Typography>
        </DetailRow>
      </DialogContent>
      <DialogActions>
        {editing ? (
          <>
            <Button
              onClick={() => {
                setForm(ticketToForm(ticket));
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <SaveOutlinedIcon />
                )
              }
              onClick={() => void handleSave()}
              disabled={saving || !form.asunto?.trim()}
            >
              Guardar
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleClose}>Cerrar</Button>
            <Button
              variant="contained"
              startIcon={<EditOutlinedIcon />}
              onClick={() => setEditing(true)}
            >
              Editar
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
