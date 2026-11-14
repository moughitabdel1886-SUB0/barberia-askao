import { and, asc, count, desc, eq, gte, inArray, lte, max, ne } from "drizzle-orm";
import {
  blockedSlots,
  bookingSlots,
  bookings,
  emailOutbox,
  media,
  services,
  settings,
  type BlockedSlot,
  type Booking,
  type EmailOutboxItem,
  type MediaItem,
  type Service,
  type Settings,
} from "../drizzle/schema";
import { DEFAULT_HOURS, availableSlots, coveredSlots, isTime, timeToMinutes, type HoursConfig } from "../shared/booking";
import { getDb } from "./db";

export const DEFAULT_REVIEWS_URL =
  "https://www.google.com/maps/place/BARBERIA+ASKAO+PELUQUER%C3%8DA+AT_MAN/@43.25878,-2.921894,17z/data=!4m8!3m7!1s0xd4e4f0fc136bb59:0x5fb56d3eda088619!8m2!3d43.25878!4d-2.921894!9m1!1b1";

export const DEFAULT_SETTINGS = {
  id: 1,
  phone: "652 41 36 81",
  whatsapp: "+34652413681",
  email: "barberiaaskao@gmail.com",
  instagram: null,
  tiktok: null,
  mapsUrl: "https://maps.app.goo.gl/c5jKDpatArCzT1J76",
  reviewsUrl: DEFAULT_REVIEWS_URL,
  ratingTenths: 48,
  reviewCount: 73,
  hoursJson: DEFAULT_HOURS,
  slotMinutes: 30,
  minLeadMinutes: 120,
  maxDaysAhead: 60,
};

/* -------------------------------------------------------------------------- */
/*                                  Settings                                  */
/* -------------------------------------------------------------------------- */

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (rows[0]) return rows[0];

  try {
    await db.insert(settings).values(DEFAULT_SETTINGS);
  } catch {
    // Another request may have inserted the singleton first.
  }

  const [created] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (!created) throw new Error("Could not create settings");
  return created;
}

export type SettingsUpdate = Partial<Omit<Settings, "id" | "updatedAt">>;

export function validateHours(hours: unknown): hours is HoursConfig {
  if (!Array.isArray(hours) || hours.length !== 7) return false;
  return hours.every(day => {
    if (!day || typeof day !== "object") return false;
    const item = day as { closed?: unknown; open?: unknown; close?: unknown };
    if (typeof item.closed !== "boolean") return false;
    if (typeof item.open !== "string" || typeof item.close !== "string") return false;
    if (!isTime(item.open) || !isTime(item.close)) return false;
    return item.closed || timeToMinutes(item.open) < timeToMinutes(item.close);
  });
}

export async function updateSettings(patch: SettingsUpdate): Promise<Settings> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await getSettings();

  if (patch.hoursJson && !validateHours(patch.hoursJson)) {
    throw new Error("El horario no es válido.");
  }

  if (patch.slotMinutes !== undefined && patch.slotMinutes !== current.slotMinutes) {
    const [active] = await db
      .select({ value: count() })
      .from(bookings)
      .where(ne(bookings.status, "cancelled"));
    if (Number(active?.value ?? 0) > 0) {
      throw new Error(
        "No puedes cambiar la rejilla de horas mientras haya citas activas. Cancélalas o complétalas primero.",
      );
    }
  }

  await db.update(settings).set(patch).where(eq(settings.id, 1));
  return getSettings();
}

/* -------------------------------------------------------------------------- */
/*                                  Services                                  */
/* -------------------------------------------------------------------------- */

export async function listServices(onlyActive = false): Promise<Service[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const query = db.select().from(services).orderBy(asc(services.sortOrder), asc(services.id));
  if (onlyActive) return query.where(eq(services.active, true));
  return query;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "servicio";
}

async function uniqueSlug(base: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  let candidate = slugify(base);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const rows = await db.select({ id: services.id }).from(services).where(eq(services.slug, candidate)).limit(1);
    if (!rows[0]) return candidate;
    candidate = `${slugify(base)}-${attempt + 2}`;
  }
  return `${slugify(base)}-${Date.now().toString(36)}`;
}

export type ServiceInput = {
  nameEs: string;
  nameEn?: string | null;
  nameFr?: string | null;
  nameDe?: string | null;
  descriptionEs?: string | null;
  descriptionEn?: string | null;
  descriptionFr?: string | null;
  descriptionDe?: string | null;
  priceCents: number;
  durationMin: number;
  active: boolean;
};

export async function createService(input: ServiceInput): Promise<Service> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [row] = await db.select({ value: max(services.sortOrder) }).from(services);
  const sortOrder = Number(row?.value ?? 0) + 1;
  const slug = await uniqueSlug(input.nameEs);

  const result = await db.insert(services).values({ ...input, slug, sortOrder });
  const id = Number((result as unknown as [{ insertId: number }])[0]?.insertId);

  const [created] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  if (!created) throw new Error("No se pudo crear el servicio.");
  return created;
}

export async function updateService(id: number, input: Partial<ServiceInput>): Promise<Service> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.update(services).set(input).where(eq(services.id, id));
  const [updated] = await db.select().from(services).where(eq(services.id, id)).limit(1);
  if (!updated) throw new Error("Servicio no encontrado.");
  return updated;
}

export async function deleteService(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(services).where(eq(services.id, id));
}

export async function reorderServices(ids: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.transaction(async tx => {
    for (let index = 0; index < ids.length; index += 1) {
      await tx.update(services).set({ sortOrder: index + 1 }).where(eq(services.id, ids[index]));
    }
  });
}

/* -------------------------------------------------------------------------- */
/*                                    Media                                   */
/* -------------------------------------------------------------------------- */

export async function listMedia(onlyVisible = false): Promise<MediaItem[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const query = db.select().from(media).orderBy(asc(media.sortOrder), asc(media.id));
  if (onlyVisible) return query;
  return query;
}

export type MediaInput = {
  url: string;
  storageKey?: string | null;
  type: "image" | "video";
  title?: string | null;
  alt?: string | null;
  category?: string;
};

export async function createMedia(input: MediaInput): Promise<MediaItem> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [row] = await db.select({ value: max(media.sortOrder) }).from(media);
  const sortOrder = Number(row?.value ?? 0) + 1;

  const result = await db.insert(media).values({
    url: input.url,
    storageKey: input.storageKey ?? null,
    type: input.type,
    title: input.title ?? null,
    alt: input.alt ?? null,
    category: input.category || "general",
    sortOrder,
  });
  const id = Number((result as unknown as [{ insertId: number }])[0]?.insertId);

  const [created] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!created) throw new Error("No se pudo guardar el archivo.");
  return created;
}

export async function updateMedia(
  id: number,
  input: Partial<Pick<MediaInput, "title" | "alt" | "category">>,
): Promise<MediaItem> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.update(media).set(input).where(eq(media.id, id));
  const [updated] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!updated) throw new Error("Archivo no encontrado.");
  return updated;
}

export async function deleteMedia(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(media).where(eq(media.id, id));
}

export async function reorderMedia(ids: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.transaction(async tx => {
    for (let index = 0; index < ids.length; index += 1) {
      await tx.update(media).set({ sortOrder: index + 1 }).where(eq(media.id, ids[index]));
    }
  });
}

/* -------------------------------------------------------------------------- */
/*                              Blocks and bookings                           */
/* -------------------------------------------------------------------------- */

export async function listBlocks(from?: string): Promise<BlockedSlot[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const query = db.select().from(blockedSlots).orderBy(asc(blockedSlots.date), asc(blockedSlots.time));
  if (from) return query.where(gte(blockedSlots.date, from));
  return query;
}

export async function createBlock(input: { date: string; time?: string; reason?: string }): Promise<BlockedSlot> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const time = input.time && input.time !== "ALL" ? input.time : "ALL";
  try {
    const result = await db.insert(blockedSlots).values({ date: input.date, time, reason: input.reason?.trim() || null });
    const id = Number((result as unknown as [{ insertId: number }])[0]?.insertId);
    const [created] = await db.select().from(blockedSlots).where(eq(blockedSlots.id, id)).limit(1);
    if (!created) throw new Error("No se pudo crear el bloqueo.");
    return created;
  } catch (error) {
    if (String(error).includes("Duplicate")) throw new Error("Ese día o franja ya está bloqueado.");
    throw error;
  }
}

export async function deleteBlock(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.delete(blockedSlots).where(eq(blockedSlots.id, id));
}

export async function listBookings(options: {
  from?: string;
  to?: string;
  status?: Booking["status"];
  limit?: number;
} = {}): Promise<Booking[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const filters = [];
  if (options.from) filters.push(gte(bookings.bookingDate, options.from));
  if (options.to) filters.push(lte(bookings.bookingDate, options.to));
  if (options.status) filters.push(eq(bookings.status, options.status));

  const query = db
    .select()
    .from(bookings)
    .orderBy(asc(bookings.bookingDate), asc(bookings.bookingTime), desc(bookings.createdAt))
    .limit(Math.min(options.limit ?? 500, 1000));

  if (filters.length) return query.where(and(...filters));
  return query;
}

export async function getBooking(id: number): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return rows[0];
}

export async function calendarCounts(from: string, to: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db
    .select({
      date: bookings.bookingDate,
      status: bookings.status,
      total: count(),
    })
    .from(bookings)
    .where(and(gte(bookings.bookingDate, from), lte(bookings.bookingDate, to)))
    .groupBy(bookings.bookingDate, bookings.status);
}

export async function setBookingStatus(id: number, status: Booking["status"]): Promise<Booking> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const currentSettings = await getSettings();

  await db.transaction(async tx => {
    const [booking] = await tx.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (!booking) throw new Error("Reserva no encontrada.");

    if (status === "cancelled") {
      await tx.delete(bookingSlots).where(eq(bookingSlots.bookingId, id));
    }

    if (booking.status === "cancelled" && status !== "cancelled") {
      const [occupiedRows, blockedRows] = await Promise.all([
        tx
          .select({ time: bookingSlots.slotTime })
          .from(bookingSlots)
          .where(and(eq(bookingSlots.slotDate, booking.bookingDate), ne(bookingSlots.bookingId, id))),
        tx.select({ time: blockedSlots.time }).from(blockedSlots).where(eq(blockedSlots.date, booking.bookingDate)),
      ]);
      const allowed = availableSlots({
        date: booking.bookingDate,
        durationMin: booking.durationMin,
        rules: {
          hours: currentSettings.hoursJson,
          slotMinutes: currentSettings.slotMinutes,
          minLeadMinutes: currentSettings.minLeadMinutes,
          maxDaysAhead: currentSettings.maxDaysAhead,
        },
        occupied: occupiedRows.map(row => row.time),
        blocked: blockedRows.map(row => row.time),
      });
      if (!allowed.includes(booking.bookingTime)) {
        throw new Error("No se puede reactivar: ese día está cerrado, bloqueado o la franja ya no cumple el horario.");
      }
      const rows = coveredSlots(booking.bookingTime, booking.durationMin, currentSettings.slotMinutes).map(slotTime => ({
        bookingId: id,
        slotDate: booking.bookingDate,
        slotTime,
      }));
      try {
        await tx.insert(bookingSlots).values(rows);
      } catch (error) {
        if (String(error).includes("Duplicate")) {
          throw new Error("No se puede reactivar: esa franja ya está ocupada.");
        }
        throw error;
      }
    }

    await tx.update(bookings).set({ status }).where(eq(bookings.id, id));
  });

  const updated = await getBooking(id);
  if (!updated) throw new Error("Reserva no encontrada.");
  return updated;
}

/* -------------------------------------------------------------------------- */
/*                                   Emails                                   */
/* -------------------------------------------------------------------------- */

export async function listEmails(limit = 50): Promise<EmailOutboxItem[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(Math.min(limit, 200));
}

export async function getEmail(id: number): Promise<EmailOutboxItem | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(emailOutbox).where(eq(emailOutbox.id, id)).limit(1);
  return rows[0];
}

export async function activeSlotsForDate(date: string): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ time: bookingSlots.slotTime }).from(bookingSlots).where(eq(bookingSlots.slotDate, date));
  return rows.map(row => row.time);
}

export async function blocksForDate(date: string): Promise<string[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ time: blockedSlots.time }).from(blockedSlots).where(eq(blockedSlots.date, date));
  return rows.map(row => row.time);
}

export async function bookingsByIds(ids: number[]): Promise<Booking[]> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (!ids.length) return [];
  return db.select().from(bookings).where(inArray(bookings.id, ids));
}
