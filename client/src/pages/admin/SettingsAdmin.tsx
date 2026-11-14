import {
  AdminCard,
  AdminSectionHeader,
  EmptyState,
  Field,
  Spinner,
  btnAccent,
  btnSecondary,
  inputClass,
} from "@/components/admin/ui";
import { setAdminToken } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import type { AdminSettings, AdminUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check, KeyRound, Mail, MailCheck, MailWarning, RefreshCw, Save, ShieldCheck, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function ContactForm({ settings }: { settings: AdminSettings }) {
  const utils = trpc.useUtils();
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [email, setEmail] = useState(settings.email);
  const [instagram, setInstagram] = useState(settings.instagram ?? "");
  const [tiktok, setTiktok] = useState(settings.tiktok ?? "");
  const [mapsUrl, setMapsUrl] = useState(settings.mapsUrl);
  const [reviewsUrl, setReviewsUrl] = useState(settings.reviewsUrl);
  const [rating, setRating] = useState(String(settings.rating));
  const [reviewCount, setReviewCount] = useState(String(settings.reviewCount));
  const [error, setError] = useState<string | null>(null);

  const update = trpc.admin.settings.update.useMutation({
    onSuccess: () => {
      utils.admin.settings.get.invalidate();
      utils.site.bootstrap.invalidate();
      toast.success("Ajustes guardados. La web ya los muestra.");
    },
    onError: mutationError => setError(mutationError.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const ratingNumber = Number(rating);
    const countNumber = Number(reviewCount);
    if (!Number.isFinite(ratingNumber) || ratingNumber < 0 || ratingNumber > 5) {
      setError("La valoración debe estar entre 0 y 5.");
      return;
    }
    if (!Number.isInteger(countNumber) || countNumber < 0) {
      setError("El número de reseñas debe ser un entero positivo.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("El email del negocio no es válido.");
      return;
    }

    update.mutate({
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      email: email.trim(),
      instagram: instagram.trim() || null,
      tiktok: tiktok.trim() || null,
      mapsUrl: mapsUrl.trim(),
      reviewsUrl: reviewsUrl.trim(),
      rating: ratingNumber,
      reviewCount: countNumber,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-ink">Contacto y redes</p>
            <p className="mt-1 text-sm text-ink-soft">Lo que se muestra en la web, los emails y el botón de WhatsApp.</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-sky text-cobalt">
            <Mail className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Teléfono visible" htmlFor="settings-phone">
            <input id="settings-phone" value={phone} onChange={event => setPhone(event.target.value)} className={inputClass} />
          </Field>
          <Field label="WhatsApp" htmlFor="settings-whatsapp" hint="Con prefijo; si pones 9 dígitos se añade +34.">
            <input id="settings-whatsapp" value={whatsapp} onChange={event => setWhatsapp(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Email del negocio" htmlFor="settings-email" className="sm:col-span-2">
            <input id="settings-email" type="email" value={email} onChange={event => setEmail(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Instagram" htmlFor="settings-instagram" hint="Usuario o URL. Se oculta si lo dejas vacío.">
            <input id="settings-instagram" value={instagram} onChange={event => setInstagram(event.target.value)} className={inputClass} placeholder="@barberiaaskao" />
          </Field>
          <Field label="TikTok" htmlFor="settings-tiktok" hint="Usuario o URL. Se oculta si lo dejas vacío.">
            <input id="settings-tiktok" value={tiktok} onChange={event => setTiktok(event.target.value)} className={inputClass} placeholder="@barberiaaskao" />
          </Field>
          <Field label="Enlace de Google Maps" htmlFor="settings-maps">
            <input id="settings-maps" type="url" value={mapsUrl} onChange={event => setMapsUrl(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Enlace de reseñas" htmlFor="settings-reviews">
            <input id="settings-reviews" type="url" value={reviewsUrl} onChange={event => setReviewsUrl(event.target.value)} className={inputClass} />
          </Field>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-ink">Valoración de Google</p>
            <p className="mt-1 text-sm text-ink-soft">Se muestra en el hero y en la sección de reseñas.</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-butter/60 text-ink">
            <Star className="h-4.5 w-4.5 fill-current" aria-hidden="true" />
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Nota media (0–5)" htmlFor="settings-rating">
            <input id="settings-rating" type="number" min={0} max={5} step={0.1} value={rating} onChange={event => setRating(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Número de reseñas" htmlFor="settings-review-count">
            <input id="settings-review-count" type="number" min={0} step={1} value={reviewCount} onChange={event => setReviewCount(event.target.value)} className={inputClass} />
          </Field>
        </div>
      </AdminCard>

      {error ? (
        <p role="alert" className="rounded-xl bg-vermilion/8 px-3.5 py-3 text-sm font-semibold text-vermilion">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button type="submit" disabled={update.isPending} className={btnAccent}>
          {update.isPending ? <Spinner /> : <Save className="h-4 w-4" aria-hidden="true" />}
          Guardar ajustes
        </button>
      </div>
    </form>
  );
}

function PasswordForm({ admin }: { admin: AdminUser }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const change = trpc.admin.changePassword.useMutation({
    onSuccess: data => {
      setAdminToken(data.token);
      setCurrent("");
      setNext("");
      setConfirm("");
      setError(null);
      toast.success("Contraseña cambiada. Las otras sesiones se han cerrado.");
    },
    onError: mutationError => setError(mutationError.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (next.length < 10) {
      setError("La nueva contraseña debe tener al menos 10 caracteres.");
      return;
    }
    if (next !== confirm) {
      setError("La nueva contraseña y su repetición no coinciden.");
      return;
    }
    change.mutate({ currentPassword: current, nextPassword: next });
  };

  return (
    <form onSubmit={submit}>
      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
              <KeyRound className="h-5 w-5 text-cobalt" aria-hidden="true" />
              Contraseña
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              Cuenta: <span className="font-bold text-ink">{admin.email}</span>
            </p>
          </div>
          <ShieldCheck className="h-5 w-5 text-[#2f7d4e]" aria-hidden="true" />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Contraseña actual" htmlFor="password-current">
            <input id="password-current" type="password" autoComplete="current-password" value={current} onChange={event => setCurrent(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Nueva contraseña" htmlFor="password-next" hint="Mínimo 10 caracteres.">
            <input id="password-next" type="password" autoComplete="new-password" value={next} onChange={event => setNext(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Repite la nueva" htmlFor="password-confirm">
            <input id="password-confirm" type="password" autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} className={inputClass} />
          </Field>
        </div>

        {error ? (
          <p role="alert" className="mt-3 rounded-xl bg-vermilion/8 px-3.5 py-3 text-sm font-semibold text-vermilion">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={change.isPending} className={btnSecondary}>
            {change.isPending ? <Spinner /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
            Cambiar contraseña
          </button>
        </div>
      </AdminCard>
    </form>
  );
}

function EmailsPanel({ configured }: { configured: boolean }) {
  const utils = trpc.useUtils();
  const emailsQuery = trpc.admin.emails.list.useQuery();
  const retry = trpc.admin.emails.retry.useMutation({
    onSuccess: result => {
      utils.admin.emails.list.invalidate();
      if (result.ok) toast.success("Email reenviado.");
      else toast.error(result.error ?? "No se pudo reenviar.");
    },
    onError: error => toast.error(error.message),
  });

  const emails = emailsQuery.data ?? [];

  return (
    <AdminCard>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight text-ink">Emails de reserva</p>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            Cada reserva avisa al negocio y, si el cliente dejó email, le envía su confirmación. Los envíos se registran
            aquí aunque el proveedor falle.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.6rem] font-extrabold uppercase tracking-[0.12em]",
            configured ? "bg-[#2f7d4e]/12 text-[#2f7d4e]" : "bg-butter/60 text-ink",
          )}
        >
          {configured ? <MailCheck className="h-3.5 w-3.5" aria-hidden="true" /> : <MailWarning className="h-3.5 w-3.5" aria-hidden="true" />}
          {configured ? "Resend configurado" : "Sin proveedor"}
        </span>
      </div>

      {!configured ? (
        <div className="mt-4 rounded-xl border border-butter bg-butter/25 p-4 text-xs leading-relaxed text-ink-soft">
          <p className="font-extrabold text-ink">Para activar los emails:</p>
          <p className="mt-1">
            Añade <code className="rounded bg-paper px-1 py-0.5 font-bold">RESEND_API_KEY</code> y{" "}
            <code className="rounded bg-paper px-1 py-0.5 font-bold">EMAIL_FROM</code> en los secretos del proyecto.
            Hasta entonces, las reservas se guardan y los mensajes quedan en cola. Puedes reintentarlos cuando quieras.
          </p>
        </div>
      ) : null}

      <div className="mt-4">
        {emailsQuery.isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-paper" />
        ) : emails.length === 0 ? (
          <EmptyState
            icon={<Mail className="h-5 w-5" />}
            title="Todavía no hay emails"
            description="Cuando entre la primera reserva verás aquí el aviso al negocio y la confirmación al cliente."
          />
        ) : (
          <ul className="space-y-2">
            {emails.map(email => {
              const sent = email.status === "sent";
              const failed = email.status === "failed";
              return (
                <li key={email.id} className="rounded-xl border border-line bg-paper px-3.5 py-3">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-ink">{email.subject}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-soft">
                        {email.kind === "owner" ? "Aviso al negocio" : "Confirmación al cliente"} · {email.recipient}
                      </p>
                      <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink-faint">
                        {new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" }).format(new Date(email.createdAt))}
                      </p>
                      {email.error ? <p className="mt-1 line-clamp-2 text-[0.65rem] text-vermilion">{email.error}</p> : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.55rem] font-extrabold uppercase tracking-[0.1em]",
                          sent
                            ? "bg-[#2f7d4e]/12 text-[#2f7d4e]"
                            : failed
                              ? "bg-vermilion/10 text-vermilion"
                              : "bg-butter/60 text-ink",
                        )}
                      >
                        {sent ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
                        {sent ? "Enviado" : failed ? "Fallido" : "En cola"}
                      </span>
                      {!sent ? (
                        <button
                          type="button"
                          onClick={() => retry.mutate({ id: email.id })}
                          disabled={retry.isPending}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[0.62rem] font-extrabold text-ink transition enabled:hover:border-ink disabled:opacity-50"
                        >
                          {retry.isPending && retry.variables?.id === email.id ? <Spinner /> : <RefreshCw className="h-3 w-3" aria-hidden="true" />}
                          Reintentar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminCard>
  );
}

export function SettingsAdmin({ admin }: { admin: AdminUser }) {
  const settingsQuery = trpc.admin.settings.get.useQuery();

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-paper-soft" />
        <div className="h-56 animate-pulse rounded-2xl bg-paper-soft" />
      </div>
    );
  }

  if (!settingsQuery.data) {
    return (
      <EmptyState
        title="No se pudieron cargar los ajustes"
        description="Recarga la página e inténtalo de nuevo."
        action={
          <button type="button" onClick={() => settingsQuery.refetch()} className={btnSecondary}>
            Reintentar
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <AdminSectionHeader
        title="Ajustes"
        description="Datos de contacto, valoración de Google, seguridad del panel y estado de los emails."
      />
      <ContactForm key={String(settingsQuery.data.updatedAt)} settings={settingsQuery.data} />
      <div className="grid gap-4 xl:grid-cols-2">
        <PasswordForm admin={admin} />
        <AdminCard>
          <p className="font-display text-2xl font-semibold tracking-tight text-ink">Privacidad y datos</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Las reservas solo son visibles desde este panel. La web pública únicamente lee servicios, galería y datos
            de contacto. No hay registro de clientes ni publicidad.
          </p>
          <ul className="mt-4 space-y-2 text-xs text-ink-soft">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2f7d4e]" aria-hidden="true" />
              Contraseñas cifradas con scrypt y sesiones de 30 días.
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2f7d4e]" aria-hidden="true" />
              Protección CSRF en las acciones del panel y límite de intentos de acceso.
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2f7d4e]" aria-hidden="true" />
              Las reservas bloquean la franja en base de datos para evitar duplicados.
            </li>
          </ul>
        </AdminCard>
      </div>
      <EmailsPanel configured={settingsQuery.data.emailConfigured} />
    </div>
  );
}
