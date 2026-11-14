import { ArrowUpRight, PenLine, Star } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";
import { RatingStars } from "@/components/site/RatingStars";
import { SectionHeading } from "@/components/site/SectionHeading";
import { useI18n } from "@/lib/i18n";
import type { PublicSettings } from "@/lib/types";

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

export function Reviews({ settings }: { settings: PublicSettings }) {
  const { t, tag } = useI18n();
  const rating = new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    settings.rating,
  );
  const reviewUrl = settings.reviewsUrl;

  return (
    <section id="resenas" className="relative overflow-hidden py-20 sm:py-28">
      <div className="container grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow={t.reviews.eyebrow}
              title={t.reviews.title}
              titleEm={t.reviews.titleEm}
              intro={t.reviews.intro}
            />
          </Reveal>

          <Reveal delay={0.12}>
            <blockquote className="mt-9 border-l-4 border-cobalt pl-5">
              <p className="font-hand text-3xl leading-tight text-cobalt sm:text-4xl">{t.reviews.quote}</p>
            </blockquote>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-extrabold text-paper-soft transition hover:-translate-y-0.5 hover:bg-cobalt"
              >
                {t.reviews.read}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-extrabold text-ink transition hover:border-ink hover:bg-paper-soft"
              >
                <PenLine className="h-4 w-4" aria-hidden="true" />
                {t.reviews.write}
              </a>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1} y={32}>
          <div className="relative mx-auto max-w-md lg:ml-auto">
            <div className="ticket rotate-[-1.4deg] rounded-[2rem] px-7 py-8 text-center shadow-lift sm:px-10 sm:py-10">
              <div className="flex items-center justify-center gap-2">
                <GoogleLogo className="h-6 w-6" />
                <span className="text-sm font-extrabold tracking-tight text-ink-soft">Google</span>
              </div>

              <p className="mt-4 font-display text-[5.5rem] font-semibold leading-none tracking-[-0.07em] text-ink sm:text-[6.5rem]">
                {rating}
              </p>
              <RatingStars rating={settings.rating} className="mt-3 justify-center scale-125" />
              <p className="mt-3 text-sm font-bold text-ink-soft">
                {settings.reviewCount} {t.common.reviews}
              </p>

              <div className="mt-7 grid gap-2">
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-vermilion px-5 py-3 text-sm font-extrabold text-paper-soft transition hover:bg-vermilion-deep"
                >
                  {t.reviews.read}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold text-ink transition hover:border-ink"
                >
                  {t.reviews.write}
                </a>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-ink-faint">
                <Star className="h-3 w-3 fill-[#e6a23c] text-[#e6a23c]" aria-hidden="true" />
                {t.reviews.googleNote}
              </p>
            </div>

            <div className="absolute -right-3 -top-5 rotate-6 rounded-full border-2 border-ink bg-butter px-4 py-2 text-[0.58rem] font-extrabold uppercase tracking-[0.16em] text-ink shadow-soft">
              Casco Viejo
            </div>
            <div className="stripe-rule absolute -bottom-3 left-8 right-8 rounded-full" aria-hidden="true" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
