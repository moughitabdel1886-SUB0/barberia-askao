import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Header } from "@/components/site/Header";
import { Marquee } from "@/components/site/Marquee";
import { Wordmark } from "@/components/site/brand";
import { trpc } from "@/lib/trpc";
import { About } from "@/sections/About";
import { Booking } from "@/sections/Booking";
import { Gallery } from "@/sections/Gallery";
import { Hero } from "@/sections/Hero";
import { Location } from "@/sections/Location";
import { Reviews } from "@/sections/Reviews";
import { Services } from "@/sections/Services";
import { Phone } from "lucide-react";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import type { PublicMedia, PublicService, PublicSettings } from "@/lib/types";

function LoadingScreen() {
  const { t } = useI18n();
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6" aria-busy="true" aria-live="polite">
      <div className="text-center">
        <Wordmark size="lg" />
        <div className="mx-auto mt-8 h-16 w-6 animate-floaty rounded-full stripe-bg shadow-soft" aria-hidden="true" />
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-ink-faint">{t.common.loading}</p>
      </div>
    </div>
  );
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6 text-center">
      <div className="max-w-md">
        <Wordmark size="lg" />
        <p className="mt-8 font-display text-3xl font-semibold tracking-tight text-ink">{t.common.error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-extrabold text-paper-soft transition hover:bg-vermilion"
        >
          {t.common.retry}
        </button>
        <a
          href="tel:+34652413681"
          className="mt-4 flex items-center justify-center gap-2 text-sm font-bold text-cobalt"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          652 41 36 81
        </a>
      </div>
    </div>
  );
}

type BootstrapData = { settings: PublicSettings; services: PublicService[]; media: PublicMedia[] };

function useSiteSchema(data: BootstrapData | undefined) {
  useEffect(() => {
    if (!data) return;
    const script = document.getElementById("askao-schema");
    if (!script) return;

    const image = data.media.find(item => item.type === "image");
    const schema = {
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: "Barbería Askao",
      alternateName: "Peluquería – Barbería AT-MAN",
      description:
        "Peluquería y barbería de barrio en el Casco Viejo de Bilbao. Cortes clásicos y modernos, degradados, barba, líneas y dibujos.",
      telephone: `+34${data.settings.phone.replace(/\D/g, "").replace(/^34/, "")}`,
      email: data.settings.email,
      priceRange: "€€",
      currenciesAccepted: "EUR",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Askao Kalea, 27",
        addressLocality: "Bilbao",
        addressRegion: "Bizkaia",
        postalCode: "48005",
        addressCountry: "ES",
      },
      geo: { "@type": "GeoCoordinates", latitude: 43.25878, longitude: -2.921894 },
      hasMap: data.settings.mapsUrl,
      url: window.location.origin,
      image: image ? new URL(image.url, window.location.origin).toString() : undefined,
      openingHoursSpecification: data.settings.hours.map((day, index) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][index],
        ...(day.closed ? {} : { opens: day.open, closes: day.close }),
      })),
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: String(data.settings.rating),
        reviewCount: String(data.settings.reviewCount),
        bestRating: "5",
      },
      areaServed: { "@type": "City", name: "Bilbao" },
      makesOffer: data.services.map(service => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: service.nameEs },
        price: (service.priceCents / 100).toFixed(2),
        priceCurrency: "EUR",
      })),
    };

    script.textContent = JSON.stringify(schema);

    if (image) {
      const absolute = new URL(image.url, window.location.origin).toString();
      for (const selector of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
        let tag = document.head.querySelector<HTMLMetaElement>(selector);
        if (!tag) {
          tag = document.createElement("meta");
          tag.setAttribute(selector.includes("og:") ? "property" : "name", selector.includes("og:") ? "og:image" : "twitter:image");
          document.head.appendChild(tag);
        }
        tag.setAttribute("content", absolute);
      }
    }
  }, [data]);
}

export default function Home() {
  const { t } = useI18n();
  const bootstrap = trpc.site.bootstrap.useQuery(undefined, { staleTime: 60_000 });
  useSiteSchema(bootstrap.data);

  useEffect(() => {
    document.title = t.meta.title;
  }, [t]);

  if (bootstrap.isLoading) return <LoadingScreen />;
  if (bootstrap.isError || !bootstrap.data) return <ErrorScreen onRetry={() => bootstrap.refetch()} />;

  const { settings, services, media } = bootstrap.data;

  return (
    <>
      <a
        href="#contenido"
        className="sr-only fixed left-4 top-4 z-[100] rounded-full bg-ink px-5 py-3 text-sm font-bold text-paper-soft focus:not-sr-only"
      >
        {t.common.skip}
      </a>
      <Header phone={settings.phone} />
      <main id="contenido" className="pb-20 sm:pb-0">
        <Hero settings={settings} />
        <Marquee items={t.marquee} />
        <About media={media} settings={settings} />
        <Services services={services} settings={settings} />
        <Gallery media={media} />
        <Booking services={services} settings={settings} />
        <Reviews settings={settings} />
        <Location settings={settings} />
      </main>
      <Footer
        phone={settings.phone}
        email={settings.email}
        instagram={settings.instagram}
        tiktok={settings.tiktok}
        hours={settings.hours}
        mapsUrl={settings.mapsUrl}
      />
      <FloatingActions whatsapp={settings.whatsapp} />
    </>
  );
}
