import { formatMoney } from "./format";

export const ADMIN_TOKEN_KEY = "askao_admin_token";

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // A blocked sessionStorage only means the HttpOnly cookie is used.
  }
}

export type UploadedMedia = {
  url: string;
  key: string;
  type: "image" | "video";
  mime: string;
  size: number;
};

export async function uploadMediaFile(file: File): Promise<UploadedMedia> {
  const body = new FormData();
  body.append("file", file);

  const headers: Record<string, string> = { "x-askao-csrf": "1" };
  const token = getAdminToken();
  if (token) headers["x-admin-token"] = token;

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body,
    headers,
    credentials: "include",
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<UploadedMedia> & { error?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "No se pudo subir el archivo.");
  }
  return payload as UploadedMedia;
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
};

export const STATUS_STYLES: Record<string, string> = {
  pending: "bg-butter/70 text-ink",
  confirmed: "bg-[#2f7d4e]/14 text-[#2f7d4e]",
  cancelled: "bg-vermilion/10 text-vermilion",
  completed: "bg-sky text-cobalt-deep",
};

export function formatAdminDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${iso}T12:00:00Z`))
    .replace(".", "");
}

export function formatAdminDateLong(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

export function formatAdminMoney(cents: number): string {
  return formatMoney(cents, "es");
}

export function eurosFromCents(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function centsFromEuros(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("");
}
