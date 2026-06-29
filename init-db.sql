-- init-db.sql
-- Script de inicialización para PostgreSQL - Helpdesk
-- NOTA: PostgreSQL NO admite "INDEX ..." dentro de CREATE TABLE (eso es MySQL).
-- Los índices se crean después con CREATE INDEX.

-- ==================== CREATE TABLES ====================

-- Tabla: tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asunto VARCHAR(255) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('redes', 'hardware', 'software')),
  prioridad VARCHAR(50) NOT NULL DEFAULT 'media' CHECK (prioridad IN ('baja', 'media', 'alta', 'critica')),
  estado VARCHAR(50) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'asignado', 'en_progreso', 'resuelto', 'cerrado', 'sin_asignar')),
  solicitante_nombre VARCHAR(255) NOT NULL,
  solicitante_email VARCHAR(255) NOT NULL,
  agente_id UUID,
  agente_nombre VARCHAR(255),
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  resuelto_en TIMESTAMP
);

-- Tabla: agents
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('redes', 'hardware', 'software')),
  status VARCHAR(50) NOT NULL DEFAULT 'disponible' CHECK (status IN ('disponible', 'ocupado', 'inactivo')),
  tickets_asignados INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('assigned', 'unassigned', 'resolved', 'closed')),
  agent_id UUID REFERENCES agents(id),
  agent_name VARCHAR(255),
  agent_email VARCHAR(255),
  asunto VARCHAR(255),
  categoria VARCHAR(50),
  razon TEXT,
  enviado_a VARCHAR(255),
  estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'fallido')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: agents_tickets (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS agents_tickets (
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (agent_id, ticket_id)
);

-- ==================== CREATE INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_tickets_categoria        ON tickets(categoria);
CREATE INDEX IF NOT EXISTS idx_tickets_estado           ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_agente_id        ON tickets(agente_id);
CREATE INDEX IF NOT EXISTS idx_tickets_creado_en        ON tickets(creado_en);
CREATE INDEX IF NOT EXISTS idx_tickets_categoria_estado ON tickets(categoria, estado);
CREATE INDEX IF NOT EXISTS idx_agents_categoria_status  ON agents(categoria, status);
CREATE INDEX IF NOT EXISTS idx_notifications_ticket_id  ON notifications(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tipo       ON notifications(tipo);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ==================== SEED DATA ====================

INSERT INTO agents (nombre, email, categoria, status) VALUES
  ('Juan Rodriguez', 'juan@helpdesk.local', 'redes', 'disponible'),
  ('María García', 'maria@helpdesk.local', 'redes', 'disponible'),
  ('Carlos López', 'carlos@helpdesk.local', 'hardware', 'disponible'),
  ('Ana Martínez', 'ana@helpdesk.local', 'hardware', 'ocupado'),
  ('Luis Fernández', 'luis@helpdesk.local', 'software', 'disponible'),
  ('Sofia Perez', 'sofia@helpdesk.local', 'software', 'disponible')
ON CONFLICT (email) DO NOTHING;

-- ==================== CREATE VIEWS ====================

-- Vista: Tickets sin asignar por categoría
CREATE OR REPLACE VIEW unassigned_tickets_by_category AS
SELECT categoria, COUNT(*) AS total, ARRAY_AGG(id) AS ticket_ids
FROM tickets
WHERE estado = 'sin_asignar'
GROUP BY categoria;

-- Vista: Dashboard de agentes
CREATE OR REPLACE VIEW agents_dashboard AS
SELECT a.id, a.nombre, a.email, a.categoria, a.status, COUNT(t.id) AS tickets_activos
FROM agents a
LEFT JOIN tickets t ON a.id = t.agente_id AND t.estado != 'cerrado'
GROUP BY a.id, a.nombre, a.email, a.categoria, a.status;

-- Vista: Estadísticas de tickets
CREATE OR REPLACE VIEW ticket_statistics AS
SELECT
  COUNT(*) AS total_tickets,
  SUM(CASE WHEN estado = 'abierto' THEN 1 ELSE 0 END) AS abiertos,
  SUM(CASE WHEN estado = 'asignado' THEN 1 ELSE 0 END) AS asignados,
  SUM(CASE WHEN estado = 'sin_asignar' THEN 1 ELSE 0 END) AS sin_asignar,
  SUM(CASE WHEN estado = 'en_progreso' THEN 1 ELSE 0 END) AS en_progreso,
  SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) AS resueltos
FROM tickets;
