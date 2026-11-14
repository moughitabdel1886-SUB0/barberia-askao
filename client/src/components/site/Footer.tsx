import type { HoursConfig } from "@shared/booking";
import { ArrowUp, ArrowUpRight, Clock3, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "wouter";
import { hasDefaultHours, telHref } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { SocialLinks, Wordmark } from "./brand";

const SECTIONS = [
  { id: "estudio", key: "studio" },
  { id: "servicios", key: "prices" },
  { id: "cortes", key: "gallery" },
  { id: "resenas", key: "reviews" },
  { id: "donde", key: "location" },
] as const;

export function Footer({
  phone = "652 41 36 81",
  email = "barberiaaskao@gmail.com",
  instagram,
  tiktok,
  hours,
  mapsUrl = "https://maps.app.goo.gl/c5jKDpatArCzT1J76",
}: {
  phone?: string;
  email?: string;
  instagram?: string | null;
  tiktok?: string | null;
  hours?: HoursConfig;
  mapsUrl?: string;
}) {
  const { t } = useI18n();
  const week = hours?.slice(1, 7).filter(day => !day.closed) ?? [];
  const opens = week[0]?.open ?? "10:00";
  const closes = week[0]?.close ?? "21:00";
  const hoursNote = !hours || hasDefaultHours(hours) ? t.location.hoursNote : t.hero.hoursVariable;

  return (
    <footer className="relative overflow-hidden bg-ink text-paper-soft">
      <div className="stripe-rule" aria-hidden="true" />
      <div className="container pb-24 pt-14 sm:pb-8 sm:pt-20">
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div>
            <Link href="/" aria-label="Barbería Askao — inicio" className="inline-block">
              <Wordmark size="xl" tone="light" className="text-paper-soft" />
            </Link>
            <p className="mt-4 max-w-md text-base leading-relaxed text-paper-soft/65">{t.footer.tagline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SocialLinks instagram={instagram} tiktok={tiktok} className="text-paper-soft" />
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-paper-soft/25 px-5 text-sm font-bold transition hover:border-vermilion hover:text-vermilion"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Askao Kalea, 27
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-paper-soft/15 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-paper-soft/45">
              {t.footer.nav}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {SECTIONS.map(item => (
                <li key={item.id}>
                  <a
                    href={`/#${item.id}`}
                    className="inline-flex min-h-9 items-center text-sm font-semibold text-paper-soft/80 transition hover:text-vermilion"
                  >
                    {t.nav[item.key]}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/#reservar"
                  className="inline-flex min-h-9 items-center text-sm font-semibold text-paper-soft/80 transition hover:text-vermilion"
                >
                  {t.nav.book}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-paper-soft/45">
              {t.footer.contact}
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-semibold text-paper-soft/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-vermilion" aria-hidden="true" />
                <span>
                  Askao Kalea, 27
                  <br />
                  48005 Bilbao, Bizkaia
                </span>
              </li>
              <li>
                <a href={telHref(phone)} className="flex min-h-9 items-center gap-2.5 transition hover:text-vermilion">
                  <Phone className="h-4 w-4 text-vermilion" aria-hidden="true" />
                  {phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex min-h-9 items-center gap-2.5 break-all transition hover:text-vermilion"
                >
                  <Mail className="h-4 w-4 shrink-0 text-vermilion" aria-hidden="true" />
                  {email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-paper-soft/45">
              {t.location.hours}
            </h2>
            <div className="mt-4 flex items-start gap-2.5 text-sm font-semibold text-paper-soft/80">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-vermilion" aria-hidden="true" />
              <span>
                {hoursNote}
                <br />
                <span className="text-paper-soft/50">
                  {opens}–{closes}
                </span>
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-paper-soft/45">
              {t.footer.social}
            </h2>
            <div className="mt-4">
              <SocialLinks instagram={instagram} tiktok={tiktok} className="text-paper-soft" />
              {!instagram && !tiktok ? (
                <p className="text-sm text-paper-soft/50">Instagram · TikTok</p>
              ) : null}
            </div>
            <p className="mt-5 font-hand text-2xl text-butter">{t.footer.made}</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-paper-soft/15 pt-6 text-xs text-paper-soft/45 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} Barbería Askao. {t.footer.rights}
          </p>
          <div className="flex items-center gap-5">
            <Link href="/privacidad" className="min-h-9 py-2 font-semibold transition hover:text-paper-soft">
              {t.footer.privacy}
            </Link>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex min-h-9 items-center gap-1.5 font-semibold transition hover:text-paper-soft"
            >
              {t.footer.backTop}
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
