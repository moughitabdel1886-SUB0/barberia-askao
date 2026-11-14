-- Barbería Askao — esquema de referencia (MySQL 8 / MariaDB 10.11+)
--
-- La fuente de verdad del esquema es drizzle/schema.ts. Las migraciones
-- versionadas están en drizzle/ y se aplican con `pnpm db:migrate`.
-- Este archivo resume las tablas de la aplicación para revisión y auditoría.
--
-- POLÍTICA DE ACCESO
-- MySQL no ofrece Row Level Security como PostgreSQL. La frontera de seguridad
-- es la API tRPC, no el cliente:
--   * Público: solo lectura de servicios activos, media y campos públicos de
--     settings; creación de reservas. Nunca puede leer bookings, emails,
--     sesiones ni bloquear horarios.
--   * Admin: todas las operaciones pasan por adminProcedure, que exige una
--     sesión válida en admin_sessions y el encabezado CSRF. La contraseña se
--     guarda como scrypt(password, sal) y nunca se devuelve al cliente.
--   * La tabla booking_slots tiene un índice único (slotDate, slotTime). La
--     creación de reservas usa una transacción y ese índice para impedir la
--     doble reserva incluso con dos peticiones simultáneas.
--   * email_outbox guarda los mensajes generados; si Resend no está
--     configurado quedan en estado 'queued' para reintento manual.
--
-- El usuario MySQL de la aplicación necesita SELECT, INSERT, UPDATE y DELETE
-- sobre esta base de datos. No le concedas privilegios globales ni DDL en
-- producción; ejecuta las migraciones con un usuario distinto.

CREATE TABLE `admin_users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `email` varchar(320) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `name` varchar(120) NOT NULL DEFAULT 'Barbería Askao',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastLoginAt` timestamp NULL,
  CONSTRAINT `admin_users_id` PRIMARY KEY (`id`),
  CONSTRAINT `uniq_admin_email` UNIQUE (`email`)
);

CREATE TABLE `admin_sessions` (
  `id` varchar(64) NOT NULL,
  `adminId` int NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `admin_sessions_id` PRIMARY KEY (`id`),
  INDEX `idx_session_admin` (`adminId`),
  INDEX `idx_session_expires` (`expiresAt`)
);

CREATE TABLE `services` (
  `id` int AUTO_INCREMENT NOT NULL,
  `slug` varchar(80) NOT NULL,
  `nameEs` varchar(120) NOT NULL,
  `nameEn` varchar(120),
  `nameFr` varchar(120),
  `nameDe` varchar(120),
  `descriptionEs` text,
  `descriptionEn` text,
  `descriptionFr` text,
  `descriptionDe` text,
  `priceCents` int NOT NULL,
  `durationMin` int NOT NULL DEFAULT 30,
  `active` boolean NOT NULL DEFAULT true,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `services_id` PRIMARY KEY (`id`),
  CONSTRAINT `uniq_service_slug` UNIQUE (`slug`)
);

CREATE TABLE `media` (
  `id` int AUTO_INCREMENT NOT NULL,
  `url` varchar(1024) NOT NULL,
  `storageKey` varchar(512),
  `type` enum('image','video') NOT NULL DEFAULT 'image',
  `title` varchar(200),
  `alt` varchar(300),
  `category` varchar(40) NOT NULL DEFAULT 'general',
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `media_id` PRIMARY KEY (`id`),
  INDEX `idx_media_order` (`sortOrder`)
);

CREATE TABLE `settings` (
  `id` int NOT NULL,
  `phone` varchar(32) NOT NULL DEFAULT '652 41 36 81',
  `whatsapp` varchar(32) NOT NULL DEFAULT '+34652413681',
  `email` varchar(320) NOT NULL DEFAULT 'barberiaaskao@gmail.com',
  `instagram` varchar(120),
  `tiktok` varchar(120),
  `mapsUrl` varchar(1024) NOT NULL DEFAULT 'https://maps.app.goo.gl/c5jKDpatArCzT1J76',
  `reviewsUrl` varchar(1024) NOT NULL,
  `ratingTenths` int NOT NULL DEFAULT 48,
  `reviewCount` int NOT NULL DEFAULT 73,
  `hoursJson` json NOT NULL,
  `slotMinutes` int NOT NULL DEFAULT 30,
  `minLeadMinutes` int NOT NULL DEFAULT 120,
  `maxDaysAhead` int NOT NULL DEFAULT 60,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `settings_id` PRIMARY KEY (`id`)
);

CREATE TABLE `bookings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `reference` varchar(16) NOT NULL,
  `name` varchar(120) NOT NULL,
  `phone` varchar(32) NOT NULL,
  `email` varchar(320),
  `serviceId` int,
  `serviceName` varchar(120) NOT NULL,
  `priceCents` int NOT NULL,
  `durationMin` int NOT NULL,
  `bookingDate` date NOT NULL,
  `bookingTime` varchar(5) NOT NULL,
  `notes` text,
  `status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  `locale` varchar(5) NOT NULL DEFAULT 'es',
  `source` varchar(20) NOT NULL DEFAULT 'web',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `bookings_id` PRIMARY KEY (`id`),
  CONSTRAINT `uniq_booking_reference` UNIQUE (`reference`),
  INDEX `idx_booking_date` (`bookingDate`, `bookingTime`),
  INDEX `idx_booking_status` (`status`)
);

CREATE TABLE `booking_slots` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bookingId` int NOT NULL,
  `slotDate` date NOT NULL,
  `slotTime` varchar(5) NOT NULL,
  CONSTRAINT `booking_slots_id` PRIMARY KEY (`id`),
  CONSTRAINT `uniq_booking_slot` UNIQUE (`slotDate`, `slotTime`),
  INDEX `idx_slot_booking` (`bookingId`)
);

CREATE TABLE `blocked_slots` (
  `id` int AUTO_INCREMENT NOT NULL,
  `date` date NOT NULL,
  `time` varchar(5) NOT NULL DEFAULT 'ALL',
  `reason` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `blocked_slots_id` PRIMARY KEY (`id`),
  CONSTRAINT `uniq_blocked_slot` UNIQUE (`date`, `time`)
);

CREATE TABLE `email_outbox` (
  `id` int AUTO_INCREMENT NOT NULL,
  `bookingId` int,
  `kind` enum('owner','customer') NOT NULL,
  `recipient` varchar(320) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `html` text NOT NULL,
  `textBody` text,
  `status` enum('queued','sent','failed','skipped') NOT NULL DEFAULT 'queued',
  `providerId` varchar(160),
  `error` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sentAt` timestamp NULL,
  CONSTRAINT `email_outbox_id` PRIMARY KEY (`id`),
  INDEX `idx_outbox_created` (`createdAt`),
  INDEX `idx_outbox_status` (`status`)
);

-- Ejemplo de usuario de aplicación con privilegios mínimos (ajusta la
-- contraseña y el host antes de ejecutarlo):
--
-- CREATE USER 'askao_app'@'%' IDENTIFIED BY 'cambia-esta-clave-larga';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON askao.* TO 'askao_app'@'%';
-- FLUSH PRIVILEGES;
