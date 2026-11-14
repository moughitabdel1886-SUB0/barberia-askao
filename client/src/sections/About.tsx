import { MapPin, Scissors } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Stamp } from "@/components/site/brand";
import { mediaAlt } from "@shared/i18n";
import { hasDefaultHours } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { PublicMedia, PublicSettings } from "@/lib/types";

export function About({ media, settings }: { media: PublicMedia[]; settings: PublicSettings }) {
  const { t, locale, tag } = useI18n();
  const image = media.find(item => item.type === "image" && item.category === "fade") ??
    media.find(item => item.type === "image");
  const rating = new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    settings.rating,
  );
  const hoursLabel = hasDefaultHours(settings.hours) ? t.hero.hours : t.hero.hoursVariable;

  const stats = [
    { value: rating, label: t.about.stats[0].label },
    { value: String(settings.reviewCount), label: t.about.stats[1].label },
    { value: t.about.stats[2].value, label: t.about.stats[2].label },
  ];

  return (
    <section id="estudio" className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-sky/50 blur-3xl"
        aria-hidden="true"
      />
      <div className="container relative grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
        <Reveal className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div className="arch relative aspect-[4/5] overflow-hidden border border-line bg-sky-soft shadow-lift">
            {image ? (
              <img
                src={image.url}
                alt={mediaAlt(image, t)}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="grid h-full place-items-center bg-gradient-to-b from-sky to-paper-deep">
                <Scissors className="h-24 w-24 -rotate-12 text-cobalt/30" aria-hidden="true" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/20 bg-paper-soft/92 p-4 backdrop-blur sm:inset-x-5 sm:bottom-5 sm:p-5">
              <p className="font-display text-2xl font-semibold tracking-tight text-ink">{t.about.cardTitle}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">{t.about.cardSub}</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
                <MapPin className="h-3.5 w-3.5 text-vermilion" aria-hidden="true" />
                {t.about.cardAddress}
              </p>
            </div>
          </div>

          <Stamp className="absolute -right-3 -top-8 rounded-full bg-paper-soft/80 shadow-soft backdrop-blur sm:-right-6" />

          <div className="absolute -bottom-6 -left-3 hidden rotate-[-3deg] items-center gap-2 rounded-full border border-line bg-paper-soft px-4 py-2.5 shadow-soft sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#2f7d4e]" aria-hidden="true" />
            <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-ink">
              {hoursLabel}
            </span>
          </div>
        </Reveal>

        <div className="lg:col-span-7">
          <Reveal>
            <SectionHeading eyebrow={t.about.eyebrow} title={t.about.title} titleEm={t.about.titleEm} />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="prose-askao mt-7 space-y-5">
              <p>{t.about.p1}</p>
              <p>{t.about.p2}</p>
              <p>{t.about.p3}</p>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <blockquote className="mt-8 border-l-4 border-vermilion pl-5">
              <p className="font-hand text-3xl leading-tight text-vermilion sm:text-4xl">{t.about.quote}</p>
              <footer className="mt-2 text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-ink-faint">
                — {t.about.quoteAuthor}
              </footer>
            </blockquote>
          </Reveal>

          <Reveal delay={0.24}>
            <dl className="mt-10 grid grid-cols-3 divide-x divide-line border-y border-line py-6">
              {stats.map(stat => (
                <div key={stat.label} className="px-4 first:pl-0 last:pr-0">
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block font-display text-4xl font-semibold leading-none tracking-tight text-ink sm:text-5xl">
                      {stat.value}
                    </span>
                    <span className="mt-2 block text-[0.62rem] font-extrabold uppercase leading-snug tracking-[0.14em] text-ink-faint">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
