import type { Locale } from "@shared/i18n";
import { serviceDescription, serviceName } from "@shared/i18n";
import { addDaysISO, madridNow, weekdayFromISO } from "@shared/booking";
import { trpc } from "@/lib/trpc";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Loader2, MessageCircle, Phone, Scissors, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Clouds } from "@/components/site/Clouds";
import {
  currentMonth,
  formatDateLong,
  formatMoney,
  formatMonthLabel,
  formatSlot,
  hasDefaultHours,
  monthGrid,
  shiftMonth,
  whatsappHref,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { PublicBooking, PublicService, PublicSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;
type FormState = { name: string; phone: string; email: string; notes: string; consent: boolean; website: string };
type FormErrors = Partial<Record<keyof FormState | "submit", string>>;

const EMPTY_FORM: FormState = { name: "", phone: "", email: "", notes: "", consent: false, website: "" };

const SUCCESS_WHATSAPP: Record<Locale, (booking: PublicBooking) => string> = {
  es: booking =>
    `Hola, he reservado cita en Barbería Askao.\nReferencia: ${booking.reference}\nServicio: ${booking.serviceName}\nFecha: ${booking.date} a las ${booking.time}`,
  en: booking =>
    `Hi, I've booked an appointment at Barbería Askao.\nReference: ${booking.reference}\nService: ${booking.serviceName}\nDate: ${booking.date} at ${booking.time}`,
  fr: booking =>
    `Bonjour, j'ai réservé un rendez-vous chez Barbería Askao.\nRéférence : ${booking.reference}\nPrestation : ${booking.serviceName}\nDate : ${booking.date} à ${booking.time}`,
  de: booking =>
    `Hallo, ich habe einen Termin bei Barbería Askao gebucht.\nReferenz: ${booking.reference}\nLeistung: ${booking.serviceName}\nDatum: ${booking.date} um ${booking.time} Uhr`,
};

export function Booking({ services, settings }: { services: PublicService[]; settings: PublicSettings }) {
  const { t, locale } = useI18n();
  const hoursLabel = hasDefaultHours(settings.hours) ? t.hero.hours : t.hero.hoursVariable;
  const hoursNote = hasDefaultHours(settings.hours) ? t.location.hoursNote : t.hero.hoursVariable;
  const cardRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [month, setMonth] = useState<string>(currentMonth());
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState<PublicBooking | null>(null);

  const selectedService = useMemo(
    () => services.find(service => service.id === serviceId) ?? null,
    [services, serviceId],
  );

  const today = madridNow().date;
  const maxDate = addDaysISO(today, settings.maxDaysAhead);
  const cells = useMemo(() => monthGrid(month), [month]);

  const availability = trpc.booking.availability.useQuery(
    { serviceId: serviceId ?? 0, date: date ?? "" },
    { enabled: Boolean(serviceId && date), staleTime: 15_000, retry: false },
  );

  const createBooking = trpc.booking.create.useMutation({
    onSuccess: result => {
      setSuccess(result.booking as PublicBooking);
      setErrors({});
      toast.success(t.booking.successTitle);
    },
    onError: error => {
      const code = (error as { data?: { code?: string } }).data?.code;
      const message =
        code === "CONFLICT"
          ? t.booking.slotTaken
          : code === "TOO_MANY_REQUESTS"
            ? error.message
            : t.booking.errorGeneric;
      setErrors({ submit: message });
      toast.error(message);
      availability.refetch();
    },
  });

  useEffect(() => {
    const onSelectService = (event: Event) => {
      const detail = (event as CustomEvent<{ serviceId?: number }>).detail;
      if (!detail?.serviceId) return;
      setServiceId(detail.serviceId);
      setDate(null);
      setTime(null);
      setSuccess(null);
      setErrors({});
      setStep(2);
    };
    window.addEventListener("askao:book", onSelectService);
    return () => window.removeEventListener("askao:book", onSelectService);
  }, []);

  useEffect(() => {
    if (serviceId && !selectedService) {
      setServiceId(null);
      setStep(1);
    }
  }, [selectedService, serviceId]);

  const scrollToCard = () => {
    window.requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const goTo = (next: Step) => {
    setStep(next);
    setErrors(current => ({ ...current, submit: undefined }));
    scrollToCard();
  };

  const chooseService = (id: number) => {
    setServiceId(id);
    setDate(null);
    setTime(null);
    setSuccess(null);
    goTo(2);
  };

  const chooseDate = (iso: string) => {
    setDate(iso);
    setTime(null);
  };

  const isDayDisabled = (iso: string, inMonth: boolean) => {
    if (!inMonth || iso < today || iso > maxDate) return true;
    const day = settings.hours[weekdayFromISO(iso)];
    return !day || day.closed;
  };

  const canGoPreviousMonth = month > currentMonth();
  const canGoNextMonth = `${shiftMonth(month, 1)}-01` <= maxDate;

  const updateField = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined, submit: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (form.name.trim().length < 2) next.name = t.booking.requiredName;
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = t.booking.requiredPhone;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = t.booking.invalidEmail;
    if (!form.consent) next.consent = t.booking.requiredConsent;
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const first = Object.keys(next)[0];
      window.setTimeout(() => document.getElementById(`booking-${first}`)?.focus(), 50);
      return false;
    }
    return true;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate() || !serviceId || !date || !time) return;
    createBooking.mutate({
      serviceId,
      date,
      time,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      notes: form.notes.trim(),
      locale,
      website: form.website,
    });
  };

  const reset = () => {
    setSuccess(null);
    setServiceId(null);
    setDate(null);
    setTime(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setStep(1);
    scrollToCard();
  };

  const morning = availability.data?.slots.filter(slot => slot < "14:00") ?? [];
  const afternoon = availability.data?.slots.filter(slot => slot >= "14:00") ?? [];

  return (
    <section id="reservar" className="relative overflow-hidden bg-paper-deep py-20 sm:py-28">
      <Clouds dense />
      <div className="container relative">
        <div
          ref={cardRef}
          className="overflow-hidden rounded-[2rem] border border-line bg-paper-soft shadow-lift lg:rounded-[2.75rem]"
        >
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="relative overflow-hidden bg-gradient-to-br from-cobalt to-cobalt-deep p-7 text-paper-soft sm:p-10 lg:p-12">
              <div
                className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
                aria-hidden="true"
              />
              <div className="stripe-rule absolute inset-x-0 top-0 opacity-90" aria-hidden="true" />

              <div className="relative">
                <p className="inline-flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.2em] text-paper-soft/65">
                  <span className="h-px w-7 bg-butter" aria-hidden="true" />
                  {t.booking.eyebrow}
                </p>
                <h2 className="mt-5 font-display text-[2.7rem] font-semibold leading-[0.95] tracking-[-0.045em] sm:text-5xl lg:text-[3.4rem]">
                  {t.booking.title}
                  <span className="block font-light italic text-butter">{t.booking.titleEm}</span>
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-relaxed text-paper-soft/75 sm:text-base">{t.booking.intro}</p>

                <ol className="mt-9 hidden space-y-3 lg:block">
                  {t.booking.steps.map((label, index) => {
                    const number = (index + 1) as Step;
                    const done = success ? true : step > number;
                    const active = !success && step === number;
                    return (
                      <li key={label}>
                        <button
                          type="button"
                          disabled={Boolean(success) || number > step}
                          onClick={() => goTo(number)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                            active
                              ? "border-butter/70 bg-white/12"
                              : "border-white/12 bg-transparent hover:border-white/30",
                            number > step && "cursor-not-allowed opacity-45",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold",
                              done ? "bg-butter text-ink" : active ? "bg-paper-soft text-cobalt" : "border border-white/30 text-paper-soft/70",
                            )}
                          >
                            {done ? <Check className="h-4 w-4" aria-hidden="true" /> : number}
                          </span>
                          <span className="flex-1">
                            <span className="block text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-paper-soft/50">
                              {t.booking.stepOf.replace("{current}", String(number))}
                            </span>
                            <span className="text-sm font-bold">{label}</span>
                          </span>
                          {active ? <Sparkles className="h-4 w-4 text-butter" aria-hidden="true" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ol>

                <div className="mt-10 hidden border-t border-white/15 pt-6 lg:block">
                  <p className="text-[0.58rem] font-extrabold uppercase tracking-[0.18em] text-paper-soft/45">
                    {t.footer.contact}
                  </p>
                  <a
                    href={`tel:${settings.phone.replace(/\s/g, "")}`}
                    className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-paper-soft transition hover:text-butter"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {settings.phone}
                  </a>
                  <p className="mt-2 flex items-center gap-2 text-xs text-paper-soft/60">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {hoursLabel}
                  </p>
                </div>

                <div className="pointer-events-none absolute -bottom-8 -right-4 hidden h-32 w-12 rotate-12 rounded-full stripe-bg opacity-90 lg:block" aria-hidden="true" />
              </div>
            </aside>

            <div className="relative p-5 sm:p-8 lg:p-10">
              {success ? (
                <div role="status" aria-live="polite" className="flex h-full flex-col justify-center py-6 text-center sm:py-12">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#2f7d4e]/12 text-[#2f7d4e]">
                    <Check className="h-10 w-10" strokeWidth={2.4} aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 font-display text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
                    {t.booking.successTitle}
                  </h3>
                  <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ink-soft">{t.booking.successIntro}</p>

                  <div className="mx-auto mt-7 w-full max-w-md rounded-2xl border border-dashed border-line bg-paper p-5 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-ink-faint">
                        {t.booking.reference}
                      </span>
                      <span className="font-mono text-lg font-bold tracking-wider text-ink">{success.reference}</span>
                    </div>
                    <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-faint">{t.booking.steps[0]}</dt>
                        <dd className="text-right font-bold text-ink">
                          {selectedService ? serviceName(selectedService, locale) : success.serviceName}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-faint">{t.booking.steps[1]}</dt>
                        <dd className="text-right font-bold text-ink">
                          {formatDateLong(success.date, locale)} · {formatSlot(success.time, locale)}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-ink-faint">{t.booking.price}</dt>
                        <dd className="text-right font-bold text-ink">{formatMoney(success.priceCents, locale)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mx-auto mt-6 grid w-full max-w-md gap-3">
                    <a
                      href={whatsappHref(settings.whatsapp, SUCCESS_WHATSAPP[locale](success))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
                    >
                      <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
                      {t.booking.whatsapp}
                    </a>
                    <button
                      type="button"
                      onClick={reset}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-extrabold text-ink transition hover:border-ink"
                    >
                      <Scissors className="h-4 w-4" aria-hidden="true" />
                      {t.booking.newBooking}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.18em] text-ink-faint" aria-live="polite">
                        {t.booking.stepOf.replace("{current}", String(step))}
                      </p>
                      <h3 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                        {step === 1 ? t.booking.chooseService : step === 2 ? t.booking.chooseDate : t.booking.summary}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      {[1, 2, 3].map(number => (
                        <span
                          key={number}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            step === number ? "w-7 bg-vermilion" : step > number ? "w-2 bg-cobalt" : "w-2 bg-line",
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {step === 1 ? (
                    <div className="mt-6" role="radiogroup" aria-label={t.booking.chooseService}>
                      {services.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-line p-8 text-center">
                          <p className="text-ink-soft">{t.common.error}</p>
                          <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="mt-3 inline-flex min-h-10 items-center gap-2 font-bold text-cobalt">
                            <Phone className="h-4 w-4" aria-hidden="true" />
                            {settings.phone}
                          </a>
                        </div>
                      ) : (
                        <div className="grid gap-2.5 sm:grid-cols-2">
                          {services.map(service => {
                            const selected = service.id === serviceId;
                            return (
                              <button
                                key={service.id}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => chooseService(service.id)}
                                className={cn(
                                  "group flex min-h-28 flex-col rounded-2xl border p-4 text-left transition",
                                  selected
                                    ? "border-cobalt bg-sky-soft"
                                    : "border-line bg-paper hover:-translate-y-0.5 hover:border-cobalt/50",
                                )}
                              >
                                <span className="flex items-start justify-between gap-2">
                                  <span className="font-display text-xl font-semibold leading-tight tracking-tight text-ink">
                                    {serviceName(service, locale)}
                                  </span>
                                  <span
                                    className={cn(
                                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                                      selected ? "border-cobalt bg-cobalt text-paper-soft" : "border-ink/20 text-transparent",
                                    )}
                                  >
                                    <Check className="h-3 w-3" aria-hidden="true" />
                                  </span>
                                </span>
                                <span className="mt-2 text-xs leading-relaxed text-ink-soft">
                                  {serviceDescription(service, locale)}
                                </span>
                                <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs font-extrabold text-ink">
                                  <span>{formatMoney(service.priceCents, locale)}</span>
                                  <span className="flex items-center gap-1 text-ink-faint">
                                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                                    {service.durationMin} {t.common.min}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {step === 2 && selectedService ? (
                    <div className="mt-6">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper px-3.5 py-2.5">
                        <span className="text-xs font-bold text-ink">
                          {serviceName(selectedService, locale)} · {formatMoney(selectedService.priceCents, locale)}
                        </span>
                        <button type="button" onClick={() => goTo(1)} className="text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-cobalt">
                          {t.booking.change}
                        </button>
                      </div>

                      <div className="mt-4 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                        <div>
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              disabled={!canGoPreviousMonth}
                              onClick={() => setMonth(value => shiftMonth(value, -1))}
                              aria-label={t.gallery.prev}
                              className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition enabled:hover:border-ink disabled:opacity-30"
                            >
                              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <p className="font-display text-lg font-semibold tracking-tight text-ink">
                              {formatMonthLabel(month, locale)}
                            </p>
                            <button
                              type="button"
                              disabled={!canGoNextMonth}
                              onClick={() => setMonth(value => shiftMonth(value, 1))}
                              aria-label={t.gallery.next}
                              className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink transition enabled:hover:border-ink disabled:opacity-30"
                            >
                              <ChevronRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>

                          <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                            {t.booking.weekdays.split(" ").map((day, index) => (
                              <span key={`${day}-${index}`} className="pb-1 text-[0.58rem] font-extrabold uppercase tracking-wider text-ink-faint">
                                {day}
                              </span>
                            ))}
                            {cells.map(cell => {
                              const disabled = isDayDisabled(cell.iso, cell.inMonth);
                              const selected = cell.iso === date;
                              const isToday = cell.iso === today;
                              return (
                                <button
                                  key={cell.iso}
                                  type="button"
                                  disabled={disabled}
                                  aria-pressed={selected}
                                  aria-label={formatDateLong(cell.iso, locale)}
                                  onClick={() => chooseDate(cell.iso)}
                                  className={cn(
                                    "relative grid h-9 w-full place-items-center rounded-lg text-xs font-bold transition sm:h-10 sm:text-sm",
                                    selected
                                      ? "bg-ink text-paper-soft"
                                      : disabled
                                        ? "cursor-not-allowed text-ink/20 line-through"
                                        : "text-ink hover:bg-sky",
                                    !selected && isToday && !disabled && "ring-1 ring-vermilion/60",
                                    !cell.inMonth && "opacity-0",
                                  )}
                                >
                                  {cell.day}
                                  {isToday ? (
                                    <span
                                      className={cn(
                                        "absolute bottom-1 h-1 w-1 rounded-full",
                                        selected ? "bg-butter" : "bg-vermilion",
                                      )}
                                      aria-hidden="true"
                                    />
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-3 flex items-center gap-1.5 text-[0.62rem] font-semibold text-ink-faint">
                            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                            {hoursNote}
                          </p>
                        </div>

                        <div className="min-w-0 border-t border-line pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
                          <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-ink-faint">
                            {t.booking.chooseTime}
                          </p>

                          {!date ? (
                            <p className="mt-3 rounded-xl bg-paper px-3.5 py-4 text-sm text-ink-soft">{t.booking.chooseDate}</p>
                          ) : availability.isLoading ? (
                            <div className="mt-3 grid grid-cols-3 gap-2" aria-busy="true" aria-label={t.common.loading}>
                              {Array.from({ length: 9 }, (_, index) => (
                                <span key={index} className="h-10 animate-pulse rounded-lg bg-paper" />
                              ))}
                            </div>
                          ) : availability.isError ? (
                            <p className="mt-3 rounded-xl bg-vermilion/8 px-3.5 py-4 text-sm text-vermilion">{t.common.error}</p>
                          ) : availability.data?.closed ? (
                            <p className="mt-3 rounded-xl bg-paper px-3.5 py-4 text-sm text-ink-soft">{t.booking.closedDay}</p>
                          ) : availability.data?.blockedAll ? (
                            <p className="mt-3 rounded-xl bg-paper px-3.5 py-4 text-sm text-ink-soft">{t.booking.blockedDay}</p>
                          ) : availability.data?.slots.length === 0 ? (
                            <p className="mt-3 rounded-xl bg-paper px-3.5 py-4 text-sm text-ink-soft">{t.booking.noSlots}</p>
                          ) : (
                            <div className="mt-3 space-y-4">
                              {[
                                { label: t.booking.morning, slots: morning },
                                { label: t.booking.afternoon, slots: afternoon },
                              ]
                                .filter(group => group.slots.length > 0)
                                .map(group => (
                                  <div key={group.label}>
                                    <p className="text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-ink-faint">
                                      {group.label}
                                    </p>
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                      {group.slots.map(slot => (
                                        <button
                                          key={slot}
                                          type="button"
                                          aria-pressed={time === slot}
                                          onClick={() => {
                                            setTime(slot);
                                            setErrors(current => ({ ...current, submit: undefined }));
                                          }}
                                          className={cn(
                                            "min-h-10 rounded-lg border px-2 text-xs font-extrabold transition",
                                            time === slot
                                              ? "border-vermilion bg-vermilion text-paper-soft shadow-[0_8px_18px_-10px_rgba(214,59,42,.9)]"
                                              : "border-line bg-paper text-ink hover:border-ink",
                                          )}
                                        >
                                          {formatSlot(slot, locale)}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
                        <button
                          type="button"
                          onClick={() => goTo(1)}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink-soft transition hover:text-ink"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          {t.booking.back}
                        </button>
                        <button
                          type="button"
                          disabled={!date || !time}
                          onClick={() => goTo(3)}
                          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-extrabold text-paper-soft transition enabled:hover:bg-cobalt disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          {t.booking.next}
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {step === 3 && selectedService && date && time ? (
                    <form className="mt-6" onSubmit={submit} noValidate>
                      <div className="rounded-2xl border border-line bg-paper p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-display text-xl font-semibold tracking-tight text-ink">
                              {serviceName(selectedService, locale)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-ink-soft">
                              {formatDateLong(date, locale)} · {formatSlot(time, locale)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-2xl font-semibold text-ink">{formatMoney(selectedService.priceCents, locale)}</p>
                            <button type="button" onClick={() => goTo(2)} className="mt-1 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-cobalt">
                              {t.booking.change}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="booking-name" className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
                            {t.booking.name} <span className="text-vermilion">*</span>
                          </label>
                          <input
                            id="booking-name"
                            name="name"
                            autoComplete="name"
                            value={form.name}
                            onChange={event => updateField("name", event.target.value)}
                            placeholder={t.booking.namePlaceholder}
                            aria-invalid={Boolean(errors.name)}
                            aria-describedby={errors.name ? "booking-name-error" : undefined}
                            className={cn(
                              "mt-2 min-h-12 w-full rounded-xl border bg-paper-soft px-3.5 text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-cobalt/40",
                              errors.name ? "border-vermilion" : "border-line",
                            )}
                          />
                          {errors.name ? (
                            <p id="booking-name-error" className="mt-1.5 text-xs font-semibold text-vermilion">
                              {errors.name}
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label htmlFor="booking-phone" className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
                            {t.booking.phone} <span className="text-vermilion">*</span>
                          </label>
                          <input
                            id="booking-phone"
                            name="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={form.phone}
                            onChange={event => updateField("phone", event.target.value)}
                            placeholder={t.booking.phonePlaceholder}
                            aria-invalid={Boolean(errors.phone)}
                            aria-describedby={errors.phone ? "booking-phone-error" : undefined}
                            className={cn(
                              "mt-2 min-h-12 w-full rounded-xl border bg-paper-soft px-3.5 text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-cobalt/40",
                              errors.phone ? "border-vermilion" : "border-line",
                            )}
                          />
                          {errors.phone ? (
                            <p id="booking-phone-error" className="mt-1.5 text-xs font-semibold text-vermilion">
                              {errors.phone}
                            </p>
                          ) : null}
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="booking-email" className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
                            {t.booking.email}{" "}
                            <span className="font-semibold normal-case tracking-normal text-ink-faint">({t.common.optional})</span>
                          </label>
                          <input
                            id="booking-email"
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={event => updateField("email", event.target.value)}
                            placeholder="tu@email.com"
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={errors.email ? "booking-email-error" : "booking-email-hint"}
                            className={cn(
                              "mt-2 min-h-12 w-full rounded-xl border bg-paper-soft px-3.5 text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-cobalt/40",
                              errors.email ? "border-vermilion" : "border-line",
                            )}
                          />
                          {errors.email ? (
                            <p id="booking-email-error" className="mt-1.5 text-xs font-semibold text-vermilion">
                              {errors.email}
                            </p>
                          ) : (
                            <p id="booking-email-hint" className="mt-1.5 text-[0.68rem] text-ink-faint">
                              {t.booking.emailHint}
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor="booking-notes" className="flex items-center justify-between text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
                            {t.booking.notes}
                            <span className="font-semibold normal-case tracking-normal text-ink-faint">({t.common.optional})</span>
                          </label>
                          <textarea
                            id="booking-notes"
                            name="notes"
                            rows={3}
                            maxLength={600}
                            value={form.notes}
                            onChange={event => updateField("notes", event.target.value)}
                            placeholder={t.booking.notesPlaceholder}
                            className="mt-2 w-full resize-none rounded-xl border border-line bg-paper-soft px-3.5 py-3 text-sm text-ink placeholder:text-ink-faint/70 focus:outline-none focus:ring-2 focus:ring-cobalt/40"
                          />
                          <p className="mt-1 text-right text-[0.62rem] text-ink-faint">{form.notes.length}/600</p>
                        </div>
                      </div>

                      <div className="mt-1">
                        <label htmlFor="booking-consent" className="flex items-start gap-3 rounded-xl bg-paper px-3.5 py-3 text-xs leading-relaxed text-ink-soft">
                          <input
                            id="booking-consent"
                            name="consent"
                            type="checkbox"
                            checked={form.consent}
                            onChange={event => updateField("consent", event.target.checked)}
                            aria-invalid={Boolean(errors.consent)}
                            aria-describedby={errors.consent ? "booking-consent-error" : undefined}
                            className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-vermilion"
                          />
                          <span>
                            {t.booking.consent}{" "}
                            <a
                              href="/privacidad"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-cobalt underline decoration-cobalt/30 underline-offset-2"
                            >
                              {t.booking.privacy}
                            </a>
                            .
                          </span>
                        </label>
                        {errors.consent ? (
                          <p id="booking-consent-error" className="mt-1.5 text-xs font-semibold text-vermilion">
                            {errors.consent}
                          </p>
                        ) : null}
                      </div>

                      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                        <label htmlFor="booking-website">Website</label>
                        <input
                          id="booking-website"
                          name="website"
                          tabIndex={-1}
                          autoComplete="off"
                          value={form.website}
                          onChange={event => updateField("website", event.target.value)}
                        />
                      </div>

                      {errors.submit ? (
                        <p className="mt-4 rounded-xl bg-vermilion/8 px-3.5 py-3 text-sm font-semibold text-vermilion" role="alert">
                          {errors.submit}
                        </p>
                      ) : null}

                      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => goTo(2)}
                          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink-soft transition hover:text-ink"
                        >
                          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          {t.booking.back}
                        </button>
                        <button
                          type="submit"
                          disabled={createBooking.isPending}
                          className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-vermilion px-7 py-3.5 text-sm font-extrabold text-paper-soft shadow-[0_16px_30px_-14px_rgba(214,59,42,.85)] transition enabled:hover:-translate-y-0.5 enabled:hover:bg-vermilion-deep disabled:cursor-wait disabled:opacity-70"
                        >
                          {createBooking.isPending ? (
                            <Loader2 className="h-4.5 w-4.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <ShieldCheck className="h-4.5 w-4.5" aria-hidden="true" />
                          )}
                          {createBooking.isPending ? t.booking.submitting : t.booking.submit}
                        </button>
                      </div>
                    </form>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
