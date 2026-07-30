# Panel administrativo — Oasis Spa

Aplicación interna para la gestión del spa: agenda, catálogo de servicios,
equipo, base de clientas, promociones y reportes.

**No es una PWA a propósito.** Se usa desde un computador del establecimiento;
instalarla o hacerla funcionar sin conexión no aporta nada y llevaría código
innecesario a quien no lo necesita. La PWA es la aplicación de la clienta
(`frontend-cliente`).

```bash
npm install
npm run dev      # http://localhost:5174
```

## Acceso

Sólo entran cuentas con rol `admin` o `especialista`. Una clienta con
credenciales válidas es rechazada en la pantalla de acceso, y el backend repite
la comprobación con `@Roles(...)`: la interfaz nunca es la única barrera.

No hay registro: las cuentas de personal las crea la administración.

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administración | `admin@oasisspa.ec` | `admin1234` |

## Relación con la aplicación de la clienta

Son dos proyectos independientes por decisión de diseño. Comparten el contrato
con la API pero **no comparten código**: `types/`, `api/`, `services/` y los
tokens de estilo están duplicados en ambos.

La contrapartida es conocida: al cambiar la API hay que actualizar los dos
lados. Si empiezan a divergir, la alternativa es extraer un paquete compartido.

## Capa de datos

Igual que la aplicación de la clienta: `VITE_USE_MOCK=true` resuelve contra el
repositorio local; con `false` consume la API NestJS de `VITE_API_URL`.
Ver `.env.example`.
