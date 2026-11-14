import { addDaysISO, madridNow } from "@shared/booking";
import { AdminCard, AdminSectionHeader, EmptyState, Spinner, StatusBadge, btnGhost, btnSecondary } from "@/components/admin/ui";
import { formatAdminDateLong, formatAdminMoney, formatAdminDate } from "@/lib/admin";
import type { AdminTab } from "@/lib/adminTabs";
import { telHref } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import type { AdminBooking, AdminUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock3,
  Images,
  MailWarning,
  Phone,
  Scissors,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <AdminCard className="relative overflow-hidden">
      <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-60", tone)} aria-hidden="true" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-ink-faint">{label}</p>
          <p className="mt-2 font-display text-4xl font-semibold leading-none tracking-tight text-ink">{value}</p>
          <p className="mt-2 text-[0.68rem] text-ink-faint">{hint}</p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-ink">{icon}</span>
      </div>
    </AdminCard>
  );
}

function NextRow({ booking, onConfirm, pending }: { booking: AdminBooking; onConfirm: () => void; pending: boolean }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-line/70 bg-paper px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-14 shrink-0 place-items-center rounded-lg bg-paper-soft text-sm font-extrabold text-ink">
          {booking.bookingTime}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-ink">{booking.name}</p>
          <p className="truncate text-xs text-ink-soft">
            {booking.serviceName} · {formatAdminMoney(booking.priceCents)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <StatusBadge status={booking.status} />
        {booking.status === "pending" ? (
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#2f7d4e] px-3 text-[0.68rem] font-extrabold text-white transition enabled:hover:bg-[#1f5e39] disabled:opacity-50"
          >
            {pending ? <Spinner /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            Confirmar
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function Overview({ admin, onNavigate }: { admin: AdminUser; onNavigate: (tab: AdminTab) => void }) {
  const utils = trpc.useUtils();
  const bookingsQuery = trpc.admin.bookings.list.useQuery(undefined, { refetchInterval: 30_000 });
  const servicesQuery = trpc.admin.services.list.useQuery();
  const settingsQuery = trpc.admin.settings.get.useQuery();

  const setStatus = trpc.admin.bookings.setStatus.useMutation({
    onSuccess: () => {
      utils.admin.bookings.list.invalidate();
      utils.admin.bookings.calendar.invalidate();
      toast.success("Cita confirmada. El cliente ya puede venir.");
    },
    onError: error => toast.error(error.message),
  });

  const today = madridNow().date;
  const bookings = bookingsQuery.data ?? [];
  const active = bookings.filter(booking => booking.status !== "cancelled");
  const todays = active
    .filter(booking => booking.bookingDate === today)
    .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime));
  const pending = active.filter(booking => booking.status === "pending" && booking.bookingDate >= today);
  const weekEnd = addDaysISO(today, 7);
  const thisWeek = active.filter(
    booking => booking.bookingDate >= today && booking.bookingDate <= weekEnd && booking.status !== "completed",
  );
  const next = active
    .filter(booking => booking.bookingDate >= today && (booking.status === "pending" || booking.status === "confirmed"))
    .sort((a, b) => `${a.bookingDate}${a.bookingTime}`.localeCompare(`${b.bookingDate}${b.bookingTime}`))
    .slice(0, 5);
  const activeServices = servicesQuery.data?.filter(service => service.active).length ?? 0;
  const dateLabel = formatAdminDateLong(today);

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-ink-faint">{dateLabel}</p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
            Hola, {admin.name?.split(" ")[0] || "equipo"}.
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">Esto es lo que hay en la silla hoy.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onNavigate("bookings")} className={btnSecondary}>
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Ver agenda
          </button>
          <button type="button" onClick={() => onNavigate("services")} className={btnGhost}>
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            Nuevo servicio
          </button>
        </div>
      </div>

      {settingsQuery.data && !settingsQuery.data.emailConfigured ? (
        <button
          type="button"
          onClick={() => onNavigate("settings")}
          className="flex w-full items-start gap-3 rounded-2xl border border-butter bg-butter/35 p-4 text-left transition hover:bg-butter/50"
        >
          <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
          <span>
            <span className="block text-sm font-extrabold text-ink">Los emails de reserva están en cola.</span>
            <span className="mt-0.5 block text-xs text-ink-soft">
              Configura Resend en Ajustes para avisar a los clientes. Las citas se guardan igualmente.
            </span>
          </span>
          <ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-ink" aria-hidden="true" />
        </button>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatCard
          label="Citas hoy"
          value={todays.length}
          hint={todays.length === 0 ? "La silla está libre" : `${todays.filter(b => b.status === "confirmed").length} confirmadas`}
          icon={<CalendarDays className="h-4.5 w-4.5 text-cobalt" aria-hidden="true" />}
          tone="bg-sky"
        />
        <StatCard
          label="Pendientes"
          value={pending.length}
          hint="Por confirmar"
          icon={<Clock3 className="h-4.5 w-4.5 text-vermilion" aria-hidden="true" />}
          tone="bg-vermilion/10"
        />
        <StatCard
          label="Próximos 7 días"
          value={thisWeek.length}
          hint="Citas activas"
          icon={<Sparkles className="h-4.5 w-4.5 text-ink" aria-hidden="true" />}
          tone="bg-butter/60"
        />
        <StatCard
          label="Servicios activos"
          value={activeServices}
          hint="En la carta"
          icon={<Scissors className="h-4.5 w-4.5 text-[#2f7d4e]" aria-hidden="true" />}
          tone="bg-[#2f7d4e]/12"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AdminCard>
          <AdminSectionHeader
            title="Lo que viene"
            description="Las próximas citas, ordenadas por fecha y hora."
            action={
              <button type="button" onClick={() => onNavigate("bookings")} className={btnGhost}>
                Todo
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            }
          />

          {bookingsQuery.isLoading ? (
            <div className="mt-5 space-y-2">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl bg-paper" />
              ))}
            </div>
          ) : next.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                icon={<CalendarDays className="h-5 w-5" />}
                title="Agenda despejada"
                description="Cuando entre una reserva desde la web, aparecerá aquí."
                action={
                  <button type="button" onClick={() => onNavigate("bookings")} className={btnSecondary}>
                    Abrir reservas
                  </button>
                }
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {next.map(booking => (
                <NextRow
                  key={booking.id}
                  booking={booking}
                  pending={setStatus.isPending && setStatus.variables?.id === booking.id}
                  onConfirm={() => setStatus.mutate({ id: booking.id, status: "confirmed" })}
                />
              ))}
            </ul>
          )}
        </AdminCard>

        <div className="space-y-4">
          <AdminCard>
            <AdminSectionHeader title="Hoy en la silla" description={formatAdminDate(today)} />
            {todays.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line px-4 py-6 text-center">
                <p className="font-display text-xl text-ink-soft">Ni un corte por ahora.</p>
                <p className="mt-1 text-xs text-ink-faint">Aprovecha para ordenar la galería o cambiar un precio.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {todays.map(booking => (
                  <li key={booking.id} className="flex items-center gap-3 rounded-xl bg-paper px-3 py-2.5">
                    <span className="w-12 text-sm font-extrabold text-ink">{booking.bookingTime}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">{booking.name}</span>
                      <span className="block truncate text-[0.68rem] text-ink-soft">{booking.serviceName}</span>
                    </span>
                    <StatusBadge status={booking.status} />
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard>
            <p className="font-hand text-2xl text-cobalt">Atajos del mostrador</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => onNavigate("services")} className="rounded-xl border border-line bg-paper p-3 text-left transition hover:border-ink">
                <Scissors className="h-4 w-4 text-vermilion" aria-hidden="true" />
                <span className="mt-2 block text-xs font-extrabold text-ink">Editar precios</span>
              </button>
              <button type="button" onClick={() => onNavigate("media")} className="rounded-xl border border-line bg-paper p-3 text-left transition hover:border-ink">
                <Images className="h-4 w-4 text-cobalt" aria-hidden="true" />
                <span className="mt-2 block text-xs font-extrabold text-ink">Subir fotos</span>
              </button>
              <button type="button" onClick={() => onNavigate("schedule")} className="rounded-xl border border-line bg-paper p-3 text-left transition hover:border-ink">
                <Clock3 className="h-4 w-4 text-ink" aria-hidden="true" />
                <span className="mt-2 block text-xs font-extrabold text-ink">Bloquear día</span>
              </button>
              <a href={telHref(settingsQuery.data?.phone ?? "652 41 36 81")} className="rounded-xl border border-line bg-paper p-3 text-left transition hover:border-ink">
                <Phone className="h-4 w-4 text-[#2f7d4e]" aria-hidden="true" />
                <span className="mt-2 block text-xs font-extrabold text-ink">Llamar</span>
              </a>
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
