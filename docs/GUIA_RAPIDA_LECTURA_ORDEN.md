# 🚀 INICIO RÁPIDO - Proyecto Helpdesk Grupo 4

## 📌 LECTURA EN ORDEN (Sigue este orden)

### Fase 1: Entendimiento (30 minutos)

```text
1. LEE PRIMERO: 
   └─ 00_INDICE_ARCHIVOS.md (este archivo)

2. LUEGO:
   └─ ESTRUCTURA_PROYECTO.md (overview de componentes)

3. FRONTEND:
   └─ FRONTEND.md (React + MUI — estructura y desarrollo)

4. DESPUÉS:
   └─ FLUJO_EVENTOS_COMPLETO.md (paso a paso visual)
```

### Fase 2: Organización del equipo (opcional)

```text
4. Roles y carpetas en el monorepo:
   └─ SEPARACION_5_PERSONAS_MULTI_REPO.md (referencia histórica de roles)

   Decisión tomada: MONOREPO único — todo en helpdesk/
```

> El análisis Monorepo vs Multi-Repo ya no aplica: el equipo eligió un solo repositorio.

### Fase 3: Implementación (1-2 horas)

```text
7. Paso a paso técnico:
   └─ 21_GUIA_IMPLEMENTACION.md

8. Referencia completa:
   └─ 18_README.md (la biblia del proyecto)
```

### Fase 4: Codificación (El trabajo real)

```text
Pueden consultar los archivos específicos:
├─ Tickets Service: 01-05_tickets-service*
├─ Routing Service: 06-08_routing-service*
├─ Notifications: 09_notifications-service*
├─ Frontend: 10-12_frontend*
├─ Docker: 13-14_docker-compose*
└─ Terraform: 15-17_terraform*
```

---

## 🎯 RESPUESTAS RÁPIDAS

### P1: ¿Cómo dividimos el trabajo?

#### En este monorepo (carpetas por rol)

```text
Persona 1: frontend/          — React + MUI
Persona 2: backend/tickets-service/
Persona 3: backend/routing-service/
Persona 4: backend/notifications-service/
Persona 5: terraform/ + docker-compose.yml
```

**VENTAJAS del monorepo para equipo pequeño:**

- ✅ Un solo clone y un solo `docker compose up`
- ✅ Cambios frontend + API en un mismo PR
- ✅ Contrato NATS visible en el mismo repo

**Referencia de roles:** `SEPARACION_5_PERSONAS_MULTI_REPO.md` (escrito para multi-repo; adaptar a carpetas).

---

### P2: ¿Monorepo o Multi-Repo?

**Decisión del proyecto: MONOREPO** — un solo repositorio con `frontend/`, `backend/` y
`terraform/`. Para un equipo pequeño y un proyecto educativo acoplado con Docker Compose,
es la opción más simple (un clone, un PR, un `docker compose up`).

El documento de análisis comparativo fue retirado porque la decisión ya está tomada.

---

### P3: ¿Cómo empezamos?

#### PASO 1: Crear 5 repos en GitHub

```bash
# Persona 5 (DevOps) hace esto:
gh repo create grupo-4-helpdesk/helpdesk-frontend
gh repo create grupo-4-helpdesk/helpdesk-tickets-service
gh repo create grupo-4-helpdesk/helpdesk-routing-service
gh repo create grupo-4-helpdesk/helpdesk-notifications-service
gh repo create grupo-4-helpdesk/helpdesk-infrastructure
```

#### PASO 2: Cada persona clona su repo

```bash
# Persona 1
git clone https://github.com/grupo-4-helpdesk/helpdesk-frontend.git

# Persona 2
git clone https://github.com/grupo-4-helpdesk/helpdesk-tickets-service.git

# etc...
```

#### PASO 3: Estructura local de carpetas

```text
helpdesk/
├── helpdesk-frontend/
├── helpdesk-tickets-service/
├── helpdesk-routing-service/
├── helpdesk-notifications-service/
└── helpdesk-infrastructure/
```

#### PASO 4: Levantar stack

```bash
cd helpdesk-infrastructure
docker-compose up --build
```

**VER:** `21_GUIA_IMPLEMENTACION.md` (Fase 1-2)

---

### P4: ¿Qué es el flujo de eventos?

**SIMPLE:**

```text
Usuario crea ticket en Frontend
         ↓
POST /tickets (API)
         ↓
Tickets Service guarda + publica: "ticket.created"
         ↓
NATS broker (message bus)
         ↓
Routing Service escucha:
├─ Busca agente disponible en BD
├─ SI encontró: publica "ticket.assigned"
└─ SI no hay: publica "ticket.unassigned"
         ↓
NATS broker
         ↓
Notifications Service:
├─ Escucha "ticket.assigned"
├─ Envía email a agente + solicitante
└─ Guarda en tabla notifications
         ↓
Frontend polling (GET /tickets)
         ↓
Usuario ve: "Tu ticket fue asignado a Juan"
```

**VER:** `20_FLUJO_EVENTOS_COMPLETO.md` (visual completo)

---

### P5: ¿Qué debo codificar?

**CADA PERSONA:**

**Persona 1 (Frontend):**

- HTML: Formulario + tabla + modal
- CSS: Responsive, profesional
- JS: Fetch, polling, CRUD actions

**Personas 2,3,4 (Backend):**

- TypeScript + NestJS
- Controllers + Services
- Unit tests
- TypeORM (si usan BD)

**Persona 5 (Infrastructure):**

- Terraform HCL
- docker-compose.yml
- PostgreSQL schema (init-db.sql)
- AWS configuration

**Archivos de referencia por persona:**

| Persona      | Ver Archivos                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------- |
| 1 (Frontend) | `frontend/src/`, `docs/FRONTEND.md` — React + MUI + Vite                                        |
| 2 (Tickets)  | `01_tickets-service_main.ts`, `02_tickets-service_entities.ts`, `03-05_tickets-service*`        |
| 3 (Routing)  | `06_routing-service_main.ts`, `07_routing-service_logic.ts`, `08_routing-service_controller.ts` |
| 4 (Notif)    | `09_notifications-service.ts`                                                                   |
| 5 (DevOps)   | `13_docker-compose.yml`, `14_init-db.sql`, `15-17_terraform*`                                   |

---

### P6: ¿Cuál es el timeline?

**SEMANA 1:** Setup + Scaffolding (3 días)

```text
Día 1: Kick-off, crear repos, docker-compose local
Día 2-3: Cada uno su estructura base
Día 4-5: Tests tempranos
```

**SEMANA 2:** Desarrollo (5 días)

```text
Personas 2,3,4: Implementan servicios
Persona 1: Frontend completo
Persona 5: Terraform + CI/CD
Daily standups (15 min)
```

**SEMANA 3:** Testing + Deploy (3 días)

```text
E2E testing local
AWS deployment
Troubleshooting
```

**SEMANA 4:** Presentación (2 días)

```text
Preparar slides
Ensayar demo
Presentación
```

---

## 📚 TODOS LOS ARCHIVOS (23 archivos)

### Documentación (5)

- `00_INDICE_ARCHIVOS.md` ← TÚ ERES AQUÍ
- `18_README.md` (biblia del proyecto)
- `ESTRUCTURA_PROYECTO.md` (overview)
- `20_FLUJO_EVENTOS_COMPLETO.md` (visual)
- `GUIA_IMPLEMENTACION.md` (paso a paso)
- `SEPARACION_5_PERSONAS_MULTI_REPO.md` (roles — referencia histórica)
- `FRONTEND.md` (frontend React)

### Backend (9)

- Tickets Service: 01-05
- Routing Service: 06-08
- Notifications Service: 09

### Frontend (React)

- `frontend/src/` — componentes, hooks, páginas
- `docs/FRONTEND.md` — guía del frontend

### Docker (2)

- 13_docker-compose.yml
- 14_init-db.sql

### Terraform (3)

- 15_terraform_main.tf
- 16_terraform_variables.tf
- 17_terraform_tfvars_example.txt

### Config (1)

- 19_.gitignore

---

## 🎓 Qué Aprenderán

✅ **Arquitectura de Microservicios**

- Servicios independientes
- Comunicación asíncrona
- Service discovery

✅ **Full Stack Cloud**

- Frontend: S3 + CloudFront
- Backend: ECS Fargate
- Database: RDS PostgreSQL
- Message Queue: NATS

✅ **Infrastructure as Code**

- Terraform + AWS
- Reproducible deployments
- Version control for infra

✅ **Trabajo en Equipo Real**

- Git workflow profesional
- CI/CD pipelines
- Code reviews
- Distributed teams

✅ **DevOps Practices**

- Docker
- CloudWatch logging
- Security Groups
- Health checks

---

## ⚠️ Errores Comunes (Evita)

❌ **No coordinar cambios en el monorepo**

- Resultado: Merge conflicts entre carpetas
- Solución: Ramas por feature, PRs pequeños, comunicar quién toca qué carpeta

❌ **No definir interfaces** entre servicios

- Resultado: Incompatibilidades
- Solución: Acuerda eventos/API PRIMERO

❌ **Cambiar formato de eventos a mitad**

- Resultado: Otros servicios se rompen
- Solución: Version los eventos (v1, v2)

❌ **Tardar 2 horas esperando la BD**

- Resultado: Tiempo perdido
- Solución: Usa docker-compose local

❌ **Hardcodear IPs en lugar de DNS**

- Resultado: Rompe en AWS
- Solución: CloudMap siempre

❌ **No hacer tests**

- Resultado: Bugs encontrados en demo
- Solución: Unit tests mientras codeas

---

## 🎯 Próximas Acciones

### HOY

```text
[ ] Reunión con grupo (30 min)
[ ] Asignar personas a carpetas/roles en el monorepo (ver SEPARACION_5_PERSONAS)
[ ] Hacer 1 docker compose local que funcione
```

### MAÑANA

```text
[ ] Persona 1: Frontend HTML base
[ ] Persona 2: Tickets Service scaffold
[ ] Persona 3: Routing Service scaffold
[ ] Persona 4: Notifications Service scaffold
[ ] Persona 5: Terraform base + docker-compose
```

### SEMANA 1

```text
[ ] Todos: Servicios básicos funcionales
[ ] Todos: Poder hacer docker-compose up
[ ] Todos: E2E flow: crear ticket → ver asignado
```

---

## 📞 Preguntas Frecuentes

**P: ¿Cuánto tiempo para todo?**
R: 20-40 horas (depende experiencia). Semana educativa.

**P: ¿Si alguien está atrasado?**
R: Divide trabajo más fino. Persona 5 ayuda a quien esté bloqueado.

**P: ¿Por qué monorepo y no un repo por servicio?**
R: Equipo pequeño, proyecto acoplado con Docker Compose. Menos overhead que 5 repos.

**P: ¿Necesito AWS credits?**
R: $15 free tier debería ser suficiente. Si no, usar localhost + docker-compose.

**P: ¿Puedo agregar más personas?**
R: Sí, asignar carpetas o features por rama. El monorepo escala bien hasta ~5-8 colaboradores activos.

**P: ¿Y después de presentación?**
R: Este proyecto = portfolio. Muéstralo en interviews. 💼

---

## 🏆 Al Final del Proyecto Tendrán

✅ 1 repo en GitHub (monorepo)  
✅ 1 docker compose que levanta todo  
✅ 4 servicios backend (api-gateway + 3 workers)  
✅ Frontend React en Nginx / S3  
✅ Terraform reproducible para AWS  
✅ Demo end-to-end funcionando  
✅ Presentación profesional  
✅ Portfolio real para conseguir job  

---

## 💼 Para el CV

```text
Proyecto: Sistema de Mesa de Ayuda (Helpdesk)
Equipo: 5 desarrolladores
Rol: [Tu rol específico]

Stack:
├─ Backend: NestJS, TypeScript, PostgreSQL
├─ Frontend: HTML5, CSS3, JavaScript
├─ Message Queue: NATS
├─ Infrastructure: Terraform, AWS (ECS, RDS, ALB)
├─ DevOps: Docker, CloudWatch, CloudMap
└─ Metodología: Scrum, Git Flow, CI/CD

Aprendizaje:
├─ Microservicios y comunicación asíncrona
├─ Infrastructure as Code
├─ Cloud (AWS)
├─ Trabajo en equipo distribuido
└─ Full Stack development
```

---

## 🚀 ¡VAMOS

**Próximo paso:** Lee `GUIA_IMPLEMENTACION.md`

Luego: Comienza el trabajo real.

---

**Tiempo estimado para leer esta guía:** 10 minutos
**Tiempo estimado para entender el proyecto:** 1 hora
**Tiempo estimado para implementar:** 20-40 horas

**Total:** 21-41 horas de trabajo = Proyecto educativo sólido. 🎓

¡Éxito! 🚀
