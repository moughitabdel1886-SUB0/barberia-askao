import { LOCALE_LABELS, LOCALES } from "@shared/i18n";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, CalendarDays, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { scrollToId, telHref } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./brand";

const SECTIONS = [
  { id: "estudio", key: "studio" },
  { id: "servicios", key: "prices" },
  { id: "cortes", key: "gallery" },
  { id: "resenas", key: "reviews" },
  { id: "donde", key: "location" },
] as const;

export function Header({ phone = "652 41 36 81" }: { phone?: string }) {
  const { t, locale, setLocale } = useI18n();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location !== "/") return;
    const elements = SECTIONS.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0.05, 0.25, 0.5] },
    );

    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [location]);

  const goTo = (id: string) => {
    setOpen(false);
    if (location === "/") {
      scrollToId(id);
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300",
        scrolled
          ? "border-line bg-paper/90 shadow-[0_10px_30px_-24px_rgba(27,26,23,.4)] backdrop-blur-xl"
          : "border-transparent bg-paper/55 backdrop-blur-sm",
      )}
    >
      <div className="container flex h-[72px] items-center justify-between gap-4 sm:h-[80px]">
        <Logo />

        <nav aria-label="Principal" className="hidden items-center gap-0.5 lg:flex">
          {SECTIONS.map(item => (
            <a
              key={item.id}
              href={`/#${item.id}`}
              onClick={event => {
                if (location === "/") {
                  event.preventDefault();
                  goTo(item.id);
                }
              }}
              aria-current={active === item.id ? "true" : undefined}
              className={cn(
                "relative rounded-full px-3.5 py-2 text-[0.82rem] font-bold text-ink-soft transition hover:text-ink",
                active === item.id && "text-ink",
              )}
            >
              {t.nav[item.key]}
              <span
                className={cn(
                  "absolute inset-x-3.5 -bottom-0.5 h-[3px] origin-left rounded-full bg-vermilion transition-transform duration-300",
                  active === item.id ? "scale-x-100" : "scale-x-0",
                )}
                aria-hidden="true"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => goTo("reservar")}
            className="hidden min-h-11 items-center gap-2 rounded-full bg-vermilion px-5 text-sm font-extrabold text-paper-soft shadow-[0_10px_24px_-12px_rgba(214,59,42,.75)] transition hover:-translate-y-0.5 hover:bg-vermilion-deep sm:inline-flex"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t.nav.book}
          </button>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label={t.common.openMenu}
                className="grid h-11 w-11 place-items-center rounded-full border border-line bg-paper-soft text-ink lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
              <Dialog.Content className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-paper px-5 pb-8 pt-5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
                <Dialog.Title className="sr-only">{t.common.openMenu}</Dialog.Title>
                <div className="flex items-center justify-between">
                  <Logo />
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label={t.common.close}
                      className="grid h-11 w-11 place-items-center rounded-full border border-line bg-paper-soft"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </Dialog.Close>
                </div>

                <nav aria-label="Móvil" className="mt-10 flex flex-col gap-1">
                  {SECTIONS.map((item, index) => (
                    <a
                      key={item.id}
                      href={`/#${item.id}`}
                      onClick={event => {
                        event.preventDefault();
                        goTo(item.id);
                      }}
                      className="group flex items-center justify-between border-b border-line/70 py-4"
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="text-[0.6rem] font-extrabold tracking-[0.15em] text-ink-faint">
                          0{index + 1}
                        </span>
                        <span className="font-display text-3xl font-medium tracking-tight text-ink transition group-hover:italic group-hover:text-cobalt">
                          {t.nav[item.key]}
                        </span>
                      </span>
                      <ArrowUpRight className="h-5 w-5 text-ink-faint transition group-hover:text-vermilion" aria-hidden="true" />
                    </a>
                  ))}
                </nav>

                <div className="mt-8">
                  <p className="eyebrow">{t.common.language}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {LOCALES.map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setLocale(value)}
                        aria-pressed={locale === value}
                        className={cn(
                          "flex min-h-11 items-center justify-between rounded-xl border px-3 text-sm font-bold",
                          locale === value
                            ? "border-ink bg-ink text-paper-soft"
                            : "border-line bg-paper-soft text-ink",
                        )}
                      >
                        {LOCALE_LABELS[value].name}
                        <span className="text-[0.6rem] tracking-wider opacity-60">{LOCALE_LABELS[value].short}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-auto grid gap-3 pt-10">
                  <button
                    type="button"
                    onClick={() => goTo("reservar")}
                    className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-vermilion px-6 py-4 text-base font-extrabold text-paper-soft"
                  >
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                    {t.nav.book}
                  </button>
                  <a
                    href={telHref(phone)}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-bold text-ink"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {phone}
                  </a>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
