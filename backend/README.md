# API Oasis Spa (NestJS)

Backend del sistema de gestión de citas y servicios para spas de belleza.
Stack: **NestJS + TypeORM + PostgreSQL (Supabase)**.

## Estado

| Fase | Alcance | Estado |
| --- | --- | --- |
| 1 | Entidades y esquema de base de datos | ✅ completada |
| 2 | Endpoints REST — módulo `auth` | ✅ completado |
| 2 | Endpoints REST — `services`, `appointments`, `reports`, recordatorios | pendiente |
| 3 | `/api/luna/chat` con ejecución de funciones (tool use) | pendiente |

## Autenticación

La identidad la gestiona **Supabase Auth**; NestJS actúa de intermediario para
que el refresh token viaje en una **cookie httpOnly** y no en `localStorage`.

| Método | Ruta | Acceso |
| --- | --- | --- |
| POST | `/api/auth/register` | público (siempre rol `cliente`) |
| POST | `/api/auth/login` | público |
| POST | `/api/auth/refresh` | público (usa la cookie) |
| POST | `/api/auth/logout` | público |
| GET | `/api/auth/me` | sesión válida |

El access token se verifica **localmente contra el JWKS de Supabase** (ES256),
sin llamar a GoTrue en cada petición. El rol no se lee del token sino de la
tabla `users`, para que revocar permisos surta efecto de inmediato.

Los guards son **globales**: todo endpoint exige sesión salvo que se marque con
`@Public()`, y `@Roles(...)` restringe por rol.

## Puesta en marcha

```bash
npm install
```

Copia `.env.example` a `.env` y completa los datos de conexión (en Supabase:
*Project Settings → Database → Connection string*).

```bash
npm run migration:run   # crea el esquema
npm run seed            # carga datos de demostración
npm run start:dev       # API en http://localhost:3000/api
```

## Arquitectura

**Monolito modular**, no microservicios. Cada dominio es un módulo generado con
`nest g resource`, con su entidad, repositorio, servicio, controlador y DTOs.
Los módulos se comunican **inyectando el servicio del otro, nunca su
repositorio**: `TypeOrmModule.forFeature` publica cada repositorio sólo dentro
de su módulo, así que el límite de responsabilidad está garantizado por el
contenedor de dependencias y no por disciplina del programador.

Se descartaron los microservicios porque crear una cita exige leer la duración
del servicio y la agenda de la especialista en la **misma transacción**, y la
restricción que impide solapes vive en una sola base. Repartirlo en procesos
obligaría a transacciones distribuidas sin ninguna ganancia para el volumen de
un spa.

```
src/
  config/database.config.ts        Conexión a PostgreSQL para la aplicación
  database/
    entities.ts                    Registro único de entidades
    data-source.ts                 DataSource para la CLI (migraciones y seed)
    migrations/                    Esquema versionado y reversible
    seeds/seed.ts                  Datos iniciales (los mismos del frontend)
  modules/
    <dominio>/
      <dominio>.module.ts          Límite del módulo: qué importa y qué exporta
      <dominio>.controller.ts      Endpoints (Fase 2)
      <dominio>.service.ts         Lógica de negocio (Fase 2)
      dto/                         Validación de entrada con class-validator
      entities/*.entity.ts         Modelo de dominio
docs/modelo-datos.md               Diagrama ER y justificación de cada decisión
```

Dependencias entre módulos:

```
categories ← services ← promotions
     ↑          ↑
specialists     └── reviews
     ↑          ↑
     └── appointments → users
                ↓
          notifications
```

`notifications` no depende de nadie: es un servicio de salida al que los demás
le piden emitir avisos, lo que evita ciclos.

## Modelo de datos

Las entidades son la fuente de verdad: el esquema se deriva de ellas, no al
revés. El diagrama entidad-relación y el razonamiento detrás de cada decisión
(por qué la categoría es una tabla, por qué la cita duplica precio y duración,
por qué el solape se impide en la base) están en
[`docs/modelo-datos.md`](docs/modelo-datos.md).

## Migraciones

```bash
npm run migration:run       # aplica las pendientes
npm run migration:revert    # deshace la última
npm run migration:generate  # genera una nueva a partir de cambios en entidades
npm run schema:log          # muestra el SQL que faltaría aplicar, sin ejecutarlo
```

`synchronize` está desactivado a propósito: todo cambio de esquema pasa por una
migración revisable.

## Cuentas de demostración

Tras ejecutar el seed:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Clienta | `adriana.torres@email.com` | `demo1234` |
| Administración | `admin@oasisspa.ec` | `admin1234` |
