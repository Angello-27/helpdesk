import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import type { Ticket } from '../types/ticket';
import {
  formatDate,
  getCategoryIcon,
  getCategoryLabel,
} from '../utils/labels';
import { PriorityChip, StatusChip } from './StatusChip';

interface TicketTableProps {
  tickets: Ticket[];
  loading?: boolean;
  error?: string | null;
  onView: (ticket: Ticket) => void;
  onDelete: (ticket: Ticket) => void;
}

export function TicketTable({
  tickets,
  loading,
  error,
  onView,
  onDelete,
}: TicketTableProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Mis tickets
        </Typography>

        {loading && tickets.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Asunto</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell>Prioridad</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Agente</TableCell>
                  <TableCell>Creado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {error && tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="error" sx={{ py: 3 }}>
                        {error}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No hay tickets. Crea uno nuevo para comenzar.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => {
                    const CategoryIcon = getCategoryIcon(ticket.categoria);
                    return (
                      <TableRow key={ticket.id} hover>
                        <TableCell>
                          <Box
                            component="code"
                            sx={{
                              fontSize: '0.8rem',
                              bgcolor: 'action.hover',
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 1,
                            }}
                          >
                            {ticket.id.substring(0, 8)}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 240 }}>
                          <Typography noWrap title={ticket.asunto}>
                            {ticket.asunto}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CategoryIcon fontSize="small" color="action" />
                            {getCategoryLabel(ticket.categoria)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <PriorityChip priority={ticket.prioridad} />
                        </TableCell>
                        <TableCell>
                          <StatusChip status={ticket.estado} />
                        </TableCell>
                        <TableCell>{ticket.agente_nombre ?? '—'}</TableCell>
                        <TableCell>{formatDate(ticket.creado_en)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Ver detalle">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => onView(ticket)}
                            >
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDelete(ticket)}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
