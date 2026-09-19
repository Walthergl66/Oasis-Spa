# Oasis Spa API — Backend NestJS

API REST modular + asistente virtual para la gestión de citas de un spa de belleza.
Documento rector: `../doc/plan-backend-nestjs.md`. Estado por sprint: `../agent.md`.

## Stack

NestJS 12 + TypeScript · PostgreSQL 16 (`btree_gist`) · TypeORM · JWT (access + refresh) ·
`class-validator` · Swagger (`/api/docs`) · Web Push (VAPID) · `@nestjs/schedule` ·
`@nestjs/event-emitter` · `@nestjs/throttler` · helmet · Vitest + Supertest.

## Puesta en marcha

```bash
cp .env.example .env        # ajustar JWT, VAPID, LLM_PROVIDER, ADMIN_*
docker compose up -d        # PostgreSQL 16
npm install
npm run seed                # catálogo realista + especialistas + clientes SUS (idempotente)
npm run start:dev           # http://localhost:3000/api/v1
```

Swagger: `http://localhost:3000/api/docs`. El primer arranque crea el admin
(`ADMIN_EMAIL` / `ADMIN_PASSWORD`) y la restricción GiST anti doble reserva.

## Scripts

| Comando | Uso |
|---|---|
| `npm run build` / `start:prod` | Compilar / correr `dist/main` |
| `npm test` | Unitarios (Vitest) |
| `npm run test:e2e` | `health` (sin DB) + `flows` (requiere Postgres) |
| `npm run seed` | Seed SUS realista |
| `npm run lint` | oxlint con type-aware |

## Módulos y endpoints principales

| Módulo | Prefijo | Notas |
|---|---|---|
| `auth` / `users` | `/auth`, `/users` | Registro, login, refresh, roles CLIENT/EMPLOYEE/ADMIN |
| `services` | `/services` | CRUD admin, catálogo público (`/active`) |
| `employees` | `/employees` | Perfiles N:M con servicios, horarios y descansos |
| `availability` | `/availability` | Slots libres (público, calculado en UTC) |
| `appointments` | `/appointments` | Reserva transaccional, confirmar/completar/no-show, cancelar y reprogramar con margen 2h |
| `notifications` | `/notifications` | Suscripciones Push, VAPID público, outbox admin, recordatorio diario 8am |
| `assistant` | `/assistant/chat` | Chat con historial + `LlmProvider` (`LLM_PROVIDER=mock\|openai\|gemini`) + 6 tools con confirmación en dos pasos |
| `dashboard` | `/dashboard` | Solo admin: KPIs, top servicios, ocupación, historial |
| `payments` | `/payments` | Anticipos (un activo por cita, anulación con traza) |

## Reglas de oro

1. El asistente solo consume servicios del backend; jamás SQL directo (RF-20, RNF-11).
2. Fechas en UTC; hora local del spa (UTC-5) solo al mostrar.
3. Doble protección anti solapamiento: `AvailabilityService.isSlotAvailable` + exclusión GiST
   `no_overlapping_appointments` (`tstzrange &&`, excluye canceladas).
4. Respuestas estándar `{ success, data, timestamp }`, rate limit 100 req/min y headers helmet.

## Variables clave

`PORT`, `API_PREFIX=api/v1`, `DB_*`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
`VAPID_PUBLIC/PRIVATE_KEY`, `VAPID_SUBJECT`, `LLM_PROVIDER`, `OPENAI_API_KEY`,
`GEMINI_API_KEY`, `LLM_MODEL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SPA_TIMEZONE`.
