import { madridNow } from "@shared/booking";
import {
  AdminCard,
  AdminSectionHeader,
  EmptyState,
  Spinner,
  StatusBadge,
  btnGhost,
  btnPrimary,
  btnSecondary,
} from "@/components/admin/ui";
import { formatAdminDate, formatAdminDateLong, formatAdminMoney, formatAdminDate as formatShortDate } from "@/lib/admin";
import { currentMonth, formatMonthLabel, monthGrid, shiftMonth, whatsappHref } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import type { AdminBooking, BookingStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  List,
  Mail,
  MessageCircle,
  Phone,
  RotateCcw,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type View = "list" | "calendar";
type Filter = "all" | BookingStatus;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "confirmed", label: "Confirmadas" },
  { id: "completed", label: "Completadas" },
  { id: "cancelled", label: "Canceladas" },
];

const STATUS_DOT: Record<string, string> = {
  pending: "bg-[#d9a21b]",
  confirmed: "bg-[#2f7d4e]",
  completed: "bg-cobalt",
  cancelled: "bg-vermilion/50",
};

function BookingCard({
  booking,
  onChange,
  pending,
}: {
  booking: AdminBooking;
  onChange: (status: BookingStatus) => void;
  pending: boolean;
}) {
  const cancel = () => {
    if (window.confirm(`¿Cancelar la cita de ${booking.name} el ${formatAdminDate(booking.bookingDate)} a las ${booking.bookingTime}? La franja quedará libre.`)) {
      onChange("cancelled");
    }
  };

  return (
    <article className="rounded-2xl border border-line bg-paper-soft p-4 shadow-soft sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-paper text-center">
            <span className="block text-base font-extrabold leading-none text-ink">{booking.bookingTime}</span>
            <span className="mt-1 block text-[0.55rem] font-bold uppercase tracking-wider text-ink-faint">
              {booking.durationMin} min
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{booking.name}</h3>
              <StatusBadge status={booking.status} />
            </div>
            <p className="mt-0.5 text-sm font-semibold text-ink-soft">
              {booking.serviceName} · {formatAdminMoney(booking.priceCents)}
            </p>
            <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-faint">
              {booking.reference} · {formatShortDate(booking.bookingDate)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-1.5">
          {booking.status === "pending" ? (
            <button
              type="button"
              onClick={() => onChange("confirmed")}
              disabled={pending}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#2f7d4e] px-3 text-[0.68rem] font-extrabold text-white transition enabled:hover:bg-[#1f5e39] disabled:opacity-50"
            >
              {pending ? <Spinner /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              Confirmar
            </button>
          ) : null}
          {booking.status === "confirmed" ? (
            <button
              type="button"
              onClick={() => onChange("completed")}
              disabled={pending}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-cobalt px-3 text-[0.68rem] font-extrabold text-paper-soft transition enabled:hover:bg-cobalt-deep disabled:opacity-50"
            >
              {pending ? <Spinner /> : <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              Completar
            </button>
          ) : null}
          {booking.status === "cancelled" ? (
            <button
              type="button"
              onClick={() => onChange("pending")}
              disabled={pending}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[0.68rem] font-extrabold text-ink transition enabled:hover:border-ink disabled:opacity-50"
            >
              {pending ? <Spinner /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
              Reactivar
            </button>
          ) : null}
          {booking.status === "pending" || booking.status === "confirmed" ? (
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[0.68rem] font-extrabold text-vermilion transition enabled:hover:bg-vermilion/8 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancelar
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line/70 pt-3 text-xs text-ink-soft">
        <a href={`tel:${booking.phone.replace(/\s/g, "")}`} className="flex min-h-8 items-center gap-1.5 font-semibold hover:text-ink">
          <Phone className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
          {booking.phone}
        </a>
        {booking.email ? (
          <a href={`mailto:${booking.email}`} className="flex min-h-8 items-center gap-1.5 font-semibold hover:text-ink">
            <Mail className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
            {booking.email}
          </a>
        ) : null}
        <a
          href={whatsappHref(booking.phone, `Hola, ${booking.name}. Te escribo de Barbería Askao sobre tu cita.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-8 items-center gap-1.5 font-semibold text-[#2f7d4e] hover:text-[#1f5e39]"
        >
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          WhatsApp
        </a>
      </div>

      {booking.notes ? (
        <p className="mt-2 rounded-xl bg-paper px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
          <span className="font-extrabold text-ink">Nota: </span>
          {booking.notes}
        </p>
      ) : null}
    </article>
  );
}

export function BookingsAdmin() {
  const utils = trpc.useUtils();
  const [view, setView] = useState<View>("list");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth());

  const bookingsQuery = trpc.admin.bookings.list.useQuery(undefined, { refetchInterval: 30_000 });
  const calendarQuery = trpc.admin.bookings.calendar.useQuery({ month }, { refetchInterval: 30_000 });

  const setStatus = trpc.admin.bookings.setStatus.useMutation({
    onSuccess: updated => {
      utils.admin.bookings.list.invalidate();
      utils.admin.bookings.calendar.invalidate();
      const messages: Record<string, string> = {
        confirmed: "Cita confirmada.",
        completed: "Cita marcada como completada.",
        cancelled: "Cita cancelada. La franja queda libre.",
        pending: "Cita reactivada como pendiente.",
      };
      toast.success(messages[updated.status] ?? "Reserva actualizada.");
    },
    onError: error => toast.error(error.message),
  });

  const today = madridNow().date;
  const bookings = bookingsQuery.data ?? [];

  const filtered = useMemo(() => {
    return bookings
      .filter(booking => (selectedDate ? booking.bookingDate === selectedDate : true))
      .filter(booking => (filter === "all" ? true : booking.status === filter))
      .sort((a, b) => `${a.bookingDate}${a.bookingTime}`.localeCompare(`${b.bookingDate}${b.bookingTime}`));
  }, [bookings, filter, selectedDate]);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    for (const booking of filtered) {
      const list = map.get(booking.bookingDate) ?? [];
      list.push(booking);
      map.set(booking.bookingDate, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const counts = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    for (const row of calendarQuery.data ?? []) {
      const entry = map.get(row.date) ?? {};
      entry[row.status] = Number(row.total);
      map.set(row.date, entry);
    }
    return map;
  }, [calendarQuery.data]);

  const cells = useMemo(() => monthGrid(month), [month]);
  const pendingId = setStatus.isPending ? setStatus.variables?.id : undefined;
  const pendingStatus = setStatus.isPending ? setStatus.variables?.status : undefined;

  const clearFilters = () => {
    setSelectedDate(null);
    setFilter("all");
  };

  return (
    <div className="space-y-5">
      <AdminSectionHeader
        title="Reservas"
        description="Confirma, completa o libera cualquier franja. Los cambios afectan a la disponibilidad de la web al instante."
        action={
          <div className="flex rounded-full border border-line bg-paper-soft p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-extrabold transition",
                view === "list" ? "bg-ink text-paper-soft" : "text-ink-soft",
              )}
            >
              <List className="h-3.5 w-3.5" aria-hidden="true" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              aria-pressed={view === "calendar"}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-extrabold transition",
                view === "calendar" ? "bg-ink text-paper-soft" : "text-ink-soft",
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" aria-hidden="true" />
              Calendario
            </button>
          </div>
        }
      />

      {view === "calendar" ? (
        <AdminCard>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMonth(value => shiftMonth(value, -1))}
                aria-label="Mes anterior"
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition hover:border-ink"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="min-w-40 text-center font-display text-xl font-semibold tracking-tight text-ink">
                {formatMonthLabel(month, "es")}
              </p>
              <button
                type="button"
                onClick={() => setMonth(value => shiftMonth(value, 1))}
                aria-label="Mes siguiente"
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition hover:border-ink"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setMonth(currentMonth());
                setSelectedDate(today);
                setView("list");
              }}
              className={btnGhost}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Hoy
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {["L", "M", "X", "J", "V", "S", "D"].map((day, index) => (
              <span key={`${day}-${index}`} className="pb-1 text-[0.58rem] font-extrabold uppercase tracking-wider text-ink-faint">
                {day}
              </span>
            ))}
            {cells.map(cell => {
              const dayCounts = counts.get(cell.iso) ?? {};
              const activeCount = Object.entries(dayCounts)
                .filter(([status]) => status !== "cancelled")
                .reduce((total, [, value]) => total + value, 0);
              const selected = selectedDate === cell.iso;
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={!cell.inMonth}
                  onClick={() => {
                    setSelectedDate(cell.iso);
                    setView("list");
                    setFilter("all");
                  }}
                  aria-label={`${formatAdminDateLong(cell.iso)}: ${activeCount} ${activeCount === 1 ? "cita" : "citas"}`}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-center rounded-xl border text-xs font-bold transition sm:h-20",
                    selected
                      ? "border-ink bg-ink text-paper-soft"
                      : cell.inMonth
                        ? "border-line bg-paper text-ink hover:border-ink hover:bg-paper-deep"
                        : "border-transparent text-ink/20",
                    cell.iso === today && !selected && "ring-1 ring-vermilion/60",
                  )}
                >
                  <span className="text-sm">{cell.day}</span>
                  {activeCount > 0 ? (
                    <span className={cn("mt-1 text-[0.58rem] font-extrabold", selected ? "text-butter" : "text-ink-faint")}>
                      {activeCount} {activeCount === 1 ? "cita" : "citas"}
                    </span>
                  ) : null}
                  <span className="mt-1 flex gap-0.5" aria-hidden="true">
                    {(["pending", "confirmed", "completed"] as const).map(status =>
                      dayCounts[status] ? (
                        <span key={status} className={cn("h-1.5 w-1.5 rounded-full", selected ? "bg-paper-soft/70" : STATUS_DOT[status])} />
                      ) : null,
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-[0.62rem] font-semibold text-ink-faint">
            {(["pending", "confirmed", "completed"] as const).map(status => (
              <span key={status} className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} aria-hidden="true" />
                {status === "pending" ? "Pendiente" : status === "confirmed" ? "Confirmada" : "Completada"}
              </span>
            ))}
            <span className="ml-auto">Toca un día para ver sus citas.</span>
          </div>
        </AdminCard>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              {FILTERS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  aria-pressed={filter === item.id}
                  className={cn(
                    "min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-extrabold transition",
                    filter === item.id ? "border-ink bg-ink text-paper-soft" : "border-line bg-paper-soft text-ink-soft hover:border-ink",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {selectedDate ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-sky px-3.5 text-xs font-extrabold text-cobalt-deep">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatAdminDateLong(selectedDate)}
                  <button type="button" onClick={() => setSelectedDate(null)} aria-label="Quitar filtro de fecha" className="grid h-5 w-5 place-items-center rounded-full hover:bg-cobalt/10">
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                </span>
                <button type="button" onClick={clearFilters} className="text-[0.68rem] font-bold text-ink-faint underline underline-offset-2">
                  Ver todas
                </button>
              </div>
            ) : null}
          </div>

          {bookingsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-2xl bg-paper-soft" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-5 w-5" />}
              title="No hay citas con estos filtros"
              description="Prueba a quitar el filtro de fecha o de estado. Las nuevas reservas de la web aparecen aquí automáticamente."
              action={
                <button type="button" onClick={clearFilters} className={btnSecondary}>
                  Ver todas las citas
                </button>
              }
            />
          ) : (
            <div className="space-y-6">
              {grouped.map(([date, list]) => (
                <section key={date}>
                  <div className="mb-2.5 flex items-center gap-3">
                    <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{formatAdminDateLong(date)}</h2>
                    {date === today ? (
                      <span className="rounded-full bg-vermilion px-2 py-0.5 text-[0.55rem] font-extrabold uppercase tracking-[0.12em] text-paper-soft">
                        Hoy
                      </span>
                    ) : null}
                    <span className="ml-auto text-[0.62rem] font-bold text-ink-faint">
                      {list.length} {list.length === 1 ? "cita" : "citas"}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {list.map(booking => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        pending={pendingId === booking.id}
                        onChange={status => setStatus.mutate({ id: booking.id, status })}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {pendingId ? (
        <p className="text-center text-xs text-ink-faint" aria-live="polite">
          Actualizando reserva… {pendingStatus ? `(${pendingStatus})` : ""}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-line bg-paper-soft/60 px-4 py-3">
        <p className="text-xs text-ink-soft">
          <span className="font-extrabold text-ink">{bookings.length}</span> {bookings.length === 1 ? "reserva registrada" : "reservas registradas"} en total.
        </p>
        <button type="button" onClick={() => setView(view === "calendar" ? "list" : "calendar")} className={btnPrimary}>
          {view === "calendar" ? <List className="h-4 w-4" aria-hidden="true" /> : <CalendarRange className="h-4 w-4" aria-hidden="true" />}
          {view === "calendar" ? "Ver lista" : "Ver calendario"}
        </button>
      </div>
    </div>
  );
}
