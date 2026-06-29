// frontend/app.js

// ==================== CONFIG ====================
const API_URL = localStorage.getItem('apiUrl') || window.location.origin;
const POLL_INTERVAL = 5000; // Actualizar cada 5 segundos

let allTickets = [];
let pollInterval;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inicializando Helpdesk...');
  console.log(`API URL: ${API_URL}`);

  // Actualizar URL del API en footer
  document.getElementById('api-url').textContent = API_URL;

  // Verificar conexión con API
  await checkApiConnection();

  // Cargar tickets
  await loadTickets();

  // Setup event listeners
  setupEventListeners();

  // Iniciar polling automático
  startPolling();
});

// ==================== API CONNECTION ====================
async function checkApiConnection() {
  try {
    const response = await fetch(`${API_URL}/tickets/health/check`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      setStatusOnline();
      console.log('✅ API conectada');
    } else {
      setStatusOffline('API error');
    }
  } catch (error) {
    setStatusOffline('No se puede conectar');
    console.error('❌ Error de conexión:', error);
  }
}

function setStatusOnline() {
  const indicator = document.getElementById('status-indicator');
  const text = document.getElementById('status-text');
  indicator.classList.remove('error');
  text.textContent = 'API conectada';
}

function setStatusOffline(reason) {
  const indicator = document.getElementById('status-indicator');
  const text = document.getElementById('status-text');
  indicator.classList.add('error');
  text.textContent = `API desconectada: ${reason}`;
}

// ==================== LOAD TICKETS ====================
async function loadTickets() {
  const loading = document.getElementById('loading-indicator');
  loading.classList.remove('hidden');

  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    allTickets = data.tickets || [];

    renderTickets(allTickets);
    updateStats();
    setStatusOnline();
  } catch (error) {
    console.error('❌ Error cargando tickets:', error);
    setStatusOffline('No se pudieron cargar tickets');
    document.getElementById('tickets-tbody').innerHTML =
      '<tr class="empty-row"><td colspan="8">Error al cargar tickets</td></tr>';
  } finally {
    loading.classList.add('hidden');
  }
}

// ==================== RENDER TICKETS ====================
function renderTickets(tickets) {
  const tbody = document.getElementById('tickets-tbody');

  if (tickets.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="8">No hay tickets. Crea uno nuevo para comenzar.</td></tr>';
    return;
  }

  tbody.innerHTML = tickets
    .map(
      (ticket) => `
    <tr>
      <td><code>${ticket.id.substring(0, 8)}</code></td>
      <td>${ticket.asunto}</td>
      <td>${getCategoryIcon(ticket.categoria)} ${ticket.categoria}</td>
      <td><span class="priority-${ticket.prioridad}">${getPriorityLabel(ticket.prioridad)}</span></td>
      <td><span class="status-badge status-${ticket.estado}">${getStatusLabel(ticket.estado)}</span></td>
      <td>${ticket.agente_nombre || '-'}</td>
      <td>${formatDate(ticket.creado_en)}</td>
      <td>
        <button class="btn-action btn-view" onclick="viewTicket('${ticket.id}')">👁️ Ver</button>
        <button class="btn-action btn-delete" onclick="deleteTicket('${ticket.id}')">🗑️ Eliminar</button>
      </td>
    </tr>
  `
    )
    .join('');

  // Agregar estilos para botones de acción
  document.querySelectorAll('.btn-action').forEach((btn) => {
    btn.style.padding = '4px 8px';
    btn.style.marginRight = '4px';
    btn.style.fontSize = '0.85rem';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.cursor = 'pointer';
    btn.style.backgroundColor = '#f0f0f0';
  });

  document.querySelectorAll('.btn-view').forEach((btn) => {
    btn.style.backgroundColor = '#e3f2fd';
  });

  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.style.backgroundColor = '#ffebee';
  });
}

// ==================== VIEW TICKET ====================
function viewTicket(ticketId) {
  const ticket = allTickets.find((t) => t.id === ticketId);
  if (!ticket) return;

  const modal = document.getElementById('modal-detail');
  const modalBody = document.getElementById('modal-body');

  modalBody.innerHTML = `
    <div class="detail-item">
      <div class="detail-label">ID del Ticket</div>
      <div class="detail-value"><code>${ticket.id}</code></div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Asunto</div>
      <div class="detail-value">${ticket.asunto}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Descripción</div>
      <div class="detail-value">${ticket.descripcion || 'N/A'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Categoría</div>
      <div class="detail-value">${getCategoryIcon(ticket.categoria)} ${ticket.categoria}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Prioridad</div>
      <div class="detail-value"><span class="priority-${ticket.prioridad}">${getPriorityLabel(ticket.prioridad)}</span></div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Estado</div>
      <div class="detail-value"><span class="status-badge status-${ticket.estado}">${getStatusLabel(ticket.estado)}</span></div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Solicitante</div>
      <div class="detail-value">${ticket.solicitante_nombre} (${ticket.solicitante_email})</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Agente Asignado</div>
      <div class="detail-value">${ticket.agente_nombre || 'Pendiente de asignación'}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Creado</div>
      <div class="detail-value">${new Date(ticket.creado_en).toLocaleString()}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Actualizado</div>
      <div class="detail-value">${new Date(ticket.actualizado_en).toLocaleString()}</div>
    </div>
  `;

  modal.classList.remove('hidden');
}

// ==================== DELETE TICKET ====================
async function deleteTicket(ticketId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este ticket?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    alert('✅ Ticket eliminado');
    await loadTickets();
  } catch (error) {
    console.error('❌ Error eliminando ticket:', error);
    alert('❌ Error al eliminar ticket');
  }
}

// ==================== CREATE TICKET ====================
async function createTicket(event) {
  event.preventDefault();

  const formData = {
    asunto: document.getElementById('asunto').value,
    descripcion: document.getElementById('descripcion').value,
    categoria: document.getElementById('categoria').value,
    prioridad: document.getElementById('prioridad').value,
    solicitante_nombre: document.getElementById('solicitante_nombre').value,
    solicitante_email: document.getElementById('solicitante_email').value,
  };

  console.log('📝 Enviando ticket:', formData);

  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    console.log('✅ Ticket creado:', result);

    alert(`✅ Ticket creado con ID: ${result.id.substring(0, 8)}`);

    // Limpiar y cerrar formulario
    document.getElementById('ticket-form').reset();
    document.getElementById('ticket-form').classList.add('hidden');
    document.getElementById('toggle-form').textContent = 'Mostrar Formulario';

    // Recargar tickets
    await loadTickets();
  } catch (error) {
    console.error('❌ Error creando ticket:', error);
    alert('❌ Error al crear ticket');
  }
}

// ==================== FILTERING ====================
function filterTickets() {
  const searchText = document.getElementById('search-input').value.toLowerCase();
  const categoryFilter = document.getElementById('filter-category').value;
  const statusFilter = document.getElementById('filter-status').value;

  const filtered = allTickets.filter((ticket) => {
    const matchesSearch =
      ticket.asunto.toLowerCase().includes(searchText) ||
      ticket.id.includes(searchText);

    const matchesCategory = !categoryFilter || ticket.categoria === categoryFilter;
    const matchesStatus = !statusFilter || ticket.estado === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  renderTickets(filtered);
}

// ==================== STATS ====================
function updateStats() {
  const total = allTickets.length;
  const abiertos = allTickets.filter((t) => t.estado === 'abierto').length;
  const asignados = allTickets.filter((t) => t.estado === 'asignado').length;
  const sinAsignar = allTickets.filter((t) => t.estado === 'sin_asignar').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-abiertos').textContent = abiertos;
  document.getElementById('stat-asignados').textContent = asignados;
  document.getElementById('stat-sin-asignar').textContent = sinAsignar;
}

// ==================== HELPERS ====================
function getCategoryIcon(categoria) {
  const icons = {
    redes: '🌐',
    hardware: '🖥️',
    software: '💻',
  };
  return icons[categoria] || '📌';
}

function getPriorityLabel(prioridad) {
  const labels = {
    baja: '🟢 Baja',
    media: '🟡 Media',
    alta: '🔴 Alta',
    critica: '⚫ Crítica',
  };
  return labels[prioridad] || prioridad;
}

function getStatusLabel(estado) {
  const labels = {
    abierto: '🔵 Abierto',
    asignado: '🟣 Asignado',
    en_progreso: '🟡 En Progreso',
    resuelto: '🟢 Resuelto',
    cerrado: '⚪ Cerrado',
    sin_asignar: '🟠 Sin Asignar',
  };
  return labels[estado] || estado;
}

function formatDate(date) {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Crear ticket
  document.getElementById('ticket-form').addEventListener('submit', createTicket);

  // Toggle formulario
  document.getElementById('toggle-form').addEventListener('click', () => {
    const form = document.getElementById('ticket-form');
    const btn = document.getElementById('toggle-form');

    form.classList.toggle('hidden');
    btn.textContent = form.classList.contains('hidden')
      ? 'Mostrar Formulario'
      : 'Ocultar Formulario';
  });

  // Filtros
  document.getElementById('search-input').addEventListener('input', filterTickets);
  document.getElementById('filter-category').addEventListener('change', filterTickets);
  document.getElementById('filter-status').addEventListener('change', filterTickets);

  // Refresh manual
  document.getElementById('btn-refresh').addEventListener('click', loadTickets);

  // Modal
  document.querySelector('.btn-close').addEventListener('click', () => {
    document.getElementById('modal-detail').classList.add('hidden');
  });

  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('modal-detail').classList.add('hidden');
  });

  // Cerrar modal con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('modal-detail').classList.add('hidden');
    }
  });
}

// ==================== AUTO POLLING ====================
function startPolling() {
  console.log(`🔄 Iniciando polling cada ${POLL_INTERVAL}ms`);

  pollInterval = setInterval(async () => {
    await loadTickets();
  }, POLL_INTERVAL);
}

// Limpiar polling al descargar la página
window.addEventListener('beforeunload', () => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
