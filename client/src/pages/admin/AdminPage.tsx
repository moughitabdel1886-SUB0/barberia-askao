import { Wordmark } from "@/components/site/brand";
import { initials, setAdminToken } from "@/lib/admin";
import { ADMIN_TABS, type AdminTab } from "@/lib/adminTabs";
import { trpc } from "@/lib/trpc";
import type { AdminUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Images,
  LayoutDashboard,
  LogOut,
  Scissors,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";
import { AuthScreen } from "./AuthScreen";
import { BookingsAdmin } from "./BookingsAdmin";
import { MediaAdmin } from "./MediaAdmin";
import { Overview } from "./Overview";
import { ScheduleAdmin } from "./ScheduleAdmin";
import { ServicesAdmin } from "./ServicesAdmin";
import { SettingsAdmin } from "./SettingsAdmin";

const ICONS = {
  overview: LayoutDashboard,
  bookings: CalendarDays,
  services: Scissors,
  media: Images,
  schedule: Clock3,
  settings: Settings,
} as const;

function AdminLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-paper px-6" aria-busy="true">
      <div className="text-center">
        <Wordmark size="lg" />
        <div className="mx-auto mt-6 h-1.5 w-24 overflow-hidden rounded-full bg-line">
          <div className="h-full w-1/2 animate-[marquee_1.4s_ease-in-out_infinite] rounded-full bg-cobalt" />
        </div>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-ink-faint">Abriendo la trastienda…</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const utils = trpc.useUtils();
  const [override, setOverride] = useState<AdminUser | null>(null);
  const [tab, setTab] = useState<AdminTab>("overview");

  useEffect(() => {
    const previousTitle = document.title;
    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const previousRobots = robots?.getAttribute("content") ?? null;
    document.title = "Panel privado · Barbería Askao";
    if (robots) robots.setAttribute("content", "noindex, nofollow");
    return () => {
      document.title = previousTitle;
      if (robots && previousRobots !== null) robots.setAttribute("content", previousRobots);
    };
  }, []);

  const status = trpc.admin.status.useQuery(undefined, { retry: false, staleTime: 30_000 });
  const me = trpc.admin.me.useQuery(undefined, {
    retry: false,
    enabled: status.data?.initialized === true,
  });

  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => {
      setAdminToken(null);
      setOverride(null);
      utils.admin.me.setData(undefined, undefined);
      utils.invalidate();
      toast.success("Sesión cerrada.");
    },
    onError: () => {
      setAdminToken(null);
      setOverride(null);
      utils.admin.me.setData(undefined, undefined);
    },
  });

  const admin = override ?? me.data ?? null;

  const onAuthed = (user: AdminUser) => {
    setOverride(user);
    utils.admin.me.setData(undefined, user);
    utils.admin.status.setData(undefined, { initialized: true });
    utils.invalidate();
  };

  if (status.isLoading) return <AdminLoading />;

  if (status.isError) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-6 text-center">
        <div className="max-w-sm">
          <Wordmark size="lg" />
          <p className="mt-6 font-display text-3xl font-semibold text-ink">No se pudo abrir el panel.</p>
          <p className="mt-2 text-sm text-ink-soft">Comprueba la conexión y vuelve a intentarlo.</p>
          <button type="button" onClick={() => status.refetch()} className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-paper-soft">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!status.data?.initialized) {
    return <AuthScreen mode="setup" onAuthed={onAuthed} />;
  }

  if (me.isLoading && !admin) return <AdminLoading />;

  if (!admin) {
    return <AuthScreen mode="login" onAuthed={onAuthed} />;
  }

  const renderTab = () => {
    switch (tab) {
      case "bookings":
        return <BookingsAdmin />;
      case "services":
        return <ServicesAdmin />;
      case "media":
        return <MediaAdmin />;
      case "schedule":
        return <ScheduleAdmin />;
      case "settings":
        return <SettingsAdmin admin={admin} />;
      default:
        return <Overview admin={admin} onNavigate={setTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Barbería Askao">
              <Wordmark size="sm" />
            </Link>
            <span className="rounded-full border border-line bg-paper-soft px-2.5 py-1 text-[0.55rem] font-extrabold uppercase tracking-[0.16em] text-ink-faint">
              Panel privado
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/"
              className="hidden min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-ink-soft transition hover:bg-paper-deep hover:text-ink sm:inline-flex"
            >
              Ver web
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <div className="hidden items-center gap-2 rounded-full border border-line bg-paper-soft py-1 pl-1 pr-3 md:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-cobalt text-[0.6rem] font-extrabold text-paper-soft">
                {initials(admin.name || admin.email)}
              </span>
              <span className="max-w-40 truncate text-[0.68rem] font-bold text-ink">{admin.email}</span>
            </div>
            <button
              type="button"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              aria-label="Cerrar sesión"
              className="grid h-10 w-10 place-items-center rounded-full border border-line bg-paper-soft text-ink-soft transition hover:border-vermilion hover:text-vermilion"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] gap-6 px-3 py-4 sm:px-6 sm:py-6">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav aria-label="Panel" className="sticky top-24 space-y-1">
            {ADMIN_TABS.map(item => {
              const Icon = ICONS[item.id];
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-bold transition",
                    active ? "bg-ink text-paper-soft shadow-soft" : "text-ink-soft hover:bg-paper-soft hover:text-ink",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-butter" : "text-ink-faint")} aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="sticky top-[390px] mt-8 overflow-hidden rounded-2xl bg-cobalt p-4 text-paper-soft">
            <div className="stripe-rule -mx-4 -mt-4 mb-4" aria-hidden="true" />
            <p className="font-hand text-2xl text-butter">El mostrador</p>
            <p className="mt-1 text-xs leading-relaxed text-paper-soft/75">
              Los cambios de precios, fotos y horarios se ven en la web al guardar.
            </p>
            <Link href="/" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-extrabold text-butter">
              Abrir la web
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <nav aria-label="Panel móvil" className="scrollbar-none -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
            {ADMIN_TABS.map(item => {
              const Icon = ICONS[item.id];
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-extrabold transition",
                    active ? "border-ink bg-ink text-paper-soft" : "border-line bg-paper-soft text-ink-soft",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div key={tab} className="animate-in fade-in duration-300">
            {renderTab()}
          </div>

          <p className="mt-10 border-t border-line pt-4 text-center text-[0.62rem] text-ink-faint">
            Barbería Askao · Panel privado · Los datos de tus clientes no se comparten.
          </p>
        </div>
      </div>
    </div>
  );
}
