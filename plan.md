# Plan — Barbería Askao

## 1. Objetivo

Web pública de una sola página (con rutas auxiliares) para Barbería Askao, en el Casco Viejo de Bilbao, más un panel de administración real en `/admin`. La web debe sentirse como un pequeño mundo flotante de barbería: clara, cálida, ilustrada y con 3D decorativo, muy lejos del típico local oscuro. Debe funcionar en móvil, reservar citas sin dobles reservas, enviar avisos por email y permitir que el dueño gestione todo desde el teléfono.

## 2. Arquitectura

- **Frontend:** React 19 + Vite 7 + Tailwind CSS 4, `wouter` para rutas, TanStack Query + tRPC para datos, Framer Motion para animaciones y `react-three-fiber` + `drei` + `three` para la escena 3D (cargada de forma diferida).
- **Backend:** Express + tRPC v11 sobre el servidor gestionado de Manus. El panel y la web comparten API tipada.
- **Base de datos:** MySQL gestionado, Drizzle ORM y migraciones versionadas en `drizzle/`. Se usa el backend integrado de la plataforma en lugar de Supabase para que la web funcione de inmediato sin cuentas ni claves externas; el modelo de acceso solicitado (lectura pública limitada, creación de reservas, admin total) se aplica en el servidor y se documenta en `docs/schema.sql` (MySQL no tiene RLS nativo).
- **Archivos:** fotos y vídeos subidos desde el admin a Manus Storage (`/manus-storage/...`) mediante subida multipart al servidor, validada por tipo y tamaño.
- **Emails:** integración con Resend si existe `RESEND_API_KEY`. Sin clave, cada email queda registrado en una bandeja `email_outbox` visible y reenviable desde el admin, de modo que la reserva nunca falla por el email. `EMAIL_FROM` configurable.
- **Auth admin:** email + contraseña con hash `scrypt` (salt aleatorio, comparación en tiempo constante), sesiones opacas con hash SHA-256 en base de datos, cookie HttpOnly `SameSite=None; Secure` para el Preview embebido y token en `sessionStorage` como respaldo para iframes que bloquean cookies de terceros. Primer arranque mediante pantalla de configuración en `/admin` (solo si no existe ningún admin); también admite siembra por `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- **Despliegue:** contenedor Docker incluido; publicación con Manus. Se documentan alternativas Vercel/Netlify y la conexión de un dominio propio.

### Por qué no Supabase

La petición admitía Supabase o Firebase "si es más simple". Usar la base de datos gestionada del proyecto evita pedir credenciales externas, funciona en Preview y en producción desde el primer minuto y mantiene un único backend tipado. Las garantías pedidas se conservan: el público solo accede a servicios activos, medios y ajustes públicos y puede crear reservas; las reservas y todas las mutaciones exigen sesión de admin. `docs/schema.sql` documenta el esquema y el modelo de acceso; si se migra a Supabase/Postgres habría que traducir las comprobaciones a políticas RLS.

## 3. Modelo de datos

- `admin_users`: email único, `password_hash`, nombre, último acceso.
- `admin_sessions`: hash del token, admin, caducidad.
- `services`: nombre en ES/EN/FR/DE, descripciones, precio en céntimos, duración, activo, orden.
- `media`: URL estable, clave de storage, tipo imagen/vídeo, título, alt, categoría, orden.
- `settings` (fila única): teléfono, WhatsApp, email, Instagram, TikTok, URLs de mapas y reseñas, nota y número de reseñas, horario semanal JSON, intervalo de franjas, antelación mínima y días máximos de reserva.
- `bookings`: referencia pública, datos del cliente, servicio y precio congelados, fecha, hora, notas, estado (`pending`, `confirmed`, `cancelled`, `completed`), idioma.
- `booking_slots`: una fila por cada franja de 30 min ocupada por una reserva, con índice único `(date, time)`. Es el candado que impide solapamientos incluso con servicios de distinta duración y peticiones simultáneas.
- `blocked_slots`: día completo (`ALL`) o franja concreta bloqueada por el dueño.
- `email_outbox`: registro de cada email (destinatario, asunto, HTML, estado, error, proveedor).

Semilla idempotente: 4 servicios y precios de la carta, ajustes por defecto (L–S 10:00–21:00, domingo cerrado, 4,8/73, Askao Kalea 27) y 7 ilustraciones de muestra para la galería. No se sobrescriben cambios posteriores del dueño. No se crea ningún admin: lo establece el dueño en la primera visita.

## 4. Reglas de reserva

- Solo se ofrecen franjas dentro del horario del día y con duración completa del servicio.
- Se descartan días cerrados, bloqueos (`ALL` o franja), franjas ya cubiertas por otra reserva, fechas pasadas, días fuera del horizonte y horas que no cumplen la antelación mínima (Europe/Madrid, con cambio de hora).
- La creación va en transacción: se inserta la reserva y sus franjas; si el índice único choca, se revierte y se devuelve "esa hora acaba de ocuparse".
- Al cancelar se liberan las franjas; al reactivar se vuelven a comprobar.
- Honeypot invisible + límite por IP (reservas y login) + validación Zod. El email nunca bloquea la reserva.
- Tras reservar: email al negocio, email de confirmación al cliente si dejó email, y botón de WhatsApp con el resumen prerrellenado.

## 5. Admin

- `/admin`: login o primer arranque (email prefijado `barberiaaskao@gmail.com`, contraseña mínima de 10 caracteres).
- Reservas: lista agrupada por fecha y calendario mensual; filtros; detalle; confirmar, completar y cancelar; teléfono/WhatsApp directos.
- Servicios: alta, edición, activación, orden y borrado con confirmación.
- Galería: subida con arrastrar y soltar, tipo detectado, categoría, alt, orden y borrado.
- Horario: por día, abierto/cerrado y horas; intervalo de franjas, antelación, horizonte; bloqueo de días completos o franjas con motivo.
- Ajustes: contacto, redes, mapas, reseñas, valoración; estado de emails y bandeja con reintento; cambio de contraseña.
- Diseño mobile-first con barra inferior en teléfono y lateral en escritorio.

## 6. Diseño

**Movimiento:** editorial storybook bilbaíno — ilustración gouache y cartel español de mediados de siglo mezclados con tipografía editorial actual; un cuento premium sobre una barbería que flota sobre el Casco Viejo.

**Principios**

1. Papel cálido, tinta y solo dos acentos: rojo bermellón y azul cobalto. Nunca una barbería oscura.
2. Asimetría de collage: arcos, sellos, cintas y tarjetas que se solapan; se evitan las retículas centradas.
3. Dibujo a mano junto a precisión premium: trazos sueltos y notas en Caveat contrastando con Fraunces.
4. El movimiento es aire, no espectáculo: flotación lenta, parallax suave y 3D decorativo que se apaga cuando molesta.

**Color:** crema `#FBF5E9` como papel y calidez de barrio; tinta `#1B1A17` para el oficio; bermellón `#D63B2A` para energía y llamadas a la acción; cobalto `#2447C9` para frescura y enlaces; blanco espuma para aire. Proporción aproximada 70 % crema, 20 % tinta, 7 % rojo, 3 % azul.

**Layout:** "escaparate de cuento". Hero a dos columnas desiguales (texto 5/12, escena 7/12) con el poste 3D entre nubes; etiquetas de sección numeradas al margen; galería como pared de postales; reserva como ticket troquelado; mapa dentro de una ventana arqueada. Los encabezados se desplazan a la izquierda y los doodles ocupan los márgenes.

**Elementos firma**

1. Nube-isla recortada con sombra suave bajo cada bloque importante.
2. Cinta de poste de barbero (rayas rojas, azules y blancas) como subrayado, borde y marquesina.
3. Sello circular "Bilbao · Casco Viejo · 4,8 ★" y anotaciones manuscritas.

**Interacción:** botones con atracción magnética suave, pasos del ticket que se deslizan, tarjetas que se elevan y giran 0,5° al pasar el ratón, escena 3D que sigue al puntero. Todo con foco visible y áreas táctiles de 44 px.

**Animación:** revelados de 600–800 ms con `cubic-bezier(.2,.7,.2,1)` y stagger de 60–90 ms; flotación de 6–9 s; marquesina de 40 s; parallax atado al scroll. Con `prefers-reduced-motion` se desactivan 3D, partículas y parallax, y las entradas se reducen a fundidos.

**Tipografía:** Fraunces variable (300–900, óptica alta) para titulares, con cursivas para las palabras emocionales; Manrope para cuerpo e interfaz; Caveat para notas. H1 `clamp(2.8rem, 6vw, 5.6rem)` con interlineado 0,95; cuerpo 1,05 rem / 1,7.

**Esencia:** la barbería de barrio del Casco Viejo que convierte un corte en un pequeño ritual, con la precisión de siempre y el humor de aquí. Personalidad: cálida, precisa, traviesa.

**Voz:** cercana y con guiño, sin clichés. Ejemplos: "Aquí se corta el pelo. Y se arregla el día." / "Precios claros, como el café de las once."

**Marca:** "askao" en minúsculas Fraunces Black, con la "o" convertida en un poste de barbero circular rayado; versión horizontal "Barbería Askao" con sello. Color propio: **Rojo Askao** `#D63B2A`.

## 7. SEO, accesibilidad y rendimiento

- `index.html` con title, description, keywords, Open Graph, Twitter Card, theme-color y JSON-LD `HairSalon` (dirección, geo 43.25878 / -2.921894, horario, teléfono, valoración 4,8/73, mapa). Contenido estático de arranque dentro de `#root` para que un rastreador sin JS vea el negocio, los servicios y la dirección; React lo sustituye al montar.
- Títulos y descripciones por idioma actualizados al cambiar de idioma; canonical/OG URL desde el origen real en runtime.
- Imágenes con `alt`, `width`/`height`, `loading="lazy"`; vídeos con `preload="metadata"`; escena 3D en chunk aparte.
- Navegación por teclado, skip link, lightbox con Esc/flechas, foco atrapado en diálogos, contraste AA, `aria-live` en reservas.
- Fallback 3D en CSS/SVG para equipos débiles, sin WebGL o con movimiento reducido.

## 8. Estructura del proyecto

```
client/
  index.html            metadatos, JSON-LD, contenido de arranque
  public/               favicon, og image, manifiesto
  src/
    components/site/    Header, Footer, Logo, Reveal, Marquee, Lightbox, idioma...
    components/three/   HeroScene (lazy) y HeroSceneFallback
    sections/           Hero, About, Services, Gallery, Booking, Reviews, Location
    pages/              Home, Privacy, admin/*
    lib/                trpc, i18n, formato, utilidades
shared/
  booking.ts            reglas puras de disponibilidad
  i18n/                 diccionarios es/en/fr/de
server/
  _core/                contexto, tRPC, cookies, servidor, vite
  auth.ts               hash, sesiones, setup
  booking.ts            disponibilidad y creación transaccional
  email.ts              Resend + plantillas + outbox
  seed.ts               semilla idempotente
  upload.ts             subida multipart validada
  routers.ts            API pública y admin
drizzle/                esquema y migraciones
docs/                   guía de despliegue y esquema SQL/seguridad
```

## 9. Entregables

Código completo, `.env.example`, `README.md`, `docs/DEPLOY.md`, `docs/schema.sql`, migraciones Drizzle y pruebas unitarias de las reglas de reserva. La publicación se hace desde Manus; las guías Vercel/Netlify y dominio propio se incluyen como alternativa.
