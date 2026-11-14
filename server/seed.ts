import { count } from "drizzle-orm";
import { media, services } from "../drizzle/schema";
import { countAdmins, getSetupTokenForLog, seedAdminFromEnv } from "./auth";
import { getDb } from "./db";
import { getSettings } from "./repo";

const SEED_SERVICES = [
  {
    slug: "corte-de-pelo",
    nameEs: "Corte de pelo",
    nameEn: "Haircut",
    nameFr: "Coupe de cheveux",
    nameDe: "Haarschnitt",
    descriptionEs: "Degradado, clásico o moderno. Tú traes la idea; nosotros el pulido.",
    descriptionEn: "Fade, classic or modern. You bring the idea; we bring the finish.",
    descriptionFr: "Dégradé, classique ou moderne. Vous apportez l'idée, nous le fini.",
    descriptionDe: "Fade, klassisch oder modern. Sie bringen die Idee, wir den Feinschliff.",
    priceCents: 1200,
    durationMin: 45,
    active: true,
    sortOrder: 1,
  },
  {
    slug: "corte-de-barba",
    nameEs: "Corte de barba",
    nameEn: "Beard trim",
    nameFr: "Taille de barbe",
    nameDe: "Bartpflege",
    descriptionEs: "Perfilado, recorte y acabado con navaja. La barba también se peina.",
    descriptionEn: "Shaping, trimming and razor finish. Beards deserve grooming too.",
    descriptionFr: "Dessin, coupe et finition au rasoir. La barbe se coiffe aussi.",
    descriptionDe: "Kontur, Schnitt und Rasierfinish. Auch Bärte verdienen Pflege.",
    priceCents: 800,
    durationMin: 30,
    active: true,
    sortOrder: 2,
  },
  {
    slug: "corte-de-pelo-y-barba",
    nameEs: "Corte de pelo y barba",
    nameEn: "Haircut & beard",
    nameFr: "Coupe et barbe",
    nameDe: "Haarschnitt & Bart",
    descriptionEs: "Corte y barba en una sola visita. Sales entero.",
    descriptionEn: "Haircut and beard in one visit. Leave feeling brand new.",
    descriptionFr: "Coupe et barbe en une seule visite. Vous repartez comme neuf.",
    descriptionDe: "Haarschnitt und Bart in einem Termin. Wie neu rausgehen.",
    priceCents: 1800,
    durationMin: 60,
    active: true,
    sortOrder: 3,
  },
  {
    slug: "corte-de-ninos-y-jubilados",
    nameEs: "Corte de niños y jubilados",
    nameEn: "Kids & seniors",
    nameFr: "Enfants et retraités",
    nameDe: "Kinder & Senioren",
    descriptionEs: "Paciencia y buen pulso para los más peques y para los que ya lo han visto todo.",
    descriptionEn: "Patience and a steady hand for the little ones and for those who have seen it all.",
    descriptionFr: "Patience et main sûre pour les plus petits et ceux qui ont tout vu.",
    descriptionDe: "Geduld und ruhige Hand für die Kleinsten und alle, die schon alles gesehen haben.",
    priceCents: 1000,
    durationMin: 30,
    active: true,
    sortOrder: 4,
  },
];

/**
 * Sample gallery pieces. They are illustrations, not photos of the shop, and
 * the owner can replace them from /admin. They ship with the public assets.
 */
const SEED_MEDIA = [
  {
    url: "/gallery/fade.webp",
    type: "image" as const,
    category: "fade",
    sortOrder: 1,
  },
  {
    url: "/gallery/classic.webp",
    type: "image" as const,
    category: "classic",
    sortOrder: 2,
  },
  {
    url: "/gallery/modern.webp",
    type: "image" as const,
    category: "modern",
    sortOrder: 3,
  },
  {
    url: "/gallery/beard.webp",
    type: "image" as const,
    category: "beard",
    sortOrder: 4,
  },
  {
    url: "/gallery/lines.webp",
    type: "image" as const,
    category: "lines",
    sortOrder: 5,
  },
  {
    url: "/gallery/eyebrows.webp",
    type: "image" as const,
    category: "eyebrows",
    sortOrder: 6,
  },
  {
    url: "/gallery/kids.webp",
    type: "image" as const,
    category: "kids",
    sortOrder: 7,
  },
];

export async function seedDefaults(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[seed] Database unavailable; skipping seed.");
    return;
  }

  await getSettings();

  const [serviceCount] = await db.select({ value: count() }).from(services);
  if (Number(serviceCount?.value ?? 0) === 0) {
    await db.insert(services).values(SEED_SERVICES);
    console.log("[seed] Servicios iniciales creados.");
  }

  const [mediaCount] = await db.select({ value: count() }).from(media);
  if (Number(mediaCount?.value ?? 0) === 0) {
    await db.insert(media).values(SEED_MEDIA);
    console.log("[seed] Galería de muestra creada.");
  }

  await seedAdminFromEnv();
  if ((await countAdmins()) === 0) {
    console.log(`[auth] Primer acceso: introduce este token en /admin → ${getSetupTokenForLog()}`);
  }
}
