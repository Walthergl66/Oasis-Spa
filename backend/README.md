# API Oasis Spa (NestJS)

Backend del sistema de gestión de citas y servicios para spas de belleza.
Stack: **NestJS + TypeORM + PostgreSQL (Supabase)**.

## Estado

| Fase | Alcance | Estado |
| --- | --- | --- |
| 1 | Entidades y esquema de base de datos | ✅ completada |
| 2 | Endpoints REST — módulo `auth` | ✅ completado |
| 2 | Endpoints REST — `services`, `categories`, `specialists` | ✅ completado |
| 2 | Endpoints REST — `appointments` (disponibilidad y reservas) | ✅ completado |
| 2 | Endpoints REST — `reports`, `reviews`, recordatorios por correo | pendiente |
| 3 | `/api/luna/chat` con ejecución de funciones (tool use) | pendiente |

## Autenticación

La identidad la gestiona **Supabase Auth (GoTrue)**: contraseñas, confirmación
de correo y recuperación. `public.users` es sólo el perfil de dominio, con el
mismo `id` que `auth.users` y `ON DELETE CASCADE`.

NestJS actúa de intermediario para que el refresh token viaje en una **cookie
httpOnly** y no en `localStorage`, que sería accesible a cualquier script.

| Método | Ruta | Acceso |
| --- | --- | --- |
| POST | `/api/auth/register` | público — envía correo de confirmación, no da sesión |
| POST | `/api/auth/verify-email` | público — confirma con el token del correo |
| POST | `/api/auth/resend-verification` | público |
| POST | `/api/auth/login` | público — exige correo confirmado |
| POST | `/api/auth/refresh` | público — usa la cookie |
| POST | `/api/auth/logout` | público |
| POST | `/api/auth/forgot-password` | público — responde igual exista o no la cuenta |
| POST | `/api/auth/reset-password` | público — token de un solo uso |
| GET | `/api/auth/me` | sesión válida |

El access token se verifica **localmente contra el JWKS de Supabase** (ES256),
sin llamar a GoTrue en cada petición. El rol no se lee del token sino de la
tabla `users`, para que revocar permisos surta efecto de inmediato.

Los guards son **globales**: todo endpoint exige sesión salvo que se marque con
`@Public()`, y `@Roles(...)` restringe por rol.

En desarrollo, los correos los captura **Mailpit** en http://127.0.0.1:54324.

## Citas y disponibilidad

El módulo `appointments` concentra la lógica del negocio:

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | `/api/appointments/availability` | público — horarios libres de un servicio |
| GET | `/api/appointments/mine` | sesión — `?scope=upcoming|history` |
| GET | `/api/appointments/agenda` | admin / especialista |
| POST | `/api/appointments` | sesión |
| PATCH | `/api/appointments/:id/reschedule` | dueña de la cita o personal |
| PATCH | `/api/appointments/:id/cancel` | dueña de la cita o personal |
| PATCH | `/api/appointments/:id/status` | admin / especialista |

**Disponibilidad.** Franjas de 30 minutos entre la apertura y el cierre, según
el día de la semana (lun-sáb 09:00-18:00, dom 10:00-14:00). Una franja se
ofrece si alguna especialista habilitada en la categoría del servicio tiene el
bloque completo libre. Los horarios ya pasados no se muestran.

**Concurrencia.** El servicio valida disponibilidad antes de insertar, pero no
confía sólo en eso: entre la comprobación y el INSERT puede colarse otra
reserva. Esa carrera la corta la restricción `appointments_no_overlap` de la
base y se traduce a un 409. Verificado con 5 peticiones simultáneas a la misma
franja: una tuvo éxito, cuatro recibieron 409, ninguna 500.

**Zona horaria.** Fecha y hora viajan separadas y en horario del spa; el
servidor las combina con desfase fijo `-05:00`, así que el resultado no depende
de dónde se ejecute la API.

## Puesta en marcha (desarrollo local)

```bash
npm install
npx supabase start          # desde la raíz del repositorio
cp .env.example .env        # los valores locales ya vienen indicados
npm run migration:run       # crea el esquema
npm run seed                # datos de demostración (SÓLO local)
npm run start:dev           # API en http://localhost:3000/api
```

Los correos de confirmación y recuperación los captura **Mailpit** en
http://127.0.0.1:54324.

## Puesta en marcha (Supabase en la nube)

1. **Conexión**: en el panel, *Project Settings → Database → Connection string*,
   pestaña **Session pooler**. Copia esos valores al bloque `DB_*` de `.env`
   con `DB_SSL=true`. No uses el *Transaction pooler* (puerto 6543): no admite
   sentencias preparadas y TypeORM las necesita.

2. **Claves de Auth**: *Project Settings → API* → `URL`, `anon` y
   `service_role`. La `service_role` nunca debe salir del servidor.

3. **Configuración de Auth**: en *Authentication → URL Configuration*, fija el
   `Site URL` y añade a *Redirect URLs* `<APP_URL>/verificar-correo` y
   `<APP_URL>/restablecer-clave`. Sin esto, los enlaces de los correos no
   vuelven a la aplicación.

4. **Confirmación de correo**: en *Authentication → Sign In / Providers →
   Email*, activa *Confirm email*.

5. **SMTP propio**: el servicio de correo incluido está limitado a unos pocos
   envíos por hora y no sirve para producción. Configura tu SMTP en
   *Authentication → Emails → SMTP Settings*.

6. **Esquema y catálogo**:

```bash
npm run migration:run
ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:catalogo
```

`seed:catalogo` inserta sólo lo que falta (categorías, servicios,
especialistas, promociones) y **no borra nada**. El `seed` de demostración se
niega a ejecutarse contra una base que no sea local.


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
