import { ArrowUpRight, Clock3, Phone, Plus, Scissors, Sparkles } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Clouds } from "@/components/site/Clouds";
import { serviceDescription, serviceName } from "@shared/i18n";
import { formatMoney, scrollToId, telHref } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { PublicService, PublicSettings } from "@/lib/types";

export function requestBooking(serviceId?: number) {
  if (serviceId) window.dispatchEvent(new CustomEvent("askao:book", { detail: { serviceId } }));
  scrollToId("reservar");
}

export function Services({ services, settings }: { services: PublicService[]; settings: PublicSettings }) {
  const { t, locale } = useI18n();

  return (
    <section id="servicios" className="relative overflow-hidden bg-sky-soft/70 py-20 sm:py-28">
      <Clouds />
      <div className="container relative">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading
              eyebrow={t.services.eyebrow}
              title={t.services.title}
              titleEm={t.services.titleEm}
              intro={t.services.intro}
            />
          </Reveal>
          <Reveal delay={0.1} className="hidden shrink-0 lg:block">
            <div className="max-w-[220px] rotate-2 text-right">
              <span className="hand text-3xl text-cobalt">{t.services.extrasNote}</span>
              <svg viewBox="0 0 120 40" className="ml-auto mt-1 h-8 w-24 text-cobalt/60" aria-hidden="true">
                <path d="M8 6c40-2 70 10 88 28" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5" />
                <path d="M88 22l9 13 3-15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {services.map((service, index) => {
            const popular = index === 2;
            return (
              <Reveal key={service.id} delay={index * 0.07}>
                <article className="ticket group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-cobalt/40 hover:shadow-lift sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-display text-sm font-semibold italic text-ink-faint">
                      0{index + 1}
                    </span>
                    {popular ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-vermilion px-3 py-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-paper-soft">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        {t.services.popular}
                      </span>
                    ) : (
                      <Scissors className="h-5 w-5 -rotate-12 text-line transition group-hover:text-vermilion" aria-hidden="true" />
                    )}
                  </div>

                  <h3 className="mt-6 font-display text-[1.85rem] font-semibold leading-[1.02] tracking-[-0.035em] text-ink sm:text-4xl">
                    {serviceName(service, locale)}
                  </h3>
                  <p className="mt-3 min-h-12 max-w-sm text-sm leading-relaxed text-ink-soft">
                    {serviceDescription(service, locale)}
                  </p>

                  <div className="mt-auto flex items-end justify-between gap-4 border-t border-dashed border-line pt-6">
                    <div>
                      <p className="font-display text-5xl font-semibold leading-none tracking-[-0.05em] text-ink">
                        {formatMoney(service.priceCents, locale)}
                      </p>
                      <p className="mt-2 flex items-center gap-1.5 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-ink-faint">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        {service.durationMin} {t.common.min}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => requestBooking(service.id)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 py-2.5 text-sm font-extrabold text-ink transition group-hover:border-ink group-hover:bg-ink group-hover:text-paper-soft"
                    >
                      {t.services.bookThis}
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.12}>
          <div className="mt-6 flex flex-col justify-between gap-6 rounded-[1.75rem] border border-dashed border-cobalt/30 bg-paper-soft/70 p-6 sm:flex-row sm:items-center sm:p-7">
            <div>
              <p className="flex items-center gap-2 font-display text-2xl font-semibold tracking-tight text-ink">
                <Plus className="h-5 w-5 text-vermilion" aria-hidden="true" />
                {t.services.extrasTitle}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {t.services.extras.map(extra => (
                  <li
                    key={extra}
                    className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink-soft"
                  >
                    {extra}
                  </li>
                ))}
              </ul>
            </div>
            <a
              href={telHref(settings.phone)}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-cobalt px-6 py-3 text-sm font-extrabold text-paper-soft transition hover:-translate-y-0.5 hover:bg-cobalt-deep"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              {settings.phone}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
