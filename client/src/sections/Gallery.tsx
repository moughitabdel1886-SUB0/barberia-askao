import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, Play, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { mediaAlt } from "@shared/i18n";
import { capitalize } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { PublicMedia } from "@/lib/types";

const CATEGORIES = ["all", "fade", "classic", "modern", "beard", "lines", "eyebrows", "kids"] as const;

export function Gallery({ media }: { media: PublicMedia[] }) {
  const { t } = useI18n();
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("all");
  const [index, setIndex] = useState<number | null>(null);

  const filtered = filter === "all" ? media : media.filter(item => item.category === filter);
  const current = index !== null ? filtered[index] : undefined;
  const open = index !== null && Boolean(current);

  const label = useCallback(
    (category: string) =>
      (t.gallery.filters as Record<string, string>)[category] ?? capitalize(category.replace(/-/g, " ")),
    [t],
  );

  const close = () => setIndex(null);
  const next = useCallback(() => {
    setIndex(value => (value === null ? null : (value + 1) % Math.max(filtered.length, 1)));
  }, [filtered.length]);
  const previous = useCallback(() => {
    setIndex(value => (value === null ? null : (value - 1 + filtered.length) % Math.max(filtered.length, 1)));
  }, [filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, previous]);

  return (
    <section id="cortes" className="relative overflow-hidden py-20 sm:py-28">
      <div className="container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading
              eyebrow={t.gallery.eyebrow}
              title={t.gallery.title}
              titleEm={t.gallery.titleEm}
              intro={t.gallery.intro}
            />
          </Reveal>
          <Reveal delay={0.08}>
            <p className="flex items-center gap-2 text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-ink-faint">
              <span className="h-px w-8 bg-vermilion" aria-hidden="true" />
              {t.gallery.note}
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="scrollbar-none -mx-1 mt-9 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={t.gallery.eyebrow}>
            {CATEGORIES.map(category => {
              const active = filter === category;
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setFilter(category);
                    setIndex(null);
                  }}
                  className={cn(
                    "min-h-10 shrink-0 rounded-full border px-4 py-2 text-xs font-extrabold transition",
                    active
                      ? "border-ink bg-ink text-paper-soft shadow-soft"
                      : "border-line bg-paper-soft text-ink-soft hover:border-ink hover:text-ink",
                  )}
                >
                  {category === "all" ? t.gallery.all : label(category)}
                </button>
              );
            })}
          </div>
        </Reveal>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border border-dashed border-line bg-paper-soft/60 p-12 text-center">
            <p className="font-display text-2xl text-ink-soft">{t.gallery.empty}</p>
          </div>
        ) : (
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3"
          >
            {filtered.map((item, itemIndex) => {
              const aspect = itemIndex % 3 === 0 ? "aspect-[4/5]" : itemIndex % 3 === 1 ? "aspect-square" : "aspect-[3/4]";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-[1.5rem] border border-line bg-paper-deep text-left shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift"
                  aria-label={`${item.title || label(item.category)} — ${t.gallery.note}`}
                >
                  <div className={cn("relative w-full overflow-hidden", aspect)}>
                    {item.type === "video" ? (
                      <>
                        <video
                          src={item.url}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          aria-hidden="true"
                        />
                        <span className="absolute inset-0 grid place-items-center bg-ink/15">
                          <span className="grid h-14 w-14 place-items-center rounded-full bg-paper-soft/90 text-ink shadow-lift">
                            <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
                          </span>
                        </span>
                      </>
                    ) : (
                      <img
                        src={item.url}
                        alt={mediaAlt(item, t)}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-70 transition group-hover:opacity-90" aria-hidden="true" />
                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-paper-soft/90 px-3 py-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-ink backdrop-blur">
                        {item.type === "video" ? t.gallery.video : label(item.category)}
                      </span>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-paper-soft/90 text-ink backdrop-blur transition group-hover:bg-vermilion group-hover:text-paper-soft">
                        <Expand className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </div>

      <Dialog.Root open={open} onOpenChange={value => !value && close()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink/92 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed inset-0 z-[70] flex flex-col p-4 text-paper-soft sm:p-8">
            <Dialog.Title className="sr-only">
              {current ? current.title || label(current.category) : t.gallery.close}
            </Dialog.Title>
            <Dialog.Description className="sr-only">{t.gallery.note}</Dialog.Description>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-paper-soft/60">
                {t.gallery.counter.replace("{current}", String((index ?? 0) + 1)).replace("{total}", String(filtered.length))}
              </p>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label={t.common.close}
                  className="grid h-11 w-11 place-items-center rounded-full border border-paper-soft/25 text-paper-soft transition hover:border-vermilion hover:bg-vermilion"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex min-h-0 flex-1 items-center justify-center py-4">
              {current?.type === "video" ? (
                <video
                  key={current.id}
                  src={current.url}
                  className="max-h-[72vh] max-w-full rounded-2xl bg-ink shadow-lift"
                  controls
                  autoPlay
                  muted
                  playsInline
                />
              ) : current ? (
                <img
                  key={current.id}
                  src={current.url}
                  alt={mediaAlt(current, t)}
                  className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-lift"
                />
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-4 pb-2">
              <p className="hidden text-sm text-paper-soft/60 sm:block">{t.gallery.note}</p>
              <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                <button
                  type="button"
                  onClick={previous}
                  aria-label={t.gallery.prev}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-paper-soft/25 px-5 text-sm font-bold transition hover:border-paper-soft hover:bg-paper-soft hover:text-ink sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {t.gallery.prev}
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label={t.gallery.next}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-paper-soft px-5 text-sm font-bold text-ink transition hover:bg-butter sm:flex-none"
                >
                  {t.gallery.next}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
