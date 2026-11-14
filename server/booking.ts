import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { bookingSlots, bookings, services, type Booking, type Service } from "../drizzle/schema";
import {
  availableSlots,
  coveredSlots,
  isISODate,
  isTime,
  weekdayFromISO,
  type BookingRules,
} from "../shared/booking";
import { getDb } from "./db";
import { sendBookingEmails } from "./email";
import { activeSlotsForDate, blocksForDate, getSettings } from "./repo";

export class BookingError extends Error {
  constructor(
    public code: "SLOT_TAKEN" | "INVALID" | "CLOSED" | "SERVICE",
    message: string,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeReference(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) code += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `ASK-${code}`;
}

function rulesFromSettings(settings: Awaited<ReturnType<typeof getSettings>>): BookingRules {
  return {
    hours: settings.hoursJson,
    slotMinutes: settings.slotMinutes,
    minLeadMinutes: settings.minLeadMinutes,
    maxDaysAhead: settings.maxDaysAhead,
  };
}

async function findActiveService(serviceId: number): Promise<Service> {
  const db = await getDb();
  if (!db) throw new BookingError("SERVICE", "No se pudo consultar el servicio.");
  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.active, true)))
    .limit(1);
  if (!service) throw new BookingError("SERVICE", "Ese servicio ya no está disponible.");
  return service;
}

export async function getAvailability(serviceId: number, date: string) {
  if (!isISODate(date)) throw new BookingError("INVALID", "La fecha no es válida.");
  const service = await findActiveService(serviceId);
  const settings = await getSettings();
  const [occupied, blocked] = await Promise.all([activeSlotsForDate(date), blocksForDate(date)]);
  const slots = availableSlots({
    date,
    durationMin: service.durationMin,
    rules: rulesFromSettings(settings),
    occupied,
    blocked,
  });

  const day = settings.hoursJson[weekdayFromISO(date)];
  return {
    date,
    slots,
    closed: !day || day.closed,
    blockedAll: blocked.includes("ALL"),
    service: {
      id: service.id,
      name: service.nameEs,
      durationMin: service.durationMin,
      priceCents: service.priceCents,
    },
  };
}

function normalizePhone(value: string): string {
  const cleaned = value.trim().replace(/[^\d+()\s.-]/g, "").replace(/\s+/g, " ");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    throw new BookingError("INVALID", "Revisa el teléfono: debe tener entre 7 y 15 dígitos.");
  }
  return cleaned;
}

function normalizeName(value: string): string {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) {
    throw new BookingError("INVALID", "Escribe tu nombre (entre 2 y 120 caracteres).");
  }
  return name;
}

export type CreateBookingInput = {
  name: string;
  phone: string;
  email?: string;
  serviceId: number;
  date: string;
  time: string;
  notes?: string;
  locale?: string;
};

function isDuplicateFor(error: unknown, key: string): boolean {
  return String(error).toLowerCase().includes(key.toLowerCase());
}

export async function createBooking(input: CreateBookingInput) {
  if (!isISODate(input.date) || !isTime(input.time)) {
    throw new BookingError("INVALID", "La fecha o la hora no son válidas.");
  }

  const service = await findActiveService(input.serviceId);
  const settings = await getSettings();
  const [occupied, blocked] = await Promise.all([activeSlotsForDate(input.date), blocksForDate(input.date)]);

  const free = availableSlots({
    date: input.date,
    durationMin: service.durationMin,
    rules: rulesFromSettings(settings),
    occupied,
    blocked,
  });

  if (!free.includes(input.time)) {
    throw new BookingError("SLOT_TAKEN", "Esa franja ya no está disponible. Elige otra hora, por favor.");
  }

  const name = normalizeName(input.name);
  const phone = normalizePhone(input.phone);
  const email = input.email?.trim().toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new BookingError("INVALID", "Revisa el email.");
  }
  const notes = input.notes?.trim().slice(0, 600) || null;
  const locale = ["es", "en", "fr", "de"].includes(input.locale ?? "") ? input.locale! : "es";
  const slots = coveredSlots(input.time, service.durationMin, settings.slotMinutes);

  const db = await getDb();
  if (!db) throw new BookingError("INVALID", "La reserva no está disponible en este momento.");

  let created: Booking | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt < 6 && !created; attempt += 1) {
    const reference = makeReference();
    try {
      created = await db.transaction(async tx => {
        const result = await tx.insert(bookings).values({
          reference,
          name,
          phone,
          email,
          serviceId: service.id,
          serviceName: service.nameEs,
          priceCents: service.priceCents,
          durationMin: service.durationMin,
          bookingDate: input.date,
          bookingTime: input.time,
          notes,
          status: "pending",
          locale,
          source: "web",
        });
        const bookingId = Number((result as unknown as [{ insertId: number }])[0]?.insertId);
        if (!bookingId) throw new BookingError("INVALID", "No se pudo guardar la reserva.");

        await tx.insert(bookingSlots).values(
          slots.map(slotTime => ({ bookingId, slotDate: input.date, slotTime })),
        );

        const [row] = await tx.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
        if (!row) throw new BookingError("INVALID", "No se pudo guardar la reserva.");
        return row;
      });
    } catch (error) {
      lastError = error;
      if (isDuplicateFor(error, "uniq_booking_slot") || isDuplicateFor(error, "booking_slots")) {
        throw new BookingError("SLOT_TAKEN", "Alguien acaba de reservar esa hora. Prueba con otra franja.");
      }
      if (isDuplicateFor(error, "uniq_booking_reference") || isDuplicateFor(error, "reference")) {
        continue;
      }
      throw error;
    }
  }

  if (!created) {
    console.error("[booking] Could not create booking:", lastError);
    throw new BookingError("INVALID", "No se pudo guardar la reserva. Inténtalo de nuevo.");
  }

  let emails = { owner: false, customer: false, configured: false };
  try {
    emails = await sendBookingEmails(created, settings);
  } catch (error) {
    console.error("[booking] Email dispatch failed:", error);
  }

  return { booking: created, emails };
}

export function bookingPublicView(booking: Booking) {
  return {
    id: booking.id,
    reference: booking.reference,
    name: booking.name,
    date: booking.bookingDate,
    time: booking.bookingTime,
    serviceName: booking.serviceName,
    priceCents: booking.priceCents,
    durationMin: booking.durationMin,
    status: booking.status,
    email: booking.email,
  };
}
