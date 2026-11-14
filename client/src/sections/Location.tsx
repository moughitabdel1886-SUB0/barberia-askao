import { madridNow, timeToMinutes } from "@shared/booking";
import { ArrowUpRight, Clock3, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { Clouds } from "@/components/site/Clouds";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { capitalize, formatSlot, hasDefaultHours, mapsEmbedUrl, telHref, whatsappHref } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { PublicSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

const WHATSAPP_TEXT = {
  es: "Hola, me gustaría consultar algo sobre una cita en Barbería Askao.",
  en: "Hi, I'd like to ask about an appointment at Barbería Askao.",
  fr: "Bonjour, je voudrais me renseigner sur un rendez-vous chez Barbería Askao.",
  de: "Hallo, ich hätte eine Frage zu einem Termin bei Barbería Askao.",
} as const;

export function Location({ settings }: { settings: PublicSettings }) {
  const { t, locale, tag } = useI18n();
  const now = madridNow();
  const hoursNote = hasDefaultHours(settings.hours) ? t.location.hoursNote : t.hero.hoursVariable;

  const weekdayName = (index: number) =>
    capitalize(
      new Intl.DateTimeFormat(tag, { weekday: "long", timeZone: "UTC" }).format(
        new Date(Date.UTC(2026, 0, 4 + index)),
      ),
    );

  const nextOpenDay = (from: number) => {
    for (let offset = 1; offset <= 7; offset += 1) {
      const index = (from + offset) % 7;
      const day = settings.hours[index];
      if (day && !day.closed) return { index, day };
    }
    return null;
  };

  const today = settings.hours[now.weekday];
  let isOpen = false;
  let status = "";

  if (!today || today.closed) {
    const next = nextOpenDay(now.weekday);
    status = next
      ? t.location.opensDay.replace("{day}", weekdayName(next.index)).replace("{time}", formatSlot(next.day.open, locale))
      : "";
  } else if (now.minutes < timeToMinutes(today.open)) {
    status = t.location.opensAt.replace("{time}", formatSlot(today.open, locale));
  } else if (now.minutes < timeToMinutes(today.close)) {
    isOpen = true;
    status = t.location.closesAt.replace("{time}", formatSlot(today.close, locale));
  } else {
    const next = nextOpenDay(now.weekday);
    status = next
      ? t.location.opensDay.replace("{day}", weekdayName(next.index)).replace("{time}", formatSlot(next.day.open, locale))
      : "";
  }

  const week = [1, 2, 3, 4, 5, 6, 0];

  return (
    <section id="donde" className="relative overflow-hidden bg-sky-soft/70 py-20 sm:py-28">
      <Clouds dense />
      <div className="container relative grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-14">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow={t.location.eyebrow}
              title={t.location.title}
              titleEm={t.location.titleEm}
              intro={t.location.intro}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="card-paper mt-8 rounded-[1.75rem] p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-ink">
                  <Clock3 className="h-4.5 w-4.5 text-vermilion" aria-hidden="true" />
                  {t.location.hours}
                </h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.12em]",
                    isOpen ? "bg-[#2f7d4e]/12 text-[#2f7d4e]" : "bg-ink/5 text-ink-faint",
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", isOpen ? "bg-[#2f7d4e]" : "bg-ink/30")}
                    aria-hidden="true"
                  />
                  {isOpen ? t.location.openNow : t.location.closedNow}
                </span>
              </div>

              <p className="mt-2 text-sm text-ink-soft" aria-live="polite">
                {status}
              </p>

              <dl className="mt-4 divide-y divide-line/70 border-t border-line/70">
                {week.map(index => {
                  const day = settings.hours[index];
                  const todayRow = index === now.weekday;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between gap-3 px-1 py-2.5 text-sm",
                        todayRow ? "font-extrabold text-ink" : "font-semibold text-ink-soft",
                      )}
                    >
                      <dt className="flex items-center gap-2">
                        {todayRow ? <span className="h-1.5 w-1.5 rounded-full bg-vermilion" aria-hidden="true" /> : null}
                        {weekdayName(index)}
                      </dt>
                      <dd className={cn(!day || day.closed ? "text-ink-faint" : "")}>
                        {!day || day.closed
                          ? t.booking.closed
                          : `${formatSlot(day.open, locale)} – ${formatSlot(day.close, locale)}`}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              <p className="mt-3 text-[0.68rem] leading-relaxed text-ink-faint">{hoursNote}</p>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <a
                href={telHref(settings.phone)}
                className="group flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-paper-soft/80 px-4 py-3 transition hover:-translate-y-0.5 hover:border-ink hover:bg-paper-soft"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky text-cobalt">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-ink-faint">
                    {t.location.phone}
                  </span>
                  <span className="block truncate text-sm font-bold text-ink">{settings.phone}</span>
                </span>
              </a>

              <a
                href={whatsappHref(settings.whatsapp, WHATSAPP_TEXT[locale])}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-paper-soft/80 px-4 py-3 transition hover:-translate-y-0.5 hover:border-ink hover:bg-paper-soft"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#25D366]/15 text-[#075E54]">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-ink-faint">
                    {t.location.whatsapp}
                  </span>
                  <span className="block truncate text-sm font-bold text-ink">{settings.whatsapp}</span>
                </span>
              </a>

              <a
                href={`mailto:${settings.email}`}
                className="group col-span-2 flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-paper-soft/80 px-4 py-3 transition hover:-translate-y-0.5 hover:border-ink hover:bg-paper-soft"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-butter/60 text-ink">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-ink-faint">
                    {t.location.email}
                  </span>
                  <span className="block truncate text-sm font-bold text-ink">{settings.email}</span>
                </span>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.12} y={30}>
          <div className="arch relative h-[420px] overflow-hidden border border-line bg-paper shadow-lift sm:h-[520px] lg:h-[620px]">
            <iframe
              src={mapsEmbedUrl(locale)}
              title={t.location.mapTitle}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/25 to-transparent" aria-hidden="true" />

            <div className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-2xl bg-paper-soft/95 p-4 shadow-soft backdrop-blur">
              <p className="flex items-center gap-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-vermilion">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Barbería Askao
              </p>
              <p className="mt-1 text-sm font-bold text-ink">{t.location.address}</p>
            </div>

            <a
              href={settings.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-xs font-extrabold text-paper-soft shadow-lift transition hover:-translate-y-0.5 hover:bg-cobalt"
            >
              <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
              {t.location.map}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
