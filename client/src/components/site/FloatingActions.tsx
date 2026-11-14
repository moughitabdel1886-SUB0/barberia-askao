import { CalendarDays, MessageCircle } from "lucide-react";
import { whatsappHref } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Locale } from "@shared/i18n";

const WHATSAPP_TEXT: Record<Locale, string> = {
  es: "Hola, me gustaría pedir cita en Barbería Askao.",
  en: "Hi, I'd like to book an appointment at Barbería Askao.",
  fr: "Bonjour, je souhaiterais prendre rendez-vous chez Barbería Askao.",
  de: "Hallo, ich möchte einen Termin bei Barbería Askao buchen.",
};

export function FloatingActions({ whatsapp = "+34652413681" }: { whatsapp?: string }) {
  const { t, locale } = useI18n();
  const wa = whatsappHref(whatsapp, WHATSAPP_TEXT[locale]);

  const goToBooking = () => {
    if (window.location.pathname === "/") {
      document.getElementById("reservar")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = "/#reservar";
    }
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-3 pt-2 backdrop-blur-xl safe-bottom sm:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToBooking}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-vermilion px-5 text-sm font-extrabold text-paper-soft shadow-[0_10px_24px_-12px_rgba(214,59,42,.8)]"
          >
            <CalendarDays className="h-4.5 w-4.5" aria-hidden="true" />
            {t.nav.book}
          </button>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.common.whatsapp}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#25D366] text-ink shadow-soft"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-40 hidden flex-col items-end gap-3 sm:flex">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.common.whatsapp}
          className="group grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-ink shadow-lift transition hover:-translate-y-1"
        >
          <MessageCircle className="h-6 w-6 transition group-hover:scale-110" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={goToBooking}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-vermilion px-6 text-sm font-extrabold text-paper-soft shadow-[0_16px_34px_-14px_rgba(214,59,42,.9)] transition hover:-translate-y-1 hover:bg-vermilion-deep"
        >
          <CalendarDays className="h-4.5 w-4.5" aria-hidden="true" />
          {t.nav.book}
        </button>
      </div>
    </>
  );
}
