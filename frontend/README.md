# Oasis Spa — PWA de gestión de citas y servicios

Aplicación web progresiva del sistema. Contiene los tres componentes que
describe el proyecto: **cliente**, **administrativo** y el asistente virtual
**Luna**.

```bash
npm install
npm run dev      # http://localhost:5173
```

## Rutas

| Ruta | Componente | Acceso |
| --- | --- | --- |
| `/` `/services` `/promotions` | cliente | público: se ve la oferta sin cuenta |
| `/booking` `/appointments` `/profile` | cliente | requiere sesión |
| `/admin/*` | administrativo | requiere rol `admin` o `especialista` |
| `/login` `/register` | — | acceso y alta de clientas |

## Carga diferida del componente administrativo

Es **una sola aplicación**: un despliegue, un manifiesto PWA. Pero las rutas
`/admin/*` se importan con `React.lazy`, así que su código viaja en fragmentos
aparte que sólo se descargan cuando alguien entra al panel.

Comprobado en ejecución: navegando como clienta por `/`, `/services` y
`/promotions` no se descarga ningún módulo del panel; al entrar una cuenta de
administración aparecen `Dashboard`, `StatsCard`, `Table` y `reports.service`.

La protección de rutas del navegador es sólo de interfaz: el backend repite la
comprobación de rol con `@Roles(...)` en cada endpoint.

## Cuentas de prueba

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Clienta | `adriana.torres@email.com` | `demo1234` |
| Administración | `admin@oasisspa.ec` | `admin1234` |

## Capa de datos

`VITE_USE_MOCK=true` resuelve contra el repositorio local (localStorage);
con `false` consume la API NestJS de `VITE_API_URL`. Ver `.env.example`.
