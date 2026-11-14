import { TRPCError } from "@trpc/server";
import type { Response } from "express";
import { z } from "zod";
import type { Settings } from "../drizzle/schema";
import { isISODate, isTime } from "../shared/booking";
import {
  ADMIN_COOKIE,
  authenticate,
  countAdmins,
  createAdmin,
  createSession,
  readAdminToken,
  revokeSession,
  updatePassword,
  validatePassword,
  verifySetupToken,
} from "./auth";
import { BookingError, bookingPublicView, createBooking, getAvailability } from "./booking";
import { isEmailConfigured, retryEmailById } from "./email";
import { clientIp, rateLimit } from "./rateLimit";
import {
  calendarCounts,
  createBlock,
  createMedia,
  createService,
  deleteBlock,
  deleteMedia,
  deleteService,
  getSettings,
  listBlocks,
  listBookings,
  listEmails,
  listMedia,
  listServices,
  reorderMedia,
  reorderServices,
  setBookingStatus,
  updateMedia,
  updateService,
  updateSettings,
  validateHours,
  type SettingsUpdate,
} from "./repo";
import { adminProcedure, publicProcedure, router, sensitiveProcedure } from "./_core/trpc";

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function setAdminCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    expires: expiresAt,
  });
}

function clearAdminCookie(res: Response) {
  res.clearCookie(ADMIN_COOKIE, { httpOnly: true, sameSite: "none", secure: true, path: "/" });
}

function publicSettings(settings: Settings) {
  return {
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    instagram: settings.instagram,
    tiktok: settings.tiktok,
    mapsUrl: settings.mapsUrl,
    reviewsUrl: settings.reviewsUrl,
    rating: settings.ratingTenths / 10,
    reviewCount: settings.reviewCount,
    hours: settings.hoursJson,
    slotMinutes: settings.slotMinutes,
    minLeadMinutes: settings.minLeadMinutes,
    maxDaysAhead: settings.maxDaysAhead,
  };
}

function mapBookingError(error: unknown): never {
  if (error instanceof BookingError) {
    throw new TRPCError({
      code: error.code === "SLOT_TAKEN" ? "CONFLICT" : "BAD_REQUEST",
      message: error.message,
    });
  }
  throw error;
}

function sanitizeHandle(value: string | null | undefined): string | null {
  if (!value) return null;
  let handle = value.trim();
  if (!handle) return null;
  if (/^https?:\/\//i.test(handle)) {
    try {
      const url = new URL(handle);
      handle = url.pathname.split("/").filter(Boolean).pop() ?? "";
    } catch {
      return null;
    }
  }
  handle = handle.replace(/^@+/, "").replace(/\/+$/, "").trim();
  handle = handle.replace(/[^A-Za-z0-9._]/g, "");
  return handle.slice(0, 80) || null;
}

function normalizeWhatsapp(value: string): string {
  const trimmed = value.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (digits.length === 9) digits = `34${digits}`;
  return `+${digits}`;
}

const dateSchema = z.string().refine(isISODate, "Fecha no válida");
const timeSchema = z.string().refine(isTime, "Hora no válida");
const emailSchema = z.string().trim().email("Email no válido").max(320);

const serviceFields = {
  nameEs: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().max(120).nullable().optional(),
  nameFr: z.string().trim().max(120).nullable().optional(),
  nameDe: z.string().trim().max(120).nullable().optional(),
  descriptionEs: z.string().trim().max(600).nullable().optional(),
  descriptionEn: z.string().trim().max(600).nullable().optional(),
  descriptionFr: z.string().trim().max(600).nullable().optional(),
  descriptionDe: z.string().trim().max(600).nullable().optional(),
  priceCents: z.number().int().min(0).max(100000),
  durationMin: z.number().int().min(15).max(180),
  active: z.boolean(),
};

const mediaSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .max(1024)
    .refine(value => value.startsWith("/manus-storage/") || /^https:\/\//i.test(value), "URL no válida"),
  storageKey: z.string().trim().max(512).nullable().optional(),
  type: z.enum(["image", "video"]),
  title: z.string().trim().max(200).nullable().optional(),
  alt: z.string().trim().max(300).nullable().optional(),
  category: z.string().trim().max(40).optional(),
});

/* -------------------------------------------------------------------------- */
/*                                   Routers                                  */
/* -------------------------------------------------------------------------- */

export const appRouter = router({
  site: router({
    bootstrap: publicProcedure.query(async () => {
      const [settings, services, media] = await Promise.all([getSettings(), listServices(true), listMedia()]);
      return {
        settings: publicSettings(settings),
        services,
        media,
      };
    }),
  }),

  booking: router({
    availability: publicProcedure
      .input(z.object({ serviceId: z.number().int().positive(), date: dateSchema }))
      .query(async ({ input, ctx }) => {
        const limit = rateLimit(`availability:${clientIp(ctx.req)}`, 240, 60 * 1000);
        if (!limit.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiadas consultas. Espera un momento." });
        }
        try {
          return await getAvailability(input.serviceId, input.date);
        } catch (error) {
          mapBookingError(error);
        }
      }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string().trim().min(2).max(120),
          phone: z.string().trim().min(6).max(32),
          email: z.union([emailSchema, z.literal("")]).optional(),
          serviceId: z.number().int().positive(),
          date: dateSchema,
          time: timeSchema,
          notes: z.string().trim().max(600).optional(),
          locale: z.enum(["es", "en", "fr", "de"]).optional(),
          website: z.string().max(200).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const ipLimit = rateLimit(`booking:${clientIp(ctx.req)}`, 8, 15 * 60 * 1000);
        if (!ipLimit.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Demasiados intentos. Prueba de nuevo en ${Math.ceil(ipLimit.retryAfterSeconds / 60)} min.`,
          });
        }

        // Honeypot: real visitors never see or fill this field.
        if (input.website && input.website.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No se pudo procesar la solicitud." });
        }

        const phoneDigits = input.phone.replace(/\D/g, "");
        const phoneLimit = rateLimit(`booking-phone:${phoneDigits}`, 4, 60 * 60 * 1000);
        if (!phoneLimit.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Ya hay varias reservas con este teléfono. Llámanos si necesitas otra.",
          });
        }

        try {
          const result = await createBooking({
            ...input,
            email: input.email || undefined,
          });
          return {
            booking: bookingPublicView(result.booking),
            emails: result.emails,
          };
        } catch (error) {
          mapBookingError(error);
        }
      }),
  }),

  admin: router({
    status: publicProcedure.query(async () => ({ initialized: (await countAdmins()) > 0 })),

    setup: sensitiveProcedure
      .input(
        z.object({
          email: emailSchema,
          password: z.string().min(1).max(200),
          name: z.string().trim().max(120).optional(),
          setupToken: z.string().min(1).max(200),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const limit = rateLimit(`setup:${clientIp(ctx.req)}`, 5, 60 * 60 * 1000);
        if (!limit.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiados intentos. Espera un poco." });
        }
        if ((await countAdmins()) > 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: "El panel ya está configurado. Inicia sesión." });
        }
        if (!verifySetupToken(input.setupToken)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Token de primer acceso incorrecto. Revisa los logs del servidor o la variable ADMIN_SETUP_TOKEN.",
          });
        }
        const passwordError = validatePassword(input.password);
        if (passwordError) throw new TRPCError({ code: "BAD_REQUEST", message: passwordError });

        const admin = await createAdmin({ email: input.email, password: input.password, name: input.name });
        const session = await createSession(admin.id);
        setAdminCookie(ctx.res, session.token, session.expiresAt);
        return { admin, token: session.token };
      }),

    login: sensitiveProcedure
      .input(z.object({ email: emailSchema, password: z.string().min(1).max(200) }))
      .mutation(async ({ input, ctx }) => {
        const ipLimit = rateLimit(`login-ip:${clientIp(ctx.req)}`, 10, 15 * 60 * 1000);
        const emailLimit = rateLimit(
          `login-email-ip:${input.email.toLowerCase()}:${clientIp(ctx.req)}`,
          6,
          15 * 60 * 1000,
        );
        if (!ipLimit.allowed || !emailLimit.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Demasiados intentos. Espera 15 minutos." });
        }

        const admin = await authenticate(input.email, input.password);
        if (!admin) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Email o contraseña incorrectos." });
        }

        const session = await createSession(admin.id);
        setAdminCookie(ctx.res, session.token, session.expiresAt);
        return { admin, token: session.token };
      }),

    logout: sensitiveProcedure.mutation(async ({ ctx }) => {
      await revokeSession(readAdminToken(ctx.req));
      clearAdminCookie(ctx.res);
      return { ok: true };
    }),

    me: adminProcedure.query(({ ctx }) => ctx.admin),

    changePassword: adminProcedure
      .input(z.object({ currentPassword: z.string().min(1).max(200), nextPassword: z.string().min(1).max(200) }))
      .mutation(async ({ input, ctx }) => {
        const passwordError = validatePassword(input.nextPassword);
        if (passwordError) throw new TRPCError({ code: "BAD_REQUEST", message: passwordError });

        const ok = await updatePassword(ctx.admin.id, input.currentPassword, input.nextPassword);
        if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: "La contraseña actual no es correcta." });

        const session = await createSession(ctx.admin.id);
        setAdminCookie(ctx.res, session.token, session.expiresAt);
        return { ok: true, token: session.token };
      }),

    bookings: router({
      list: adminProcedure
        .input(
          z
            .object({
              from: dateSchema.optional(),
              to: dateSchema.optional(),
              status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
            })
            .optional(),
        )
        .query(({ input }) => listBookings(input ?? {})),

      calendar: adminProcedure.input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) })).query(async ({ input }) => {
        const [year, month] = input.month.split("-").map(Number);
        const first = new Date(Date.UTC(year, month - 1, 1));
        const last = new Date(Date.UTC(year, month, 0));
        return calendarCounts(first.toISOString().slice(0, 10), last.toISOString().slice(0, 10));
      }),

      setStatus: adminProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
          }),
        )
        .mutation(({ input }) => setBookingStatus(input.id, input.status)),
    }),

    services: router({
      list: adminProcedure.query(() => listServices(false)),

      create: adminProcedure.input(z.object(serviceFields)).mutation(({ input }) => createService(input)),

      update: adminProcedure
        .input(z.object({ id: z.number().int().positive() }).merge(z.object(serviceFields).partial()))
        .mutation(({ input }) => {
          const { id, ...patch } = input;
          return updateService(id, patch);
        }),

      delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
        await deleteService(input.id);
        return { ok: true };
      }),

      reorder: adminProcedure
        .input(z.object({ ids: z.array(z.number().int().positive()).min(1).max(200) }))
        .mutation(async ({ input }) => {
          await reorderServices(input.ids);
          return { ok: true };
        }),
    }),

    media: router({
      list: adminProcedure.query(() => listMedia(false)),

      create: adminProcedure.input(mediaSchema).mutation(({ input }) => createMedia(input)),

      update: adminProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            title: z.string().trim().max(200).nullable().optional(),
            alt: z.string().trim().max(300).nullable().optional(),
            category: z.string().trim().max(40).optional(),
          }),
        )
        .mutation(({ input }) => {
          const { id, ...patch } = input;
          return updateMedia(id, patch);
        }),

      delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
        await deleteMedia(input.id);
        return { ok: true };
      }),

      reorder: adminProcedure
        .input(z.object({ ids: z.array(z.number().int().positive()).min(1).max(500) }))
        .mutation(async ({ input }) => {
          await reorderMedia(input.ids);
          return { ok: true };
        }),
    }),

    settings: router({
      get: adminProcedure.query(async () => {
        const settings = await getSettings();
        return { ...settings, rating: settings.ratingTenths / 10, emailConfigured: isEmailConfigured() };
      }),

      update: adminProcedure
        .input(
          z.object({
            phone: z.string().trim().min(6).max(32).optional(),
            whatsapp: z
              .string()
              .trim()
              .min(6)
              .max(32)
              .refine(value => value.replace(/\D/g, "").length >= 7, "WhatsApp no válido")
              .optional(),
            email: emailSchema.optional(),
            instagram: z.string().trim().max(200).nullable().optional(),
            tiktok: z.string().trim().max(200).nullable().optional(),
            mapsUrl: z.string().url().max(1024).refine(value => /^https?:\/\//i.test(value), "URL no válida").optional(),
            reviewsUrl: z.string().url().max(1024).refine(value => /^https?:\/\//i.test(value), "URL no válida").optional(),
            rating: z.number().min(0).max(5).optional(),
            reviewCount: z.number().int().min(0).max(100000).optional(),
            hours: z.array(z.unknown()).length(7).optional(),
            slotMinutes: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60)]).optional(),
            minLeadMinutes: z.number().int().min(0).max(10080).optional(),
            maxDaysAhead: z.number().int().min(1).max(365).optional(),
          }),
        )
        .mutation(async ({ input }) => {
          if (input.hours && !validateHours(input.hours)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "El horario no es válido." });
          }

          const patch: SettingsUpdate = {};
          if (input.phone !== undefined) patch.phone = input.phone;
          if (input.whatsapp !== undefined) patch.whatsapp = normalizeWhatsapp(input.whatsapp);
          if (input.email !== undefined) patch.email = input.email.toLowerCase();
          if (input.instagram !== undefined) patch.instagram = sanitizeHandle(input.instagram);
          if (input.tiktok !== undefined) patch.tiktok = sanitizeHandle(input.tiktok);
          if (input.mapsUrl !== undefined) patch.mapsUrl = input.mapsUrl;
          if (input.reviewsUrl !== undefined) patch.reviewsUrl = input.reviewsUrl;
          if (input.rating !== undefined) patch.ratingTenths = Math.round(input.rating * 10);
          if (input.reviewCount !== undefined) patch.reviewCount = input.reviewCount;
          if (input.hours !== undefined) patch.hoursJson = input.hours as Settings["hoursJson"];
          if (input.slotMinutes !== undefined) patch.slotMinutes = input.slotMinutes;
          if (input.minLeadMinutes !== undefined) patch.minLeadMinutes = input.minLeadMinutes;
          if (input.maxDaysAhead !== undefined) patch.maxDaysAhead = input.maxDaysAhead;

          const settings = await updateSettings(patch);
          return { ...settings, rating: settings.ratingTenths / 10, emailConfigured: isEmailConfigured() };
        }),
    }),

    blocks: router({
      list: adminProcedure.input(z.object({ from: dateSchema.optional() }).optional()).query(({ input }) =>
        listBlocks(input?.from),
      ),

      create: adminProcedure
        .input(
          z.object({
            date: dateSchema,
            time: z.union([z.literal("ALL"), timeSchema]).optional(),
            reason: z.string().trim().max(200).optional(),
          }),
        )
        .mutation(({ input }) => createBlock(input)),

      delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => {
        await deleteBlock(input.id);
        return { ok: true };
      }),
    }),

    emails: router({
      list: adminProcedure.query(async () => {
        const rows = await listEmails(50);
        return rows.map(row => ({
          id: row.id,
          kind: row.kind,
          recipient: row.recipient,
          subject: row.subject,
          status: row.status,
          error: row.error,
          createdAt: row.createdAt,
          sentAt: row.sentAt,
        }));
      }),

      retry: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) =>
        retryEmailById(input.id),
      ),
    }),
  }),
});

export type AppRouter = typeof appRouter;
