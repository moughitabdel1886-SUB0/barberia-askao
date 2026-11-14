import { eq } from "drizzle-orm";
import type { Booking, EmailOutboxItem, Settings } from "../drizzle/schema";
import { emailOutbox } from "../drizzle/schema";
import { formatPrice } from "../shared/booking";
import { getDb } from "./db";
import { getEmail } from "./repo";

const DEFAULT_FROM = "Barbería Askao <onboarding@resend.dev>";
const SITE_ADDRESS = "Askao Kalea, 27 · 48005 Bilbao";
const SITE_PHONE = "652 41 36 81";

const LOCALE_TAG: Record<string, string> = { es: "es-ES", en: "en-GB", fr: "fr-FR", de: "de-DE" };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatBookingDate(date: string, locale: string): string {
  const formatted = new Intl.DateTimeFormat(LOCALE_TAG[locale] ?? "es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function shell(options: {
  heading: string;
  intro: string;
  rows: Array<[string, string]>;
  footerNote: string;
  phone?: string;
  lang?: string;
}): string {
  const rows = options.rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee6d6;font:600 12px/1.4 Arial,sans-serif;color:#8a8172;text-transform:uppercase;letter-spacing:.08em;width:38%;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee6d6;font:500 15px/1.5 Arial,sans-serif;color:#1b1a17;vertical-align:top">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="${escapeHtml(options.lang ?? "es")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(options.heading)}</title></head>
<body style="margin:0;padding:0;background:#fbf5e9;color:#1b1a17">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(options.intro)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf5e9;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf8;border:1px solid #eadfca;border-radius:20px;overflow:hidden">
        <tr><td style="height:10px;background:repeating-linear-gradient(135deg,#d63b2a 0 18px,#fffdf8 18px 36px,#2447c9 36px 54px,#fffdf8 54px 72px)"></td></tr>
        <tr><td style="padding:32px 32px 8px">
          <div style="font:700 30px/1 Georgia,'Times New Roman',serif;letter-spacing:-.03em;color:#1b1a17">askao<span style="color:#d63b2a">.</span></div>
          <div style="font:600 11px/1.4 Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8a8172;margin-top:6px">Barbería · Casco Viejo · Bilbao</div>
        </td></tr>
        <tr><td style="padding:18px 32px 4px">
          <h1 style="margin:0 0 8px;font:700 26px/1.15 Georgia,'Times New Roman',serif;letter-spacing:-.02em;color:#1b1a17">${escapeHtml(options.heading)}</h1>
          <p style="margin:0;font:400 15px/1.6 Arial,sans-serif;color:#5f574a">${escapeHtml(options.intro)}</p>
        </td></tr>
        <tr><td style="padding:16px 32px 8px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td></tr>
        <tr><td style="padding:18px 32px 28px">
          <p style="margin:0 0 6px;font:600 14px/1.5 Arial,sans-serif;color:#1b1a17">${escapeHtml(options.footerNote)}</p>
          <p style="margin:0;font:400 13px/1.6 Arial,sans-serif;color:#8a8172">${escapeHtml(SITE_ADDRESS)} · ${escapeHtml(options.phone ?? SITE_PHONE)}</p>
        </td></tr>
        <tr><td style="padding:16px 32px;background:#f7efdf;font:400 11px/1.5 Arial,sans-serif;color:#8a8172">Este mensaje se ha generado automáticamente desde la web de Barbería Askao</td></tr>
      </table>
      <div style="font:400 11px/1.5 Arial,sans-serif;color:#a69b87;padding:14px">Barbería Askao · Peluquería – Barbería AT-MAN</div>
    </td></tr>
  </table>
</body></html>`;
}

export function ownerEmailContent(booking: Booking, settings: Settings) {
  const date = formatBookingDate(booking.bookingDate, "es");
  const price = formatPrice(booking.priceCents, "es-ES");
  const subject = `Nueva cita · ${booking.name} · ${date} ${booking.bookingTime}`;
  const rows: Array<[string, string]> = [
    ["Cliente", booking.name],
    ["Teléfono", booking.phone],
    ["Email", booking.email || "No facilitado"],
    ["Servicio", booking.serviceName],
    ["Precio", price],
    ["Fecha", `${date} a las ${booking.bookingTime}`],
    ["Notas", booking.notes || "—"],
    ["Referencia", booking.reference],
  ];
  const html = shell({
    heading: "Nueva cita en la silla",
    intro: `${booking.name} ha reservado desde la web. Revisa y confirma desde el panel.`,
    rows,
    footerNote: "Puedes gestionarla en /admin → Reservas.",
    phone: settings.phone,
  });
  const text = [
    "Nueva cita en Barbería Askao",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Contacto del negocio: ${settings.phone} · ${settings.email}`,
  ].join("\n");
  return { subject, html, text };
}

const COPY = {
  es: {
    subject: (date: string, time: string) => `Tu cita en Barbería Askao · ${date} a las ${time}`,
    heading: "Tu silla está guardada",
    intro: (date: string, time: string) => `Te esperamos el ${date.toLowerCase()} a las ${time}. Llega cinco minutos antes y tráenos una idea; del resto nos ocupamos nosotros.`,
    footer: "Si necesitas cambiarla, llámanos o escríbenos por WhatsApp.",
    labels: { service: "Servicio", date: "Fecha", price: "Precio", reference: "Referencia", name: "A nombre de" },
  },
  en: {
    subject: (date: string, time: string) => `Your appointment at Barbería Askao · ${date} at ${time}`,
    heading: "Your chair is saved",
    intro: (date: string, time: string) => `See you on ${date.toLowerCase()} at ${time}. Come five minutes early and bring an idea; we'll take care of the rest.`,
    footer: "Need to change it? Call us or send us a WhatsApp.",
    labels: { service: "Service", date: "Date", price: "Price", reference: "Reference", name: "Booked for" },
  },
  fr: {
    subject: (date: string, time: string) => `Votre rendez-vous chez Barbería Askao · ${date} à ${time}`,
    heading: "Votre fauteuil est réservé",
    intro: (date: string, time: string) => `Rendez-vous le ${date.toLowerCase()} à ${time}. Arrivez cinq minutes avant et apportez une idée ; on s'occupe du reste.`,
    footer: "Besoin de modifier ? Appelez-nous ou écrivez-nous sur WhatsApp.",
    labels: { service: "Prestation", date: "Date", price: "Prix", reference: "Référence", name: "Au nom de" },
  },
  de: {
    subject: (date: string, time: string) => `Ihr Termin bei Barbería Askao · ${date} um ${time} Uhr`,
    heading: "Ihr Stuhl ist reserviert",
    intro: (date: string, time: string) => `Wir sehen uns am ${date.toLowerCase()} um ${time} Uhr. Kommen Sie fünf Minuten früher und bringen Sie eine Idee mit – den Rest übernehmen wir.`,
    footer: "Termin ändern? Rufen Sie uns an oder schreiben Sie uns per WhatsApp.",
    labels: { service: "Leistung", date: "Datum", price: "Preis", reference: "Referenz", name: "Auf den Namen" },
  },
} as const;

export function customerEmailContent(booking: Booking, settings: Settings) {
  const copy = COPY[(booking.locale as keyof typeof COPY) ?? "es"] ?? COPY.es;
  const tag = LOCALE_TAG[booking.locale] ?? "es-ES";
  const date = formatBookingDate(booking.bookingDate, booking.locale);
  const price = formatPrice(booking.priceCents, tag);
  const subject = copy.subject(date, booking.bookingTime);
  const rows: Array<[string, string]> = [
    [copy.labels.name, booking.name],
    [copy.labels.service, booking.serviceName],
    [copy.labels.date, `${date} · ${booking.bookingTime}`],
    [copy.labels.price, price],
    [copy.labels.reference, booking.reference],
  ];
  const html = shell({
    heading: copy.heading,
    intro: copy.intro(date, booking.bookingTime),
    rows,
    footerNote: copy.footer,
    phone: settings.phone,
    lang: booking.locale,
  });
  const text = [
    copy.heading,
    copy.intro(date, booking.bookingTime),
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `${settings.phone} · ${settings.email} · ${SITE_ADDRESS}`,
  ].join("\n");
  return { subject, html, text };
}

type SendResult = { ok: boolean; providerId?: string; error?: string };

async function sendWithResend(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: "RESEND_API_KEY no configurada; el email queda en la bandeja de salida." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM?.trim() || DEFAULT_FROM,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(12_000),
    });

    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string; error?: string };
    if (!response.ok) {
      return { ok: false, error: body.message || body.error || `Resend ${response.status}` };
    }
    return { ok: true, providerId: body.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Error de red al enviar el email" };
  }
}

async function queueAndSend(input: {
  bookingId: number;
  kind: "owner" | "customer";
  recipient: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const db = await getDb();
  if (!db) return { ok: false, error: "Database unavailable" };

  const result = await db.insert(emailOutbox).values({
    bookingId: input.bookingId,
    kind: input.kind,
    recipient: input.recipient,
    subject: input.subject,
    html: input.html,
    textBody: input.text,
    status: "queued",
  });
  const id = Number((result as unknown as [{ insertId: number }])[0]?.insertId);

  const configured = isEmailConfigured();
  const sent = await sendWithResend({
    to: input.recipient,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
  });

  await db
    .update(emailOutbox)
    .set({
      status: sent.ok ? "sent" : configured ? "failed" : "queued",
      providerId: sent.providerId ?? null,
      error: sent.ok ? null : sent.error ?? "Error desconocido",
      sentAt: sent.ok ? new Date() : null,
    })
    .where(eq(emailOutbox.id, id));

  return sent;
}

export async function sendBookingEmails(booking: Booking, settings: Settings) {
  const owner = ownerEmailContent(booking, settings);
  const jobs: Array<Promise<SendResult>> = [
    queueAndSend({
      bookingId: booking.id,
      kind: "owner",
      recipient: settings.email,
      subject: owner.subject,
      html: owner.html,
      text: owner.text,
      replyTo: booking.email ?? undefined,
    }),
  ];

  if (booking.email) {
    const customer = customerEmailContent(booking, settings);
    jobs.push(
      queueAndSend({
        bookingId: booking.id,
        kind: "customer",
        recipient: booking.email,
        subject: customer.subject,
        html: customer.html,
        text: customer.text,
        replyTo: settings.email,
      }),
    );
  }

  const results = await Promise.allSettled(jobs);
  return {
    owner: results[0]?.status === "fulfilled" && results[0].value.ok,
    customer:
      results.length > 1 ? results[1]?.status === "fulfilled" && results[1].value.ok : false,
    configured: isEmailConfigured(),
  };
}

export async function resendOutboxEmail(item: EmailOutboxItem): Promise<SendResult> {
  const db = await getDb();
  if (!db) return { ok: false, error: "Database unavailable" };
  if (!item.textBody) {
    // Legacy rows may only have HTML; a plain-text fallback is still valid.
    item.textBody = item.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  const configured = isEmailConfigured();
  const sent = await sendWithResend({
    to: item.recipient,
    subject: item.subject,
    html: item.html,
    text: item.textBody,
  });

  await db
    .update(emailOutbox)
    .set({
      status: sent.ok ? "sent" : configured ? "failed" : "queued",
      providerId: sent.providerId ?? null,
      error: sent.ok ? null : sent.error ?? "Error desconocido",
      sentAt: sent.ok ? new Date() : null,
    })
    .where(eq(emailOutbox.id, item.id));

  return sent;
}

export async function retryEmailById(id: number): Promise<SendResult> {
  const item = await getEmail(id);
  if (!item) return { ok: false, error: "Email no encontrado." };
  if (item.status === "sent") return { ok: true, providerId: item.providerId ?? undefined };
  return resendOutboxEmail(item);
}
