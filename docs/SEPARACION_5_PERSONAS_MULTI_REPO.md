# Roles del equipo — 5 integrantes (monorepo)

Guía de **ownership**, **ramas Git** y **entregables** para completar el proyecto Grupo 4.

**Decisión del equipo:** un solo repositorio (`helpdesk/`). Cada integrante trabaja en su
**rama** y abre PR hacia `main`.

**Estado vs rúbrica:** [`ESTADO_PROYECTO_RUBRICA.md`](ESTADO_PROYECTO_RUBRICA.md)  
**Pasos técnicos:** [`GUIA_IMPLEMENTACION.md`](GUIA_IMPLEMENTACION.md)  
**Arquitectura:** [`../ARQUITECTURA.md`](../ARQUITECTURA.md)

---

## 1. Flujo Git (obligatorio)

```bash
# Una vez por integrante, desde main actualizado
git checkout main
git pull origin main
git checkout -b feature/<rol>-<apellido>   # ver tabla abajo

# Trabajo diario
git add <solo-tu-carpeta>
git commit -m "feat(tickets): descripción clara"
git push -u origin feature/<rol>-<apellido>

# Abrir Pull Request → main (1 revisor de otro rol)
```

### Ramas sugeridas

| Integrante | Rama Git | Carpeta principal |
| ---------- | -------- | ----------------- |
| 1 — Frontend | `feature/frontend-<apellido>` | `frontend/` |
| 2 — Tickets + Gateway | `feature/tickets-<apellido>` | `backend/tickets-service/`, `backend/api-gateway/` |
| 3 — Routing | `feature/routing-<apellido>` | `backend/routing-service/` |
| 4 — Notifications | `feature/notifications-<apellido>` | `backend/notifications-service/` |
| 5 — DevOps | `feature/terraform-<apellido>` | `terraform/`, `.github/`, `docker-compose.yml` |

**Regla:** no editar la carpeta de otro integrante en la misma rama. Coordinar cambios
transversales (`docker-compose.yml`, `init-db.sql`) vía PR pequeño o pair con Persona 5.

---

## 2. Persona 1 — Frontend

**Carpeta:** `frontend/`  
**Docs:** [`FRONTEND.md`](FRONTEND.md)

### Persona 1 — Base implementada

- React 18 + TypeScript + Vite + MUI
- CRUD: crear, listar, editar (PATCH), eliminar
- App shell, filtros, stats, polling 5 s
- Docker multi-stage + Nginx local

### Persona 1 — Pendiente

- [ ] Vista móvil (cards) o tabla responsive pulida
- [ ] Variable `API_URL` para producción (ALB DNS)
- [ ] Colaborar con Persona 5: módulo Terraform `s3-frontend` + subida de `dist/`
- [ ] Documentar CORS en `docs/FRONTEND.md` (origen S3/CloudFront → ALB)
- [ ] Probar E2E: ticket creado muestra agente/estado tras routing

### Persona 1 — Entregables

- Frontend desplegado en AWS vía Terraform
- CRUD funcional contra ALB
- Sección en presentación: despliegue + conexión al backend

---

## 3. Persona 2 — Tickets + API Gateway

**Carpetas:** `backend/tickets-service/`, `backend/api-gateway/`  
**Docs:** [`API_GATEWAY.md`](API_GATEWAY.md)

### Persona 2 — Base implementada

- Gateway: único HTTP, CORS, DTOs, proxy NATS
- Tickets: CRUD, Postgres, publica `ticket.created` y `ticket.<estado>`
- Patrones NATS sincronizados gateway ↔ tickets-service

### Persona 2 — Pendiente

- [ ] Exponer/consumir actualización de ticket tras routing (`assignToAgent`, `markAsUnassigned`)
- [ ] Opción A: patrón NATS `tickets.assign` / `tickets.unassign`
- [ ] Opción B: routing actualiza vía contrato con tickets-service
- [ ] Asegurar estados `asignado` / `sin_asignar` en BD
- [ ] Imagen Docker lista para ECR (Persona 5 la sube)
- [ ] Tests mínimos CRUD (opcional)

### Persona 2 — Entregables

- Servicio HTTP detrás del ALB (gateway)
- Persistencia RDS funcionando
- Flujo `ticket.created` correcto

---

## 4. Persona 3 — Routing

**Carpeta:** `backend/routing-service/`

### Persona 3 — Base implementada

- Escucha `ticket.created`
- Busca agente por categoría en `agents`
- Publica `ticket.assigned` / `ticket.unassigned`
- Marca agente `ocupado`

### Persona 3 — Pendiente

- [ ] **Actualizar fila en `tickets`** al asignar o rechazar (hoy solo emite evento)
- [ ] Coordinar con Persona 2 el contrato (NATS o SQL compartido)
- [ ] Probar: categoría sin agentes → ticket `sin_asignar` visible en UI
- [ ] Probar: categoría con agente → `asignado` + nombre agente en UI
- [ ] (Opcional) usar tabla `agents_tickets`

### Persona 3 — Entregables

- Worker event-driven correcto
- Demo: logs muestran assign/unassign + BD coherente

---

## 5. Persona 4 — Notifications

**Carpeta:** `backend/notifications-service/`

### Persona 4 — Base implementada

- Escucha `ticket.assigned` y `ticket.unassigned`
- Inserta en `notifications`
- Simula email (logs)

### Persona 4 — Pendiente

- [ ] Verificar payloads si Persona 3 cambia eventos
- [ ] Escuchar `ticket.<estado>` si se usa en demo
- [ ] Consulta SQL de notificaciones para demo/presentación
- [ ] Imagen ECR + health en ECS (con Persona 5)

### Persona 4 — Entregables

- Worker NATS documentado en presentación
- Evidencia en CloudWatch / logs docker

---

## 6. Persona 5 — DevOps / Terraform

**Carpetas:** `terraform/`, `docker-compose.yml`, `.github/workflows/` (opcional)

### Persona 5 — Base implementada

- `terraform/main.tf` + `variables.tf` + `terraform.tfvars.example`
- `docker-compose.yml` stack completo local
- `nginx.conf`, Dockerfiles backend/frontend

### Persona 5 — Pendiente

- [ ] Implementar **todos** los módulos referenciados en `main.tf`
- [ ] ECR: gateway + tickets + routing + notifications + frontend
- [ ] ECS Fargate: NATS + 4 servicios app
- [ ] RDS PostgreSQL + SG solo desde ECS
- [ ] ALB → api-gateway
- [ ] Cloud Map `*.app.internal`
- [ ] S3 (+ CloudFront opcional) frontend
- [ ] CloudWatch log group por servicio
- [ ] IAM Task Execution Role
- [ ] Security Groups encadenados (diagrama para presentación)
- [ ] README: `terraform apply`, prueba E2E, `terraform destroy`
- [ ] (Extra) state S3, CI/CD, ACM HTTPS

### Persona 5 — Entregables

- `terraform apply` reproducible
- Outputs ALB + frontend URL
- Cuenta limpia tras `destroy`

---

## 7. Integración semanal (reunión 30 min)

```text
[ ] Cada uno: demo de su rama en local
[ ] Persona 5: estado terraform plan
[ ] Revisar ESTADO_PROYECTO_RUBRICA.md — marcar checkboxes
[ ] Resolver bloqueos entre Persona 2 ↔ 3 (estado ticket)
[ ] Persona 1 ↔ 5 (URL ALB en frontend)
```

---

## 8. Matriz rápida: quién desbloquea a quién

| Necesita | Depende de |
| -------- | ---------- |
| Frontend en AWS | Persona 5 (S3/CloudFront) + ALB DNS |
| CORS producción | Persona 2 (FRONTEND_URL) + Persona 5 (URL real) |
| Ticket asignado en UI | Persona 3 + Persona 2 |
| ECS corriendo | Persona 5 + imágenes Docker de 2, 3, 4, 1 |
| Demo completa | Todos |

---

## 9. Contacto y convenciones

- **Commits:** `feat(scope):`, `fix(scope):`, `docs(scope):`
- **Scopes:** `frontend`, `gateway`, `tickets`, `routing`, `notifications`, `terraform`
- **Main protegida:** solo vía PR
- **No commitear:** `terraform.tfvars`, `.env`, credenciales AWS
