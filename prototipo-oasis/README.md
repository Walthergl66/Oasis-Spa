# Prototipo funcional — Spa & Belleza

Prototipo interactivo del sistema de gestión de citas y asistente virtual, construido en React + Vite, siguiendo el stack tecnológico definido en el Capítulo II de la tesis.

## Requisitos previos

- Node.js instalado (versión 18 o superior). Descárgalo de https://nodejs.org si no lo tienes.

## Instalación

1. Copia esta carpeta completa a:
   `C:\Users\walth\Documents\SEPTIMO\Titulacion\prototipo`

2. Abre una terminal (CMD o PowerShell) dentro de esa carpeta.

3. Instala las dependencias:
   ```
   npm install
   ```

4. Inicia el servidor de desarrollo:
   ```
   npm run dev
   ```

5. Abre el navegador en la dirección que aparece en la terminal (normalmente `http://localhost:5173`).

## Qué incluye el prototipo

**Vista Cliente:**
- Inicio — panel de bienvenida con estadísticas y servicios destacados
- Servicios — catálogo filtrable por categoría
- Reservar — modal funcional de 2 pasos: fecha/hora → especialista → confirmación
- Mis Reservas — listado de citas con ubicación (Manta, Ecuador)
- **Asistente Luna** — chat funcional que interpreta la intención del usuario y ejecuta un flujo real de reserva paso a paso, mostrando explícitamente cuándo invoca `consultarDisponibilidad()` y `registrarCita()` (documentado en la sección 2.7 del Marco Teórico)

**Vista Admin:**
- Dashboard — KPIs del día y agenda con estados
- Gestión de Servicios — tabla del catálogo
- Especialistas — disponibilidad del personal

Usa el selector "Vista Cliente / Vista Admin" en la esquina inferior izquierda para alternar entre ambas — es solo una herramienta de este prototipo para la defensa, no forma parte del sistema final (en el sistema real, cada rol tendría su propio inicio de sesión).

## Nota importante para la tesis

Este es un **prototipo de interfaz con lógica simulada en el frontend** (no tiene backend real ni base de datos). Las funciones `consultarDisponibilidad()` y `registrarCita()` que invoca Luna están simuladas en `src/data.js` para demostrar el comportamiento esperado del asistente. En el desarrollo real (Capítulo IV), estas funciones se implementarán como endpoints del backend en NestJS, consultando la base de datos PostgreSQL real a través de Supabase.

## Estructura del proyecto

```
prototipo/
├── public/
│   └── img/                      (Fotografías de los servicios — ver CREDITOS-IMAGENES.md)
├── src/
│   ├── components/
│   │   ├── ClientHome.jsx        (Inicio)
│   │   ├── ClientServices.jsx    (Catálogo)
│   │   ├── ClientReservations.jsx (Mis Reservas)
│   │   ├── BookingModal.jsx      (Flujo de reserva)
│   │   ├── LunaChat.jsx          (Asistente virtual)
│   │   └── AdminViews.jsx        (Dashboard, Servicios, Especialistas admin)
│   ├── App.jsx                   (Navegación principal)
│   ├── data.js                   (Datos de ejemplo y funciones simuladas)
│   └── index.css                 (Estilos y paleta de diseño)
├── index.html
├── package.json
└── vite.config.js
```
