import { useI18n } from "@/lib/i18n";
import { ArrowLeft, Scissors } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";

const NOT_FOUND_PATH = "/404";

export default function NotFound() {
  const { t } = useI18n();

  useEffect(() => {
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.appendChild(robots);

    // The published gateway answers /404 with a real 404 while still serving the app.
    if (window.location.pathname.replace(/\/$/, "") !== NOT_FOUND_PATH) {
      window.location.replace(NOT_FOUND_PATH);
    }

    return () => robots.remove();
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-5 py-16 text-ink">
      <div className="cloud left-[8%] top-[16%] h-16 w-40 opacity-80" aria-hidden="true" />
      <div className="cloud right-[10%] top-[30%] h-12 w-32 opacity-70" aria-hidden="true" />

      <div className="relative z-10 max-w-xl text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-paper-soft shadow-soft">
          <Scissors className="h-9 w-9 -rotate-12 text-vermilion" aria-hidden="true" />
        </div>
        <p className="eyebrow justify-center">Error 404</p>
        <h1 className="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl">
          {t.notFound.title}
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg text-ink-soft">{t.notFound.text}</p>
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-bold text-paper-soft transition hover:bg-vermilion"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t.notFound.back}
        </Link>
      </div>
    </main>
  );
}
