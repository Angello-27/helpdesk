import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import type { TicketFilters } from '../hooks/useTickets';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '../utils/labels';

interface TicketFiltersBarProps {
  filters: TicketFilters;
  onChange: (filters: TicketFilters) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function TicketFiltersBar({
  filters,
  onChange,
  onRefresh,
  loading,
}: TicketFiltersBarProps) {
  return (
    <Card>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por asunto o ID..."
              value={filters.search}
              onChange={(e) =>
                onChange({ ...filters, search: e.target.value })
              }
              slotProps={{
                input: {
                  startAdornment: (
                    <SearchIcon
                      fontSize="small"
                      sx={{ mr: 1, color: 'text.secondary' }}
                    />
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Categoría"
              value={filters.category}
              onChange={(e) =>
                onChange({
                  ...filters,
                  category: e.target.value as TicketFilters['category'],
                })
              }
            >
              <MenuItem value="">Todas</MenuItem>
              {CATEGORY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={filters.status}
              onChange={(e) =>
                onChange({
                  ...filters,
                  status: e.target.value as TicketFilters['status'],
                })
              }
            >
              <MenuItem value="">Todos</MenuItem>
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: { md: 'flex-end' } }}>
              <Button
                variant="outlined"
                onClick={onRefresh}
                disabled={loading}
                startIcon={<RefreshIcon />}
                fullWidth
                sx={{ minWidth: { md: 'auto' } }}
              >
                Actualizar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
