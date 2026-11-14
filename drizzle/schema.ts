import type { HoursConfig } from "../shared/booking";
import {
  boolean,
  date,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Legacy platform user table. The public site no longer uses Manus OAuth, but the
 * table is kept so existing migrations remain additive and non-destructive.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/* -------------------------------------------------------------------------- */
/*                                   Admin                                    */
/* -------------------------------------------------------------------------- */

export const adminUsers = mysqlTable(
  "admin_users",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
    name: varchar("name", { length: 120 }).default("Barbería Askao").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastLoginAt: timestamp("lastLoginAt"),
  },
  table => [uniqueIndex("uniq_admin_email").on(table.email)],
);

export const adminSessions = mysqlTable(
  "admin_sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    adminId: int("adminId").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("idx_session_admin").on(table.adminId), index("idx_session_expires").on(table.expiresAt)],
);

/* -------------------------------------------------------------------------- */
/*                                  Catálogo                                  */
/* -------------------------------------------------------------------------- */

export const services = mysqlTable(
  "services",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    nameEs: varchar("nameEs", { length: 120 }).notNull(),
    nameEn: varchar("nameEn", { length: 120 }),
    nameFr: varchar("nameFr", { length: 120 }),
    nameDe: varchar("nameDe", { length: 120 }),
    descriptionEs: text("descriptionEs"),
    descriptionEn: text("descriptionEn"),
    descriptionFr: text("descriptionFr"),
    descriptionDe: text("descriptionDe"),
    priceCents: int("priceCents").notNull(),
    durationMin: int("durationMin").default(30).notNull(),
    active: boolean("active").default(true).notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [uniqueIndex("uniq_service_slug").on(table.slug), index("idx_service_order").on(table.sortOrder)],
);

export const media = mysqlTable(
  "media",
  {
    id: int("id").autoincrement().primaryKey(),
    url: varchar("url", { length: 1024 }).notNull(),
    storageKey: varchar("storageKey", { length: 512 }),
    type: mysqlEnum("type", ["image", "video"]).default("image").notNull(),
    title: varchar("title", { length: 200 }),
    alt: varchar("alt", { length: 300 }),
    category: varchar("category", { length: 40 }).default("general").notNull(),
    sortOrder: int("sortOrder").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("idx_media_order").on(table.sortOrder)],
);

export const settings = mysqlTable("settings", {
  id: int("id").primaryKey(),
  phone: varchar("phone", { length: 32 }).default("652 41 36 81").notNull(),
  whatsapp: varchar("whatsapp", { length: 32 }).default("+34652413681").notNull(),
  email: varchar("email", { length: 320 }).default("barberiaaskao@gmail.com").notNull(),
  instagram: varchar("instagram", { length: 120 }),
  tiktok: varchar("tiktok", { length: 120 }),
  mapsUrl: varchar("mapsUrl", { length: 1024 })
    .default("https://maps.app.goo.gl/c5jKDpatArCzT1J76")
    .notNull(),
  reviewsUrl: varchar("reviewsUrl", { length: 1024 }).notNull(),
  ratingTenths: int("ratingTenths").default(48).notNull(),
  reviewCount: int("reviewCount").default(73).notNull(),
  hoursJson: json("hoursJson").$type<HoursConfig>().notNull(),
  slotMinutes: int("slotMinutes").default(30).notNull(),
  minLeadMinutes: int("minLeadMinutes").default(120).notNull(),
  maxDaysAhead: int("maxDaysAhead").default(60).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;

/* -------------------------------------------------------------------------- */
/*                                  Reservas                                  */
/* -------------------------------------------------------------------------- */

export const bookings = mysqlTable(
  "bookings",
  {
    id: int("id").autoincrement().primaryKey(),
    reference: varchar("reference", { length: 16 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    email: varchar("email", { length: 320 }),
    serviceId: int("serviceId"),
    serviceName: varchar("serviceName", { length: 120 }).notNull(),
    priceCents: int("priceCents").notNull(),
    durationMin: int("durationMin").notNull(),
    bookingDate: date("bookingDate", { mode: "string" }).notNull(),
    bookingTime: varchar("bookingTime", { length: 5 }).notNull(),
    notes: text("notes"),
    status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
    locale: varchar("locale", { length: 5 }).default("es").notNull(),
    source: varchar("source", { length: 20 }).default("web").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("uniq_booking_reference").on(table.reference),
    index("idx_booking_date").on(table.bookingDate, table.bookingTime),
    index("idx_booking_status").on(table.status),
  ],
);

/**
 * Every 30-minute slot covered by a booking. The unique index is the hard
 * concurrency lock: two simultaneous requests can never claim the same slot,
 * even when their services have different durations.
 */
export const bookingSlots = mysqlTable(
  "booking_slots",
  {
    id: int("id").autoincrement().primaryKey(),
    bookingId: int("bookingId").notNull(),
    slotDate: date("slotDate", { mode: "string" }).notNull(),
    slotTime: varchar("slotTime", { length: 5 }).notNull(),
  },
  table => [
    uniqueIndex("uniq_booking_slot").on(table.slotDate, table.slotTime),
    index("idx_slot_booking").on(table.bookingId),
  ],
);

export const blockedSlots = mysqlTable(
  "blocked_slots",
  {
    id: int("id").autoincrement().primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    time: varchar("time", { length: 5 }).default("ALL").notNull(),
    reason: varchar("reason", { length: 200 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [uniqueIndex("uniq_blocked_slot").on(table.date, table.time)],
);

export const emailOutbox = mysqlTable(
  "email_outbox",
  {
    id: int("id").autoincrement().primaryKey(),
    bookingId: int("bookingId"),
    kind: mysqlEnum("kind", ["owner", "customer"]).notNull(),
    recipient: varchar("recipient", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    html: text("html").notNull(),
    textBody: text("textBody"),
    status: mysqlEnum("status", ["queued", "sent", "failed", "skipped"]).default("queued").notNull(),
    providerId: varchar("providerId", { length: 160 }),
    error: text("error"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    sentAt: timestamp("sentAt"),
  },
  table => [index("idx_outbox_created").on(table.createdAt), index("idx_outbox_status").on(table.status)],
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type Service = typeof services.$inferSelect;
export type MediaItem = typeof media.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BlockedSlot = typeof blockedSlots.$inferSelect;
export type EmailOutboxItem = typeof emailOutbox.$inferSelect;
