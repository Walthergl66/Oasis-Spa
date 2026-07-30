# PWA de la clienta — Oasis Spa

Aplicación con la que la clienta explora servicios, consulta promociones,
reserva citas y conversa con **Luna**, el asistente virtual.

Es la aplicación destinada a convertirse en PWA: se abre desde el navegador del
móvil, sin pasar por una tienda de aplicaciones. La gestión interna del spa vive
en un proyecto aparte (`frontend-admin`).

```bash
npm install
npm run dev      # http://localhost:5173
```

## Rutas

| Ruta | Acceso |
| --- | --- |
| `/` `/services` `/promotions` | públicas: se puede ver la oferta sin cuenta |
| `/booking` `/appointments` `/profile` | requieren sesión |
| `/login` `/register` | acceso y alta de clientas |

No existe ninguna ruta `/admin`: el panel es otra aplicación.

| Cuenta de prueba | Contraseña |
| --- | --- |
| `adriana.torres@email.com` | `demo1234` |

## Capa de datos

`VITE_USE_MOCK=true` resuelve contra el repositorio local (localStorage);
con `false` consume la API NestJS de `VITE_API_URL`. Ver `.env.example`.
