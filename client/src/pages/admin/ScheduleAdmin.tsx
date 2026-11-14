import type { HoursConfig } from "@shared/booking";
import { madridNow } from "@shared/booking";
import {
  AdminCard,
  AdminSectionHeader,
  EmptyState,
  Field,
  Spinner,
  btnAccent,
  btnSecondary,
  inputClass,
  selectClass,
} from "@/components/admin/ui";
import { formatAdminDateLong } from "@/lib/admin";
import { trpc } from "@/lib/trpc";
import type { AdminSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarOff, Clock3, Copy, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const WEEK = [1, 2, 3, 4, 5, 6, 0];

function dayName(index: number) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(2026, 0, 4 + index)))
    .replace(/^./, character => character.toUpperCase());
}

function HoursEditor({ settings }: { settings: AdminSettings }) {
  const utils = trpc.useUtils();
  const [hours, setHours] = useState<HoursConfig>(settings.hoursJson.map(day => ({ ...day })));
  const [slotMinutes, setSlotMinutes] = useState(settings.slotMinutes);
  const [minLead, setMinLead] = useState(settings.minLeadMinutes);
  const [maxDays, setMaxDays] = useState(settings.maxDaysAhead);
  const [error, setError] = useState<string | null>(null);

  const update = trpc.admin.settings.update.useMutation({
    onSuccess: () => {
      utils.admin.settings.get.invalidate();
      utils.site.bootstrap.invalidate();
      toast.success("Horario y reglas guardados.");
    },
    onError: mutationError => setError(mutationError.message),
  });

  const setDay = (index: number, patch: Partial<HoursConfig[number]>) => {
    setHours(current => current.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)));
    setError(null);
  };

  const copyMonday = () => {
    setHours(current => current.map((day, index) => (index >= 1 && index <= 6 ? { ...current[1] } : day)));
    toast.success("Horario del lunes aplicado a martes–sábado.");
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    for (const index of WEEK) {
      const day = hours[index];
      if (!day.closed && day.open >= day.close) {
        setError(`${dayName(index)}: la hora de apertura debe ser anterior a la de cierre.`);
        return;
      }
    }

    update.mutate({
      hours,
      slotMinutes: slotMinutes as 15 | 30 | 45 | 60,
      minLeadMinutes: minLead,
      maxDaysAhead: maxDays,
    });
  };

  return (
    <form onSubmit={save}>
      <AdminCard>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
              <Clock3 className="h-5 w-5 text-cobalt" aria-hidden="true" />
              Horario de apertura
            </p>
            <p className="mt-1 text-sm text-ink-soft">Zona horaria: Europe/Madrid. Los cambios se aplican a las nuevas reservas.</p>
          </div>
          <button type="button" onClick={copyMonday} className={btnSecondary}>
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Aplicar lunes a L–S
          </button>
        </div>

        <div className="mt-4 divide-y divide-line/70">
          {WEEK.map(index => {
            const day = hours[index];
            return (
              <div
                key={index}
                className={cn(
                  "grid gap-2 py-2.5 sm:grid-cols-[1fr_auto_auto] sm:items-center",
                  day.closed && "opacity-60",
                )}
              >
                <p className="text-sm font-extrabold text-ink">{dayName(index)}</p>
                <div className="flex items-center gap-1.5">
                  <label className="sr-only" htmlFor={`open-${index}`}>
                    Apertura {dayName(index)}
                  </label>
                  <input
                    id={`open-${index}`}
                    type="time"
                    step={900}
                    value={day.open}
                    disabled={day.closed}
                    onChange={event => setDay(index, { open: event.target.value })}
                    className={`${inputClass} min-h-10 w-32`}
                  />
                  <span className="text-xs font-bold text-ink-faint">a</span>
                  <label className="sr-only" htmlFor={`close-${index}`}>
                    Cierre {dayName(index)}
                  </label>
                  <input
                    id={`close-${index}`}
                    type="time"
                    step={900}
                    value={day.close}
                    disabled={day.closed}
                    onChange={event => setDay(index, { close: event.target.value })}
                    className={`${inputClass} min-h-10 w-32`}
                  />
                </div>
                <label className="flex min-h-10 items-center gap-2 rounded-xl border border-line bg-paper px-3 text-xs font-bold text-ink">
                  <input
                    type="checkbox"
                    checked={day.closed}
                    onChange={event => setDay(index, { closed: event.target.checked })}
                    className="h-4 w-4 rounded border-line accent-vermilion"
                  />
                  Cerrado
                </label>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
          <Field label="Intervalo entre citas" htmlFor="slot-minutes">
            <select
              id="slot-minutes"
              value={slotMinutes}
              onChange={event => setSlotMinutes(Number(event.target.value))}
              className={selectClass}
            >
              {[15, 30, 45, 60].map(value => (
                <option key={value} value={value}>
                  Cada {value} minutos
                </option>
              ))}
            </select>
          </Field>
          <Field label="Antelación mínima (min)" htmlFor="min-lead" hint="Tiempo mínimo antes de una cita para reservar online.">
            <input
              id="min-lead"
              type="number"
              min={0}
              max={10080}
              step={30}
              value={minLead}
              onChange={event => setMinLead(Number(event.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Reservar con antelación (días)" htmlFor="max-days">
            <input
              id="max-days"
              type="number"
              min={1}
              max={365}
              value={maxDays}
              onChange={event => setMaxDays(Number(event.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-vermilion/8 px-3.5 py-3 text-sm font-semibold text-vermilion">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={update.isPending} className={btnAccent}>
            {update.isPending ? <Spinner /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Guardar horario y reglas
          </button>
        </div>
      </AdminCard>
    </form>
  );
}

function BlocksEditor() {
  const utils = trpc.useUtils();
  const today = madridNow().date;
  const blocksQuery = trpc.admin.blocks.list.useQuery({ from: today });
  const [date, setDate] = useState(today);
  const [allDay, setAllDay] = useState(true);
  const [time, setTime] = useState("14:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = trpc.admin.blocks.create.useMutation({
    onSuccess: () => {
      utils.admin.blocks.list.invalidate();
      setReason("");
      setError(null);
      toast.success("Bloqueo añadido.");
    },
    onError: mutationError => setError(mutationError.message),
  });

  const remove = trpc.admin.blocks.delete.useMutation({
    onSuccess: () => {
      utils.admin.blocks.list.invalidate();
      toast.success("Bloqueo eliminado.");
    },
    onError: mutationError => toast.error(mutationError.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!date) {
      setError("Elige una fecha.");
      return;
    }
    create.mutate({ date, time: allDay ? "ALL" : time, reason: reason.trim() || undefined });
  };

  const blocks = blocksQuery.data ?? [];

  return (
    <AdminCard>
      <div>
        <p className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
          <CalendarOff className="h-5 w-5 text-vermilion" aria-hidden="true" />
          Días y franjas bloqueadas
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Impide nuevas reservas en una fecha o a una hora concreta. No cancela citas ya existentes: si hay alguna,
          cancélala desde Reservas.
        </p>
      </div>

      <form onSubmit={submit} className="mt-4 grid gap-3 rounded-xl border border-line bg-paper p-3.5 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end">
        <Field label="Fecha" htmlFor="block-date">
          <input id="block-date" type="date" min={today} value={date} onChange={event => setDate(event.target.value)} className={inputClass} />
        </Field>

        <div>
          <span className="text-[0.65rem] font-extrabold uppercase tracking-[0.13em] text-ink">Franja</span>
          <div className="mt-1.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => setAllDay(true)}
              aria-pressed={allDay}
              className={cn(
                "min-h-11 flex-1 rounded-xl border px-2 text-[0.68rem] font-extrabold transition",
                allDay ? "border-ink bg-ink text-paper-soft" : "border-line bg-paper-soft text-ink-soft",
              )}
            >
              Todo el día
            </button>
            <button
              type="button"
              onClick={() => setAllDay(false)}
              aria-pressed={!allDay}
              className={cn(
                "min-h-11 flex-1 rounded-xl border px-2 text-[0.68rem] font-extrabold transition",
                !allDay ? "border-ink bg-ink text-paper-soft" : "border-line bg-paper-soft text-ink-soft",
              )}
            >
              Una hora
            </button>
          </div>
          {!allDay ? (
            <input
              type="time"
              step={900}
              value={time}
              onChange={event => setTime(event.target.value)}
              aria-label="Hora bloqueada"
              className={`${inputClass} mt-1.5`}
            />
          ) : null}
        </div>

        <Field label="Motivo (opcional)" htmlFor="block-reason">
          <input id="block-reason" value={reason} onChange={event => setReason(event.target.value)} placeholder="Descanso, evento, vacaciones…" className={inputClass} />
        </Field>

        <button type="submit" disabled={create.isPending} className={btnAccent}>
          {create.isPending ? <Spinner /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          Bloquear
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 rounded-xl bg-vermilion/8 px-3.5 py-3 text-sm font-semibold text-vermilion">
          {error}
        </p>
      ) : null}

      <div className="mt-4">
        {blocksQuery.isLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-paper" />
        ) : blocks.length === 0 ? (
          <EmptyState
            icon={<CalendarOff className="h-5 w-5" />}
            title="Sin bloqueos próximos"
            description="La agenda sigue el horario normal. Añade un bloqueo cuando cierres por vacaciones o un imprevisto."
          />
        ) : (
          <ul className="space-y-2">
            {blocks.map(block => (
              <li key={block.id} className="flex flex-col gap-2 rounded-xl border border-line bg-paper px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-ink">{formatAdminDateLong(block.date)}</p>
                  <p className="text-xs text-ink-soft">
                    {block.time === "ALL" ? "Todo el día" : `Desde las ${block.time}`}
                    {block.reason ? ` · ${block.reason}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("¿Quitar este bloqueo? La franja volverá a estar disponible.")) {
                      remove.mutate({ id: block.id });
                    }
                  }}
                  disabled={remove.isPending}
                  className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-full px-3 text-[0.68rem] font-extrabold text-vermilion transition hover:bg-vermilion/8 sm:self-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminCard>
  );
}

export function ScheduleAdmin() {
  const settingsQuery = trpc.admin.settings.get.useQuery();

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-paper-soft" />
        <div className="h-96 animate-pulse rounded-2xl bg-paper-soft" />
      </div>
    );
  }

  if (!settingsQuery.data) {
    return (
      <EmptyState
        title="No se pudo cargar el horario"
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
        title="Horario y disponibilidad"
        description="Define cuándo abre el taller y cómo se reparten las citas. Los bloqueos puntuales se gestionan aquí mismo."
      />
      <HoursEditor key={String(settingsQuery.data.updatedAt)} settings={settingsQuery.data} />
      <BlocksEditor />
    </div>
  );
}
