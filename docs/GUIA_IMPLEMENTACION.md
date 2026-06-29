# Guía de implementación — 5 integrantes

Pasos de **acción** a partir de la base existente. No es un tutorial desde cero: el
scaffold ya está en el repo.

**Leer antes:**

1. [`README_COMPLETO.md`](README_COMPLETO.md) — especificaciones del proyecto (PDF)
2. [`ESTADO_PROYECTO_RUBRICA.md`](ESTADO_PROYECTO_RUBRICA.md) — qué falta para la nota
3. [`SEPARACION_5_PERSONAS_MULTI_REPO.md`](SEPARACION_5_PERSONAS_MULTI_REPO.md) — tu rol y rama
4. [`../ARQUITECTURA.md`](../ARQUITECTURA.md) — diseño objetivo

---

## Fase 0 — Todo el equipo (1 hora)

### 0.1 Clonar y verificar base local

```bash
git clone <url-del-repo> helpdesk
cd helpdesk
docker compose up --build -d
curl http://localhost:3000/tickets/health/check
# Frontend: http://localhost:3001
```

### 0.2 Crear ramas

Cada integrante (ver [`SEPARACION_5_PERSONAS_MULTI_REPO.md`](SEPARACION_5_PERSONAS_MULTI_REPO.md)):

```bash
git checkout main && git pull
git checkout -b feature/<rol>-<apellido>
```

### 0.3 Acordar contrato NATS (Personas 2, 3, 4)

Definir en un issue o comentario de PR cómo **routing** actualizará el ticket en BD:

- Patrón nuevo `tickets.assign` / `tickets.unassign` en tickets-service, o
- SQL directo en routing-service sobre tabla `tickets`

Sin esto la demo E2E no cumple validación Grupo 4 del PDF.

---

## Fase 1 — Persona 1 (Frontend)

**Rama:** `feature/frontend-*`  
**Carpeta:** `frontend/`

### Desarrollo local con hot reload

```bash
docker compose up -d postgres nats api-gateway tickets-service routing-service notifications-service
cd frontend && npm install && npm run dev
```

### Persona 1 — Tareas

1. Probar CRUD completo en UI
2. Tras fix de Persona 3: verificar que agente/estado aparecen sin editar manual
3. Configurar `API_URL` para build producción (env o `localStorage` documentado)
4. Con Persona 5: desplegar `dist/` a S3 vía Terraform
5. Actualizar [`FRONTEND.md`](FRONTEND.md) con sección CORS + ALB

### Verificación

```bash
cd frontend && npm run build
# dist/ listo para S3
```

---

## Fase 2 — Persona 2 (Tickets + API Gateway)

**Rama:** `feature/tickets-*`  
**Carpetas:** `backend/tickets-service/`, `backend/api-gateway/`

### Persona 2 — Tareas

1. Implementar handler para asignación/desasignación (usar `assignToAgent`, `markAsUnassigned`)
2. Sincronizar patrones NATS en `messaging/patterns.ts` (gateway y tickets-service)
3. Verificar CORS: `FRONTEND_URL` en gateway para URL CloudFront/S3
4. Probar con curl (ver abajo)
5. Entregar Dockerfiles listos para ECR

```bash
curl -X POST http://localhost:3000/tickets -H "Content-Type: application/json" \
  -d '{"asunto":"Test","categoria":"redes","prioridad":"media","solicitante_nombre":"A","solicitante_email":"a@t.com"}'
curl http://localhost:3000/tickets
```

---

## Fase 3 — Persona 3 (Routing)

**Rama:** `feature/routing-*`  
**Carpeta:** `backend/routing-service/`

### Persona 3 — Tareas

1. Tras `ticket.assigned`: actualizar ticket (estado + agente) — **requerido PDF**
2. Tras `ticket.unassigned`: estado `sin_asignar`
3. Probar sin agentes: vaciar categoría en BD o usar categoría sin seed
4. Logs: `docker compose logs -f routing-service`

### Verificación Grupo 4

- Ticket con agente disponible → UI muestra agente asignado
- Sin agente → UI muestra sin asignar / pendiente

---

## Fase 4 — Persona 4 (Notifications)

**Rama:** `feature/notifications-*`  
**Carpeta:** `backend/notifications-service/`

### Persona 4 — Tareas

1. Confirmar inserts en tabla `notifications` tras assign/unassign
2. Preparar query demo: `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;`
3. Ajustar templates de log/email simulado si cambian payloads
4. Dockerfile listo para ECR

---

## Fase 5 — Persona 5 (Terraform / AWS)

**Rama:** `feature/terraform-*`  
**Carpeta:** `terraform/`

### 5.1 Crear módulos faltantes

```bash
cd terraform
mkdir -p modules/{vpc,ecs,rds,alb,cloudmap,ecr,iam,security-groups,cloudwatch,s3-frontend}
```

Implementar cada módulo referenciado en `main.tf`. Incluir **api-gateway** en ECR/ECS.

### 5.2 Variables

```bash
cp terraform.tfvars.example terraform.tfvars
# Editar: db_password, aws_region, etc. — NO commitear terraform.tfvars
```

### 5.3 Build y push imágenes

```bash
aws ecr get-login-password --region us-east-1 | docker login ...
# Por cada servicio: build, tag, push
# Actualizar image tags en terraform.tfvars
```

### 5.4 Apply

```bash
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

Outputs esperados: `alb_dns_name`, `frontend_url`, `api_endpoint`.

### 5.5 Frontend en S3

Coordinar con Persona 1: subir `frontend/dist/` al bucket creado por módulo `s3-frontend`.

### 5.6 Destroy (prueba obligatoria)

```bash
terraform destroy -var-file=terraform.tfvars
```

Documentar en README cualquier recurso que quede huérfano.

---

## Fase 6 — Integración y demo (todo el equipo)

### Checklist E2E

```text
[ ] terraform apply OK
[ ] Frontend URL carga SPA
[ ] Crear ticket desde UI (contra ALB)
[ ] routing-service log: ticket.created procesado
[ ] notifications-service log: notificación registrada
[ ] UI: estado/agente correctos
[ ] CloudWatch: logs por servicio
[ ] Presentación: diagrama + 2 trade-offs + SGs
```

### Trade-offs sugeridos para presentación

1. **API Gateway** vs tickets HTTP directo (seguridad y ALB único)
2. **RDS PostgreSQL** vs ElastiCache Redis (persistencia relacional)
3. **Monorepo** vs multi-repo (equipo pequeño)
4. **S3 estático** vs ECS para frontend (costo)

### Diagrama

Basarse en [`../ARQUITECTURA.md`](../ARQUITECTURA.md) sección 6 (AWS objetivo).

---

## Referencia rápida de comandos

```bash
# Stack local completo
docker compose up --build -d

# Logs
docker compose logs -f api-gateway routing-service notifications-service

# BD local
docker exec -it helpdesk-postgres psql -U helpdesk_user -d helpdesk_db

# Reset BD local
docker compose down -v && docker compose up -d
```

---

## Documentos relacionados

| Documento | Uso |
| --------- | --- |
| [`README_COMPLETO.md`](README_COMPLETO.md) | Especificaciones + API |
| [`ESTADO_PROYECTO_RUBRICA.md`](ESTADO_PROYECTO_RUBRICA.md) | Avance vs 100 pts |
| [`FLUJO_EVENTOS_COMPLETO.md`](FLUJO_EVENTOS_COMPLETO.md) | Flujo NATS detallado |
| [`FRONTEND.md`](FRONTEND.md) | Frontend React |
| [`API_GATEWAY.md`](API_GATEWAY.md) | Añadir endpoints |
