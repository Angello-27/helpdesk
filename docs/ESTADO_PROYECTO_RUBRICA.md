# Estado del proyecto vs rúbrica — Grupo 4 Helpdesk

Documento de referencia para **todos los integrantes**. Resume qué está hecho en la base,
qué falta para la calificación y cómo repartir el trabajo.

**Última revisión:** junio 2026  
**Arquitectura objetivo:** [`../ARQUITECTURA.md`](../ARQUITECTURA.md)  
**Especificaciones completas:** [`README_COMPLETO.md`](README_COMPLETO.md)

---

## 1. Puntuación estimada (base actual)

| Criterio (PDF)              | Puntos | Estado base     | Estimado hoy |
| --------------------------- | ------ | --------------- | ------------ |
| IaC / Terraform             | 40     | Esqueleto       | 4–6          |
| Backend microservicios      | 25     | Fuerte en local | 18–21        |
| Frontend en la nube         | 15     | React local OK  | 5–7          |
| Funcionamiento end-to-end   | 10     | Parcial         | 6–7          |
| Presentación y trade-offs   | 10     | Por entregar    | 4–6          |
| **Total**                   | **100**|                 | **~45–55**   |

> Prioridad del curso (PDF): *IaC impecable > backend complejo*. El mayor gap es **Terraform + AWS**.

---

## 2. Qué SÍ tiene la base (no repetir)

| Área | Hecho | Ubicación |
| ---- | ----- | --------- |
| Monorepo único | ✅ | Raíz `helpdesk/` |
| API Gateway HTTP → NATS | ✅ | `backend/api-gateway/` |
| tickets-service CRUD + Postgres | ✅ | `backend/tickets-service/` |
| routing-service + eventos | ✅ | `backend/routing-service/` |
| notifications-service | ✅ | `backend/notifications-service/` |
| NATS + Postgres en Docker | ✅ | `docker-compose.yml` |
| Frontend React + MUI CRUD | ✅ | `frontend/` |
| Schema BD + seed agentes | ✅ | `init-db.sql` |
| Documentación arquitectura | ✅ | `ARQUITECTURA.md`, `docs/` |
| Terraform root (sin módulos) | ⚠️ | `terraform/main.tf` |

---

## 3. Gaps críticos (bloquean puntos)

### 3.1 Terraform — 40 pts

- [ ] Crear `terraform/modules/` (vpc, ecs, rds, alb, cloudmap, ecr, iam, security-groups, cloudwatch, s3-frontend)
- [ ] Incluir **api-gateway** en ECR y ECS (hoy solo tickets/routing/notifications en `main.tf`)
- [ ] `terraform plan` / `apply` sin pasos manuales
- [ ] Outputs: DNS ALB + URL frontend
- [ ] `terraform destroy` limpio
- [ ] Security Groups encadenados (mínimo privilegio)

### 3.2 Flujo NATS — validación Grupo 4

PDF exige: *marcar sin asignar si no hay agente*.

- [ ] Tras `ticket.assigned` → actualizar ticket (`estado`, `agente_nombre`, `agente_id`)
- [ ] Tras `ticket.unassigned` → `estado = sin_asignar`
- [ ] Resultado **visible en frontend** sin PATCH manual

Métodos existentes sin usar: `assignToAgent` / `markAsUnassigned` en `tickets.service.ts`.

### 3.3 Frontend en AWS — 15 pts

- [ ] Build `frontend/dist/` desplegado vía Terraform (S3 ± CloudFront)
- [ ] Frontend consume **DNS público del ALB** (no solo proxy local)
- [ ] CORS documentado (`FRONTEND_URL` en api-gateway)

### 3.4 Demo end-to-end — 10 pts

- [ ] Crear ticket → evento → estado/agente visible en UI
- [ ] Logs en CloudWatch (AWS) o `docker compose logs` (local previo)

---

## 4. Reparto por integrante y rúbrica

Ver detalle de ramas y tareas en [`SEPARACION_5_PERSONAS_MULTI_REPO.md`](SEPARACION_5_PERSONAS_MULTI_REPO.md).

| # | Rol | Carpeta(s) | Puntos rúbrica que impacta | Prioridad |
| - | --- | ---------- | -------------------------- | --------- |
| 1 | Frontend | `frontend/` | Frontend (15), E2E (10) | Alta |
| 2 | Tickets + Gateway | `backend/tickets-service/`, `backend/api-gateway/` | Backend (25), E2E | Alta |
| 3 | Routing | `backend/routing-service/` | Backend (25), E2E | Alta |
| 4 | Notifications | `backend/notifications-service/` | Backend (25) | Media |
| 5 | DevOps / IaC | `terraform/`, `docker-compose.yml`, CI opcional | IaC (40), todo AWS | **Crítica** |

---

## 5. Checklist de entrega (PDF sección 7)

```text
[ ] Repo Git: backend (3+ servicios) + frontend + Terraform + README
[ ] README: terraform apply + prueba E2E
[ ] docker-compose.yml funcional
[ ] Diagrama arquitectura (adaptado a gateway + 3 workers)
[ ] Presentación 15–20 min (frontend nube + backend NATS + SGs)
[ ] Demo: levantar infra y flujo completo
```

---

## 6. Puntos extra opcionales (+10)

- [ ] HTTPS ALB (ACM)
- [ ] Secrets Manager
- [ ] Terraform state remoto S3 + lock
- [ ] CI/CD GitHub Actions → ECR → ECS
- [ ] Autoscaling ECS
- [ ] RDS Multi-AZ

---

## 7. Orden de lectura para el equipo

1. [`README_COMPLETO.md`](README_COMPLETO.md) — especificaciones del proyecto (reemplaza PDF)
2. Este documento — estado y rúbrica
3. [`../ARQUITECTURA.md`](../ARQUITECTURA.md) — diseño objetivo
4. [`SEPARACION_5_PERSONAS_MULTI_REPO.md`](SEPARACION_5_PERSONAS_MULTI_REPO.md) — tu rol y rama
5. [`GUIA_IMPLEMENTACION.md`](GUIA_IMPLEMENTACION.md) — pasos de acción
