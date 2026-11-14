CREATE TABLE `admin_sessions` (
	`id` varchar(64) NOT NULL,
	`adminId` int NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(120) NOT NULL DEFAULT 'Barbería Askao',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastLoginAt` timestamp,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_admin_email` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `blocked_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` date NOT NULL,
	`time` varchar(5) NOT NULL DEFAULT 'ALL',
	`reason` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blocked_slots_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_blocked_slot` UNIQUE(`date`,`time`)
);
--> statement-breakpoint
CREATE TABLE `booking_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`slotDate` date NOT NULL,
	`slotTime` varchar(5) NOT NULL,
	CONSTRAINT `booking_slots_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_booking_slot` UNIQUE(`slotDate`,`slotTime`)
);
--> statement-breakpoint
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_booking_reference` UNIQUE(`reference`)
);
--> statement-breakpoint
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	CONSTRAINT `email_outbox_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`url` varchar(1024) NOT NULL,
	`storageKey` varchar(512),
	`type` enum('image','video') NOT NULL DEFAULT 'image',
	`title` varchar(200),
	`alt` varchar(300),
	`category` varchar(40) NOT NULL DEFAULT 'general',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_service_slug` UNIQUE(`slug`)
);
--> statement-breakpoint
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
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_session_admin` ON `admin_sessions` (`adminId`);--> statement-breakpoint
CREATE INDEX `idx_session_expires` ON `admin_sessions` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `idx_slot_booking` ON `booking_slots` (`bookingId`);--> statement-breakpoint
CREATE INDEX `idx_booking_date` ON `bookings` (`bookingDate`,`bookingTime`);--> statement-breakpoint
CREATE INDEX `idx_booking_status` ON `bookings` (`status`);--> statement-breakpoint
CREATE INDEX `idx_outbox_created` ON `email_outbox` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_outbox_status` ON `email_outbox` (`status`);--> statement-breakpoint
CREATE INDEX `idx_media_order` ON `media` (`sortOrder`);--> statement-breakpoint
CREATE INDEX `idx_service_order` ON `services` (`sortOrder`);