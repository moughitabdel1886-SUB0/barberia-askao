# Barbería Askao

Sitio web completo de **Barbería Askao** (Peluquería – Barbería AT-MAN, Askao Kalea 27, Casco Viejo de Bilbao): web pública en cuatro idiomas, reservas online con control de disponibilidad, panel privado para el negocio y base de datos MySQL.

## Qué incluye

- **Web pública**: hero con poste de barbero 3D, secciones de estudio, precios, galería de fotos y vídeos con lightbox, reservas, reseñas de Google y ubicación con mapa.
- **Diseño claro y onírico**: crema, azul cobalto, rojo bermellón y negro; nubes, partículas y tipografía editorial. Responsive y con alternativa CSS/SVG cuando el equipo no puede con WebGL o prefiere menos movimiento.
- **Cuatro idiomas**: español (por defecto), inglés, francés y alemán. La elección se guarda en el navegador.
- **Reservas**: nombre, teléfono, email opcional, servicio, fecha, hora y notas. Solo se ofrecen huecos libres dentro del horario, se respetan bloqueos y antelación, y una restricción única en base de datos impide la doble reserva incluso con peticiones simultáneas.
- **Emails**: aviso al negocio y confirmación al cliente mediante Resend. Sin proveedor configurado, los mensajes quedan en una bandeja de salida visible en el panel.
- **Panel `/admin`**: resumen, reservas en lista y calendario, servicios y precios, galería, horarios/bloqueos, contacto, valoración, contraseña y estado de emails. Adaptado a móvil.
- **SEO y accesibilidad**: título, descripción, Open Graph, datos estructurados `HairSalon`, HTML inicial con contenido legible sin JavaScript, textos alt, foco visible y contraste cuidado.

## Stack

- React 19 + Vite 7 + TypeScript
- Tailwind CSS 4, Framer Motion, Three.js / React Three Fiber
- Express + tRPC 11 + Drizzle ORM + MySQL 8
- Sesiones propias de administración con `scrypt`, cookies `HttpOnly` y CSRF
- Resend para email; almacenamiento gestionado de Manus para archivos

## Estructura

```text
client/                 Interfaz pública y panel
  src/sections/         Hero, estudio, precios, galería, reservas, reseñas, ubicación
  src/pages/admin/      Panel privado por pestañas
  src/components/       Componentes de marca, 3D y UI
  public/               Favicon, manifiesto, imágenes de galería y OG
server/                 API Express + tRPC
  auth.ts               Contraseñas, sesiones y primer acceso
  booking.ts            Disponibilidad y creación transaccional
  email.ts              Resend y bandeja de salida
  repo.ts               Acceso a datos y ajustes
  routers.ts            Procedimientos públicos y de administración
  storage.ts            Subidas al almacenamiento de Manus
shared/                 Reglas de reservas, tipos e i18n
drizzle/                Esquema y migraciones
docs/                   Esquema SQL y guía de despliegue
```

## Puesta en marcha local

Requisitos: Node.js 22, pnpm 10 y MySQL 8.

```bash
pnpm install
cp .env.example .env
# edita DATABASE_URL en .env
pnpm db:migrate
pnpm dev
```

Abre `http://localhost:3000`. El servidor también atiende la API en `/api/trpc` y la salud en `/api/health`.

Comandos útiles:

```bash
pnpm check          # TypeScript
pnpm test           # pruebas de reglas de disponibilidad
pnpm build          # build de producción (dist/)
pnpm start          # servidor de producción
pnpm db:push        # genera y aplica una migración nueva
```

## Primer acceso al panel

Entra en `http://localhost:3000/admin`.

- Si no existe ningún administrador, verás **Crea la cuenta del negocio**. El email viene preparado como `barberiaaskao@gmail.com`; elige una contraseña de al menos 10 caracteres.
- El formulario pide un **token de primer acceso** para que un visitante anónimo no pueda reclamar el panel. Si defines `ADMIN_SETUP_TOKEN`, usa ese valor. Si lo dejas vacío, el servidor genera uno aleatorio y lo imprime en los logs al arrancar: búscalo en la salida del servidor o en los logs del proyecto. En producción, define `ADMIN_SETUP_TOKEN` para que sea estable.
- También puedes definir `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el entorno antes del primer arranque. La contraseña **nunca** se guarda en el frontend: se almacena con hash `scrypt` y sal aleatoria.
- La sesión dura 30 días, se puede cerrar desde el panel y se invalida al cambiar la contraseña.
- Si pierdes la contraseña y no tienes otro administrador, elimina la fila correspondiente de `admin_users` en la base de datos, reinicia el servidor y vuelve a abrir `/admin` con un token nuevo. No hay recuperación por email.

## Emails con Resend

1. Crea una cuenta en [Resend](https://resend.com) y verifica el dominio desde el que enviarás (por ejemplo, `barberia-askao.com`).
2. Añade `RESEND_API_KEY` y `EMAIL_FROM` a los secretos del proyecto (en Manus: panel del proyecto → Secrets) o a `.env` en local.
3. Reinicia el servidor. En `/admin → Ajustes` aparecerá **Email configurado** y podrás reintentar los mensajes en cola.

Sin clave, el flujo de reservas sigue funcionando: se guardan las citas y los emails quedan en cola. Es intencionado para no perder solicitudes mientras se termina de configurar el dominio.

## Datos y contenido

Los textos legales de privacidad son una base razonable, pero deben revisarse con el negocio antes de publicar. La dirección y el mapa se toman del local real; teléfono, WhatsApp, email, redes, valoración y horario se editan desde `/admin`. Las fotos y vídeos subidos desde el panel se guardan en el almacenamiento gestionado y se sirven bajo `/manus-storage/`.

## Despliegue

La vía recomendada es publicar desde Manus (el proyecto ya está preparado con servidor, base de datos y almacenamiento). Para dominios propios, Vercel/Netlify o Docker, consulta [docs/DEPLOY.md](docs/DEPLOY.md).

## Documentación

- [Esquema SQL y modelo de seguridad](docs/schema.sql)
- [Guía de despliegue y dominio](docs/DEPLOY.md)
- [Variables de entorno](.env.example)

## Licencia

MIT. Las ilustraciones de muestra de la galería son material de demostración y deben sustituirse por fotos reales del taller cuando el negocio las tenga.
