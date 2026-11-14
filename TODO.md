# TODO — Barbería Askao

> Criterios copiados de la petición. Solo se marca completo con evidencia de funcionamiento.

## [x] 1. Identidad y mundo visual claro

- Tema claro: fondo blanco cálido/crema suave, aireado y limpio; nada de barbería oscura.
- Concepto onírico y divertido: mundo barbería flotante, nubes/degradados suaves, partículas a la deriva, mezcla de dibujo a mano y tipografía premium.
- Colores de marca del letrero real: rojo, azul, blanco y acentos negros.
- Poste de barbero 3D giratorio y brillante (rayas rojas, azules y blancas) en el hero; tijeras, navaja y peine flotantes que reaccionan al ratón y al scroll.
- Animaciones de scroll suaves.
- Mobile first, responsive en teléfono y PC; escena 3D degradada o desactivada en equipos débiles y con `prefers-reduced-motion`.

## [x] 2. Web pública completa

- Secciones: Hero, Sobre nosotros, Servicios y precios, Galería de cortes con fotos y vídeos y lightbox, Pedir cita, Reseñas, Ubicación y horario con mapa, Footer.
- Nombre: Barbería Askao (Peluquería – Barbería "AT-MAN", Casco Viejo, Bilbao).
- Dirección: Askao Kalea, 27, Ibaiondo, 48005 Bilbao, Bizkaia, España.
- El botón de mapa y el mapa embebido usan la ubicación exacta de https://maps.app.goo.gl/c5jKDpatArCzT1J76.
- Teléfono 652 41 36 81 con enlace `tel:` y WhatsApp +34 652 41 36 81 (`wa.me/34652413681`).
- Email barberiaaskao@gmail.com.
- Horario visible lunes a sábado 10:00–21:00, editable en admin.
- Valoración Google 4.8 (73 reseñas) con enlace a las reseñas.
- Iconos de Instagram y TikTok con usuarios editables en admin; ocultos si están vacíos.
- Botón flotante de WhatsApp y botón fijo "Pide cita"; áreas táctiles grandes.
- Cortes mostrados: degradado/fade, clásico, moderno, barba, líneas y dibujos, cejas, corte infantil.

## [x] 3. Multilingüe

- Español por defecto, inglés, francés y alemán con selector de idioma; la elección se conserva y actualiza el `lang` del documento.

## [x] 4. Servicios y precios editables

- Corte de pelo 12 €; corte de barba 8 €; corte de pelo y barba 18 €; corte de niños y jubilados 10 €.
- Extras con precio a consultar: líneas, dibujos, lavados, cejas, gominas.
- El admin puede añadir, editar, desactivar, ordenar y borrar servicios; la web refleja los cambios.

## [x] 5. Reservas completas

- Formulario: nombre, teléfono, email opcional, servicio, fecha, franja horaria y notas.
- Solo se muestran franjas libres dentro del horario de apertura; se impide la doble reserva, también con peticiones simultáneas.
- Al enviar: se guarda en la base de datos, se envía email al negocio, email de confirmación al cliente si dio email y se ofrece un mensaje de WhatsApp prerrellenado.
- Honeypot o límite de frecuencia contra spam.
- Se respetan días/franjas bloqueadas por el admin y la antelación/horizonte configurados.

## [x] 6. Backend, base de datos y archivos

- Tablas `bookings`, `services`, `media`, `settings` (además de sesiones, bloqueos y outbox de email).
- Almacenamiento de fotos y vídeos subidos desde el admin.
- El público solo puede leer servicios activos, media y settings públicos y crear reservas; solo el admin lee reservas y cambia datos.
- Emails mediante Resend (o bandeja de salida registrada si no hay clave).

## [x] 7. Autenticación del admin

- Ruta `/admin` con login real email + contraseña, hash seguro y sesión.
- Usuario barberiaaskao@gmail.com; contraseña definida por variable de entorno o en el primer acceso del panel, nunca hardcodeada en el frontend.
- Cierre de sesión, caducidad y cambio de contraseña.

## [x] 8. Panel de administración

- Ver, confirmar y cancelar reservas en calendario y lista.
- Añadir/editar/eliminar servicios y precios.
- Subir y eliminar fotos y vídeos.
- Editar horario de apertura, teléfono, WhatsApp, email y redes sociales.
- Bloquear días o franjas horarias.
- Adaptado a móvil para gestionarlo todo desde el teléfono.

## [x] 9. SEO, accesibilidad y rendimiento

- Title, meta description, Open Graph y schema markup de negocio local para Bilbao.
- Contenido comprensible sin ejecutar JavaScript.
- Buen contraste, textos alt y navegación por teclado.
- Carga rápida: medios lazy, imágenes comprimidas y 3D en carga diferida.

## [x] 10. Entregables y documentación

- Código fuente con estructura clara, `.env.example`, esquema SQL con modelo de seguridad e instrucciones de despliegue (Vercel o Netlify y dominio propio tipo barberia-askao.com).
- `README.md` con puesta en marcha, admin, emails y publicación.

## [x] 11. Validación

- `pnpm check` y `pnpm build` sin errores; pruebas unitarias de disponibilidad en verde.
- Revisión independiente de requisitos e integración de web, API, admin y base de datos; corrección de fallos confirmados.


## Evidencia de la implementación

- `pnpm check`: sin errores.
- `pnpm test`: 11 pruebas de reglas de disponibilidad en verde.
- `pnpm build`: cliente y servidor compilados correctamente (`dist/`).
- Prueba manual en navegador: portada, servicios, galería, reserva real, panel de admin, confirmación de cita, subida de imagen y vista móvil a 390 px.
- Prueba de concurrencia: una segunda reserva en la misma franja devuelve `409 CONFLICT`.
- Prueba de bloqueo: un día bloqueado devuelve `blockedAll: true` y cero franjas; al eliminarlo vuelve a estar disponible.
- Prueba de CRUD: servicio temporal creado, visible en la API pública y eliminado; media temporal creada y eliminada; ajustes editados y restaurados.
- Emails: con Resend configurado se envían; sin `RESEND_API_KEY` quedan en estado `queued` en la bandeja del panel. La verificación de un envío real queda pendiente de aportar la clave de Resend.
- Los datos de prueba (reservas, admin temporal, bloqueo, servicio y media) se eliminaron; la base queda con los 4 servicios y las 7 ilustraciones de muestra.
- Revisión independiente completada: se corrigieron el token de primer acceso, el proxy de almacenamiento en Preview, la rejilla de horarios con citas activas, el bloqueo de una hora completa, la autenticación antes de leer subidas, el refresco de reservas, el contraste, el horario editable, el health check con base de datos y la validación al reactivar citas.
- Comprobaciones finales: `pnpm check` limpio, `pnpm test` 11/11 y `pnpm build` correcto; `/api/health` responde 200 con la base de datos y `/manus-storage/*` redirige al archivo en Preview.
