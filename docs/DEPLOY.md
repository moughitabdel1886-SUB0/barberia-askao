# Despliegue de Barbería Askao

El proyecto es una aplicación full-stack: React/Vite en el cliente, API Express/tRPC en el servidor, MySQL para datos y almacenamiento de Manus para fotos y vídeos. No es un sitio estático: el formulario de reservas, el panel `/admin` y los emails necesitan el servidor.

## Opción A — Manus (recomendada)

Es la vía con menos configuración porque la plataforma ya aporta base de datos, almacenamiento y HTTPS.

1. En el proyecto, abre **Publish** y publica la versión actual. El health check configurado es `/api/health`.
2. Comprueba la URL publicada: portada, `/admin`, una reserva de prueba y la subida de una imagen.
3. En el panel del proyecto, entra en **Domains** y añade `barberia-askao.com` (y `www.barberia-askao.com` si quieres ambos).
4. El panel mostrará los registros DNS exactos. En tu registrador:
   - Para el dominio raíz, usa el registro `A` o `ALIAS` que indique Manus.
   - Para `www`, usa el `CNAME` que indique Manus.
   - No cambies los registros MX del correo salvo que sepas lo que haces.
5. Espera la propagación (de minutos a 24 h) y activa/verifica el certificado TLS desde el panel.
6. Actualiza las URLs absolutas de SEO: en `client/index.html`, añade
   `<link rel="canonical" href="https://barberia-askao.com/" />`,
   `<meta property="og:url" content="https://barberia-askao.com/" />` y cambia
   `og:image`/`twitter:image` a `https://barberia-askao.com/og.jpg`. Vuelve a publicar.
7. Configura Resend con el dominio verificado (SPF, DKIM y DMARC) y añade `RESEND_API_KEY` y `EMAIL_FROM` en los secretos del proyecto.
8. Entra en `/admin`. Si no has definido `ADMIN_EMAIL`/`ADMIN_PASSWORD`, el formulario pedirá el **token de primer acceso**: usa el valor de `ADMIN_SETUP_TOKEN` o el que aparezca en los logs del servidor. Después crea la cuenta del negocio y cambia la contraseña si has usado una temporal.

## Opción B — Docker en un VPS, Render, Railway o Fly.io

El `Dockerfile` incluido compila el cliente y el servidor y arranca `dist/index.js`.

```bash
docker build -t barberia-askao .
docker run --rm -p 3000:3000 --env-file .env barberia-askao
```

Variables mínimas: `DATABASE_URL`, `PORT` (la plataforma suele inyectarlo), `ADMIN_EMAIL`/`ADMIN_PASSWORD` o `ADMIN_SETUP_TOKEN` en el primer arranque, `RESEND_API_KEY`/`EMAIL_FROM` y, para subidas, `MANUS_API_URL`/`MANUS_API_KEY`. Si usas el almacenamiento de Manus fuera de Manus, añade también `MANUS_STORAGE_PROXY=1` para que el servidor sirva `/manus-storage/*`. En Docker directo, pon `TRUST_PROXY=false`; detrás de Render/Vercel, deja `TRUST_PROXY=1`.

En Render/Railway:

1. Crea un servicio MySQL 8 y copia su URL a `DATABASE_URL`.
2. Crea un **Web Service** desde el repositorio usando Docker.
3. Configura el health check en `/api/health` y el puerto 3000.
4. Ejecuta las migraciones una vez contra la base de datos de producción:
   `DATABASE_URL="mysql://..." pnpm db:migrate` desde tu máquina o un job de release. Después arranca el servidor con `RUN_MIGRATIONS=0` para que el usuario de la aplicación no necesite permisos DDL.
5. Añade los secretos y despliega.
6. Si no vas a usar el almacenamiento de Manus, sustituye `server/storage.ts` por un adaptador S3/R2 (el SDK de AWS ya está instalado) o las subidas del panel fallarán; reservas, servicios y ajustes seguirán funcionando. Si mantienes el almacenamiento de Manus, activa `MANUS_STORAGE_PROXY=1` para que las rutas `/manus-storage/*` se resuelvan en tu host.

## Opción C — Vercel o Netlify para el frontend + API en un host Node

Vercel y Netlify pueden servir el frontend estático, pero no ejecutan este Express/MySQL tal cual. La receta es separar:

- **API** en Render/Railway/Fly/VPS con el Dockerfile y MySQL.
- **Frontend** en Vercel/Netlify, proxificando `/api` y `/manus-storage` al host de la API para que las cookies y las rutas relativas sigan funcionando.

### 1. Publica la API

Sigue la opción B. Anota su URL, por ejemplo `https://askao-api.onrender.com`. Comprueba `https://askao-api.onrender.com/api/health`.

### 2. Configura Vercel

`vercel.json` de ejemplo (colócalo en la raíz del repositorio o en el proyecto de Vercel):

```json
{
  "buildCommand": "pnpm install --frozen-lockfile && pnpm build:static",
  "outputDirectory": "dist/public",
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://askao-api.onrender.com/api/:path*" },
    { "source": "/manus-storage/:path*", "destination": "https://askao-api.onrender.com/manus-storage/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- `pnpm build:static` genera solo el cliente en `dist/public`.
- Las rutas `/api/*` y `/manus-storage/*` se proxifican al servidor; el navegador sigue viendo el mismo origen, así que la cookie de sesión y el CSRF funcionan. El host de la API debe tener `MANUS_STORAGE_PROXY=1` y las claves de Manus si vas a servir ahí las imágenes subidas.
- No publiques el panel como una SPA estática sin API: el login no tendría backend.

### 3. Configura Netlify

Build command: `pnpm install --frozen-lockfile && pnpm build:static`; publish directory: `dist/public`.

Crea `public/_redirects` (o `client/public/_redirects`, que Vite copia al build):

```text
/api/*            https://askao-api.onrender.com/api/:splat   200
/manus-storage/*  https://askao-api.onrender.com/manus-storage/:splat  200
/*                /index.html                                  200
```

Las reglas se evalúan en orden: primero API y almacenamiento, después el fallback de la SPA.

### 4. Dominio propio en Vercel/Netlify

1. Añade `barberia-askao.com` en **Domains**.
2. En el registrador, crea el `A`/`ALIAS` del apex y el `CNAME` de `www` con los valores que muestre Vercel/Netlify.
3. Espera la verificación y activa HTTPS.
4. Actualiza canonical, `og:url` y las URLs absolutas de `og:image` como en la opción A.

## Emails y DNS

Resend pedirá verificar el dominio con registros DNS (normalmente SPF, DKIM y un DMARC recomendado). Hazlo antes de enviar a clientes reales. Si no configuras Resend, los emails quedan en cola en `/admin` y las reservas se guardan igualmente.

## Seguridad y mantenimiento

- Cambia la contraseña inicial del panel y no la reutilices.
- No subas `.env` al repositorio; usa los secretos del host.
- Rota `RESEND_API_KEY` y las claves de almacenamiento si se filtran.
- Limita el usuario MySQL a `SELECT, INSERT, UPDATE, DELETE` sobre la base de datos (ver `docs/schema.sql`).
- Haz copias periódicas: `mysqldump` de la base de datos y copia de los archivos de `/manus-storage/` o del bucket S3.
- Revisa los textos de privacidad con el negocio y añade el aviso legal/NIF si la normativa española lo requiere.
- Prueba después de cada cambio: reserva real, doble reserva, cancelación, bloqueo de un día, subida y borrado de una foto y email de confirmación.

## Checklist rápido antes de publicar

- [ ] `pnpm check` y `pnpm test` en verde.
- [ ] Build de producción correcto.
- [ ] `ADMIN_EMAIL`/`ADMIN_PASSWORD` definidos o cuenta creada en el primer acceso.
- [ ] Resend verificado y emails de prueba recibidos.
- [ ] Fotos reales del taller subidas desde `/admin`.
- [ ] Dirección, teléfono, WhatsApp, email y redes revisados.
- [ ] Dominio y HTTPS activos; canonical y Open Graph con la URL final.
- [ ] Copia de seguridad de la base de datos.
