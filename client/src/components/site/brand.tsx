import { instagramHref, tiktokHref } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Instagram } from "lucide-react";
import { useId } from "react";
import { Link } from "wouter";

export function Wordmark({
  className,
  size = "md",
  tone = "dark",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "dark" | "light";
}) {
  const sizes = {
    sm: "text-2xl",
    md: "text-[1.85rem]",
    lg: "text-5xl sm:text-6xl",
    xl: "text-[18vw] sm:text-[13rem]",
  };
  const oSizes = {
    sm: "h-[0.58em] w-[0.58em] border-[1.5px]",
    md: "h-[0.58em] w-[0.58em] border-2",
    lg: "h-[0.6em] w-[0.6em] border-[3px]",
    xl: "h-[0.6em] w-[0.6em] border-[5px]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-baseline font-display font-black leading-none tracking-[-0.065em]",
        sizes[size],
        className,
      )}
      aria-label="askao"
    >
      aska
      <span
        aria-hidden="true"
        className={cn(
          "stripe-bg ml-[0.035em] inline-block shrink-0 translate-y-[0.015em] rounded-full shadow-[inset_2px_0_3px_rgba(255,255,255,.45)]",
          tone === "light" ? "border-paper-soft" : "border-ink",
          oSizes[size],
        )}
      />
    </span>
  );
}

export function Logo({ className, showSub = true }: { className?: string; showSub?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Barbería Askao — volver al inicio"
      className={cn("group inline-flex items-center gap-2.5 rounded-lg", className)}
    >
      <Wordmark className="transition-transform duration-500 group-hover:-rotate-2" />
      {showSub ? (
        <span className="hidden border-l border-line pl-2.5 text-[0.58rem] font-extrabold uppercase leading-[1.35] tracking-[0.2em] text-ink-faint sm:block">
          Barbería
          <br />
          Bilbao
        </span>
      ) : null}
    </Link>
  );
}

export function Stamp({ className, label = "Bilbao · Casco Viejo · Barbería Askao · " }: { className?: string; label?: string }) {
  const pathId = useId().replace(/:/g, "");

  return (
    <div className={cn("relative h-28 w-28 text-ink", className)} aria-hidden="true">
      <svg viewBox="0 0 120 120" className="animate-spin-slow h-full w-full">
        <defs>
          <path id={pathId} d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
        </defs>
        <text fill="currentColor" fontSize="8.2" fontWeight="800" letterSpacing="2.1">
          <textPath href={`#${pathId}`}>{label}</textPath>
        </text>
        <circle cx="60" cy="60" r="32" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-display text-2xl font-black italic text-vermilion">4,8</span>
        <span className="absolute bottom-8 text-[0.55rem] font-extrabold uppercase tracking-[0.18em] text-ink-faint">
          Google
        </span>
      </div>
    </div>
  );
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82a5.6 5.6 0 0 1-1.36-3.32h-3.1v12.1a2.62 2.62 0 1 1-2.62-2.62c.28 0 .55.04.8.12V8.94a5.77 5.77 0 1 0 4.92 5.7V9.4a8.66 8.66 0 0 0 4.48 1.25V7.55a5.6 5.6 0 0 1-3.12-1.73Z" />
    </svg>
  );
}

export function SocialLinks({
  instagram,
  tiktok,
  className,
  iconClassName,
}: {
  instagram?: string | null;
  tiktok?: string | null;
  className?: string;
  iconClassName?: string;
}) {
  if (!instagram && !tiktok) return null;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {instagram ? (
        <a
          href={instagramHref(instagram)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Instagram de Barbería Askao: @${instagram.replace(/^@/, "")}`}
          className="grid h-11 w-11 place-items-center rounded-full border border-current/25 transition hover:border-vermilion hover:text-vermilion"
        >
          <Instagram className={cn("h-4.5 w-4.5", iconClassName)} aria-hidden="true" />
        </a>
      ) : null}
      {tiktok ? (
        <a
          href={tiktokHref(tiktok)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`TikTok de Barbería Askao: @${tiktok.replace(/^@/, "")}`}
          className="grid h-11 w-11 place-items-center rounded-full border border-current/25 transition hover:border-vermilion hover:text-vermilion"
        >
          <TikTokIcon className={cn("h-4.5 w-4.5", iconClassName)} />
        </a>
      ) : null}
    </div>
  );
}
