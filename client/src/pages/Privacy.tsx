import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { Link } from "wouter";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Header } from "@/components/site/Header";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";

export default function Privacy() {
  const { t } = useI18n();
  const siteQuery = trpc.site.bootstrap.useQuery(undefined, { staleTime: 60_000 });
  const settings = siteQuery.data?.settings;
  const email = settings?.email ?? "barberiaaskao@gmail.com";

  useEffect(() => {
    const previous = document.title;
    document.title = `${t.footer.privacy} · Barbería Askao`;
    const description = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.getAttribute("content") ?? "";
    description?.setAttribute("content", t.privacy.intro);

    return () => {
      document.title = previous;
      description?.setAttribute("content", previousDescription);
    };
  }, [t]);

  return (
    <>
      <Header phone={settings?.phone} />
      <main className="relative overflow-hidden pb-24 pt-12 sm:pt-20">
        <div className="cloud left-[4%] top-[8%] h-14 w-40 opacity-70" aria-hidden="true" />
        <div className="container max-w-4xl">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-faint transition hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.privacy.back}
          </Link>

          <div className="mt-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-line bg-paper-soft text-cobalt">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="eyebrow">{t.footer.privacy}</p>
          </div>

          <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] tracking-[-0.045em] text-ink sm:text-6xl">
            {t.privacy.title} <span className="font-light italic text-cobalt">{t.privacy.titleEm}</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{t.privacy.intro}</p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {t.privacy.sections.map((section, index) => (
              <section key={section.title} className="card-paper rounded-2xl p-5 shadow-soft sm:p-6">
                <p className="font-display text-sm font-semibold italic text-vermilion">0{index + 1}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{section.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{section.body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-dashed border-line bg-paper-soft/70 p-6 sm:flex-row sm:items-center">
            <p className="max-w-md text-sm text-ink-soft">
              ¿Tienes una duda con tus datos? Escríbenos y te contestamos sin letra pequeña.
            </p>
            <a
              href={`mailto:${email}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-extrabold text-paper-soft transition hover:bg-cobalt"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {email}
            </a>
          </div>
        </div>
      </main>
      <Footer
        phone={settings?.phone}
        email={email}
        instagram={settings?.instagram}
        tiktok={settings?.tiktok}
        hours={settings?.hours}
      />
      <FloatingActions whatsapp={settings?.whatsapp} />
    </>
  );
}
