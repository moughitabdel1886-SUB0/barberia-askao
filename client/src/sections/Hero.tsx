import { CalendarDays, Clock3, MapPin, Scissors, Star } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Clouds } from "@/components/site/Clouds";
import { Particles } from "@/components/site/Particles";
import { RatingStars } from "@/components/site/RatingStars";
import { Reveal } from "@/components/site/Reveal";
import { HeroSceneFallback } from "@/components/three/HeroSceneFallback";
import { scrollToId } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { PublicSettings } from "@/lib/types";

const HeroScene = lazy(() => import("@/components/three/HeroScene"));

function useCanRender3D() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () => {
      if (motion.matches) {
        setAllowed(false);
        return;
      }
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
      const cores = navigator.hardwareConcurrency ?? 8;
      if (memory <= 4 || cores <= 4) {
        setAllowed(false);
        return;
      }
      try {
        const canvas = document.createElement("canvas");
        const gl =
          canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
          canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
        setAllowed(Boolean(gl));
      } catch {
        setAllowed(false);
      }
    };

    evaluate();
    motion.addEventListener("change", evaluate);
    return () => motion.removeEventListener("change", evaluate);
  }, []);

  return allowed;
}

export function Hero({ settings }: { settings: PublicSettings }) {
  const { t, tag } = useI18n();
  const canRender3D = useCanRender3D();
  const ratingLabel = new Intl.NumberFormat(tag, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
    settings.rating,
  );
  const defaultWeek = settings.hours
    .slice(1, 7)
    .every(day => !day.closed && day.open === "10:00" && day.close === "21:00");
  const hoursLabel = defaultWeek ? t.hero.hours : t.hero.hoursVariable;

  return (
    <section id="inicio" className="relative overflow-hidden pb-10 pt-8 sm:pb-16 sm:pt-12 lg:pb-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_18%,rgba(220,233,255,.85),transparent_46%),radial-gradient(ellipse_at_12%_82%,rgba(255,232,176,.28),transparent_38%)]"
        aria-hidden="true"
      />
      <Clouds dense />
      <Particles className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />

      <div className="container relative">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-4">
          <div className="relative z-10 lg:col-span-5 lg:pb-10">
            <Reveal>
              <p className="eyebrow">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vermilion opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-vermilion" />
                </span>
                {t.hero.eyebrow}
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-5 font-display text-[3.1rem] font-semibold leading-[0.93] tracking-[-0.05em] text-ink sm:text-[4.2rem] lg:text-[4.6rem] xl:text-[5.3rem]">
                {t.hero.title}
                <span className="relative mt-1 block font-light italic text-cobalt">
                  {t.hero.titleEm}
                  <svg
                    viewBox="0 0 320 22"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 left-0 h-4 w-[96%] text-vermilion"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 14C64 5 138 19 197 10c38-6 76 1 118 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-7 max-w-md text-[1.03rem] leading-relaxed text-ink-soft sm:text-lg">
                {t.hero.subtitle}
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => scrollToId("reservar")}
                  className="group inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-vermilion px-7 py-4 text-[0.95rem] font-extrabold text-paper-soft shadow-[0_18px_34px_-16px_rgba(214,59,42,.85)] transition hover:-translate-y-0.5 hover:bg-vermilion-deep"
                >
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  {t.common.book}
                  <span className="transition group-hover:translate-x-0.5" aria-hidden="true">
                    →
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollToId("cortes")}
                  className="inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full border border-ink/20 bg-paper-soft/60 px-6 py-4 text-[0.95rem] font-extrabold text-ink backdrop-blur transition hover:border-ink hover:bg-paper-soft"
                >
                  <Scissors className="h-4.5 w-4.5 -rotate-12" aria-hidden="true" />
                  {t.common.viewCuts}
                </button>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line/80 pt-5 text-[0.82rem] font-semibold text-ink-soft">
                <a
                  href="#resenas"
                  onClick={event => {
                    event.preventDefault();
                    scrollToId("resenas");
                  }}
                  className="flex min-h-10 items-center gap-2 transition hover:text-ink"
                >
                  <RatingStars rating={settings.rating} />
                  <span className="font-extrabold text-ink">{ratingLabel}</span>
                  <span className="text-ink-faint">
                    · {settings.reviewCount} {t.common.reviews}
                  </span>
                </a>
                <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-vermilion" aria-hidden="true" />
                  {hoursLabel}
                </span>
                <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-cobalt" aria-hidden="true" />
                  {t.hero.address}
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.4} className="hidden lg:block">
              <button
                type="button"
                onClick={() => scrollToId("estudio")}
                className="mt-10 inline-flex items-center gap-3 text-[0.68rem] font-extrabold uppercase tracking-[0.2em] text-ink-faint transition hover:text-ink"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full border border-line">
                  <span aria-hidden="true">↓</span>
                </span>
                {t.hero.scroll}
              </button>
            </Reveal>
          </div>

          <div className="relative lg:col-span-7">
            <Reveal delay={0.1} y={36}>
              <div className="relative mx-auto h-[380px] w-full max-w-[620px] sm:h-[500px] lg:h-[600px] xl:h-[640px]">
                <div
                  className="arch absolute inset-x-3 bottom-3 top-4 border border-ink/10 bg-gradient-to-b from-sky/55 via-sky-soft/30 to-paper-soft/10 shadow-[inset_0_30px_80px_rgba(255,255,255,.5)]"
                  aria-hidden="true"
                />
                <div className="absolute inset-0">
                  {canRender3D ? (
                    <Suspense fallback={<HeroSceneFallback className="h-full w-full" />}>
                      <HeroScene />
                    </Suspense>
                  ) : (
                    <HeroSceneFallback className="h-full w-full" />
                  )}
                </div>

                <div className="absolute left-0 top-[18%] hidden -rotate-6 sm:block" aria-hidden="true">
                  <span className="hand text-2xl text-vermilion sm:text-3xl">{t.hero.note1}</span>
                  <svg viewBox="0 0 80 40" className="ml-8 h-8 w-16 text-vermilion/70">
                    <path d="M4 4c22 2 34 14 30 30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5" />
                    <path d="M28 28l6 7 2-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="absolute bottom-[16%] right-0 hidden rotate-3 text-right sm:block" aria-hidden="true">
                  <span className="hand text-2xl text-cobalt sm:text-3xl">{t.hero.note2}</span>
                  <svg viewBox="0 0 80 36" className="ml-auto mr-6 h-7 w-16 text-cobalt/70">
                    <path d="M76 4C54 4 42 14 46 32" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 5" />
                    <path d="M40 27l6 7 2-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="absolute right-1 top-2 flex items-center gap-1.5 rounded-full border border-ink/10 bg-paper-soft/85 px-3.5 py-2 text-[0.62rem] font-extrabold uppercase tracking-[0.16em] text-ink shadow-soft backdrop-blur">
                  <Star className="h-3 w-3 fill-[#e6a23c] text-[#e6a23c]" aria-hidden="true" />
                  {t.hero.badge}
                </div>

                <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-paper-soft px-4 py-2 text-[0.65rem] font-extrabold uppercase tracking-[0.15em] text-ink-soft shadow-soft">
                  <span className="h-2 w-2 rounded-full bg-[#2f7d4e]" aria-hidden="true" />
                  {hoursLabel}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
